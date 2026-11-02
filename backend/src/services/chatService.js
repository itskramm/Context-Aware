import Groq from 'groq-sdk';
import { getFirestore } from '../config/database.js';

// Lazy Groq init
let groq = null;
let groqInitialized = false;

function getGroqClient() {
  if (!groqInitialized) {
    if (process.env.GROQ_API_KEY) {
      groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    groqInitialized = true;
  }
  return groq;
}

/**
 * Parse a timestamp string like "MM:SS" or "H:MM:SS" into total seconds.
 */
function parseTimestamp(ts) {
  const parts = ts.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Format seconds as MM:SS.
 */
function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Ask a question about a lecture, using its transcript as context.
 *
 * @param {string} lectureId
 * @param {string} question
 * @param {Array<{role: string, content: string}>} conversationHistory
 * @returns {Promise<{answer: string, relevantTimestamps: Array<{time: number, text: string}>}>}
 */
export async function askAboutLecture(lectureId, question, conversationHistory = []) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq API key not configured');
  }

  // Fetch transcript segments from Firestore
  const db = getFirestore();
  const snapshot = await db
    .collection('transcripts')
    .where('lectureId', '==', lectureId)
    .orderBy('timestamp', 'asc')
    .limit(500)
    .get();

  const segments = snapshot.docs.map((doc) => doc.data());

  // Build transcript text for the system prompt
  const transcriptText = segments
    .map((seg) => {
      const secs = typeof seg.timestamp === 'number' ? seg.timestamp : 0;
      return `[${formatSeconds(secs)}] ${seg.text || ''}`;
    })
    .join('\n');

  const systemPrompt = `You are a helpful teaching assistant for a lecture. Answer questions about the lecture content using the transcript provided below.

Guidelines:
- Answer questions based only on the lecture content.
- When referencing specific moments, cite the timestamp in [MM:SS] format.
- Stay focused on the lecture material.
- Be concise and clear.

Lecture Transcript:
${transcriptText || '(No transcript available for this lecture.)'}`;

  // Build messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: question },
  ];

  const completion = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    temperature: 0.3,
    max_tokens: 1024,
  });

  const answer = completion.choices[0]?.message?.content || '';

  // Extract timestamp references from the answer
  const timestampPattern = /\[(\d+:\d{2}(?::\d{2})?)\]/g;
  const found = new Map(); // deduplicate by time value
  let match;

  while ((match = timestampPattern.exec(answer)) !== null) {
    const raw = match[1];
    const timeSecs = parseTimestamp(raw);
    if (!found.has(timeSecs)) {
      // Find the closest segment
      let closest = null;
      let minDiff = Infinity;
      for (const seg of segments) {
        const segSecs = typeof seg.timestamp === 'number' ? seg.timestamp : 0;
        const diff = Math.abs(segSecs - timeSecs);
        if (diff < minDiff) {
          minDiff = diff;
          closest = seg;
        }
      }
      found.set(timeSecs, {
        time: timeSecs,
        text: closest?.text || raw,
      });
    }
  }

  const relevantTimestamps = Array.from(found.values());

  return { answer, relevantTimestamps };
}
