# Authentication Session Persistence Review

## Task Requirements
Fix authentication session persistence to work correctly with 1-minute auto-logout requirement:
- Store lastActivity timestamp in localStorage
- Check it on app mount and expire sessions after 1 minute of inactivity
- InactivityLogout component should update timestamp on user activity

## Changes Summary
- **AuthContext.jsx**: Added session expiration logic on mount, `updateLastActivity()` function, and lastActivity timestamp storage
- **InactivityLogout.jsx**: Added call to `updateLastActivity()` on user events

## Critical Blocker

### BLOCKER 1: Session timestamp incorrectly reset on page load
**Location:** `frontend/src/lib/AuthContext.jsx:42`

**Issue:** When a user returns to the app (page refresh or tab reopen) with a valid session (< 60 seconds since last activity), the code updates the lastActivity timestamp to the current time:

```javascript
// Session still valid, restore it
try {
  setToken(storedToken)
  setUser(JSON.parse(storedUser))
  // Update lastActivity to current time since they're back  ← PROBLEM
  localStorage.setItem('lastActivity', Date.now().toString())
```

**Consequence:** This grants users a fresh 60-second session window on every page reload, even if they were inactive for 59 seconds. The 1-minute inactivity timeout is effectively reset, violating the approved requirement.

**Expected behavior:** 
- User is active at T=0, lastActivity = 0
- User closes tab
- User returns at T=50 seconds
- Session should expire at T=60 seconds (10 seconds after return), not T=110 seconds

**Current behavior:**
- User returns at T=50 seconds
- lastActivity is reset to 50
- Session now expires at T=110 seconds

**Correction:** Remove line 42 that updates lastActivity on session restoration. The timestamp should only be updated on actual user interaction (via `updateLastActivity()` called by InactivityLogout), not on page load.

## Verification Gap

### BLOCKER 2: Required verification not performed
**Location:** Commit messages 2eb0019 and 3d18ca4

**Issue:** The task explicitly required verification of four scenarios:
1. Session expires after 1 minute when page is refreshed
2. Session expires after 1 minute when tab is closed and reopened
3. Active users stay logged in when interacting every 30 seconds
4. Existing 1-minute auto-logout during active browsing still works

**Evidence provided:** Only "npm run build succeeded with no errors"

**Consequence:** Without manual testing of the specified scenarios, the implementation cannot be confirmed to meet requirements. The build success only verifies no syntax errors, not functional correctness.

**Required action:** Perform and document manual testing of all four scenarios before approval.

## Secondary Issues

The implementation has additional concerns that compound the blockers:

1. **Inconsistent session state:** After session restoration, the in-memory `lastActivity` timestamp (not stored in a state variable) diverges from localStorage, making it impossible to track actual inactivity duration during the current page session.

2. **No synchronization with InactivityLogout timers:** When a page loads with 10 seconds remaining until expiration, InactivityLogout starts fresh 60-second timers, creating a mismatch between the expected expiration time and actual logout time.

## Verdict
**CHANGES_REQUESTED** - Two blockers must be resolved:
1. Remove the lastActivity timestamp reset on page load (line 42)
2. Perform and document the required manual testing scenarios

## Recommendations for Fix
1. In `AuthContext.jsx` line 42, remove: `localStorage.setItem('lastActivity', Date.now().toString())`
2. Consider passing remaining time to InactivityLogout to synchronize timers with existing session state
3. Complete manual testing per the task requirements and document results
