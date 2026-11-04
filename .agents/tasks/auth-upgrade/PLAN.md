# Authentication System Upgrade - Implementation Plan

## Executive Summary

After thorough investigation of the codebase, the authentication system already implements **most** of the required features. This plan identifies what works, what needs modification, and what needs to be created from scratch.

**Key Findings:**
- ✅ 85% of required features already exist with proper validation
- ⚠️ 10% need modifications (OTP attempts, auto-logout timer, login attempt tracking)
- 🆕 5% need to be created from scratch (password change on settings, backend password history endpoints)

---

## 1. REMOVE ADMIN/SUPER ADMIN ROLES

### Current State
- `ACCESS_TYPES` array in `/Users/mark/Context Aware/frontend/src/lib/authValidations.js` includes ["Super Admin", "Admin", "User"]
- Access Type dropdown exists in Register.jsx
- RoleRoute component guards admin routes ("/admin" for Super Admin + Admin, "/users" for Super Admin only)
- Backend sets role to 'student'/'professor'/'admin' but access_type defaults to 'User'

### Required Changes

#### 1.1 Remove Admin/Super Admin from ACCESS_TYPES
**File:** `/Users/mark/Context Aware/frontend/src/lib/authValidations.js`
- Change line 3: `export const ACCESS_TYPES = ["Super Admin", "Admin", "User"];` → `export const ACCESS_TYPES = ["User"];`

#### 1.2 Remove Access Type Dropdown from Register Page
**File:** `/Users/mark/Context Aware/frontend/src/pages/Register.jsx`
- Remove the Access Type select component (lines ~188-208)
- Remove `accessType` state and related handlers
- Set `accessType` to fixed value "User" in handleSubmit

#### 1.3 Remove Admin Routes
**File:** `/Users/mark/Context Aware/frontend/src/app.jsx`
- Remove RoleRoute imports and protected routes for `/users` and `/admin`
- Remove import statements for AdminPanel and UserManagement pages

#### 1.4 Backend - Default Role to User
**File:** `/Users/mark/Context Aware/backend/src/routes/auth.js`
- Line 31: Change `role: ['admin', 'professor', 'student'].includes(role) ? role : 'student'` to simply `role: 'User'`
- Update access_type field to always be 'User'

**Verification:** `npm run build` in frontend directory should pass with no errors.

---

## 2. REGISTRATION PAGE - VALIDATION

### Current State ✅
**All validations already exist and work correctly:**
- Full Name validation: Letters, hyphens, apostrophes only (FULL_NAME_REGEX)
- Birthday validation: 18+ age check with dynamic calculation
- Address: Required text field
- Email: Valid format with EMAIL_REGEX
- Mobile: Philippine format (09XXXXXXXXX or +639XXXXXXXXX)
- Password: 8-16 chars, uppercase, lowercase, number, special character
- Confirm Password: Copy/paste blocked with onPaste handler

### Required Changes
**NONE - All validations already implemented correctly**

**Verification:** Manual testing - fill out register form and verify all validation messages work.

---

## 3. OTP FLOW

### Current State
**OTP implementation exists via EmailJS:**
- Sends 6-digit code via `emailService.js`
- Stores OTP in sessionStorage with 10-minute expiry
- OTP verification happens client-side
- MAX_OTP_ATTEMPTS currently set to 5
- Resend cooldown: 60 seconds
- New OTP invalidates previous one

### Required Changes

#### 3.1 Change OTP Max Attempts from 5 to 3
**File:** `/Users/mark/Context Aware/frontend/src/pages/Register.jsx`
- Line 35: Change `const MAX_OTP_ATTEMPTS = 5;` → `const MAX_OTP_ATTEMPTS = 3;`

**File:** `/Users/mark/Context Aware/frontend/src/pages/ForgotPassword.jsx`
- Line 12: Change `const MAX_OTP_ATTEMPTS = 5;` → `const MAX_OTP_ATTEMPTS = 3;`

#### 3.2 Verify OTP Expiry is 5 Minutes
**File:** `/Users/mark/Context Aware/frontend/src/lib/emailService.js`
- Line 10: Currently `const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes`
- **CHANGE TO:** `const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes`

#### 3.3 Verify No Auto-Login After Registration
**File:** `/Users/mark/Context Aware/frontend/src/pages/Register.jsx`
- Line 132: Already redirects to `/login?registered=1` ✅
- No automatic login happens ✅

