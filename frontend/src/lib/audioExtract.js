// Extracts a compact mono audio track from a video/audio file in the browser.
// Lecture videos are far too large for the transcription service (which accepts
// only audio files under ~25 MB), so we decode the file locally, downmix it to a
// small 8 kHz mono WAV and split it into chunks that stay under that limit.
// Each chunk reports its offset so transcript timestamps stay accurate.

const SAMPLE_RATE = 8000;
const CHUNK_SECONDS = 1200; // 20 min ≈ 19 MB as 16-bit mono WAV
const TRANSCRIBE_SAFE_BYTES = 20 * 1024 * 1024;

// Small audio files already match what the transcriber accepts — send as-is.
export function needsAudioExtraction(file) {
  if (!file) return false;
  const isAudio = (file.type || "").startsWith("audio/") ||
    /\.(mp3|m4a|aac|wav|flac|ogg|oga|webm)$/i.test(file.name || "");
  return !(isAudio && file.size <= TRANSCRIBE_SAFE_BYTES);
}

function writeWavHeader(view, dataBytes) {
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataBytes, true);
}

export async function extractAudioChunks(file, onProgress = () => {}) {
  const OfflineCtx = typeof window !== "undefined"
    ? window.OfflineAudioContext || window.webkitOfflineAudioContext
    : null;
  if (!OfflineCtx) throw new Error("This browser can't read the audio track of this file.");

  onProgress({ phase: "reading", percent: 5 });
  const arrayBuffer = await file.arrayBuffer();

  onProgress({ phase: "decoding", percent: 20 });
  let audioBuffer;
  try {
    audioBuffer = await new OfflineCtx(1, 1, SAMPLE_RATE).decodeAudioData(arrayBuffer);
  } catch {
    throw new Error("This file's audio track couldn't be decoded in your browser.");
  }

  const channels = [];
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) channels.push(audioBuffer.getChannelData(c));
  if (!channels.length || !audioBuffer.length) throw new Error("This file has no audio track.");

  const totalSamples = audioBuffer.length;
  const chunkSamples = CHUNK_SECONDS * SAMPLE_RATE;
  const chunks = [];

  for (let start = 0; start < totalSamples; start += chunkSamples) {
    const end = Math.min(start + chunkSamples, totalSamples);
    const samples = end - start;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    writeWavHeader(view, samples * 2);

    let offset = 44;
    for (let i = start; i < end; i++) {
      let value = 0;
      for (let c = 0; c < channels.length; c++) value += channels[c][i];
      value /= channels.length;
      const clamped = Math.max(-1, Math.min(1, value));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }

    const baseName = (file.name || "lecture").replace(/\.[^.]+$/, "");
    const name = `${baseName}-part${chunks.length + 1}.wav`;
    chunks.push({
      file: new File([buffer], name, { type: "audio/wav" }),
      offset: start / SAMPLE_RATE,
      duration: samples / SAMPLE_RATE,
    });

    onProgress({ phase: "encoding", percent: 20 + Math.round((end / totalSamples) * 30) });
  }

  return { duration: audioBuffer.duration, chunks };
}