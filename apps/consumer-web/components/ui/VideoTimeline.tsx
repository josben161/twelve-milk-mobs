'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export interface TimelineHighlight {
  timestamp: number; // seconds
  description: string;
  score?: number; // 0–1 relevance
}

interface VideoTimelineProps {
  duration: number; // Total video duration in seconds
  highlights: TimelineHighlight[];
  currentTime: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function VideoTimeline({
  duration,
  highlights,
  currentTime,
  onSeek,
  className,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoveredHighlight, setHoveredHighlight] = useState<TimelineHighlight | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = Math.max(0, Math.min(duration, percentage * duration));
    
    onSeek(seekTime);
  };

  const handleHighlightHover = (highlight: TimelineHighlight, e: React.MouseEvent) => {
    setHoveredHighlight(highlight);
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHoverPosition(x);
    }
  };

  if (duration === 0 || !isFinite(duration) || duration <= 0) {
    return null;
  }

  const currentPercentage = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <div className={cn('relative w-full', className)}>
      {/* Timeline track */}
      <div
        ref={timelineRef}
        className="relative h-2 bg-[var(--bg-subtle)] rounded-full cursor-pointer group"
        onClick={handleTimelineClick}
        onMouseLeave={() => setHoveredHighlight(null)}
      >
        {/* Progress bar */}
        <div
          className="absolute left-0 top-0 h-full bg-[var(--accent)] rounded-full transition-all duration-100"
          style={{ width: `${currentPercentage}%` }}
        />
        
        {/* Highlight markers */}
        {highlights.map((highlight, idx) => {
          const position = (highlight.timestamp / duration) * 100;
          const score = highlight.score ?? 0.5;
          const intensity = Math.max(0.3, score); // Minimum opacity for visibility
          
          return (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${position}%` }}
              onMouseEnter={(e) => handleHighlightHover(highlight, e)}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(highlight.timestamp);
              }}
            >
              {/* Highlight dot */}
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all hover:scale-125"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--accent) ${intensity * 100}%, transparent)`,
                }}
              />
              
              {/* Score indicator bar */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-0.5 transition-all"
                style={{
                  height: `${score * 20}px`,
                  backgroundColor: 'var(--accent)',
                  opacity: intensity,
                }}
              />
            </div>
          );
        })}
        
        {/* Current time indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full shadow-lg pointer-events-none"
          style={{ left: `${currentPercentage}%` }}
        />
      </div>
      
      {/* Hover tooltip */}
      {hoveredHighlight && (
        <div
          className="absolute bottom-full mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none whitespace-nowrap z-10"
          style={{
            left: `${hoverPosition}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-medium">
            {Math.floor(hoveredHighlight.timestamp / 60)}:
            {(hoveredHighlight.timestamp % 60).toFixed(0).padStart(2, '0')}
          </div>
          <div className="text-[10px] opacity-80">{hoveredHighlight.description}</div>
        </div>
      )}
      
      {/* Time labels */}
      <div className="flex justify-between mt-1 text-[10px] text-[var(--text-muted)]">
        <span>0:00</span>
        <span>
          {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}

