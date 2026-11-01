import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

/**
 * Check if yt-dlp is installed (keeping for backward compatibility)
 */
export async function checkYtDlpInstalled() {
  // Using Node.js package, always available
  return true;
}

/**
 * Download YouTube video as audio using ytdl-core
 * @param {string} youtubeUrl - YouTube video URL
 * @returns {Promise<string>} - Path to downloaded audio file
 */
export async function downloadYouTubeAudio(youtubeUrl) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const timestamp = Date.now();
  const outputPath = path.join(tempDir, `youtube-${timestamp}.mp4`);
  
  try {
    console.log('Downloading YouTube audio with ytdl-core...');
    
    // Get video info first
    const info = await ytdl.getInfo(youtubeUrl);
    console.log(`Video: ${info.videoDetails.title} (${info.videoDetails.lengthSeconds}s)`);
    
    // Download audio only (highest quality)
    const audioStream = ytdl(youtubeUrl, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });
    
    // Save to file
    const writeStream = fs.createWriteStream(outputPath);
    await pipeline(audioStream, writeStream);
    
    console.log('YouTube audio downloaded successfully:', outputPath);
    return outputPath;
    
  } catch (error) {
    console.error('YouTube download error:', error);
    // Cleanup on error
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        console.error('Failed to cleanup partial file:', e);
      }
    }
    throw new Error(`Failed to download YouTube audio: ${error.message}`);
  }
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null
 */
export function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Check if URL is a YouTube URL
 * @param {string} url
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

/**
 * Get YouTube video info
 * @param {string} youtubeUrl
 * @returns {Promise<Object>}
 */
export async function getYouTubeInfo(youtubeUrl) {
  try {
    const command = `yt-dlp --dump-json "${youtubeUrl}"`;
    const { stdout } = await execPromise(command, { timeout: 30000 });
    
    const info = JSON.parse(stdout);
    
    return {
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      description: info.description,
      uploader: info.uploader
    };
  } catch (error) {
    console.error('Failed to get YouTube info:', error);
    return null;
  }
}