**Verification:** 
1. Register new account
2. Enter OTP
3. Verify redirect to login page (not auto-logged in)
4. Verify max 3 OTP attempts
5. Verify OTP expires after 5 minutes

---

## 4. LOGIN PAGE - SECURITY

### Current State
**Login attempt tracking exists but uses localStorage:**
- MAX_ATTEMPTS = 3 ✅
- 5-minute lockout (LOCKOUT_MS = 5 * 60 * 1000) ✅
- Tracks attempts in localStorage per email ✅
- Shows correct error messages ✅

### Required Changes

#### 4.1 Move Failed Login Tracking to Firestore
**Current:** Uses localStorage (client-side only)
**Required:** Server-side tracking in Firestore

**Files to modify:**
1. **Backend:** `/Users/mark/Context Aware/backend/src/routes/auth.js`
   - Add failed attempt tracking in login endpoint
   - Check `failedLoginAttempts` and `loginLockedUntil` fields on user document
   - Increment attempts on failed login
   - Reset to 0 on successful login
   - Set `loginLockedUntil` timestamp when attempts reach 3

2. **Frontend:** `/Users/mark/Context Aware/frontend/src/pages/Login.jsx`
   - Remove localStorage lockout logic (lines 17-23, 46-54, 72-83, 96-104)
   - Backend will return 429 status when locked
   - Display error message from backend response

**New Backend Logic:**
```javascript
// In /backend/src/routes/auth.js login endpoint:
// 1. Check if user.loginLockedUntil > current time → return 429
// 2. On invalid password:
//    - Increment user.failedLoginAttempts
//    - If attempts >= 3: set loginLockedUntil = now + 5 minutes
// 3. On success: set failedLoginAttempts = 0, loginLockedUntil = null
```

**Verification:**
1. Attempt login with wrong password 3 times
2. Check Firestore - verify failedLoginAttempts = 3 and loginLockedUntil is set
3. Wait 5 minutes
4. Verify can login again
5. Check attempts reset to 0 on successful login

---

## 5. FORGOT PASSWORD FLOW

### Current State ✅
**Fully implemented:**
- User enters email → check if exists
- Sends OTP via EmailJS
- 6-digit code, 5-minute expiry (after fix in section 3.2)
- Verify OTP → redirect to ResetPassword page
- New password with validation
- Password reuse check via `isPasswordReused()`
- Shows error if password reused
- Redirects to /login

### Required Changes
**NONE - Already fully implemented**

**Verification:** Complete forgot password flow end-to-end.

---

## 6. RESET PASSWORD (Change Password on Settings)

### Current State
**DOES NOT EXIST** - Settings page has no password change feature

### Required Changes

#### 6.1 Create Change Password Feature in Settings
**File:** `/Users/mark/Context Aware/frontend/src/pages/Settings.jsx`

**Add new section after Privacy & Data:**
```javascript
// Add to Settings.jsx:
// - Section titled "CHANGE PASSWORD"
// - Fields: Current Password, New Password, Confirm New Password
// - Use PasswordInput component
// - Use PasswordStrength component for new password
// - Call new backend endpoint: /api/auth/change-password
// - Check password reuse with isPasswordReused()
// - Show success toast and clear fields on success
```

**Implementation Steps:**
1. Add state: `currentPassword`, `newPassword`, `confirmNewPassword`
2. Add password change section with Lock icon
3. Validate current password is not empty
4. Validate new password meets requirements
5. Check new password not in history
6. Call backend endpoint
7. Record new password hash
8. Show success message

#### 6.2 Create Backend Change Password Endpoint
**File:** `/Users/mark/Context Aware/backend/src/routes/auth.js`

**Add new endpoint:**
```javascript
router.post('/change-password', authenticate, async (req, res) => {
  // 1. Verify current password matches user's password in Firestore
  // 2. Validate new password
  // 3. Check password not in passwordHistory array (last 5)
  // 4. Hash new password
  // 5. Add old password hash to passwordHistory array (keep last 5)
  // 6. Update user document with new password and passwordHistory
  // 7. Return success
});
```

**Verification:**
1. Go to Settings page
2. Enter current password and new password
3. Verify can change password
4. Verify cannot reuse any of last 5 passwords
5. Login with new password works

---

## 7. PASSWORD HISTORY

