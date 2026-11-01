# AI Implementation Guide - Whisper API + Gemini

Complete guide to implement speech-to-text transcription and summarization using OpenAI Whisper API and Google Gemini Flash.

---

## 🎯 Why This Stack?

**OpenAI Whisper API + Google Gemini Flash**

✅ **Cost**: $0.36 (Whisper) + FREE (Gemini) = **$0.36 per hour**
✅ **Quality**: Excellent transcription + Good summarization
✅ **Setup**: Simple API integration, no infrastructure
✅ **Scale**: Pay-as-you-go, no upfront costs
✅ **Deployment**: Works perfectly on Render

---

## 📋 Prerequisites

1. **OpenAI API Key** (for Whisper)
   - Sign up: https://platform.openai.com/signup
   - Get API key: https://platform.openai.com/api-keys
   - Pricing: $0.006 per minute (~$0.36 per hour)

2. **Google AI API Key** (for Gemini - FREE!)
   - Sign up: https://makersuite.google.com/
   - Get API key: https://makersuite.google.com/app/apikey
   - Free tier: 15 requests/minute, 1M tokens/day

3. **FFmpeg** (for audio extraction)
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
   - Render: Will install via apt-buildpack

---

## 🚀 Implementation Steps

### Step 1: Install Dependencies

Add to `backend/package.json`:

```json
{
  "dependencies": {
    "openai": "^4.67.0",
    "@google/generative-ai": "^0.21.0",
    "fluent-ffmpeg": "^2.1.3",
    "axios": "^1.6.7",
    "form-data": "^4.0.0"
  }
}
```

Install:
```bash
cd backend
npm install openai @google/generative-ai fluent-ffmpeg
```

### Step 2: Create AI Service Files

#### `backend/src/services/whisperService.js`

```javascript
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Transcribe audio file using OpenAI Whisper API
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<Object>} - Transcript with text and segments
 */
export async function transcribeAudio(audioFilePath) {
  try {
    console.log('Transcribing audio:', audioFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      language: 'en', // or auto-detect
      response_format: 'verbose_json', // includes timestamps
      timestamp_granularities: ['segment']
    });

    console.log('Transcription complete:', transcription.text.substring(0, 100) + '...');
    
    return {
      text: transcription.text,
      segments: transcription.segments || [],
      duration: transcription.duration,
      language: transcription.language
    };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Transcribe from audio URL (downloads first)
 * @param {string} audioUrl - URL to audio file
 * @returns {Promise<Object>} - Transcript
 */
export async function transcribeFromUrl(audioUrl) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `audio-${Date.now()}.mp3`);

  try {
    // Download audio
    const axios = require('axios');
    const writer = fs.createWriteStream(tempFilePath);
    const response = await axios({
      url: audioUrl,
      method: 'GET',
      responseType: 'stream'
    });
    
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Transcribe
    const result = await transcribeAudio(tempFilePath);
    
    // Cleanup
    fs.unlinkSync(tempFilePath);
    
    return result;
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw error;
  }
}
```

#### `backend/src/services/geminiService.js`

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * Generate summary using Gemini Flash
 * @param {string} transcript - Full transcript text
 * @returns {Promise<Object>} - Summary with key points and chapters
 */
export async function generateSummary(transcript) {
  try {
    console.log('Generating summary with Gemini...');
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash' // Free tier!
    });

    const prompt = `
You are an expert at analyzing lecture transcripts and creating educational summaries.

Analyze this lecture transcript and provide:

1. **Executive Summary** (3-4 sentences): A concise overview of the main topic and key takeaways.

2. **Key Points** (5-8 bullet points): The most important concepts, facts, or ideas covered.

3. **Main Topics** (3-5 topics): Broad categories of content covered in the lecture.

4. **Chapters** (4-8 chapters): Break the lecture into logical sections with:
   - Title: Descriptive chapter name
   - Summary: 1-2 sentences about what's covered
   - Timestamp: Estimate based on transcript flow (format: "00:00")

Format your response as JSON:
{
  "summary": "executive summary text",
  "keyPoints": ["point 1", "point 2", ...],
  "topics": ["topic 1", "topic 2", ...],
  "chapters": [
    {
      "title": "Chapter Title",
      "summary": "Chapter summary",
      "timestamp": "00:00"
    }
  ]
}

Transcript:
${transcript}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (Gemini may wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    console.log('Summary generated successfully');
    return parsed;
    
  } catch (error) {
    console.error('Gemini summarization error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

/**
 * Generate study questions from transcript
 * @param {string} transcript - Full transcript text
 * @returns {Promise<Array>} - Array of questions
 */
export async function generateQuestions(transcript) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash'
    });

    const prompt = `
