# Auth System Investigation Report

**Repo:** `/Users/mark/Context Aware`
**Date:** 2025-07-16
**Scope:** End-to-end authentication: frontend flows, backend endpoints, middleware coverage, Firebase integration

---

## Executive Summary

The system uses a **hybrid but disconnected** architecture: Firebase Admin SDK is initialized on the backend solely as a Firestore database driver — not for Firebase Authentication. User credentials (hashed passwords) are stored in a Firestore `users` collection, and auth is handled with custom **bcrypt + JWT** on the backend. The frontend does **not** use the Firebase Auth SDK at all. The resulting token stored in `localStorage` is a custom JWT signed by the backend.

The biggest structural problems are:

1. **Most API routes have no auth middleware** — only `/api/chat/ask` is protected. All lecture, digest, transcript, analytics, and processing endpoints are publicly accessible to anyone who can reach the server.
2. **Three methods the frontend calls don't exist on the backend** — `verifyOtp`, `resendOtp`, and `updateMe` (profile save after OTP). The entire OTP verification step in registration is broken.
3. **`/auth/register` ignores three of five posted fields** — the frontend sends `fullName`, `birthday`, `mobile`, `address`, and `accessType` but the backend only reads `email`, `password`, and `name` (and `name` is required yet the Register page never sends it in the initial `register()` call).
4. **Lockout is client-side only** — trivially bypassed by clearing `localStorage` or using a different browser.
5. **`JWT_SECRET` in `.env` is the placeholder value** `your-super-secret-jwt-key-change-this-in-production`.

---

## Q1 — How does auth work end-to-end?

**Answer: Custom JWT only. Firebase is used as a Firestore host, not for authentication.**

### Flow

```
Browser                         Backend                       Firestore
  |                               |                               |
  | POST /api/auth/login           |                               |
  |   { email, password }         |                               |
  |------------------------------>|                               |
  |                               | query users where email==X    |
  |                               |------------------------------>|
  |                               |<----- userDoc                 |
  |                               | bcrypt.compare(pw, hash)      |
  |                               | jwt.sign({ userId, email,     |
  |                               |   role }, JWT_SECRET, 7d)     |
  |<- { user, token }             |                               |
  |                               |                               |
  | localStorage.setItem(         |                               |
  |   'auth_token', token)        |                               |
```

**Evidence:**
- `backend/src/config/database.js` — calls `admin.initializeApp()` and exports `getFirestore()`. No `admin.auth()` is called anywhere in the codebase.
- `backend/src/routes/auth.js` lines 74–131 — uses `bcrypt.compare` and `jwt.sign`.
- `frontend/src/api/base44Client.js` lines 44–52 — request interceptor reads `localStorage.getItem('auth_token')` and sets `Authorization: Bearer <token>`.

---

## Q2 — What does `/auth/login` do?

**Answer: Verifies credentials against a Firestore `users` collection. No Firebase Auth involved.**

```js
// backend/src/routes/auth.js:74-131
const snapshot = await usersRef.where('email', '==', email).get();
const isValidPassword = await bcrypt.compare(password, user.password);
const token = jwt.sign({ userId, email, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
```

Users are stored in Firestore `users` collection with hashed passwords (`bcrypt`, 10 rounds). `firebase-admin` is used only to read/write Firestore documents — it never calls `admin.auth().verifyIdToken()` or `admin.auth().createUser()`.

---

## Q3 — What token is stored in `localStorage`?

**Answer: A custom JWT signed with `JWT_SECRET`.**

- Key: `auth_token` (set by `base44Client.setToken()` → `localStorage.setItem('auth_token', token)`).
- Payload: `{ userId, email, role, iat, exp }`.
- Expiry: 7 days.
- `frontend/src/lib/AuthContext.jsx:21` also looks for `APP_PARAMS.TOKEN_KEY` which resolves to `'auth_token'`.

The client also checks `token` and `base44_access_token` as legacy fallbacks (see `base44Client.js:44-47`), but only `auth_token` is written on login.

---

## Q4 — Does the frontend use the Firebase Auth SDK?

**Answer: No. The Firebase Auth SDK (`firebase/auth`) is never imported.**

A `grep` across all `frontend/src/**/*.{js,jsx}` for `from 'firebase` returns zero matches. The only Firebase artifact on the frontend is `firebase.json` at the repo root, which is the Firestore rules config for the CLI — not a frontend SDK import.

The `GoogleIcon.jsx` component exists (it renders an SVG of the Google logo) but it is not wired to any sign-in flow.

---

## Q5 — Is there a Google Sign-In or OAuth flow?

**Answer: No. There is a `GoogleIcon` SVG component but no Google sign-in implementation.**

`frontend/src/components/GoogleIcon.jsx` renders a Google SVG but is not used in `Login.jsx` or `Register.jsx` and has no onClick handler. There is no `signInWithPopup`, `GoogleAuthProvider`, or OAuth redirect anywhere in the codebase. The Login page has no Google button.

