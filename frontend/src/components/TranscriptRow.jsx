import React from 'react';

export default function TranscriptRow({ segment, onClick, isActive }) {
  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer border-b border-border hover:bg-accent/50 transition-colors ${
        isActive ? 'bg-accent' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xs text-muted-foreground font-mono min-w-[60px]">
          {segment.start}
        </span>
        <p className="text-sm flex-1">{segment.text}</p>
      </div>
    </div>
  );
}