Generate 5-8 study questions based on this lecture transcript.
Include a mix of:
- Comprehension questions
- Application questions
- Critical thinking questions

Return as JSON array:
["Question 1?", "Question 2?", ...]

Transcript:
${transcript.substring(0, 5000)} // Limit for brevity
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not parse questions from response');
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error('Question generation error:', error);
    throw error;
  }
}
```

#### `backend/src/services/audioService.js`

```javascript
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * Extract audio from video URL
 * @param {string} videoUrl - YouTube or direct video URL
 * @returns {Promise<string>} - Path to extracted audio file
 */
export async function extractAudio(videoUrl) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
  const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);

  try {
    // Download video first
    console.log('Downloading video...');
    const writer = fs.createWriteStream(videoPath);
    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'stream'
    });
    
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Extract audio using ffmpeg
    console.log('Extracting audio...');
    
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .on('end', () => {
          console.log('Audio extraction complete');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .save(audioPath);
    });

    // Cleanup video file
    fs.unlinkSync(videoPath);
    
    return audioPath;
    
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    throw error;
  }
}

/**
 * Get audio duration in seconds
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<number>} - Duration in seconds
 */
export async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
}
```

### Step 3: Create Processing Routes

#### `backend/src/routes/processing.js`

```javascript
import express from 'express';
import { getFirestore } from '../config/database.js';
import { extractAudio, getAudioDuration } from '../services/audioService.js';
import { transcribeAudio } from '../services/whisperService.js';
import { generateSummary, generateQuestions } from '../services/geminiService.js';
import fs from 'fs';

const router = express.Router();

/**
 * POST /api/processing/lecture/:id
 * Process a lecture: extract audio, transcribe, summarize
 */
