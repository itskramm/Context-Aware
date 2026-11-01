# Testing Guide - YouTube Processing

## Quick Test (After Render Deployment)

### 1. Wait for Deployment
- Render will automatically deploy after GitHub push
- Check deployment status: https://dashboard.render.com
- Look for "Live" status and successful build logs

### 2. Test YouTube Upload

**Test Video (Short, 3 minutes):**
```
https://www.youtube.com/watch?v=jNQXAC9IVRw
Title: "Me at the zoo" (First YouTube video ever)
```

**Steps:**
1. Go to https://contextaware.vercel.app
2. Login with test account: `demoaccount@contextaware.com` / `demo12345678910`
3. Click "Upload Lecture" in sidebar
4. Fill in form:
   - Title: "Test YouTube Processing"
   - Video URL: `https://www.youtube.com/watch?v=jNQXAC9IVRw`
   - Tags: test, youtube
   - Purpose: general
5. Click "Upload Lecture"
6. Should see success message and redirect to My Lectures

### 3. Monitor Processing

**Check Lecture Status:**
1. Go to My Lectures page
2. Find your new lecture
3. Status should show "Processing" initially
4. Refresh page after 1-2 minutes
5. Status should change to "Completed"

**Check Render Logs:**
1. Go to Render dashboard
2. Click on your backend service
3. Go to "Logs" tab
4. Look for these messages:
   ```
   Downloading YouTube audio with yt-dlp...
   YouTube audio downloaded successfully
   Transcribing audio with Groq Whisper...
   Lecture processing completed
   ```

### 4. View Results

**Check Transcript:**
1. Click on the completed lecture
2. Should see transcript with timestamps
3. Check for Topics tab with extracted topics
4. Try generating a digest

## Expected Timeline

| Video Length | Expected Processing Time |
|-------------|-------------------------|
| 0-5 min     | 30-60 seconds          |
| 5-10 min    | 1-2 minutes            |
| 10-20 min   | 2-4 minutes            |
| 20-30 min   | 4-6 minutes            |

## What to Check

### ✅ Success Indicators
- [ ] Upload form accepts YouTube URL
- [ ] Lecture created with "Processing" status
- [ ] Render logs show yt-dlp download
- [ ] Status changes to "Completed"
- [ ] Transcript visible with timestamps
- [ ] Topics extracted and visible
- [ ] Can generate digest from transcript

### ❌ Common Issues

**Issue: "yt-dlp is not installed"**
- Check Render build logs for install-ytdlp.sh output
- May need to trigger manual redeploy
- Verify Python is available on Render

**Issue: "Download timeout"**
- Video too long for free tier
- Try shorter video (<10 minutes)
- Check Render memory usage

**Issue: "Status stuck on Processing"**
- Check Render logs for errors
- Free tier may have cold start delay
- Wait 5 minutes, then check logs

**Issue: "Invalid YouTube URL"**
- Must be full URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- Not shortened: `youtu.be/VIDEO_ID` (should work but test)
- Not playlist or channel URLs

## Test Videos (Short & Safe)

1. **Me at the zoo** (0:19)
   ```
   https://www.youtube.com/watch?v=jNQXAC9IVRw
   ```

2. **First YouTube Video** (0:18)
   ```
   https://www.youtube.com/watch?v=jNQXAC9IVRw
   ```

3. **TED Talk Sample** (~5 min - find a short one)
   Search "TED talk 5 minutes" on YouTube

## Manual API Test

If frontend isn't working, test API directly:

```bash
# 1. Login to get token
curl -X POST https://contextaware-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demoaccount@contextaware.com",
    "password": "demo12345678910"
  }'

# 2. Upload lecture (replace YOUR_TOKEN)
curl -X POST https://contextaware-backend.onrender.com/api/lectures \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "API Test Video",
    "videoUrl": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "uploadedBy": "demoaccount@contextaware.com",
    "tags": ["test"]
  }'

# 3. Check lecture status (replace LECTURE_ID)
curl https://contextaware-backend.onrender.com/api/lectures/LECTURE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Rollback Plan

If YouTube processing fails completely:

1. **Disable auto-trigger temporarily:**
   ```javascript
   // In lectures.js POST route, comment out:
   // processLecture(lectureId).catch(...)
   ```

2. **Use manual processing endpoint:**
   ```bash
   POST /api/processing/lecture/:id
   ```

3. **Test with direct audio files:**
   - Upload MP3 files directly (implement file upload)
   - Skip YouTube processing for now

## Production Monitoring

### First 24 Hours
- Monitor Render logs continuously
- Check first 5-10 uploads manually
- Note any error patterns
- Watch Render memory/CPU usage

### Metrics to Track
- Upload success rate
- Average processing time by video length
- Error rate and types
- Render resource usage
- User feedback on transcript quality

## Support Contacts
- Render Dashboard: https://dashboard.render.com
- Groq API Status: Check API key usage
- Firebase Console: Check Firestore writes

## Next Steps After Testing

1. **If successful:**
   - Monitor for 24 hours
   - Gather user feedback
   - Optimize processing speed
   - Add progress indicators to frontend

2. **If issues found:**
   - Check YOUTUBE_PROCESSING.md troubleshooting section
   - Review Render logs in detail
   - Test yt-dlp installation manually
   - Consider fallback options
