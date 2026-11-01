import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

// Lazy initialization - check API key only when actually used
let groq = null;
let groqInitialized = false;

function getGroqClient() {
  if (!groqInitialized) {
    if (process.env.GROQ_API_KEY) {
      groq = new Groq({
        apiKey: process.env.GROQ_API_KEY // Get free key at console.groq.com
      });
      console.log('✅ Groq API initialized');
    } else {
      console.warn('⚠️  GROQ_API_KEY not set - transcription will not work');
    }
    groqInitialized = true;
  }
  return groq;
}

/**
 * Transcribe audio using Groq's Whisper (FREE!)
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<Object>} - Transcript with text and metadata
 */
export async function transcribeWithGroq(audioFilePath) {
  try {
    console.log('Transcribing with Groq Whisper (FREE)...');
    
    const groq = getGroqClient();
    if (!groq) {
      throw new Error('Groq API key not configured');
    }
    
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-large-v3', // Best Whisper model, FREE!
      language: 'en', // or omit for auto-detection
      response_format: 'verbose_json', // includes timestamps
      temperature: 0.0 // More deterministic
    });

    console.log('Groq transcription complete!');
    
    return {
      text: transcription.text,
      segments: transcription.segments || [],
      duration: transcription.duration || 0,
      language: transcription.language || 'en'
    };
  } catch (error) {
    console.error('Groq transcription error:', error);
    throw new Error(`Groq transcription failed: ${error.message}`);
  }
}

/**
 * Generate summary using Groq's GPT-OSS-120B (FREE!)
 * @param {string} transcript - Full transcript text
 * @returns {Promise<Object>} - Summary with key points and chapters
 */
export async function generateSummaryWithGroq(transcript) {
  try {
    console.log('Generating summary with Groq GPT-OSS-120B (FREE)...');
    
    const groq = getGroqClient();
    if (!groq) {
      throw new Error('Groq API key not configured');
    }

    const prompt = `You are an expert at analyzing lecture transcripts and creating educational summaries.

Analyze this lecture transcript and provide a JSON response with:

1. **summary**: A 3-4 sentence executive summary of the main topic and key takeaways.
2. **keyPoints**: Array of 5-8 most important concepts, facts, or ideas (strings).
3. **topics**: Array of 3-5 broad categories of content covered (strings).
4. **chapters**: Array of 4-8 logical sections, each with:
   - title: Descriptive chapter name
   - summary: 2-3 sentences about this section
   - timestamp: Estimated start time (e.g., "0:00", "5:30", "12:15")

Transcript:
${transcript}

Respond ONLY with valid JSON matching this structure:
{
  "summary": "string",
  "keyPoints": ["string", "string", ...],
  "topics": ["string", "string", ...],
  "chapters": [
    {
      "title": "string",
      "summary": "string",
      "timestamp": "string"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b', // FREE! Groq's largest model
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    const result = JSON.parse(content);
    console.log('Groq summarization complete!');
    
    return result;
  } catch (error) {
    console.error('Groq summarization error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

/**
 * Generate quiz questions using Groq's GPT-OSS-120B (FREE!)
 * @param {string} transcript - Full transcript text
 * @returns {Promise<Array>} - Array of questions with answers
 */
export async function generateQuestionsWithGroq(transcript) {
  try {
    console.log('Generating questions with Groq GPT-OSS-120B (FREE)...');
    
    const groq = getGroqClient();
    if (!groq) {
      throw new Error('Groq API key not configured');
    }

    const prompt = `Create 5-8 quiz questions based on this lecture transcript.

For each question provide:
- question: The question text
- options: Array of 4 possible answers
- correctAnswer: The correct answer (must match one option exactly)
- explanation: Why this is the correct answer

Transcript:
${transcript}

Respond ONLY with valid JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "string",
      "explanation": "string"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq');
    }

    const result = JSON.parse(content);
    console.log('Groq question generation complete!');
    
    return result.questions || [];
  } catch (error) {
    console.error('Groq question generation error:', error);
    throw new Error(`Question generation failed: ${error.message}`);
  }
}

/**
 * Check Groq API status
 * @returns {Promise<boolean>}
 */
export async function checkGroqStatus() {
  try {
    // Just check if API key is valid
    if (!process.env.GROQ_API_KEY) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}
