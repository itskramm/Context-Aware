import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

/**
 * Check if yt-dlp is installed (keeping for backward compatibility)
 */
export async function checkYtDlpInstalled() {
  // Using Node.js package, always available
  return true;
}

/**
 * Download YouTube video as audio using youtube-dl-exec
 * @param {string} youtubeUrl - YouTube video URL
 * @returns {Promise<string>} - Path to downloaded audio file
 */
export async function downloadYouTubeAudio(youtubeUrl) {
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const timestamp = Date.now();
  const outputTemplate = path.join(tempDir, `youtube-${timestamp}.%(ext)s`);
  
  try {
    console.log('Downloading YouTube audio with youtube-dl...');
    
    // Download audio only, convert to MP3
    // Add user-agent to avoid bot detection
    await youtubedl(youtubeUrl, {
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0, // Best quality
      output: outputTemplate,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      // Try to avoid bot detection
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      addHeader: ['User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'],
      // Use IPv4 to avoid some YouTube blocks
      forceIpv4: true,
      // Bypass age gate
      age Limit: 21
    });
    
    // Find the downloaded file
    const expectedPath = path.join(tempDir, `youtube-${timestamp}.mp3`);
    
    if (!fs.existsSync(expectedPath)) {
      // Look for any file with our timestamp
      const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`youtube-${timestamp}`));
      if (files.length === 0) {
        throw new Error('Downloaded file not found');
      }
      const actualPath = path.join(tempDir, files[0]);
      console.log('YouTube audio downloaded successfully:', actualPath);
      return actualPath;
    }
    
    console.log('YouTube audio downloaded successfully:', expectedPath);
    return expectedPath;
    
  } catch (error) {
    console.error('YouTube download error:', error);
    
    // Check if it's a bot detection error
    if (error.message && error.message.includes('Sign in to confirm')) {
      throw new Error('YouTube is blocking automated downloads. Please try uploading an audio file directly, or try a different video URL. For production use, consider implementing file uploads or using YouTube\'s official API.');
    }
    
    // Cleanup any partial files
    try {
      const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`youtube-${timestamp}`));
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(tempDir, file));
        } catch (e) {
          console.error('Failed to cleanup partial file:', e);
        }
      });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
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