---

## Q6 — What user fields are stored, and where?

**In Firestore `users` collection** (set by `backend/src/routes/auth.js:30-42`):

| Field | Type | Notes |
|---|---|---|
| `email` | string | from registration |
| `password` | string | bcrypt hash |
| `name` | string | required at `/auth/register` |
| `role` | string | `student` \| `professor` \| `admin` (default: `student`) |
| `createdAt` | ISO string | |
| `lastLogin` | ISO string \| null | updated on each login |
| `preferences.theme` | string | `'light'` |
| `preferences.notifications` | boolean | `true` |

**Profile fields the frontend collects but never persists (broken):**

The `Register.jsx` form collects `fullName`, `birthday`, `address`, `mobile`, and `accessType`. After OTP verification it tries to call `base44.auth.updateMe(...)` — but:

1. `updateMe` does not exist in `base44Client.js` (`auth` object has: `login`, `loginViaEmailPassword`, `register`, `logout`, `forgotPassword`, `resetPassword`, `verifyOtp`, `me` — no `updateMe`).
2. `verifyOtp` and `resendOtp` have no backend endpoint (see Q7).

So `birthday`, `address`, `mobile`, and `accessType` are **never saved** to Firestore.

**Firebase Auth** stores nothing — no user accounts are created there.

---

## Q7 — Are there broken flows?

**Yes, several critical ones.**

### 7a — OTP endpoints missing from backend

`Register.jsx` calls:
- `base44.auth.verifyOtp({ email, otpCode })` → `POST /api/auth/verify-otp`
- `base44.auth.resendOtp(email)` → (no mapping defined in `base44Client.js` at all — will throw at runtime)

Neither `/api/auth/verify-otp` nor `/api/auth/resend-otp` exist in `backend/src/routes/auth.js`. The backend only has `POST /register`, `POST /login`, and `GET /me`. **Registration past the initial account creation step is completely broken.**

### 7b — `updateMe` missing from `base44Client.js`

After OTP verification, `Register.jsx:148` calls `base44.auth.updateMe(...)`. That method is not defined in the `auth` object of `base44Client.js`. This throws a `TypeError: base44.auth.updateMe is not a function`.

### 7c — `resetPasswordRequest` missing from `base44Client.js`

`ForgotPassword.jsx:20` calls `base44.auth.resetPasswordRequest(email)`. This method does not exist — the client has `forgotPassword(email)` instead. This will throw at runtime. The error is silently swallowed (`catch {}` with no rethrow), so the UI always shows "success" even though nothing is sent.

### 7d — Register sends `name` as `undefined`

`backend/src/routes/auth.js:12` requires `name` to be present: `if (!email || !password || !name)`. But `Register.jsx` calls `base44.auth.register({ email, password })` — no `name` field. The backend rejects this with `400 Email, password, and name are required`. Registration fails before it even creates the user.

### 7e — `/auth/me` has no middleware wrapper

`GET /auth/me` (lines 134–165 of `auth.js`) re-implements JWT verification inline instead of using the `authenticate` middleware. It also doesn't update `lastLogin`. Minor inconsistency but means the middleware and this route can drift.

### 7f — `base44.auth.logout` signature mismatch

`Register.jsx:165` calls `base44.auth.logout('/login?registered=1')` passing a redirect URL. `base44Client.js` `auth.logout` takes no parameters and calls `this.post('/auth/logout')`. There is no `/auth/logout` backend endpoint. The POST fails silently (the error is not caught in `Register.jsx`). The token is cleared from `localStorage` by `setToken(null)` before the POST, so the user is effectively logged out, but the redirect URL argument is ignored — navigation does not happen.

---

## Q8 — Is the auth middleware properly applied to all routes?

**Answer: No. Only `/api/chat/ask` is protected. Everything else is open.**

| Route group | Auth middleware | Notes |
|---|---|---|
| `POST /api/auth/login` | ✗ (correct) | Public |
| `POST /api/auth/register` | ✗ (correct) | Public |
| `GET /api/auth/me` | ✗ (manual inline verify) | No `authenticate` middleware |
| `GET /api/lectures` | ✗ | **Unprotected** |
| `POST /api/lectures` | ✗ | **Unprotected** |
| `POST /api/lectures/upload` | ✗ | **Unprotected** |
| `GET /api/digests` | ✗ | **Unprotected** |
| `POST /api/digests` | ✗ | **Unprotected** |
| `GET /api/transcripts` | ✗ | **Unprotected** |
| `POST /api/processing/lecture/:id` | ✗ | **Unprotected** |
| `GET /api/analytics/dashboard` | ✗ | **Unprotected** |
| `POST /api/functions/deleteLecture` | ✗ | **Unprotected — destructive** |
| `POST /api/functions/generateDigest` | ✗ | **Unprotected — expensive AI call** |
| `POST /api/chat/ask` | ✅ | Only protected route |

