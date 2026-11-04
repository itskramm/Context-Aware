# Review: Four Digest-Page Bug Fixes

## Commits reviewed

| SHA | Message |
|-----|---------|
| `44af602` | fix: four digest bugs (use_history, template comment, lecture_id filter, DigestChat auth) |
| `c4ff326` | fix: move Groq prompt comment outside template literal (bug2) — re-applies bug 2 correctly |

Both commits are on `main` and pushed to `origin/main` (`HEAD -> main, origin/main, origin/HEAD`).

---

## Bug 1 — `use_history` in GenerateDigest.jsx + functions.js

**Requirement:** `use_history: useHistory` must be included in `functions.invoke('generateDigest', ...)` payload AND `backend/src/routes/functions.js` must accept it from `req.body` and store it on the Firestore digest document.

**Evidence:**

- `GenerateDigest.jsx` (~line 97): `use_history: useHistory` is present in the invoke payload alongside `lecture_id`, `learning_goal`, and `topics`.
- `backend/src/routes/functions.js` (~line 84): `const { lecture_id, learning_goal, topics = [], use_history = false } = req.body;`
- Same file (~line 183): `use_history: use_history` is present in the `db.collection('digests').add({...})` call.

**Verdict:** ✅ Requirement fully met.

---

## Bug 2 — Comment outside template literal in functions.js

**Requirement:** `// Limit to ~100k chars for API` must be a JS comment above the template line, not text inside the backtick string.

**Evidence (commit 44af602, corrected by c4ff326):**

```diff
+    // Limit to ~100k chars for API
     const prompt = `Given this lecture transcript...
 Transcript:
-// Limit to ~100k chars for API
 ${fullTranscript.substring(0, 100000)}
```

The final state (HEAD) shows the comment on the line immediately before `const prompt = \`...\``, outside the template literal. The `${fullTranscript.substring(0, 100000)}` line inside the template is clean.

**Verdict:** ✅ Requirement fully met.

---

## Bug 3 — digests.js dual query-param support

**Requirement:** GET `/api/digests` must accept both `lecture_id` (snake_case) and `lectureId` (camelCase) and use whichever is provided to filter Firestore by `lectureId`.

**Evidence (`backend/src/routes/digests.js` lines 8–9):**

```js
const { userId, lectureId: lectureIdParam, lecture_id, status, limit = 50 } = req.query;
const lectureId = lectureIdParam || lecture_id;
```

The Firestore query at line 21 uses `.where('lectureId', '==', lectureId)`. The stored field name is `lectureId` (confirmed in `functions.js` line 176: `lectureId: lecture_id`). The coalesce correctly resolves both variants to the stored field name.

**Verdict:** ✅ Requirement fully met.

---

## Bug 4 — DigestChat uses base44.post (authenticated axios instance)

**Requirement:** The chat endpoint call must use `base44.post(...)` (the axios instance with the auth interceptor), not a raw `fetch` or bare `axios` call.

**Evidence (`frontend/src/components/digest/DigestChat.jsx` line 49):**

```js
const response = await base44.post("/chat/ask", {
  lectureId,
  question,
  conversationHistory,
});
```

`base44` is the singleton `Base44Client` instance exported from `base44Client.js`. Its `axiosInstance` has a `request` interceptor that reads `auth_token` / `token` / `base44_access_token` from `localStorage` and sets `Authorization: Bearer <token>`. The `post()` method calls `this.axios.post(endpoint, data)` which goes through that interceptor.

The response interceptor unwraps `.data`: `(response) => response.data`. The backend `/api/chat/ask` responds with `res.json({ answer, relevantTimestamps, lectureId })`, so after unwrapping, `response.answer` and `response.relevantTimestamps` are accessible directly — matching the usage in DigestChat.jsx lines 54–57.

No change was required here because the component was already correctly implemented. The coder's claim in the commit message ("already uses base44.post") is confirmed.

**Verdict:** ✅ Requirement fully met.

---

## Build verification

Commit message for `44af602`: `cd frontend && npm run build -> exit 0 (1898 modules, built in 2.41s)`  
Commit message for `c4ff326`: `cd frontend && npm run build -> exit 0, 1898 modules, 3.32s`

Both commits record a clean frontend build at exit 0.

---

## Push to main

`git log --oneline origin/main -3` shows HEAD at `c4ff326` tracking `origin/main`. Both commits are pushed.

---

## Pre-existing issues noted (out of scope)

- `digests.js` `orderBy('createdAt', 'desc')` but stored field is `created_date`. This existed before `44af602` and is not introduced by this change.

---

## Summary

All four required bug fixes are present, correct, and verifiable. The frontend build passes. Changes are committed and pushed to `main`. No blockers found.
