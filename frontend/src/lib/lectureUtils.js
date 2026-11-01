/**
 * Lecture utility functions
 */

import { APP_PARAMS } from "./app-params"

/**
 * Format duration in seconds to readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1h 23m" or "45m")
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return "0m"
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  
  if (minutes > 0) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
  }
  
  return `${secs}s`
}

/**
 * Format file size to readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export function extractYouTubeId(url) {
  if (!url) return null
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /youtube\.com\/v\/([^&\s]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Check if URL is a valid YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean} True if valid YouTube URL
 */
export function isYouTubeUrl(url) {
  return APP_PARAMS.YOUTUBE_URL_REGEX.test(url)
}

/**
 * Validate file type for lecture upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateLectureFile(file) {
  const errors = []
  
  // Check file size
  if (file.size > APP_PARAMS.MAX_FILE_SIZE) {
    errors.push(
      `File size exceeds maximum allowed size of ${formatFileSize(APP_PARAMS.MAX_FILE_SIZE)}`
    )
  }
  
  // Check file type
  const extension = "." + file.name.split(".").pop().toLowerCase()
  const allowedFormats = [
    ...APP_PARAMS.ALLOWED_VIDEO_FORMATS,
    ...APP_PARAMS.ALLOWED_AUDIO_FORMATS,
  ]
  
  if (!allowedFormats.includes(extension)) {
    errors.push(
      `File type ${extension} is not supported. Allowed formats: ${allowedFormats.join(", ")}`
    )
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get lecture status badge color
 * @param {string} status - Lecture status
 * @returns {string} Tailwind color class
 */
export function getLectureStatusColor(status) {
  const colors = {
    processing: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-blue-100 text-blue-800",
  }
  
  return colors[status] || "bg-gray-100 text-gray-800"
}

/**
 * Format date to relative time
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now - past) / 1000)
  
  if (diffInSeconds < 60) return "just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return past.toLocaleDateString()
}

/**
 * Generate thumbnail URL for YouTube video
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality (default, medium, high, maxres)
 * @returns {string} Thumbnail URL
 */
export function getYouTubeThumbnail(videoId, quality = "high") {
  const qualities = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    maxres: "maxresdefault",
  }
  
  return `https://img.youtube.com/vi/${videoId}/${qualities[quality] || "hqdefault"}.jpg`
}

export default {
  formatDuration,
  formatFileSize,
  extractYouTubeId,
  isYouTubeUrl,
  validateLectureFile,
  getLectureStatusColor,
  formatRelativeTime,
  getYouTubeThumbnail,
}
