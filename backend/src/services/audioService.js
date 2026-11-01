import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { isYouTubeUrl, downloadYouTubeAudio, checkYtDlpInstalled } from './youtubeService.js';

/**
 * Extract audio from video URL (supports YouTube and direct URLs)
 * @param {string} videoUrl - Video URL (YouTube or direct)
 * @returns {Promise<string>} - Path to extracted audio file
 */
export async function extractAudio(videoUrl) {
  // Check if it's a YouTube URL
  if (isYouTubeUrl(videoUrl)) {
    console.log('Detected YouTube URL, using ytdl-core...');
    
    // Download directly as audio - ytdl-core returns MP4/M4A
    const audioPath = await downloadYouTubeAudio(videoUrl);
    
    // Convert to MP3 for consistency
    return await convertToMp3(audioPath);
  }
  
  // Otherwise, use direct download + ffmpeg extraction
  console.log('Using direct download for non-YouTube URL...');
  return await extractAudioDirect(videoUrl);
}

/**
 * Convert audio file to MP3 format
 * @param {string} inputPath - Path to input audio file
 * @returns {Promise<string>} - Path to MP3 file
 */
async function convertToMp3(inputPath) {
  const tempDir = path.join(process.cwd(), 'temp');
  const outputPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
  
  console.log('Converting to MP3...');
  
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp3')
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .on('end', () => {
        console.log('Conversion to MP3 complete');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg conversion error:', err);
        reject(err);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Converting: ${Math.round(progress.percent)}% done`);
        }
      })
      .save(outputPath);
  });
  
  // Cleanup original file
  if (fs.existsSync(inputPath)) {
    fs.unlinkSync(inputPath);
  }
  
  return outputPath;
}

/**
 * Extract audio from direct video URL
 * @param {string} videoUrl - Direct video URL
 * @returns {Promise<string>} - Path to extracted audio file
 */
async function extractAudioDirect(videoUrl) {
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
      responseType: 'stream',
      timeout: 300000 // 5 minute timeout
    });
    
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('Video downloaded, extracting audio...');

    // Extract audio using ffmpeg
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
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Processing: ${Math.round(progress.percent)}% done`);
          }
        })
        .save(audioPath);
    });

    // Cleanup video file
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    
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
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration);
      }
    });
  });
}

/**
 * Cleanup old temp files (older than 1 hour)
 */
export function cleanupTempFiles() {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) return;

  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  fs.readdirSync(tempDir).forEach(file => {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtimeMs < oneHourAgo) {
      console.log('Cleaning up old temp file:', file);
      fs.unlinkSync(filePath);
    }
  });
}