router.post('/lecture/:id', async (req, res) => {
  const { id } = req.params;
  const db = getFirestore();
  
  try {
    // Get lecture
    const lectureDoc = await db.collection('lectures').doc(id).get();
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    const lecture = lectureDoc.data();
    console.log(`Processing lecture: ${lecture.title}`);
    
    // Update status to processing
    await lectureDoc.ref.update({ 
      status: 'processing',
      processingStartedAt: new Date().toISOString()
    });
    
    // Step 1: Extract audio
    console.log('Step 1: Extracting audio...');
    const audioPath = await extractAudio(lecture.videoUrl);
    const duration = await getAudioDuration(audioPath);
    
    // Update duration
    await lectureDoc.ref.update({ duration: Math.round(duration) });
    
    // Step 2: Transcribe with Whisper
    console.log('Step 2: Transcribing audio...');
    const transcription = await transcribeAudio(audioPath);
    
    // Save transcript
    const transcriptRef = await db.collection('transcripts').add({
      lectureId: id,
      text: transcription.text,
      segments: transcription.segments,
      language: transcription.language || 'en',
      createdAt: new Date().toISOString()
    });
    
    console.log('Transcript saved:', transcriptRef.id);
    
    // Step 3: Generate summary with Gemini
    console.log('Step 3: Generating summary...');
    const summary = await generateSummary(transcription.text);
    
    // Step 4: Generate questions (optional)
    let questions = [];
    try {
      questions = await generateQuestions(transcription.text);
    } catch (err) {
      console.log('Question generation failed:', err.message);
    }
    
    // Save digest
    const digestRef = await db.collection('digests').add({
      lectureId: id,
      userId: lecture.uploadedBy,
      type: 'summary',
      status: 'completed',
      content: {
        summary: summary.summary,
        keyPoints: summary.keyPoints || [],
        topics: summary.topics || [],
        chapters: summary.chapters || [],
        questions: questions
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    });
    
    console.log('Digest saved:', digestRef.id);
    
    // Update lecture status
    await lectureDoc.ref.update({ 
      status: 'completed',
      transcriptId: transcriptRef.id,
      digestId: digestRef.id,
      processingCompletedAt: new Date().toISOString()
    });
    
    // Cleanup audio file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    
    res.json({
      message: 'Processing complete',
      lectureId: id,
      transcriptId: transcriptRef.id,
      digestId: digestRef.id,
      duration: Math.round(duration)
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    
    // Update lecture status to failed
    try {
      await db.collection('lectures').doc(id).update({ 
        status: 'failed',
        error: error.message,
        processingFailedAt: new Date().toISOString()
      });
    } catch (updateErr) {
      console.error('Failed to update lecture status:', updateErr);
    }
    
    res.status(500).json({ 
      error: 'Processing failed', 
      details: error.message 
    });
  }
});

/**
 * GET /api/processing/status/:id
 * Get processing status for a lecture
 */
router.get('/status/:id', async (req, res) => {
  try {
    const db = getFirestore();
    const lectureDoc = await db.collection('lectures').doc(req.params.id).get();
    
    if (!lectureDoc.exists) {
      return res.status(404).json({ error: 'Lecture not found' });
    }
    
    const lecture = lectureDoc.data();
    
    res.json({
      lectureId: req.params.id,
      status: lecture.status,
      transcriptId: lecture.transcriptId || null,
      digestId: lecture.digestId || null,
      error: lecture.error || null
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
```

### Step 4: Update server.js

```javascript
// Add to backend/src/server.js
import processingRoutes from './routes/processing.js';

// ... existing routes ...

app.use('/api/processing', processingRoutes);
```

### Step 5: Update Environment Variables

#### `backend/.env` (local)
```env
PORT=3001
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=contextaware-507ad
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# JWT
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# AI Services
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
```

#### For Render Deployment

Add these environment variables in Render dashboard:
1. `OPENAI_API_KEY` - Your OpenAI API key
2. `GOOGLE_AI_API_KEY` - Your Google AI API key

---

## 🐳 Deploy to Render

### Step 1: Add FFmpeg Buildpack

Create `backend/.buildpacks`:
```
https://github.com/jonathanong/heroku-buildpack-ffmpeg-latest.git
https://github.com/heroku/heroku-buildpack-nodejs.git
```

Or update `backend/render.yaml`:
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
      - key: OPENAI_API_KEY
        sync: false
      - key: GOOGLE_AI_API_KEY
        sync: false
```

### Step 2: Update package.json

```json
{
  "name": "context-aware-backend",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "firebase-admin": "^12.7.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "openai": "^4.67.0",
    "@google/generative-ai": "^0.21.0",
    "fluent-ffmpeg": "^2.1.3",
    "axios": "^1.6.7",
    "form-data": "^4.0.0"
  }
}
```

### Step 3: Create temp directory handling

```javascript
// Add to backend/src/server.js
import fs from 'fs';
import path from 'path';

// Create temp directory
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Cleanup temp files on shutdown
process.on('SIGTERM', () => {
  console.log('Cleaning up temp files...');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  process.exit(0);
});
```

---

## 🧪 Testing Locally

### 1. Set up environment
```bash
cd backend
cp .env.example .env
# Add your API keys to .env
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start server
```bash
npm start
```

### 4. Test processing endpoint

```bash
# Upload a lecture first (get the ID)
curl -X POST http://localhost:3001/api/lectures \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Lecture",
    "videoUrl": "https://example.com/video.mp4",
    "uploadedBy": "user123"
  }'

# Process the lecture
curl -X POST http://localhost:3001/api/processing/lecture/LECTURE_ID

# Check status
curl http://localhost:3001/api/processing/status/LECTURE_ID
```

---

## 💰 Cost Breakdown

For a 1-hour lecture:
- **Whisper API**: $0.36 (60 minutes × $0.006/min)
- **Gemini Flash**: $0 (free tier)
- **Total**: $0.36 per lecture

For 100 lectures/month:
- **Total**: ~$36/month

---

## 🚀 Next Steps

1. ✅ Install dependencies
2. ✅ Add API keys to `.env`
3. ✅ Test locally with a sample video
4. ✅ Commit changes to GitHub
5. ✅ Deploy to Render
6. ✅ Test in production
7. ✅ Connect frontend to processing endpoint

---

Last Updated: November 1, 2026  
Maintained by: Mark Gabriel (@itskramm)
