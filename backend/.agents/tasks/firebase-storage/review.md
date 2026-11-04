# Firebase Storage Upload — Review

## Evidence Summary

### Criterion 1 — `uploadFileToStorage` signature and return URL
`storageService.js` exports `uploadFileToStorage(localFilePath, originalName, mimeType)` (line 11). The returned URL is constructed as `https://storage.googleapis.com/${bucket.name}/${destination}` (line 48). ✅

### Criterion 2 — Local temp file deleted in `finally`
Lines 51-58 of `storageService.js` wrap the delete in a `finally` block that runs whether `bucket.upload` / `makePublic` succeeds or throws. ✅

### Criterion 3 — Clear error if bucket not configured
Two guard blocks at lines 12-20 (getStorage call throws) and lines 23-28 (`bucket.exists()` returns false) both throw a descriptive `Error` with a link to the Firebase console. ✅

### Criterion 4 — `storageBucket` in `admin.initializeApp`
`database.js` line 40: `storageBucket: process.env.FIREBASE_STORAGE_BUCKET || \`${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app\`` is passed to `initializeApp`. ✅

### Criterion 5 — POST /upload calls `uploadFileToStorage` before Firestore write
`lectures.js` lines 241-249: the `uploadFileToStorage` call completes (or is caught) before `lectureData` is assembled and `db.collection('lectures').add(lectureData)` is called. ✅

### Criterion 6 — `file_url` and `videoUrl` both set to Storage URL (with fallback)
`lectureData` at lines 252-253: `file_url: fileUrl, videoUrl: fileUrl`. `fileUrl` is the Storage URL on success or `req.file.path` on Storage error. ✅

### Criterion 7 — YouTube route (POST /youtube) unchanged
The diff touches only the `POST /upload` handler inside `lectures.js`. The `POST /youtube` route (lines 316-379) is unmodified. ✅

### Criterion 8 — Processing pipeline unchanged
`processingService.js` and `audioService.js` are not in the diff and were not modified. ✅

### Criterion 9 — No new dependencies
`storageService.js` imports from `firebase-admin/storage` (sub-path of the already-installed `firebase-admin` package) and Node's built-in `fs`. No new `package.json` entries required. ✅

### Criterion 10 — Module loads without error
Commit message records: `node -e "import('./src/services/storageService.js').then(m => console.log('OK:', Object.keys(m)))"` → `OK: [ 'uploadFileToStorage' ]`. ✅

---

## Correctness / Security Path Checks

### Fallback leaves local file on disk — consequence is acceptable
When `uploadFileToStorage` throws, the `finally` block inside `storageService.js` still runs and **deletes** the temp file (lines 51-58). The outer catch in `lectures.js` then attempts an `fs.unlinkSync` on the now-deleted file, but wraps it in `try/catch`, so no double-delete error surfaces. The local path stored in `fileUrl` is passed to `processLecture`; `audioService.extractAudio` handles local paths via the `videoUrl.startsWith('/')` branch, so transcription still works on the fallback path. No data loss or crash.

### `bucket.exists()` race / false-positive — low risk, no reachable failure
A network error on `bucket.exists()` is caught by `.catch(() => [false])` and causes the function to throw, which the outer catch handles. No unhandled rejection.

### `makePublic` failure after successful upload
If `makePublic` throws, the `finally` block deletes the local file and the error propagates to the outer catch in `lectures.js`, which logs it and falls back to the local path. No data left in an inconsistent state.

### No reachable correctness, security, or data failures found.
