import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

// Groq Whisper file size limit is 25MB
const GROQ_MAX_BYTES = 24 * 1024 * 1024; // 24MB to be safe
// Chunk duration in seconds (10 minutes per chunk at 32kbps ≈ ~2.4MB)
const CHUNK_DURATION_SEC = 10 * 60;

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
 * Re-encode audio to low-bitrate mono MP3 to stay under Groq's 25MB limit.
 * 32kbps mono = ~14MB/hour, well within limits.
 */
async function compressAudio(inputPath) {
  const outputPath = inputPath.replace(/\.[^.]+$/, '') + '-compressed.mp3';
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(1)       // mono
      .audioBitrate('32k')    // 32kbps keeps file tiny
      .toFormat('mp3')
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
  return outputPath;
}

/**
 * Split audio into chunks using ffmpeg, each CHUNK_DURATION_SEC long.
 */
async function splitAudio(inputPath, totalDuration) {
  const tempDir = path.dirname(inputPath);
  const chunks = [];
  let start = 0;
  let index = 0;
  while (start < totalDuration) {
    const chunkPath = path.join(tempDir, `chunk-${Date.now()}-${index}.mp3`);
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(start)
        .setDuration(CHUNK_DURATION_SEC)
        .audioChannels(1)
        .audioBitrate('32k')
        .toFormat('mp3')
        .on('end', resolve)
        .on('error', reject)
        .save(chunkPath);
    });
    chunks.push({ path: chunkPath, startOffset: start });
    start += CHUNK_DURATION_SEC;
    index++;
  }
  return chunks;
}

/**
 * Get audio duration in seconds using ffprobe.
 */
function getFileDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) reject(err);
      else resolve(meta.format.duration || 0);
    });
  });
}

/**
 * Transcribe a single file via Groq Whisper.
 */
async function transcribeFile(filePath, groqClient) {
  const transcription = await groqClient.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-large-v3',
    language: 'en',
    response_format: 'verbose_json',
    temperature: 0.0
  });
  return transcription;
}

/**
 * Transcribe audio using Groq's Whisper (FREE!)
 * Handles large files by compressing to 32kbps mono and chunking if still too large.
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<Object>} - Transcript with text and metadata
 */
export async function transcribeWithGroq(audioFilePath) {
  const groqClient = getGroqClient();
  if (!groqClient) {
    throw new Error('Groq API key not configured');
  }

  let workingPath = audioFilePath;
  let compressed = null;
  const tempFiles = [];

  try {
    console.log('Transcribing with Groq Whisper (FREE)...');

    // Step 1: Compress to 32kbps mono to reduce size
    console.log('Compressing audio to 32kbps mono...');
    compressed = await compressAudio(audioFilePath);
    tempFiles.push(compressed);
    workingPath = compressed;

    const fileSize = fs.statSync(workingPath).size;
    console.log(`Compressed audio size: ${(fileSize / 1024 / 1024).toFixed(1)}MB`);

    let allSegments = [];
    let fullText = '';
    let totalDuration = 0;

    if (fileSize <= GROQ_MAX_BYTES) {
      // Small enough — send directly
      const result = await transcribeFile(workingPath, groqClient);
      fullText = result.text;
      allSegments = result.segments || [];
      totalDuration = result.duration || 0;
    } else {
      // Too large — split into 10-minute chunks
      console.log('File too large for single request, splitting into chunks...');
      const duration = await getFileDuration(workingPath);
      const chunks = await splitAudio(workingPath, duration);
      tempFiles.push(...chunks.map(c => c.path));

      for (const chunk of chunks) {
        console.log(`Transcribing chunk at ${Math.floor(chunk.startOffset / 60)}m...`);
        const result = await transcribeFile(chunk.path, groqClient);
        fullText += (fullText ? ' ' : '') + result.text;
        // Offset segment timestamps by chunk start
        const offsetSegments = (result.segments || []).map(seg => ({
          ...seg,
          start: (seg.start || 0) + chunk.startOffset,
          end: (seg.end || 0) + chunk.startOffset,
        }));
        allSegments.push(...offsetSegments);
        totalDuration = chunk.startOffset + (result.duration || 0);
      }
    }

    console.log('Groq transcription complete!');
    return {
      text: fullText,
      segments: allSegments,
      duration: totalDuration,
      language: 'en'
    };
  } catch (error) {
    console.error('Groq transcription error:', error);
    throw new Error(`Groq transcription failed: ${error.message}`);
  } finally {
    // Clean up temp files
    for (const f of tempFiles) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    }
  }
}

/**
 * Generate summary using Groq's GPT-OSS-120B (FREE!)
 * @param {string} transcript - Full transcript text
 * @returns {Promise<Object>} - Summary with key points and chapters
 */
// Free tier limit: 8000 TPM. Prompt overhead ~500 tokens, output ~500 tokens.
// Leaves ~5500 tokens for transcript. At ~4 chars/token = ~20000 chars safe.
const MAX_TRANSCRIPT_CHARS = 18000;

export async function generateSummaryWithGroq(transcript) {
  try {
    console.log('Generating summary with Groq GPT-OSS-120B (FREE)...');
    
    const groq = getGroqClient();
    if (!groq) {
      throw new Error('Groq API key not configured');
    }

    // Truncate transcript to stay within token limits
    const truncated = transcript.length > MAX_TRANSCRIPT_CHARS
      ? transcript.substring(0, MAX_TRANSCRIPT_CHARS) + '... [transcript truncated]'
      : transcript;

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
${truncated}

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

    const truncated = transcript.length > MAX_TRANSCRIPT_CHARS
      ? transcript.substring(0, MAX_TRANSCRIPT_CHARS) + '... [transcript truncated]'
      : transcript;

    const prompt = `Create 5-8 quiz questions based on this lecture transcript.

For each question provide:
- question: The question text
- options: Array of 4 possible answers
- correctAnswer: The correct answer (must match one option exactly)
- explanation: Why this is the correct answer

Transcript:
${truncated}

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
