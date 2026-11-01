# 🆓 FREE AI Setup - Groq + Gemini

Complete setup guide for **100% FREE** transcription and summarization!

---

## ✨ What You Get

✅ **Groq Whisper** - FREE unlimited transcription
✅ **Gemini Flash** - FREE summarization (15 requests/min)
✅ **Total Cost**: $0 per lecture!
✅ **Quality**: Same as paid services

---

## 🔑 Step 1: Get Free API Keys

### Groq API Key (FREE Whisper)

1. Visit: https://console.groq.com/
2. Sign up (free, no credit card required)
3. Click **"Create API Key"**
4. Copy your key: `gsk_xxxxxxxxxxxxx`

**Features**:
- Whisper Large v3 (best model)
- Unlimited usage (FREE)
- 500+ tokens/second (extremely fast!)

### Google AI API Key (FREE Gemini)

1. Visit: https://makersuite.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy your key: `AIzaSyxxxxxxxxxxxxxxxxx`

**Free Tier**:
- 15 requests per minute
- 1 million tokens per day
- More than enough for your project!

---

## 📦 Step 2: Install Dependencies

```bash
cd backend
npm install groq-sdk @google/generative-ai fluent-ffmpeg
```

---

## ⚙️ Step 3: Add API Keys

### Local Development

Edit `backend/.env`:
```env
PORT=3001
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=contextaware-507ad
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# JWT
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# FREE AI Services
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
```

### Render Deployment

Add these environment variables in Render dashboard:

1. **GROQ_API_KEY**
   - Value: Your Groq API key

2. **GOOGLE_AI_API_KEY**
   - Value: Your Google AI API key

---

## 🧪 Step 4: Test Locally

```bash
# Start backend
cd backend
npm start
```

Test the processing endpoint:

```bash
# 1. Upload a lecture (get the ID from response)
curl -X POST http://localhost:3001/api/lectures \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Lecture",
    "videoUrl": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4",
    "uploadedBy": "user123",
    "tags": ["test"]
  }'

# 2. Process the lecture (replace LECTURE_ID)
curl -X POST http://localhost:3001/api/processing/lecture/LECTURE_ID

# 3. Check status
curl http://localhost:3001/api/processing/status/LECTURE_ID
```

---

## 🚀 Step 5: Deploy to Render

### Update render.yaml

```yaml
services:
  - type: web
    name: contextaware-backend
    env: node
    region: oregon
    plan: free
    buildCommand: |
      apt-get update
      apt-get install -y ffmpeg
      npm install
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: 18.17.0
      - key: GROQ_API_KEY
        sync: false
      - key: GOOGLE_AI_API_KEY
        sync: false
      - key: FIREBASE_PROJECT_ID
        value: contextaware-507ad
      - key: FIREBASE_SERVICE_ACCOUNT
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        value: https://contextaware.vercel.app
```

### Commit and Push

```bash
git add -A
git commit -m "Add FREE AI processing with Groq + Gemini"
git push
```

Render will auto-deploy!

---

## 📊 What Gets Processed

When you call `/api/processing/lecture/:id`:

1. **Extract Audio** (FFmpeg)
   - Downloads video
   - Extracts audio to MP3
   - ~30 seconds for 1-hour video

2. **Transcribe** (Groq Whisper)
   - Sends audio to Groq
   - Gets full transcript with timestamps
   - FREE, extremely fast!

3. **Summarize** (Gemini Flash)
   - Analyzes transcript
   - Generates summary, key points, chapters
   - FREE, 15 requests/min

4. **Save to Firebase**
   - Transcript → `transcripts` collection
   - Digest → `digests` collection
   - Updates lecture status

---

## 💡 Usage Examples

### From Frontend

```javascript
// After user uploads a lecture
async function processLecture(lectureId) {
  try {
    const response = await axios.post(
      `${API_URL}/api/processing/lecture/${lectureId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Processing started!', response.data);
    
    // Poll for status
    const checkStatus = setInterval(async () => {
      const status = await axios.get(
        `${API_URL}/api/processing/status/${lectureId}`
      );
      
      if (status.data.status === 'completed') {
        clearInterval(checkStatus);
        console.log('Processing complete!');
        // Redirect to digest
        navigate(`/digest/${status.data.digestId}`);
      }
    }, 5000); // Check every 5 seconds
    
  } catch (error) {
    console.error('Processing failed:', error);
  }
}
```

---

## 🎯 Performance

For a typical 1-hour lecture:

| Step | Time | Cost |
|------|------|------|
| Audio extraction | ~30s | $0 |
| Groq transcription | ~2-3 min | **$0 (FREE)** |
| Gemini summary | ~10s | **$0 (FREE)** |
| **Total** | **~3-4 min** | **$0** |

Compare to paid services:
- Whisper API: $0.36
- GPT-4: $0.50
- **Total paid**: $0.86

**You save $0.86 per lecture!**

---

## 🔧 Troubleshooting

### "Invalid API key"
- Check your `.env` file has correct keys
- Verify keys at console.groq.com and makersuite.google.com

### "Rate limit exceeded" (Gemini)
- Free tier: 15 requests/min
- Wait 1 minute and retry
- Or upgrade to paid tier ($0.075 per 1M tokens)

### "FFmpeg not found" (Render)
- Make sure render.yaml includes ffmpeg installation
- Or use .buildpacks file

### "Audio extraction failed"
- Check video URL is publicly accessible
- Try a direct video URL instead of YouTube
- Check video format is supported

---

## 📈 Scaling Up

### When FREE tier is not enough:

**Groq** (still FREE in beta):
- Currently unlimited
- May add pricing in future

**Gemini** (if you hit rate limits):
- Upgrade to paid: $0.075 per 1M tokens
- ~100 lectures = ~$7.50/month
- Still cheaper than alternatives!

**Alternative**:
- Switch to Whisper API ($0.36/hour)
- Keep using Gemini Flash (free)
- Total: ~$36/month for 100 lectures

---

## ✅ Next Steps

1. ✅ Get Groq API key
2. ✅ Get Google AI API key
3. ✅ Add keys to backend/.env
4. ✅ Install dependencies
5. ✅ Test locally
6. ✅ Deploy to Render
7. ✅ Process your first lecture!

---

**Total Setup Time**: 15 minutes  
**Total Cost**: $0  
**Quality**: Same as paid services ✨

---

Last Updated: November 1, 2026  
Maintained by: Mark Gabriel (@itskramm)
