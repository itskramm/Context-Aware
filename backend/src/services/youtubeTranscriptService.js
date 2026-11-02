import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Extract YouTube video ID from URL
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
 */
export function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

/**
 * Fetch YouTube transcript using captions API (FREE, instant)
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @returns {Promise<Object>} - { text: string, segments: Array }
 */
export async function fetchYouTubeTranscript(videoIdOrUrl) {
  try {
    // Extract video ID if URL provided
    const videoId = videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')
      ? extractYouTubeId(videoIdOrUrl)
      : videoIdOrUrl;
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL or video ID');
    }
    
    console.log(`Fetching YouTube transcript for video: ${videoId}`);
    
    // Fetch transcript (supports auto-generated and manual captions)
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en', // Try English first
      country: 'US'
    });
    
    if (!transcriptData || transcriptData.length === 0) {
      throw new Error('No transcript available for this video');
    }
    
    console.log(`✅ Found YouTube transcript with ${transcriptData.length} segments`);
    
    // Convert to our format
    const segments = transcriptData.map(segment => ({
      start: segment.offset / 1000, // Convert ms to seconds
      end: (segment.offset + segment.duration) / 1000,
      text: segment.text.trim(),
      speaker: null // YouTube captions don't include speaker info
    }));
    
    // Combine all text
    const fullText = segments.map(s => s.text).join(' ');
    
    return {
      text: fullText,
      segments: segments,
      language: 'en',
      source: 'youtube-captions'
    };
    
  } catch (error) {
    console.error('YouTube transcript fetch error:', error.message);
    
    // Check specific error types
    if (error.message.includes('Transcript is disabled') || 
        error.message.includes('No transcript available')) {
      throw new Error('CAPTIONS_DISABLED');
    }
    
    if (error.message.includes('Video unavailable') || 
        error.message.includes('Private video')) {
      throw new Error('VIDEO_UNAVAILABLE');
    }
    
    throw error;
  }
}

/**
 * Get YouTube video metadata (duration, title, thumbnail)
 * Uses a simple HTTP request to avoid bot detection
 */
export async function getYouTubeMetadata(videoId) {
  try {
    // Use YouTube oEmbed API (no API key required)
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }
    
    const data = await response.json();
    
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
      // oEmbed doesn't provide duration, we'll get it from the page if needed
    };
  } catch (error) {
    console.warn('Could not fetch YouTube metadata:', error.message);
    return null;
  }
}

/**
 * Format seconds to timestamp string (HH:MM:SS or MM:SS)
 */
export function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
