# Investigation Report: Personalized Digest & My Digests Pages

**Date:** 2025-11  
**Scope:** `GenerateDigest.jsx`, `MyDigest.jsx`, `DigestResult.jsx`, `backend/src/routes/digests.js`, `backend/src/routes/functions.js`, `backend/src/routes/segments.js`, `backend/src/routes/chat.js`

---

## Executive Summary

There are **four confirmed bugs** across the digest feature, plus one structural observation:

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | **High** | `GenerateDigest.jsx` | `useHistory` toggle is collected into state but **never sent to the backend** |
| 2 | **High** | `DigestResult.jsx` + `segments.js` | DigestSegment field names are camelCase in Firestore (`digestId`, `startTime`) but the backend **returns them in snake_case** (`digest_id`, `start_time`). `segments.js` correctly maps them — this part now works — but the collection name mismatch is a risk (see #3). |
| 3 | **Critical** | `functions.js` (`generateDigest`) vs `segments.js` | `generateDigest` writes segments to the **`segments`** collection; `segments.js` reads from the **`segments`** collection — these match. However `deleteLecture` in `functions.js` deletes segments from the **`segments`** collection using `.where('digestId')` while `DigestSegment.deleteMany` in the client calls `POST /digest-segments/delete-many` which also uses `digestId` — this is consistent. **The problem is field name convention confusion** (see detailed section below). |
| 4 | **Critical** | `DigestChat.jsx` → `chat.js` | The chat `/api/chat/ask` endpoint requires **JWT authentication** (`authenticate` middleware) but the `axiosInstance` used by `DigestChat` sends the auth token from `localStorage`. If the user is authenticated via Firebase (Google login) and not via the JWT-based `/auth/login`, no JWT token will be in `localStorage`, causing **401 Unauthorized** on every chat message. |
| 5 | **Medium** | `MyDigest.jsx` | Imports `PURPOSE_LABELS` from `lectureUtils` — it **exists** and is exported correctly, so no runtime error here. However `PURPOSE_LABELS` is imported but **never used** in `MyDigest.jsx` (dead import, no runtime breakage). |

---

## Detailed Findings

### 1. GenerateDigest.jsx — Personalized Digest page

**Form fields shown:**
- Lecture selector (dropdown, filters to `processing_status === "ready"`)
- Learning goal (textarea, required)
- Topics of interest (tag input with Add button + Enter key, removable badges)
- "Use my previous activity to personalize" toggle (`useHistory` state, custom toggle UI)

**API call:**
```js
// GenerateDigest.jsx line ~96
const response = await base44.functions.invoke('generateDigest', {
  lecture_id: lectureId,
  learning_goal: learningGoal.trim(),
  topics,
  // useHistory is NOT included here
});
```

`base44.functions.invoke(name, params)` maps to `POST /api/functions/${name}` (base44Client.js line ~215).  
Resolved endpoint: **`POST /api/functions/generateDigest`** ✅ — exists in `backend/src/routes/functions.js` line 82.

**Field name match:**
- Frontend sends: `lecture_id`, `learning_goal`, `topics` ✅
- Backend expects: `const { lecture_id, learning_goal, topics = [] } = req.body;` ✅ — exact match.

**Bug 1 — `useHistory` never sent:**  
`useHistory` is wired to a toggle switch in the UI (`aria-checked={useHistory}`, visual knob animates) but is never included in the `functions.invoke` payload. The backend `generateDigest` also has no parameter for it. The toggle looks interactive but does nothing. This is a non-functional UI element.

**After generation — navigation:**
```js
// GenerateDigest.jsx line ~109
const digestId = result?.digest_id;
navigate(`/digests/${digestId}`);
```
`functions.js` returns `{ digest_id: digestRef.id, ... }` ✅ — field names match.  
Route `/digests/:id` maps to `DigestResults` component in App.jsx ✅.

**No broken imports or undefined variables** in GenerateDigest.jsx. All imports resolve (`formatDuration`, `compactDuration` from lectureUtils, all UI components).

---

### 2. MyDigest.jsx — My Digests listing page

**API endpoints used:**
```js
base44.entities.Digest.list("-created_date", 200)   // → GET /api/digests?sort=...&limit=200
base44.entities.Lecture.list("-created_date", 200)  // → GET /api/lectures?sort=...&limit=200
```
Both backend routes exist and are mounted in `server.js` ✅.

**Field name usage on digest cards:**
```js
const lec = lectures[d.lectureId || d.lecture_id];  // robust fallback ✅
d.title           // set by generateDigest as string ✅
d.learning_goal   // set by generateDigest ✅
d.duration        // set by generateDigest ✅
d.duration_label  // set by generateDigest ✅
d.created_date    // set by generateDigest ✅
d.topics          // set by generateDigest as array ✅
```
All field names match what `generateDigest` writes to Firestore. No mismatches.

**Actions on each card:**
- `<Link to={/digests/${d.id}}>` — Watch button and title link ✅ route exists
- `handleDelete(d.id)` — calls `DigestSegment.deleteMany({ digest_id: id })` then `Digest.delete(id)`:
  - `deleteMany` → `POST /api/digest-segments/delete-many` with `{ digest_id: id }` ✅ — `segments.js` handles this and queries Firestore with `.where('digestId', '==', digest_id)` ✅
  - `Digest.delete` → `DELETE /api/digests/:id` ✅ — exists in `digests.js`

**Bug 5 — dead import (non-breaking):**  
`import { PURPOSE_LABELS, compactDuration, relativeDate } from "@/lib/lectureUtils";`  
`PURPOSE_LABELS` is imported but never referenced anywhere in `MyDigest.jsx`. Harmless (no runtime error).

**No regenerate action** on the cards — just View (Watch) and Delete. The "Generate" button navigates to `/generate-digest` without pre-filling a lecture. This is by design; there's no "regenerate" feature.

---

### 3. DigestResult.jsx

**Lecture lookup — field name fix:**
```js
// DigestResult.jsx line ~47
const lecId = dig.lectureId || dig.lecture_id;
```
`generateDigest` stores the field as `lectureId` (camelCase). The `|| dig.lecture_id` fallback handles legacy/other creation paths. This is correct and robust ✅.

**Transcript tab:**
```js
base44.entities.Transcript.filter({ lecture_id: lecId }, "timestamp", 500)
// → GET /api/transcripts?lecture_id=<id>&sort=timestamp&limit=500
```
`transcripts.js` accepts both `lecture_id` and `lectureId` in `req.query` and queries Firestore by `lectureId`. ✅ Works.

**DigestSegment fetch:**
```js
base44.entities.DigestSegment.filter({ digest_id: id }, "start_time", 100)
// → GET /api/digest-segments?digest_id=<id>&sort=start_time&limit=100
```
`segments.js` GET `/` reads `req.query.digest_id`, queries Firestore `.where('digestId', '==', digest_id)`, and returns objects with snake_case fields (`start_time`, `end_time`, `relevance_score`, etc.) ✅.  
`DigestResult.jsx` reads `s.start_time`, `s.end_time`, `s.relevance_score` — matches the mapped response ✅.

**Transcript filtering against segments:**
```js
transcripts.filter((t) =>
  segments.some((s) => t.timestamp >= s.start_time - 5 && t.timestamp <= s.end_time + 5)
)
```
Both use `start_time`/`end_time` (snake_case as returned by segments.js) and `timestamp` (as returned by transcripts.js) ✅.

**Ask about lecture chat — Bug 4 (Critical):**  
`DigestChat.jsx` calls `base44.post("/chat/ask", { lectureId, question, conversationHistory })`.  
`chat.js` route `POST /api/chat/ask` uses `authenticate` middleware (JWT-based).  
`authenticate` reads `req.headers.authorization?.split(' ')[1]` and verifies against `JWT_SECRET`.  

The `base44Client.js` interceptor sends the token from `localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('base44_access_token')`.  

**If the app uses Firebase Auth (Google Sign-In)**, the Firebase ID token is managed by Firebase SDK, not stored under those localStorage keys unless explicitly set by the app's `AuthContext`. If `AuthContext.jsx` stores the Firebase token under one of those keys on login, chat will work; if it doesn't, every chat message will return **401 Unauthorized** and the DigestChat component will show the "Could not get a response" error.  

This needs verification against `AuthContext.jsx`, but it is the single most likely cause of chat being broken.

**No remaining field name mismatches** in DigestResult.jsx after the earlier `lectureId` fix.

---

### 4. backend/src/routes/digests.js

**Routes defined:**
| Method | Path | Status |
|--------|------|--------|
| GET | `/api/digests` | ✅ Mounted, works |
| GET | `/api/digests/:id` | ✅ Mounted, works |
| POST | `/api/digests` | ✅ Mounted — but **not used by the frontend** (frontend generates via `/api/functions/generateDigest` instead) |
| PATCH | `/api/digests/:id` | ✅ Mounted, works |
| DELETE | `/api/digests/:id` | ✅ Mounted, works |

**No dead-code-after-export bug** — `export default router` is the last statement in the file ✅.

**Structural observation — two digest creation paths:**  
The `POST /api/digests` route creates a bare digest with `{ lectureId, userId, type, status: 'processing' }` and **does not do AI generation**. This route is not called by the frontend. The real digest creation goes through `POST /api/functions/generateDigest` which creates a fully-populated digest with AI content. This dual-path is not a bug, just potentially confusing.

**Field name in `digests.js` GET routes:**  
The GET list route filters by `req.query.lectureId` (camelCase). The frontend sends `lecture_id` when filtering (from `Digest.filter({ lecture_id: id })`). This means **filtering digests by lecture from `DigestResult.jsx` would fail** if called. Currently `DigestResult.jsx` fetches the single digest by ID via `Digest.get(id)` (not `filter`), so this mismatch is dormant but would break any feature that tries to filter digests by lecture.

---

### 5. backend/src/routes/functions.js — generateDigest route

**Works correctly for the happy path:**
- Reads `lecture_id`, `learning_goal`, `topics` ✅
- Fetches lecture and transcripts from Firestore ✅
- Calls Groq AI, parses JSON response ✅
- Stores digest with `lectureId` (camelCase), `learning_goal`, `topics`, `key_takeaways`, `created_date`, `duration_label`, etc. ✅
- Stores segments in `segments` collection with `digestId`, `startTime`, `endTime`, `relevanceScore` (camelCase in Firestore) ✅
- Returns `{ digest_id: digestRef.id }` ✅

**One syntax issue (non-crashing):** Line ~142 contains a template literal with a comment inline:
```js
${fullTranscript.substring(0, 100000)} // Limit to ~100k chars for API
```
This comment is **inside the template literal string**, so it will be sent as literal text to Groq. Not a crash, but it sends `// Limit to ~100k chars for API` as part of the transcript prompt. Minor but a bug.

---

## Summary of All Issues

### Confirmed Bugs (need fixing)

**Bug 1 — `useHistory` toggle does nothing (GenerateDigest.jsx)**  
The "Use my previous activity" switch updates React state but the value is never included in the `functions.invoke` call. The toggle is decorative. Either wire it into the payload or remove the UI element.  
_File:_ `frontend/src/pages/GenerateDigest.jsx` line ~96–101

**Bug 2 — Template literal comment sent to Groq (functions.js)**  
The comment `// Limit to ~100k chars for API` appears inside the prompt template string and gets sent verbatim to the AI.  
_File:_ `backend/src/routes/functions.js` line ~142

**Bug 3 — GET /api/digests filter uses camelCase, client sends snake_case (digests.js)**  
`req.query.lectureId` in the list route won't match `lecture_id` sent by `Digest.filter()`. Currently dormant but would break any lecture-scoped digest listing.  
_File:_ `backend/src/routes/digests.js` line ~10

**Bug 4 — DigestChat returns 401 if Firebase token not in expected localStorage key (chat.js + DigestChat.jsx)**  
`/api/chat/ask` requires JWT auth. If Firebase Auth is used and the token isn't stored under `auth_token`/`token`/`base44_access_token`, every question gets a 401 and the chat panel is broken.  
_Files:_ `backend/src/routes/chat.js` line ~8, `frontend/src/components/digest/DigestChat.jsx` line ~49, `frontend/src/api/base44Client.js` interceptor

### Non-Breaking (low priority)

**Bug 5 — Dead import in MyDigest.jsx**  
`PURPOSE_LABELS` is imported but never used. No runtime effect.  
_File:_ `frontend/src/pages/MyDigest.jsx` line ~18

---

## Recommended Fixes

1. **GenerateDigest.jsx:** Add `use_history: useHistory` to the `functions.invoke` payload, and handle it in `generateDigest` on the backend (can be a no-op initially to unblock UI).

2. **functions.js line ~142:** Move the comment outside the template literal:
   ```js
   // Limit to ~100k chars for API
   ${fullTranscript.substring(0, 100000)}
   ```

3. **digests.js GET `/`:** Accept both `lecture_id` and `lectureId` in the query filter:
   ```js
   const { userId, lectureId, lecture_id, status, limit = 50 } = req.query;
   const lecId = lecture_id || lectureId;
   if (lecId) query = query.where('lectureId', '==', lecId);
   ```

4. **DigestChat / chat.js:** Verify that `AuthContext.jsx` stores the Firebase ID token under one of the localStorage keys the axios interceptor reads. If it uses a different key or sets the token via a different mechanism, either:
   - Update the interceptor to also check that key, or
   - Pass the token as a prop to `DigestChat` and include it in the request header directly, or
   - Remove `authenticate` from `chat.js` (risk: unauthenticated chat calls) and handle auth at a higher level.