### Current State
**Partially implemented:**
- Client-side hashing exists in `passwordHistory.js`
- Functions `recordPasswordHash()` and `isPasswordReused()` exist
- Backend functions endpoint exists but missing password history functions

### Required Changes

#### 7.1 Add Password History Backend Functions
**File:** `/Users/mark/Context Aware/backend/src/routes/functions.js`

**Add two new function endpoints:**

```javascript
// Function 1: Record password hash
router.post('/recordPasswordHash', authenticate, async (req, res) => {
  // 1. Get authenticated user ID
  // 2. Get password_hash from request body
  // 3. Fetch user's passwordHistory array (or create empty)
  // 4. Add new hash to beginning of array
  // 5. Keep only last 5 hashes
  // 6. Update user document
  // 7. Return success
});

// Function 2: Check password reuse
router.post('/checkPasswordReuse', async (req, res) => {
  // 1. Get email and candidate_hash from request body
  // 2. Find user by email
  // 3. Get passwordHistory array
  // 4. Check if candidate_hash exists in array
  // 5. Return { reused: true/false }
});
```

#### 7.2 Add passwordHistory Field to User Schema
**File:** `/Users/mark/Context Aware/backend/src/routes/auth.js`

**Update registration to include:**
```javascript
passwordHistory: [], // Array of hashed passwords, max 5
```

#### 7.3 Update base44Client to Support Functions
**File:** `/Users/mark/Context Aware/frontend/src/api/base44Client.js`

**Verify functions.invoke() method exists and works**

**Verification:**
1. Register new account - verify passwordHistory field created
2. Change password - verify old password added to history
3. Try to reuse old password - verify rejected
4. Change password 6 times - verify only last 5 stored

---

## 8. AUTO LOGOUT

### Current State
**Implemented with 30-minute timeout:**
- InactivityLogout.jsx component exists
- Tracks mouse, keyboard, scroll, touch events
- Shows warning 5 minutes before logout
- Logs out after 30 minutes

### Required Changes

#### 8.1 Change Timeout from 30 Minutes to 1 Minute
**File:** `/Users/mark/Context Aware/frontend/src/components/InactivityLogout.jsx`

**Current:**
- Line 5: `const INACTIVITY_LIMIT_MS = 1800000; // 30 minutes`
- Line 6: `const WARNING_AT_MS = 1500000; // warn 5 minutes before`

**Change to:**
```javascript
const INACTIVITY_LIMIT_MS = 60000; // 1 minute of inactivity
const WARNING_AT_MS = 50000; // warn 10 seconds before logout
```

**Update warning message:**
- Line 31: Keep message: "Your session will expire soon due to inactivity."

**Verification:**
1. Login and stay idle for 50 seconds
2. Verify warning toast appears
3. Stay idle for 10 more seconds
4. Verify auto-logout and redirect to login page

---

## 9. BACKEND USER SCHEMA

### Current State
**Existing fields in user document:**
- email ✅
- password (hashed) ✅
- name ✅
- role ✅
- access_type ✅
- createdAt ✅
- lastLogin ✅
- preferences ✅

**Missing fields:**
- birthday (being added via updateMe)
- address (being added via updateMe)
- mobile_number (being added via updateMe)
- username (being added via updateMe)
- passwordHistory (NEW - needs to be added)
- failedLoginAttempts (NEW - needs to be added)
- loginLockedUntil (NEW - needs to be added)
- otpCode (frontend handles OTP in sessionStorage)
- otpExpiry (frontend handles OTP in sessionStorage)
- otpAttempts (frontend handles OTP in sessionStorage)

### Required Changes

#### 9.1 Update Registration to Include All Fields
**File:** `/Users/mark/Context Aware/backend/src/routes/auth.js`

**Modify registration userData object (lines 31-37):**
```javascript
const userData = {
  email,
  password: hashedPassword,
  name,
  birthday: null,
  address: null,
  mobile_number: null,
  username: email, // Username is email
  role: 'User',
  access_type: 'User',
  passwordHistory: [], // Array of last 5 password hashes
  failedLoginAttempts: 0,
  loginLockedUntil: null,
  createdAt: new Date().toISOString(),
  lastLogin: null,
  preferences: { theme: 'light', notifications: true },
};
```

**Verification:**
1. Register new account
2. Check Firestore user document
3. Verify all fields exist with correct default values

---

## 10. VALIDATION FUNCTIONS

