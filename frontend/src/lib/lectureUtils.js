// Shared helpers for the lecture digest app.

// Convert seconds to HH:MM:SS (or MM:SS when under an hour).
export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return "00:00";
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Convert seconds to a compact label e.g. "1h 32m" or "12m 15s".
export function compactDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return "0m";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const PROCESSING_STAGES = [
  { key: "uploading", label: "Uploading", icon: "Upload" },
  { key: "extracting_audio", label: "Extracting audio", icon: "AudioLines" },
  { key: "generating_transcript", label: "Generating transcript", icon: "FileText" },
  { key: "identifying_segments", label: "Identifying important segments", icon: "Scissors" },
  { key: "preparing_index", label: "Preparing lecture index", icon: "ListTree" },
  { key: "ready", label: "Ready", icon: "CheckCircle2" },
];

export const STAGE_KEYS = PROCESSING_STAGES.map((s) => s.key);

export function stageIndex(status) {
  const i = STAGE_KEYS.indexOf(status);
  return i < 0 ? 0 : i;
}

export function stageProgress(status) {
  if (status === "ready") return 100;
  if (status === "failed") return 100;
  const i = stageIndex(status);
  return Math.round((i / (STAGE_KEYS.length - 1)) * 100);
}

export const STATUS_LABELS = {
  uploading: "Uploading",
  extracting_audio: "Extracting audio",
  generating_transcript: "Transcribing",
  analyzing_visual: "Analyzing visuals",
  identifying_segments: "Identifying segments",
  preparing_index: "Indexing",
  ready: "Ready",
  failed: "Failed",
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
};

export const STATUS_STYLES = {
  uploading: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  extracting_audio: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  generating_transcript: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  analyzing_visual: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  identifying_segments: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  preparing_index: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  ready: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

export const PURPOSE_LABELS = {
  exam_review: "Exam review",
  missed_lecture: "Missed lecture",
  assignment: "Assignment",
  general_review: "General review",
  specific_topic: "Specific topic",
  other: "Other",
  study: "Study",
  review: "Review",
  reference: "Reference",
  research: "Research",
};

export const DEPTH_LABELS = {
  quick: "Quick Review",
  standard: "Standard",
  detailed: "Detailed",
};

export const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/ogg",
];

export const MAX_FILE_SIZE_MB = 500;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidVideoFile(file) {
  if (!file) return false;
  if (file.size > MAX_FILE_SIZE_BYTES) return false;
  if (SUPPORTED_VIDEO_TYPES.includes(file.type)) return true;
  const name = (file.name || "").toLowerCase();
  return [".mp4", ".mov", ".avi", ".webm", ".ogg"].some((ext) => name.endsWith(ext));
}

// Get a readable video duration from a File via a temporary <video> element.
export function getVideoMeta(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      URL.revokeObjectURL(url);
      resolve({ duration, thumbnailUrl: null });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: 0, thumbnailUrl: null });
    };
    video.src = url;
  });
}

// Capture a thumbnail frame from a video File.
export function captureVideoThumbnail(file, seekTime = 1) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    video.preload = "metadata";
    video.muted = true;
    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(seekTime, Math.max(0, (video.duration || 2) - 1));
      } catch {
        resolve(null);
      }
    };
    video.onseeked = () => {
      try {
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });
}

// Extract YouTube video ID from various URL formats
export function getYoutubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/\/(embed|shorts|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {
    // Not a valid URL
  }
  return null;
}

export function isYoutubeUrl(url) {
  return !!getYoutubeId(url);
}

export function youtubeThumbnail(videoId) {
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function getYouTubeThumbnail(videoId, quality = "high") {
  const qualities = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    maxres: "maxresdefault",
  };
  return `https://img.youtube.com/vi/${videoId}/${qualities[quality] || "hqdefault"}.jpg`;
}

export function relativeDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default {
  formatDuration,
  compactDuration,
  PROCESSING_STAGES,
  STAGE_KEYS,
  stageIndex,
  stageProgress,
  STATUS_LABELS,
  STATUS_STYLES,
  PURPOSE_LABELS,
  DEPTH_LABELS,
  SUPPORTED_VIDEO_TYPES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
  isValidVideoFile,
  getVideoMeta,
  captureVideoThumbnail,
  getYoutubeId,
  isYoutubeUrl,
  youtubeThumbnail,
  getYouTubeThumbnail,
  relativeDate,
};


// YouTube utilities
export function isYoutubeUrl(url) {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

export function getYoutubeId(url) {
  if (!url) return null;
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

// Format relative time (e.g. "2 hours ago", "3 days ago")
export function relativeDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? 's' : ''} ago`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) !== 1 ? 's' : ''} ago`;
}
