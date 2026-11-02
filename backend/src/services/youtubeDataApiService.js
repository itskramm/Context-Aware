import axios from 'axios';

/**
 * Parse ISO 8601 duration string into total seconds.
 * e.g. "PT1H32M15S" → 5535
 * @param {string} iso8601Duration
 * @returns {number}
 */
function parseIso8601Duration(iso8601Duration) {
  const match = iso8601Duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video metadata from the YouTube Data API v3.
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{title, channelTitle, description, duration, thumbnailUrl, publishedAt}|null>}
 */
export async function fetchYouTubeMetadata(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  YOUTUBE_API_KEY not set — skipping Data API metadata fetch');
    return null;
  }

  try {
    const url = 'https://www.googleapis.com/youtube/v3/videos';
    const response = await axios.get(url, {
      params: {
        part: 'snippet,contentDetails',
        id: videoId,
        key: apiKey
      },
      timeout: 10000
    });

    const items = response.data?.items;
    if (!items || items.length === 0) {
      console.warn(`⚠️  YouTube Data API returned no items for videoId: ${videoId}`);
      return null;
    }

    const item = items[0];
    const snippet = item.snippet || {};
    const contentDetails = item.contentDetails || {};

    const duration = parseIso8601Duration(contentDetails.duration || '');

    // Prefer highest-res thumbnail available
    const thumbnails = snippet.thumbnails || {};
    const thumbnailUrl =
      thumbnails.maxres?.url ||
      thumbnails.standard?.url ||
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      null;

    return {
      title: snippet.title || null,
      channelTitle: snippet.channelTitle || null,
      description: snippet.description || null,
      duration,
      thumbnailUrl,
      publishedAt: snippet.publishedAt || null
    };
  } catch (error) {
    console.warn('⚠️  YouTube Data API fetch failed:', error.message);
    return null;
  }
}