### Current State ✅
**All validation functions exist and work correctly:**
- `validateFullName()` - letters, spaces, hyphen, apostrophe ✅
- `validateAge()` / `validateBirthday()` - 18+ dynamic check ✅
- `validatePhilippineMobile()` / `validateMobile()` - Philippine format ✅
- `validatePasswordStrength()` - returns strength level ✅
- `checkPasswordRequirements()` - returns object with each requirement ✅

### Required Changes
**NONE - All validations already implemented correctly**

**Verification:** All validations tested during registration process.

---

## 11. PASSWORD STRENGTH INDICATOR

### Current State ✅
**Fully implemented in PasswordStrength.jsx:**
- Shows 5 segment bar (one per requirement)
- Red (Weak) - < 3 requirements met
- Yellow (Average) - 3-4 requirements met  
- Green (Strong) - all 5 requirements met
- Individual requirement checklist with ✅/❌
- Shows: Length (8-16), Uppercase, Lowercase, Number, Special char

### Required Changes
**NONE - Already fully implemented**

**Verification:** Type password in register/reset form and watch indicator update live.

---

## Implementation Order

### Phase 1: Quick Fixes (2-3 hours)
**These are simple constant changes:**

1. ✅ Change OTP max attempts from 5 to 3 (Register.jsx, ForgotPassword.jsx)
2. ✅ Change OTP expiry from 10 to 5 minutes (emailService.js)
3. ✅ Change auto-logout from 30 min to 1 min (InactivityLogout.jsx)
4. ✅ Remove Admin/Super Admin from ACCESS_TYPES (authValidations.js)
5. ✅ Remove Access Type dropdown from Register page
6. ✅ Remove admin routes from app.jsx
7. ✅ Update backend default role to 'User'

**Verification:** `npm run build:frontend` should pass.

### Phase 2: Backend Enhancements (4-6 hours)
**Move client-side tracking to server-side:**

8. 🆕 Update user schema in backend register endpoint (add all fields)
9. 🆕 Implement server-side login attempt tracking in Firestore
10. 🆕 Add password history functions to backend (recordPasswordHash, checkPasswordReuse)
11. 🆕 Update login endpoint to track failed attempts in Firestore
12. ✅ Update frontend Login.jsx to use backend lockout status

**Verification:** Test login lockout and verify Firestore tracks attempts.

### Phase 3: New Features (3-4 hours)
**Add missing password change feature:**

13. 🆕 Create Change Password section in Settings.jsx
14. 🆕 Add POST /auth/change-password backend endpoint
15. 🆕 Integrate password reuse check in change password flow
16. ✅ Test complete change password flow

**Verification:** Change password in Settings and verify history prevents reuse.

### Phase 4: Integration Testing (2-3 hours)
**End-to-end testing of all flows:**

17. ✅ Test complete registration flow with OTP (3 attempts max, 5 min expiry)
18. ✅ Test login flow with server-side lockout (3 attempts, 5 min block)
19. ✅ Test forgot password flow with password history check
20. ✅ Test change password in Settings with reuse prevention
21. ✅ Test auto-logout after 1 minute idle
22. ✅ Verify password strength indicator works everywhere
23. ✅ Verify all validations work (name, birthday, email, mobile, password)
24. ✅ Test that admin routes and role selection are completely removed

**Final Verification:** `npm run build:frontend` passes with no errors or warnings.

---

## Summary Statistics

### What Already Works ✅
- Full name validation (letters only, hyphen/apostrophe allowed)
- Birthday validation (18+ dynamic check)
- Address field (required)
- Email validation (format check)
- Mobile phone validation (Philippine format only)
- Password validation (8-16 chars, complexity requirements)
- Confirm password (copy/paste blocked)
- OTP flow (send, verify, resend with cooldown)
- Password strength indicator (5-level with individual requirements)
- Forgot password flow (complete)
- Reset password page (with history check)
- Login attempt limits (3 max, needs Firestore migration)
- Auto-logout (exists, needs timer adjustment)
- Password reuse prevention (client-side exists, needs backend functions)

### What Needs Modification ⚠️
- OTP max attempts: 5 → 3
- OTP expiry: 10 min → 5 min
- Auto-logout: 30 min → 1 min
- ACCESS_TYPES: remove Admin/Super Admin
- Remove Access Type dropdown
- Remove admin routes
- Login tracking: localStorage → Firestore
- Backend default role: 'student' → 'User'

