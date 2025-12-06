'use client';

import { useMemo } from 'react';
import { VideoThumbnailCard } from './VideoThumbnailCard';
import type { VideoSummary } from '@twelve/core-types';

interface ExploreGridProps {
  videos: VideoSummary[];
  mobNames?: Record<string, string>;
  similarityScores?: Record<string, number>;
  loading?: boolean;
}

type CardSize = 'small' | 'medium' | 'large';

interface VideoWithSize extends VideoSummary {
  size: CardSize;
}

export function ExploreGrid({ videos, mobNames = {}, similarityScores = {}, loading = false }: ExploreGridProps) {
  // Assign varied sizes to videos for masonry effect
  const videosWithSizes = useMemo(() => {
    return videos.map((video, index) => {
      // Create varied sizes: 60% small, 25% medium, 15% large
      const sizePattern = index % 20;
      let size: CardSize = 'small';
      
      if (sizePattern < 12) {
        size = 'small'; // 60%
      } else if (sizePattern < 17) {
        size = 'medium'; // 25%
      } else {
        size = 'large'; // 15%
      }
      
      // Occasionally make featured videos (with mobs) larger
      if (video.mobId && index % 7 === 0) {
        size = 'large';
      }
      
      return { ...video, size };
    });
  }, [videos]);

  if (loading) {
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 px-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="mb-3 rounded-xl bg-[var(--bg-subtle)] animate-pulse"
            style={{ height: `${200 + (i % 3) * 100}px` }}
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
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 px-4 w-full">
      {videosWithSizes.map((video) => {
        const heightClass = 
          video.size === 'small' ? 'h-48' :
          video.size === 'medium' ? 'h-64' :
          'h-80';
        
        return (
          <div key={video.id} className={`mb-3 break-inside-avoid ${heightClass}`}>
            <VideoThumbnailCard
              video={video}
              mobName={video.mobId ? mobNames[video.mobId] : undefined}
              similarityScore={similarityScores[video.id]}
            />
          </div>
        );
      })}
    </div>
  );
}

