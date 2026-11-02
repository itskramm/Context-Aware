import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import useIsClamped from "@/hooks/useIsClamped";

export default function TranscriptRow({ timestampLabel, onSeek, children, measureKey }) {
  const [open, setOpen] = useState(false);
  const [textRef, clamped] = useIsClamped(open, measureKey);

  return (
    <div className="p-4 hover:bg-accent/40 transition-colors">
      <div className="flex gap-3">
        <button
          onClick={onSeek}
          className="text-primary font-mono text-sm font-medium shrink-0 hover:underline tabular-nums"
        >
          {timestampLabel}
        </button>
        <div className="min-w-0 flex-1">
          <p ref={textRef} className={`text-sm text-foreground leading-relaxed ${open ? "" : "line-clamp-2"}`}>
            {children}
          </p>
        </div>
        {clamped && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground shrink-0 self-start"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}