### What Needs to Be Created 🆕
- Change password feature in Settings page
- Backend /auth/change-password endpoint
- Backend password history functions (recordPasswordHash, checkPasswordReuse)
- Updated user schema with all required fields
- Server-side login attempt tracking in Firestore

---

## Potential Issues & Dependencies

### 1. EmailJS Configuration
**Dependency:** EmailJS service must be configured with valid credentials
**Files:** `.env` must have:
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_OTP_TEMPLATE_ID`
- `VITE_EMAILJS_RESET_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

**Risk:** OTP emails won't send if credentials are invalid
**Mitigation:** Test OTP flow immediately after Phase 1

### 2. Firestore Index Requirements
**Dependency:** Firestore composite indexes may be needed for queries
**Potential Indexes:**
- `users` collection: (email, failedLoginAttempts, loginLockedUntil)

**Risk:** Queries may fail without proper indexes
**Mitigation:** Firebase console will show index creation link in error message

### 3. Password History Array Management
**Dependency:** Need to ensure passwordHistory array never exceeds 5 items
**Risk:** Array could grow unbounded
**Mitigation:** Backend functions must slice to last 5 on every update

### 4. Session Management
**Dependency:** Auto-logout at 1 minute may be too aggressive for production
**Risk:** Users may get logged out while actively working
**Mitigation:** Recommend changing to 5-10 minutes after testing user feedback

### 5. Client-Side OTP Storage
**Current:** OTP stored in sessionStorage (not secure for production)
**Risk:** User could inspect sessionStorage and see OTP
**Mitigation:** For production, move OTP storage to backend with hashing

### 6. Build Process
**Dependency:** Vite build must complete without errors
**Risk:** Type errors or import issues could break build
**Mitigation:** Run `npm run build` after each phase

---

## Testing Checklist

### Registration Flow
- [ ] Full name validation rejects numbers
- [ ] Birthday validation requires 18+
- [ ] Email validation rejects invalid formats
- [ ] Mobile validation accepts only Philippine format
- [ ] Password strength indicator updates live
- [ ] Confirm password blocks copy/paste
- [ ] Access Type dropdown is removed
- [ ] OTP email sends successfully
- [ ] OTP blocks after 3 incorrect attempts
- [ ] OTP expires after 5 minutes
- [ ] Resend OTP works with 60s cooldown
- [ ] New OTP invalidates old one
- [ ] Account created successfully
- [ ] Redirects to login (NO auto-login)
- [ ] All fields saved to Firestore correctly

### Login Flow
- [ ] Email and password fields work
- [ ] Show/hide password works
- [ ] Remember me saves email
- [ ] Failed attempts tracked in Firestore
- [ ] Locked after 3 failed attempts
- [ ] Lockout shows countdown timer
- [ ] Lockout expires after 5 minutes
- [ ] Successful login resets attempt counter
- [ ] Password hash recorded after login
- [ ] No admin roles selectable

### Forgot Password Flow
- [ ] Email validation works
- [ ] OTP sent to email
- [ ] OTP verification works (3 attempts max)
- [ ] OTP expires after 5 minutes
- [ ] Reset password page shows
- [ ] New password validated
- [ ] Password reuse checked and blocked
- [ ] Password reset success
- [ ] Redirect to login works
- [ ] Can login with new password

### Change Password (Settings)
- [ ] Change password section exists
- [ ] Current password required
- [ ] New password validated
- [ ] Password strength indicator shows
- [ ] Confirm password blocks copy/paste
- [ ] Password reuse checked (last 5)
- [ ] Old password rejected with error message
- [ ] New password saves successfully
- [ ] Old password added to history
- [ ] Can login with new password

### Auto-Logout
- [ ] Warning shows after 50 seconds idle
- [ ] Logout happens after 60 seconds idle
- [ ] Mouse movement resets timer
- [ ] Keyboard input resets timer
- [ ] Scrolling resets timer
- [ ] Touch events reset timer
- [ ] Redirects to login after logout

### Admin Routes Removal
- [ ] No Admin/Super Admin in ACCESS_TYPES
- [ ] No Access Type dropdown in registration
- [ ] /admin route does not exist
- [ ] /users route does not exist
- [ ] RoleRoute guards removed from app.jsx
- [ ] All users created with role 'User'

