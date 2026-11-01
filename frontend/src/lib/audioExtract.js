/**
 * Audio extraction utilities
 */

/**
 * Extract audio from video file
 * @param {File} videoFile - Video file to extract audio from
 * @returns {Promise<Blob>} Audio blob
 */
export async function extractAudioFromVideo(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    video.src = URL.createObjectURL(videoFile)
    
    video.addEventListener("loadedmetadata", async () => {
      try {
        const mediaSource = audioContext.createMediaElementSource(video)
        const destination = audioContext.createMediaStreamDestination()
        
        mediaSource.connect(destination)
        
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: "audio/webm",
        })
        
        const chunks = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" })
          URL.revokeObjectURL(video.src)
          resolve(audioBlob)
        }
        
        mediaRecorder.start()
        video.play()
        
        video.addEventListener("ended", () => {
          mediaRecorder.stop()
          audioContext.close()
        })
      } catch (error) {
        reject(error)
      }
    })
    
    video.addEventListener("error", (error) => {
      reject(error)
    })
  })
}

/**
 * Get audio duration from file
 * @param {File|Blob} audioFile - Audio file
 * @returns {Promise<number>} Duration in seconds
 */
export async function getAudioDuration(audioFile) {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.src = URL.createObjectURL(audioFile)
    
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(audio.src)
      resolve(audio.duration)
    })
    
    audio.addEventListener("error", (error) => {
      URL.revokeObjectURL(audio.src)
      reject(error)
    })
  })
}

/**
 * Convert audio file to different format
 * @param {File} audioFile - Source audio file
 * @param {string} targetMimeType - Target MIME type (e.g., 'audio/mp3')
 * @returns {Promise<Blob>} Converted audio blob
 */
export async function convertAudioFormat(audioFile, targetMimeType) {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    audio.src = URL.createObjectURL(audioFile)
    
    audio.addEventListener("loadedmetadata", async () => {
      try {
        const source = audioContext.createMediaElementSource(audio)
        const destination = audioContext.createMediaStreamDestination()
        
        source.connect(destination)
        
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: targetMimeType,
        })
        
        const chunks = []
        
        mediaRecorder.ondataavailable = (event) => {
          chunks.push(event.data)
        }
        
        mediaRecorder.onstop = () => {
          const convertedBlob = new Blob(chunks, { type: targetMimeType })
          URL.revokeObjectURL(audio.src)
          resolve(convertedBlob)
        }
        
        mediaRecorder.start()
        audio.play()
        
        audio.addEventListener("ended", () => {
          mediaRecorder.stop()
          audioContext.close()
        })
      } catch (error) {
        reject(error)
      }
    })
  })
}

export default {
  extractAudioFromVideo,
  getAudioDuration,
  convertAudioFormat,
}
