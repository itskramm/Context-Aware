# How to Get a Valid Gemini API Key

## Issue
Your current API key format (`AQ.Ab8RN6...`) appears to be from an older or different Google service. The Gemini API requires a specific format starting with `AIza...`.

## Solution: Get a Free Gemini API Key

### Step 1: Visit Google AI Studio
Go to: **https://aistudio.google.com/app/apikey**

### Step 2: Create API Key
1. Sign in with your Google account
2. Click **"Get API Key"** or **"Create API Key"**
3. Select **"Create API key in new project"** (or use existing project)
4. Copy the key (format: `AIzaSy...`)

### Step 3: Update Your .env File
Replace the current `GOOGLE_AI_API_KEY` in `/backend/.env`:

```bash
GOOGLE_AI_API_KEY=AIzaSy_YOUR_NEW_KEY_HERE
```

### Step 4: Test the New Key
```bash
cd backend
node test-ai-services.js
```

## Free Tier Limits
- **15 requests per minute (RPM)**
- **1 million tokens per minute**
- **1,500 requests per day**

Perfect for your lecture management platform!

## Model to Use
Once you have the correct key, use: `gemini-1.5-flash`

This is the fastest, most cost-effective model in the free tier.

## Current Status
❌ API Key Format: `AQ.Ab8RN6...` (Invalid format)
✅ Groq API: Working correctly
⏳ Waiting for valid Gemini API key

## Alternative: Use Only Groq (Still FREE!)
If you prefer to skip Gemini setup, you can:
1. Use **Groq Whisper** for transcription (FREE) ✅
2. Use **Groq Llama 3.1** for summarization (also FREE!)

Would save you from needing the Gemini key at all.
