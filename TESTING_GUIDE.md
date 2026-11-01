# Context-Aware Testing Guide

## Quick Start

Test Account:
- **Email**: demoaccount@contextaware.com
- **Password**: demo12345678910

## Current Status

### ✅ Working
- Backend deployed successfully on Render
- Frontend deployed on Vercel
- File upload with drag-and-drop UI
- Multer backend endpoint (/api/lectures/upload)
- Local file processing (audio extraction without download)
- Backend successfully processes uploads (confirmed in logs)

### 🔧 Debugging NOW
- Added detailed console logging to track XHR response handling
- Pushed commit `ff696d9` - waiting for Vercel deployment
- Frontend shows "Uploading" despite 201 success response

### ❌ Known Issues
- YouTube downloads fail (bot detection from Render IPs)
- Frontend may not have latest deployed code from Vercel
- User's browser may have cached old frontend code

## URLs
- **Frontend**: https://contextaware.vercel.app
- **Backend**: https://contextaware-backend.onrender.com

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Wait for Vercel Deployment
1. Check Vercel dashboard: https://vercel.com/dashboard
2. Look for deployment triggered by commit `ff696d9`
3. Wait until status shows "Ready" (usually 30-60 seconds)

### Step 2: Hard Refresh Browser
**This is CRITICAL** - your browser has cached the old JavaScript:

**Windows/Linux**: `Ctrl + Shift + R`
**Mac**: `Cmd + Shift + R`

Or manually:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Step 3: Test Upload with Console Open

1. **BEFORE uploading**, open DevTools Console tab (F12 → Console)
2. Go to Upload Lecture page
3. Upload a file (any video/audio under 500MB)
4. **Watch the Console** for these logs:

**Expected Console Output:**
```
XHR load event fired!
Status: 201
Response: {"lecture":{"id":"abc123xyz","title":"...","videoUrl":"..."}...}
Parsed response: {lecture: {id: 'abc123xyz', ...}}
Upload completed successfully! {lecture: {...}}
Navigating to lecture: abc123xyz
```

If you see these logs → XHR is working correctly
If you DON'T see these logs → XHR load event isn't firing (deeper issue)

### Step 4: Also Check Network Tab

1. Open Network tab alongside Console
2. Filter by "upload"
3. Upload file
4. Click on the POST request to `/api/lectures/upload`
5. Verify:
   - Status: `201 Created`
   - Response tab shows JSON with lecture data
   - Time: 2-10 seconds

## How to Test Upload

1. Go to https://contextaware.vercel.app
2. Login with test account
3. Click "Upload Lecture" in sidebar
4. Switch to "Upload file" tab
5. Drag and drop a video/audio file (max 500MB)
6. Fill in title and optional tags
7. **Open Console tab FIRST** (F12 → Console)
8. Click "Upload & Create Lecture"
9. **Watch Console output**
10. Check Network tab if Console shows nothing

## Expected Behavior

### File Upload Flow:
1. User selects/drops file → Frontend validates size/type
2. Frontend creates FormData and sends XHR to `/api/lectures/upload`
3. Backend (multer) saves file to `/opt/render/project/src/backend/uploads/`
4. Backend creates lecture in Firestore with local file path
5. Backend starts background processing (audio extraction, transcription, AI)
6. Backend responds immediately with 201 and lecture data
7. **Frontend should**: Navigate to lecture detail page
8. **Frontend currently does**: Gets stuck on "Uploading" step

### What Backend Processes in Background:
- Audio extraction (skip for MP3/WAV/M4A, convert video to MP3)
- Transcription (Groq Whisper API - FREE)
- AI analysis (Groq GPT-OSS-120B - FREE)
- Generate digest, topics, segments, interactions

## Network Tab Guide

### Where to Find Upload Request:
1. Open DevTools (F12)
2. Click "Network" tab
3. Start recording if not already (red dot at top-left should be filled)
4. Filter by "Fetch/XHR" or type "upload" in filter box
5. Upload a file
6. Look for: POST request to `/api/lectures/upload`

