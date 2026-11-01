import { useState, useEffect } from "react"

export function useYouTubeDuration(videoId) {
  const [duration, setDuration] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!videoId) {
      setLoading(false)
      return
    }

    const fetchDuration = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Note: You'll need to add your YouTube API key
        const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
        
        if (!API_KEY) {
          throw new Error("YouTube API key not configured")
        }

        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${API_KEY}`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch video duration")
        }

        const data = await response.json()
        
        if (data.items && data.items.length > 0) {
          const duration = data.items[0].contentDetails.duration
          setDuration(parseDuration(duration))
        } else {
          throw new Error("Video not found")
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDuration()
  }, [videoId])

  return { duration, loading, error }
}

// Parse ISO 8601 duration format (PT1H2M10S) to seconds
function parseDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  
  const hours = (match[1] || '').replace('H', '') || 0
  const minutes = (match[2] || '').replace('M', '') || 0
  const seconds = (match[3] || '').replace('S', '') || 0
  
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
}

// Format seconds to readable time
export function formatDuration(seconds) {
  if (!seconds) return "0:00"
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
