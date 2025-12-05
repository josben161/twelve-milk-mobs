'use client';

import { VideoThumbnailCard } from './VideoThumbnailCard';
import type { VideoSummary } from '@twelve/core-types';

interface ExploreGridProps {
  videos: VideoSummary[];
  mobNames?: Record<string, string>;
  similarityScores?: Record<string, number>;
  loading?: boolean;
}

export function ExploreGrid({ videos, mobNames = {}, similarityScores = {}, loading = false }: ExploreGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] rounded-xl bg-[var(--bg-subtle)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center">
          <p className="text-base font-medium text-[var(--text)] mb-2">No videos to explore</p>
          <p className="text-sm text-[var(--text-muted)]">
            Check back soon for more content!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-4">
      {videos.map((video) => (
        <VideoThumbnailCard
          key={video.id}
          video={video}
          mobName={video.mobId ? mobNames[video.mobId] : undefined}
          similarityScore={similarityScores[video.id]}
        />
      ))}
    </div>
  );
}