The `authenticate` middleware is imported in `chat.js` only. It is not imported or used in `lectures.js`, `digests.js`, `transcripts.js`, `processing.js`, `analytics.js`, `functions.js`, `interactions.js`, `topics.js`, or `segments.js`.

---

## Q9 — What is the lockout mechanism?

**Answer: Client-side only. Trivially bypassed.**

Lockout is implemented entirely in `Login.jsx`:

```js
// frontend/src/pages/Login.jsx:14-20
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes
const lockoutKey = (email) => `login_lockout:${String(email).toLowerCase()}`;
// State stored in localStorage
localStorage.setItem(key, JSON.stringify({ attempts, until }));
```

The backend has no rate limiting, no failed-attempt counter, no IP blocking, and no account lock. An attacker can:
- Clear `localStorage` in DevTools and retry immediately.
- Make requests directly to `POST /api/auth/login` via `curl`/Postman, bypassing the UI entirely.
- Brute-force credentials without any server-side resistance.

---

## Q10 — What would need to change to use Firebase Auth ID tokens?

**Answer: Significant but well-scoped changes to both sides.**

Currently: `bcrypt` in Firestore + custom JWT.
Target: Firebase Auth issues ID tokens; backend verifies them with `admin.auth().verifyIdToken()`.

### Backend changes

1. **Replace `/auth/register`** — instead of hashing a password and writing to Firestore, call `admin.auth().createUser({ email, password, displayName })`. Store only non-auth profile data (role, birthday, address, mobile) in Firestore.
2. **Replace `/auth/login`** — remove this endpoint entirely. Login happens on the frontend via the Firebase Auth SDK. The backend no longer needs to verify passwords.
3. **Replace `authenticate` middleware** — swap `jwt.verify(token, JWT_SECRET)` for `admin.auth().verifyIdToken(token)`. The Firebase Admin SDK is already initialized.
4. **Remove `bcrypt` and `jsonwebtoken` dependencies** — they become unnecessary.
5. **Remove the `password` field from the Firestore `users` document schema.**

### Frontend changes

1. **Add `firebase` SDK** — `npm install firebase` in the frontend package.
2. **Create `frontend/src/lib/firebase.js`** — initialize Firebase app with `firebaseConfig` (API key, authDomain, projectId, etc.).
3. **Replace `base44.auth.loginViaEmailPassword`** in `Login.jsx` with `signInWithEmailAndPassword(auth, email, password)` from `firebase/auth`. After sign-in, get the ID token with `user.getIdToken()` and store it.
4. **Replace `base44.auth.register`** in `Register.jsx` with `createUserWithEmailAndPassword(auth, email, password)`.
5. **Update `AuthContext.jsx`** — subscribe to `onAuthStateChanged(auth, ...)` instead of reading from `localStorage` on mount. Use `user.getIdToken(true)` to refresh tokens (Firebase ID tokens expire in 1 hour vs. the current 7-day JWT).
6. **Token refresh** — Firebase Auth handles token refresh automatically via `onIdTokenChanged`; the `base44Client` interceptor must call `getIdToken()` (not just `localStorage.getItem`) to always send a fresh token.
7. **OTP verification** — remove the custom OTP step; Firebase Auth includes built-in email verification via `sendEmailVerification(user)`.

---

## Recommendations (priority order)

| Priority | Issue | Fix |
|---|---|---|
| 🔴 Critical | All API routes unprotected | Add `authenticate` middleware to every non-auth route in `lectures.js`, `digests.js`, `processing.js`, `functions.js`, `analytics.js` |
| 🔴 Critical | `JWT_SECRET` is placeholder | Set a real secret in `.env` and in Render environment |
| 🔴 Critical | `name` not sent on registration | Pass `name: fullName` in the `base44.auth.register()` call in `Register.jsx` |
| 🔴 Critical | OTP endpoints don't exist | Either implement `/auth/verify-otp` and `/auth/resend-otp` on the backend, or remove the OTP step from `Register.jsx` |
| 🔴 Critical | `updateMe` and `resetPasswordRequest` missing from `base44Client.js` | Add `updateMe: (data) => this.put('/auth/me', data)` and `resetPasswordRequest: (email) => this.post('/auth/forgot-password', { email })` |
| 🟠 High | Lockout is client-side only | Implement server-side rate limiting (`express-rate-limit`) on `/api/auth/login` |
| 🟠 High | `logout` ignores redirect URL | Fix `base44Client.js` `auth.logout` to accept a `redirectTo` param, or handle navigation in the caller |
| 🟡 Medium | Firebase Auth not used | Connect to Firebase Auth as described in Q10 to gain token refresh, email verification, and Google Sign-In for free |
| 🟡 Medium | Profile fields lost on register | Implement `PUT /api/auth/me` and `POST /api/auth/verify-otp` so all collected fields are saved |
| 🟡 Medium | `/auth/me` inline JWT verify | Refactor to use the `authenticate` middleware for consistency |
