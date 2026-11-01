import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

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
      language: 'en', // or auto-detect by omitting
      response_format: 'verbose_json', // includes timestamps
      timestamp_granularities: ['segment']
    });

    console.log('Transcription complete');
    
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
    console.log('Downloading audio from URL...');
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
