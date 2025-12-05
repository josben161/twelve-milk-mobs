'use client';

import { VideoThumbnailCard } from './VideoThumbnailCard';
import Link from 'next/link';
import type { VideoSummary } from '@twelve/core-types';

interface SimilarVideosSectionProps {
  title: string;
  videos: VideoSummary[];
  mobNames?: Record<string, string>;
  similarityScores?: Record<string, number>;
  viewAllHref?: string;
}

export function SimilarVideosSection({
  title,
  videos,
  mobNames = {},
  similarityScores = {},
  viewAllHref,
}: SimilarVideosSectionProps) {
  if (videos.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-[var(--accent)] hover:underline"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {videos.map((video) => (
          <div key={video.id} className="flex-shrink-0 w-32">
            <VideoThumbnailCard
              video={video}
              mobName={video.mobId ? mobNames[video.mobId] : undefined}
              similarityScore={similarityScores[video.id]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

