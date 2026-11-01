# YouTube Processing Implementation

## Overview
Auto-trigger processing system for YouTube videos with complete audio extraction and transcription pipeline.

## Implementation Summary

### 1. Auto-Trigger Processing
**File: `src/routes/lectures.js`**
- POST `/api/lectures` now automatically starts processing after creating lecture record
- Processing runs in background (non-blocking)
- Returns immediately with `status: 'processing'`
- On processing failure, updates lecture status to `'failed'` with error message

### 2. YouTube Support
**File: `src/services/youtubeService.js`**
- `downloadYouTubeAudio(url)` - Downloads YouTube video as MP3 using yt-dlp
- `isYouTubeUrl(url)` - Detects YouTube URLs
- `extractYouTubeId(url)` - Extracts video ID from various YouTube URL formats
- `getYouTubeInfo(url)` - Fetches video metadata (title, duration, thumbnail)
- `checkYtDlpInstalled()` - Verifies yt-dlp availability

**File: `src/services/audioService.js`**
- Updated `extractAudio(url)` to detect and handle YouTube URLs
- Falls back to direct download for non-YouTube URLs
- Integrates with youtubeService.js for YouTube processing

### 3. Dependencies
**yt-dlp Installation:**
- Added `install-ytdlp.sh` script for automatic installation
- Runs during `npm install` via `postinstall` script
- Tries multiple installation methods:
  1. pip3 (Python 3)
  2. pip (Python 2)
  3. Binary download from GitHub releases

**Required System Dependencies:**
- Python (pip or pip3) - for yt-dlp installation
- ffmpeg - for audio conversion (already in dependencies)

## Processing Flow

```
User uploads YouTube URL
         ↓
POST /api/lectures creates record
         ↓
Response sent immediately (status: processing)
         ↓
Background: processLecture(id) starts
         ↓
audioService.extractAudio() called
         ↓
Detects YouTube URL → youtubeService.downloadYouTubeAudio()
         ↓
yt-dlp downloads video as MP3
         ↓
groqService.transcribeAudio() processes audio
         ↓
Transcript saved to Firestore
         ↓
Topics extracted and saved
         ↓
Lecture status updated to 'completed'
```

## Error Handling

### YouTube Download Failures
- Missing yt-dlp: Clear error message with installation instructions
- Invalid URL: Returns 400 error
- Download timeout: 5-minute timeout with proper cleanup
- Network errors: Automatic retry logic in yt-dlp

### Processing Failures
- Lecture status updated to `'failed'`
- Error message stored in lecture document
- Temporary files cleaned up automatically
- Frontend can display error to user

## Testing

### Local Testing
```bash
# 1. Install yt-dlp locally
pip3 install yt-dlp

# 2. Test YouTube download
curl -X POST http://localhost:5000/api/lectures \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Lecture",
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "uploadedBy": "test@example.com",
    "tags": ["test"]
  }'

# 3. Check logs for processing progress
```

### Production Testing (Render)
1. Push changes to GitHub
2. Render auto-deploys
3. Check logs: `install-ytdlp.sh` output
4. Test with YouTube URL upload
5. Monitor Render logs for processing status

## Environment Variables
No new environment variables required. Uses existing:
- `GROQ_API_KEY` - for transcription
- `FIREBASE_PROJECT_ID` - for database

## Render Configuration

### Build Command
```bash
npm install
```
The `postinstall` script automatically runs `install-ytdlp.sh`

### Start Command
```bash
npm start
```

### System Requirements
- Node.js 18+
- Python 3 (for yt-dlp)
- ffmpeg (pre-installed on Render)

## Limitations

### Free Tier Constraints
- Render free tier has 512MB RAM limit
- Large videos (>1 hour) may cause memory issues
- Consider adding video length validation

### yt-dlp Rate Limits
- YouTube may rate-limit excessive downloads
- Implement request queuing for high traffic

### Processing Time
- Small videos (<10 min): 30-60 seconds
- Medium videos (10-30 min): 1-3 minutes
- Large videos (30-60 min): 3-10 minutes

## Monitoring

### Check Processing Status
```bash
GET /api/lectures/:id
```
Returns:
- `status: 'processing'` - Still processing
- `status: 'completed'` - Ready with transcript
- `status: 'failed'` - Check `error` field

### Backend Logs
Monitor Render logs for:
- `"Downloading YouTube audio with yt-dlp..."` - Download started
- `"YouTube audio downloaded successfully"` - Download complete
- `"Transcribing audio with Groq Whisper..."` - Transcription started
- `"Lecture processing completed"` - Full pipeline done

## Troubleshooting

### "yt-dlp is not installed" Error
1. Check Render logs for `install-ytdlp.sh` output
2. Verify Python is available: `which python3`
3. Manually trigger install: `pip3 install --user yt-dlp`
4. Check PATH includes `~/.local/bin`

### "Downloaded file not found" Error
1. Check disk space on Render
2. Verify temp directory permissions
3. Check yt-dlp version: `yt-dlp --version`
4. Test with shorter video

### Processing Takes Too Long
1. Check video length (>30 min may timeout)
2. Monitor Render CPU/memory usage
3. Consider upgrading Render plan for heavy usage
4. Implement job queue (Bull/BullMQ) for large videos

## Future Enhancements

1. **Video Length Validation**: Reject videos >60 minutes on free tier
2. **Job Queue**: Use Redis + Bull for processing queue
3. **Progress Updates**: WebSocket for real-time progress
4. **Thumbnail Extraction**: Save YouTube thumbnail during download
5. **Caching**: Cache processed videos to avoid re-downloading
6. **Batch Processing**: Process multiple uploads simultaneously
7. **Retry Logic**: Automatic retry on transient failures

## API Changes

### POST /api/lectures
**Before:**
- Created lecture record only
- Manual processing trigger required

**After:**
- Creates lecture record
- Auto-starts background processing
- Returns immediately with `status: 'processing'`

**Response:**
```json
{
  "message": "Lecture created successfully and processing started",
  "lecture": {
    "id": "abc123",
    "title": "My Lecture",
    "status": "processing",
    "videoUrl": "https://youtube.com/watch?v=...",
    "uploadedAt": "2026-11-01T10:30:00.000Z"
  }
}
```

## Files Modified
- `backend/src/routes/lectures.js` - Auto-trigger processing
- `backend/src/services/audioService.js` - YouTube detection
- `backend/src/services/youtubeService.js` - YouTube download (new)
- `backend/package.json` - Added postinstall script
- `backend/install-ytdlp.sh` - yt-dlp installer (new)

## Deployment Checklist
- [x] Updated lectures.js with auto-trigger
- [x] Integrated youtubeService.js
- [x] Added install-ytdlp.sh script
- [x] Updated package.json postinstall
- [x] Tested locally with YouTube URL
- [ ] Push to GitHub
- [ ] Verify Render deployment
- [ ] Test with production URL
- [ ] Monitor first few uploads

## Support
For issues or questions:
1. Check Render logs first
2. Verify yt-dlp installation: `yt-dlp --version`
3. Test with short YouTube video (<5 min)
4. Check Firestore for lecture status and error messages