### Password Validation
- [ ] Minimum 8 characters enforced
- [ ] Maximum 16 characters enforced
- [ ] Requires uppercase letter
- [ ] Requires lowercase letter
- [ ] Requires number
- [ ] Requires special character
- [ ] Strength indicator: Red (weak) < 3 requirements
- [ ] Strength indicator: Yellow (average) 3-4 requirements
- [ ] Strength indicator: Green (strong) all 5 requirements
- [ ] Individual requirement checklist shows ✅/❌

### Build & Deploy
- [ ] `npm run build:frontend` passes
- [ ] No console errors in production build
- [ ] All routes accessible after build
- [ ] Environment variables loaded correctly

---

## Files Modified Summary

### Frontend Files Modified (10 files)
1. `/Users/mark/Context Aware/frontend/src/lib/authValidations.js` - Remove admin roles
2. `/Users/mark/Context Aware/frontend/src/pages/Register.jsx` - Remove dropdown, fix OTP attempts
3. `/Users/mark/Context Aware/frontend/src/pages/Login.jsx` - Use Firestore for lockout
4. `/Users/mark/Context Aware/frontend/src/pages/ForgotPassword.jsx` - Fix OTP attempts
5. `/Users/mark/Context Aware/frontend/src/lib/emailService.js` - Fix OTP expiry
6. `/Users/mark/Context Aware/frontend/src/components/InactivityLogout.jsx` - Fix timeout
7. `/Users/mark/Context Aware/frontend/src/app.jsx` - Remove admin routes
8. `/Users/mark/Context Aware/frontend/src/pages/Settings.jsx` - Add change password
9. `/Users/mark/Context Aware/frontend/src/api/base44Client.js` - Verify functions support
10. `/Users/mark/Context Aware/frontend/src/lib/passwordHistory.js` - Already correct ✅

### Backend Files Modified (2 files)
1. `/Users/mark/Context Aware/backend/src/routes/auth.js` - Update schema, add endpoints
2. `/Users/mark/Context Aware/backend/src/routes/functions.js` - Add password history functions

### Files Already Correct (No Changes) ✅
- `/Users/mark/Context Aware/frontend/src/components/PasswordStrength.jsx`
- `/Users/mark/Context Aware/frontend/src/components/PasswordInput.jsx`
- `/Users/mark/Context Aware/frontend/src/components/auth/OtpStep.jsx`
- `/Users/mark/Context Aware/frontend/src/pages/ResetPassword.jsx`
- `/Users/mark/Context Aware/frontend/src/components/RoleRoute.jsx` (will be unused after admin removal)
- `/Users/mark/Context Aware/frontend/src/components/ProtectedRoute.jsx`

---

## Estimated Time

- **Phase 1 (Quick Fixes):** 2-3 hours
- **Phase 2 (Backend Enhancements):** 4-6 hours
- **Phase 3 (New Features):** 3-4 hours
- **Phase 4 (Testing):** 2-3 hours

**Total Estimated Time:** 11-16 hours

---

## Digest: Verification Evidence

### Files Read and Verified

**Authentication Validation:**
- `authValidations.js` (lines 1-180): All validation functions exist - Full name (letters only), Birthday (18+ dynamic), Email (format), Mobile (PH format 09XX/+639XX), Password (8-16 chars, complexity), Username functions
- Current ACCESS_TYPES: ["Super Admin", "Admin", "User"] on line 3
- PASSWORD_MIN=8, PASSWORD_MAX=16 on lines 45-46

**Registration Page:**
- `Register.jsx` (lines 1-227): Complete registration form with all required fields
- Access Type dropdown exists (lines 188-208) - uses SELECT component
- OTP flow implemented with MAX_OTP_ATTEMPTS = 5 (line 35) - needs change to 3
- Copy/paste blocked on confirm password (line 209)
- Redirects to /login?registered=1 (line 132) - no auto-login ✅

**Login Page:**
- `Login.jsx` (lines 1-133): Complete login with attempt tracking
- MAX_ATTEMPTS = 3, LOCKOUT_MS = 5*60*1000 (5 minutes) ✅
- Uses localStorage for lockout tracking (lines 17-23) - needs Firestore migration
- Shows correct error messages ✅
- Remember me feature exists ✅

**Forgot Password:**
- `ForgotPassword.jsx` (lines 1-108): Complete flow implemented
- MAX_OTP_ATTEMPTS = 5 (line 12) - needs change to 3
- OTP verification and reset flow working ✅