### What to Check:
- **Status**: Should be `201 Created` (not 304, 200, or 500)
- **Size**: Response should be around 0.5-1 kB (JSON response)
- **Time**: Upload time varies (2-20 seconds depending on file size)
- **Response**: Click request → Response tab → Should show JSON like:
  ```json
  {
    "lecture": {
      "id": "abc123xyz",
      "title": "My Lecture",
      "videoUrl": "/opt/render/project/src/backend/uploads/filename.mp4",
      ...
    }
  }
  ```

### Console Tab:
Should show logs like:
```
XHR load event fired!
Status: 201
Response: {"lecture":{"id":"...","title":"...",...}}
Parsed response: {lecture: {...}}
Upload completed successfully! {lecture: {...}}
Navigating to lecture: abc123xyz
```

## Troubleshooting

### Upload Stuck on "Uploading"
**Symptoms**: Progress bar at 100%, button says "Uploading 100%...", but doesn't navigate

**Possible Causes**:
1. ✅ **MOST LIKELY**: Vercel hasn't deployed latest code OR browser cache
2. XHR load event not firing (CORS issue)
3. Response JSON structure doesn't match expected format
4. JavaScript error preventing navigation

**Solutions (in order)**:
1. **Hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Check Vercel deployment**: Verify commit `ff696d9` is deployed
3. **Clear cache**: DevTools → Application tab → Clear site data
4. **Check console**: Look for errors in Console tab
5. **Check Network response**: Verify response structure matches expected format

### File Upload Fails Immediately
**Symptoms**: Error toast appears right away

**Possible Causes**:
- File too large (>500MB)
- Invalid file type
- Network error
- Backend error

**Solutions**:
1. Check file size (max 500MB)
2. Check file type (MP4, MOV, AVI, WebM, OGG, MP3, WAV, M4A only)
3. Check Network tab for error details
4. Check backend logs on Render

### YouTube URL Processing
**Status**: YouTube downloads are currently blocked by bot detection

**Error**: "Sign in to confirm you're not a bot"

**Why**: Render's servers are detected as bots by YouTube

**Current Behavior**: 
- URL submission still works
- Lecture is created in database
- Processing starts but fails at download step
- User sees error in lecture detail page

**Recommended**: Use file upload instead

## File Upload Details

### Supported Formats:
- **Video**: MP4, MOV, AVI, WebM, OGG
- **Audio**: MP3, WAV, M4A

### Size Limits:
- **Max file size**: 500MB
- **Backend limit**: 50MB body parser (can be increased if needed)

### Storage:
- Files stored on Render's ephemeral filesystem
- Path: `/opt/render/project/src/backend/uploads/`
- Files persist until Render restarts (typically daily for free tier)
- Consider moving to cloud storage (S3, GCS, etc.) for production

## Debug Console Logs Explained

When you upload a file, you should see these console logs in order:

1. **`XHR load event fired!`** - XHR successfully received response from server
2. **`Status: 201`** - Server returned 201 Created (success)
3. **`Response: {...}`** - Raw JSON text from server
4. **`Parsed response: {...}`** - JavaScript object after parsing JSON
5. **`Upload completed successfully! {...}`** - Promise resolved with response
6. **`Navigating to lecture: abc123xyz`** - About to navigate to lecture detail page

**If you DON'T see these logs**, it means:
- Vercel hasn't deployed the new code yet (wait and hard refresh)
- Browser is using cached old code (hard refresh)
- XHR request isn't completing (check Network tab)
- CORS or network error preventing load event

## Next Steps

1. ✅ Pushed debugging code (commit `ff696d9`)
2. ⏳ **YOU ARE HERE** → Wait for Vercel deployment
3. 🔄 Hard refresh browser (Ctrl+Shift+R)
4. 🧪 Try uploading with Console tab open
5. 📊 Check console logs to see where it's failing
6. 🐛 Based on logs, we'll know exactly what to fix
