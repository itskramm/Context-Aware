import React, { useState } from "react";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import useIsClamped from "@/hooks/useIsClamped";

export default function SegmentCard({ segment, active, onSeek }) {
  const [open, setOpen] = useState(false);
  const [textRef, clamped] = useIsClamped(open, segment.explanation);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSeek}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSeek();
        }
      }}
      className={`w-full text-left rounded-xl p-3 border transition-colors cursor-pointer ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm truncate">{segment.topic}</span>
        <Play className="w-4 h-4 text-primary shrink-0" />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums mt-1">
        {segment.start_label} – {segment.end_label}
      </p>
      <div className="flex items-start gap-2 mt-1.5">
        <p ref={textRef} className={`text-xs text-muted-foreground flex-1 leading-relaxed ${open ? "" : "line-clamp-2"}`}>
          {segment.explanation}
        </p>
        {clamped && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className="text-muted-foreground hover:text-foreground shrink-0 -mt-0.5"
            aria-label={open ? "Show less" : "Show full description"}
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${segment.relevance_score}%` }} />
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{segment.relevance_score}%</span>
      </div>
    </div>
  );
}