import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

// Initialize Groq only if API key is available
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY // Get free key at console.groq.com
  });
  console.log('✅ Groq API initialized');
} else {
  console.warn('⚠️  GROQ_API_KEY not set - transcription will not work');
}

/**
 * Transcribe audio using Groq's Whisper (FREE!)
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<Object>} - Transcript with text and metadata
 */
export async function transcribeWithGroq(audioFilePath) {
  try {
    console.log('Transcribing with Groq Whisper (FREE)...');
    
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
