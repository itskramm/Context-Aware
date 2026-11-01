import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

/**
 * Check if yt-dlp is installed
 */
export async function checkYtDlpInstalled() {
  try {
    await execPromise('yt-dlp --version');
    return true;
  } catch (error) {
    console.warn('yt-dlp not installed');
    return false;
  }
}

/**
 * Download YouTube video as audio using yt-dlp
 * @param {string} youtubeUrl - YouTube video URL
 * @returns {Promise<string>} - Path to downloaded audio file
 */
export async function downloadYouTubeAudio(youtubeUrl) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const timestamp = Date.now();
  const outputTemplate = path.join(tempDir, `youtube-${timestamp}`);
  
  try {
    console.log('Downloading YouTube audio with yt-dlp...');
    
    // Use yt-dlp to download audio only
    // -x extracts audio, --audio-format converts to mp3
    const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}.%(ext)s" "${youtubeUrl}"`;
    
    const { stdout, stderr } = await execPromise(command, {
      timeout: 300000, // 5 minutes
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });
    
    console.log('yt-dlp output:', stdout);
    if (stderr) console.log('yt-dlp stderr:', stderr);
    
    // The file should be named youtube-{timestamp}.mp3
    const expectedPath = `${outputTemplate}.mp3`;
    
    // Check if file exists, or look for any file with our timestamp
    let actualPath = expectedPath;
    if (!fs.existsSync(expectedPath)) {
      const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`youtube-${timestamp}`));
      if (files.length === 0) {
        throw new Error('Downloaded file not found after yt-dlp execution');
      }
      actualPath = path.join(tempDir, files[0]);
    }
    
    console.log('YouTube audio downloaded successfully:', actualPath);
    return actualPath;
    
  } catch (error) {
    console.error('YouTube download error:', error);
    // Cleanup any partial files
    const partialFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(`youtube-${timestamp}`));
    partialFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(tempDir, file));
      } catch (e) {
        console.error('Failed to cleanup partial file:', e);
      }
    });
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