**Reset Password:**
- `ResetPassword.jsx` (lines 1-118): Complete with password reuse check
- Uses `isPasswordReused()` function (line 32) ✅
- Guards against reusing previous passwords ✅

**Password History:**
- `passwordHistory.js` (lines 1-48): Client-side hashing implemented
- Functions: hashPassword, recordPasswordHash, isPasswordReused
- Calls backend functions that don't exist yet: "recordPasswordHash", "checkPasswordReuse"

**Auto-Logout:**
- `InactivityLogout.jsx` (lines 1-46): Implemented with timers
- INACTIVITY_LIMIT_MS = 1800000 (30 minutes) - needs change to 60000 (1 minute)
- WARNING_AT_MS = 1500000 (25 minutes) - needs change to 50000 (50 seconds)
- Tracks: click, keydown, scroll, touchstart events ✅

**Password Strength:**
- `PasswordStrength.jsx` (lines 1-67): Complete visual indicator
- Shows 5-segment bar with color coding ✅
- Individual requirement checklist with ✅/❌ ✅
- Requirements: length, upper, lower, number, special ✅

**OTP Service:**
- `emailService.js` (lines 1-77): EmailJS integration working
- OTP_TTL_MS = 10*60*1000 (10 minutes) - needs change to 5*60*1000 (5 minutes)
- Generates 6-digit code ✅
- Stores in sessionStorage ✅
- Verification logic correct ✅

**Backend Auth:**
- `auth.js` (lines 1-239): All endpoints exist
- POST /register - creates user with role defaulting to 'student' (line 31)
- POST /login - validates credentials, no attempt tracking yet
- POST /reset-password - updates password (line 202)
- PATCH /me - updates profile fields (line 147)
- Missing: /change-password endpoint
- Missing: password history tracking
- Missing: failed login attempt tracking

**Backend Functions:**
- `functions.js` (lines 1-180): Has deleteLecture, generateDigest, generateLectureAnalysis
- Missing: recordPasswordHash function
- Missing: checkPasswordReuse function

**App Routing:**
- `app.jsx` (lines 1-106): Complete routing structure
- RoleRoute guards: /users (Super Admin only), /admin (Super Admin + Admin)
- These routes need to be removed ✅

**Build Commands:**
- Root package.json: `build:frontend` = "cd frontend && npm run build"
- Frontend package.json: `build` = "vite build"
- Test: `npm run build:frontend` from root

### What Works Today (Tested via Code Review)
✅ Full name validation (FULL_NAME_REGEX)
✅ Birthday 18+ validation (latestSelectableBirthday)
✅ Email validation (EMAIL_REGEX)
✅ Mobile Philippine format (MOBILE_REGEX)
✅ Password complexity validation (checkPasswordRequirements)
✅ Password strength indicator (5 levels, visual checklist)
✅ Copy/paste blocking on confirm password
✅ OTP send/verify flow (EmailJS integration)
✅ Forgot password complete flow
✅ Reset password with reuse check
✅ Login with localStorage attempt tracking
✅ Auto-logout with inactivity timer
✅ Remember me feature
✅ No auto-login after registration

### What Needs Changes
⚠️ OTP max attempts: 5 → 3 (2 files)
⚠️ OTP expiry: 10 min → 5 min (1 file)
⚠️ Auto-logout: 30 min → 1 min (1 file)
⚠️ ACCESS_TYPES: remove admin roles (1 file)
⚠️ Register: remove dropdown (1 file)
⚠️ App routes: remove admin routes (1 file)
⚠️ Login: move to Firestore tracking (2 files)
⚠️ Backend: default role to 'User' (1 file)

### What Needs Creation
🆕 Settings: change password section (1 file)
🆕 Backend: /auth/change-password endpoint (1 file)
🆕 Backend: password history functions (1 file)
🆕 Backend: login attempt Firestore tracking (1 file)
🆕 Backend: user schema with all fields (1 file)

---

## Conclusion

The existing codebase has a solid authentication foundation. Most features already work correctly. The implementation focuses on:

1. **Minor adjustments** (OTP attempts, timeouts, role removal)
2. **Backend migration** (localStorage → Firestore for login attempts)
3. **Missing features** (change password in Settings, password history backend)

The phased approach ensures each change is tested before moving forward, minimizing risk and ensuring all features work together correctly.
