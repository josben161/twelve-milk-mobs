'use client';

import Link from 'next/link';
import type { VideoSummary } from '@twelve/core-types';
import { MobBadge } from '@/components/explore';

interface VideoThumbnailProps {
  video: VideoSummary;
  mobName?: string;
  similarityScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
  className?: string;
}

export function VideoThumbnail({
  video,
  mobName,
  similarityScore,
  size = 'md',
  showInfo = true,
  className = '',
}: VideoThumbnailProps) {
  const sizeClasses = {
    sm: 'aspect-square',
    md: 'aspect-[4/5]',
    lg: 'aspect-[4/5]',
  };

  return (
    <Link
      href={`/video/${video.id}`}
      className={`group relative block w-full ${sizeClasses[size]} rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-soft)] transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-xl hover:scale-[1.02] ${className}`}
    >
      {/* Thumbnail */}
      <div className="absolute inset-0">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.caption || `Video by @${video.userHandle}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-[var(--text-muted)]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        )}
        
        {/* Gradient Overlay */}
        {showInfo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>

      {/* Content Overlay */}
      {showInfo && (
        <div className="absolute inset-0 flex flex-col justify-end p-3">
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            {video.mobId && (
              <MobBadge mobId={video.mobId} mobName={mobName} />
            )}
            {similarityScore !== undefined && (
              <div className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                {Math.round(similarityScore * 100)}% match
              </div>
            )}
          </div>

          {/* Bottom Info */}
          <div className="transform transition-all duration-300 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white text-sm font-semibold">@{video.userHandle}</span>
            </div>
            {video.caption && (
              <p className="text-white/90 text-xs line-clamp-2 mb-2">
                {video.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Play Icon on Hover */}
      {showInfo && (
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      )}
    </Link>
  );
}

