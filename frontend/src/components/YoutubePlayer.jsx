import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { Loader2, Film } from "lucide-react";

// Loads the YouTube IFrame API once and caches the promise.
let apiPromise = null;
function loadYouTubeAPI() {
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev && prev();
        resolve();
      };
    });
  }
  return apiPromise;
}

// Renders a YouTube video via the IFrame API. Exposes an imperative seek()
// handle so parent pages can jump to a timestamp, matching VideoPlayer.
const YouTubePlayer = forwardRef(function YouTubePlayer(
  { videoId, start = 0, className },
  ref
) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let destroyed = false;
    setLoading(true);
    setError(false);

    loadYouTubeAPI().then(() => {
      if (destroyed || !mountRef.current) return;
      try {
        playerRef.current = new window.YT.Player(mountRef.current, {
          videoId,
          playerVars: {
            start: Math.max(0, Math.floor(start)),
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: () => {
              if (!destroyed) setLoading(false);
            },
            onError: () => {
              if (!destroyed) {
                setError(true);
                setLoading(false);
              }
            },
          },
        });
      } catch {
        if (!destroyed) {
          setError(true);
          setLoading(false);
        }
      }
    });

    return () => {
      destroyed = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
  }, [videoId]);

  useImperativeHandle(ref, () => ({
    seek: (seconds) => {
      try {
        playerRef.current?.seekTo?.(Math.max(0, seconds), true);
        playerRef.current?.playVideo?.();
      } catch {}
    },
    getCurrentTime: () => {
      try {
        return playerRef.current?.getCurrentTime?.() || 0;
      } catch {
        return 0;
      }
    },
  }));

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted rounded-2xl gap-2 py-16 ${className || ""}`}>
        <Film className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Video preview unavailable.</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-black ${className || ""}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/70" />
        </div>
      )}
      <div ref={mountRef} className="w-full" style={{ aspectRatio: "16 / 9" }} />
    </div>
  );
});

export default YouTubePlayer;