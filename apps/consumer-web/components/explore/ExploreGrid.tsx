'use client';

import { useMemo } from 'react';
import { VideoThumbnailCard } from './VideoThumbnailCard';
import { JoinMobButton } from '@/components/ui/JoinMobButton';
import Link from 'next/link';
import type { VideoSummary, MobSummary } from '@twelve/core-types';

interface ExploreGridProps {
  videos: VideoSummary[];
  mobs?: MobSummary[];
  mobNames?: Record<string, string>;
  similarityScores?: Record<string, number>;
  loading?: boolean;
}

type CardSize = 'small' | 'medium' | 'large';

type GridItem = 
  | { type: 'video'; data: VideoSummary; size: CardSize }
  | { type: 'mob'; data: MobSummary; size: CardSize };

export function ExploreGrid({ videos, mobs = [], mobNames = {}, similarityScores = {}, loading = false }: ExploreGridProps) {
  // Mix mobs and videos together, assign sizes, and shuffle for natural flow
  const gridItems = useMemo(() => {
    const items: GridItem[] = [];
    
    // Add mobs as special items
    mobs.slice(0, 5).forEach((mob, index) => {
      const sizePattern = index % 3;
      let size: CardSize = 'medium';
      if (sizePattern === 0) size = 'small';
      else if (sizePattern === 1) size = 'medium';
      else size = 'large';
      
      items.push({ type: 'mob', data: mob, size });
    });
    
    // Add videos with varied sizes
    videos.forEach((video, index) => {
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
      
      items.push({ type: 'video', data: video, size });
    });
    
    // Shuffle items for natural mixing (but keep some structure)
    // Simple shuffle: swap every 3rd item with a random item
    for (let i = 2; i < items.length; i += 3) {
      const j = Math.floor(Math.random() * items.length);
      [items[i], items[j]] = [items[j], items[i]];
    }
    
    return items;
  }, [videos, mobs]);

  if (loading) {
    return (
      <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-[2px]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="mb-[2px] rounded-sm bg-[var(--bg-subtle)] animate-pulse aspect-square"
          />
        ))}
      </div>
    );
  }

  if (gridItems.length === 0) {
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
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-[2px] w-full">
      {gridItems.map((item, index) => {
        if (item.type === 'mob') {
          const mob = item.data;
          // Use aspect ratios instead of fixed heights
          const aspectClass = 
            item.size === 'small' ? 'aspect-square' :
            item.size === 'medium' ? 'aspect-[4/5]' :
            'aspect-[3/4]';
          
          return (
            <div key={`mob-${mob.id}`} className={`mb-[2px] break-inside-avoid ${aspectClass}`}>
              <Link
                href={`/mob/${mob.id}`}
                className="group relative block w-full h-full rounded-sm overflow-hidden border border-[var(--border-subtle)] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:border-[var(--accent)]/50 hover:shadow-lg transition-all duration-200 flex flex-col p-3"
              >
                <div className="text-2xl font-bold mb-1 text-[var(--text)]">{mob.videoCount}</div>
                <div className="text-sm font-semibold mb-1 text-[var(--text)] line-clamp-1">{mob.name}</div>
                <div className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 flex-1">{mob.description}</div>
                {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mob.exampleHashtags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-auto">
                  <JoinMobButton 
                    mobId={mob.id} 
                    mobName={mob.name}
                    variant="default"
                    size="sm"
                    className="w-full justify-center"
                  />
                </div>
              </Link>
            </div>
          );
        } else {
          const video = item.data;
          // Use aspect ratios instead of fixed heights
          const aspectClass = 
            item.size === 'small' ? 'aspect-square' :
            item.size === 'medium' ? 'aspect-[4/5]' :
            'aspect-[3/4]';
          
          return (
            <div key={video.id} className={`mb-[2px] break-inside-avoid ${aspectClass}`}>
              <VideoThumbnailCard
                video={video}
                mobName={video.mobId ? mobNames[video.mobId] : undefined}
                similarityScore={similarityScores[video.id]}
              />
            </div>
          );
        }
      })}
    </div>
  );
}

