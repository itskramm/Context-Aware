import React, { useEffect, useRef, useImperativeHandle, useState, forwardRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Film } from "lucide-react";
import YouTubePlayer from "@/components/YoutubePlayer";
import { getYoutubeId } from "@/lib/lectureUtils";

// Chooses between a native <video> player (for uploaded files) and a YouTube
// IFrame player (for pasted links), based on the stored URL. Both expose the
// same imperative seek(seconds) handle so parent pages can jump to timestamps.
const VideoPlayer = forwardRef(function VideoPlayer(props, ref) {
  const youtubeId = getYoutubeId(props.fileUrl) || getYoutubeId(props.fileUri);
  if (youtubeId) {
    return <YouTubePlayer ref={ref} videoId={youtubeId} className={props.className} />;
  }
  return <FileVideoPlayer {...props} ref={ref} />;
});

// Plays a privately uploaded file by resolving a signed URL from its file_uri.
const FileVideoPlayer = forwardRef(function FileVideoPlayer(
  { fileUri, fileUrl, poster, className, onTimeUpdate },
  ref
) {
  const videoRef = useRef(null);
  const [src, setSrc] = useState(fileUrl || null);
  const [loading, setLoading] = useState(!fileUrl && !!fileUri);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (fileUrl) {
      setSrc(fileUrl);
      setLoading(false);
      return;
    }
    if (!fileUri) return;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const res = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: fileUri,
          expires_in: 3600,
        });
        if (active) {
          setSrc(res?.signed_url || null);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [fileUri, fileUrl]);

  useImperativeHandle(ref, () => ({
    seek: (seconds) => {
      const v = videoRef.current;
      if (v && seconds != null) {
        try {
          v.currentTime = Math.max(0, seconds);
          v.play().catch(() => {});
        } catch {}
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
  }));

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-2xl ${className || ""}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted rounded-2xl gap-2 py-16 ${className || ""}`}>
        <Film className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Video preview unavailable.</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      controls
      playsInline
      className={`w-full rounded-2xl bg-black ${className || ""}`}
      onTimeUpdate={onTimeUpdate}
    />
  );
});

export default VideoPlayer;