'use client';

import Link from 'next/link';
import { use } from 'react';
import type { VideoStatus } from '@twelve/core-types';
import { Card, VideoCard, PageShell } from '@/components/ui';

// Mock data
const mockMobs: Record<
  string,
  {
    id: string;
    name: string;
    description: string;
    videoCount: number;
    vibe: string;
    videoIds: string[];
  }
> = {
  skatepark: {
    id: 'skatepark',
    name: 'Skatepark milk tricks',
    description: 'Action-heavy videos from skateparks',
    videoCount: 24,
    vibe: 'Skatepark, sunset, action-heavy',
    videoIds: ['vid-001', 'vid-004'],
  },
  'bedroom-dance': {
    id: 'bedroom-dance',
    name: 'Bedroom Dance',
    description: 'Late night dance sessions',
    videoCount: 18,
    vibe: 'Bedroom, night, energetic',
    videoIds: ['vid-002'],
  },
  'cafe-study': {
    id: 'cafe-study',
    name: 'Café Study',
    description: 'Chill study sessions with milk',
    videoCount: 12,
    vibe: 'Café, calm, focused',
    videoIds: ['vid-003'],
  },
};

const mockVideoTitles: Record<string, string> = {
  'vid-001': 'Skatepark Milk Trick',
  'vid-002': 'Bedroom Dance Session',
  'vid-003': 'Café Study Vibes',
  'vid-004': 'Action-Packed Milk Moment',
};

export default function MobFeedPage({
  params,
}: {
  params: Promise<{ mobId: string }>;
}) {
  const { mobId } = use(params);
  const mob = mockMobs[mobId];

  if (!mob) {
    return (
      <PageShell>
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Mob not found</h1>
          <p className="text-slate-400 mb-4">
            The mob with ID {mobId} could not be found.
          </p>
          <Link
            href="/"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Home
          </Link>
        </Card>
      </PageShell>
    );
  }

  // Mock video data for the mob
  const mobVideos = mob.videoIds.map((videoId) => ({
    videoId,
    title: mockVideoTitles[videoId] || videoId,
    status: 'validated' as VideoStatus,
    createdAt: '2024-01-15T10:30:00Z',
  }));

  return (
    <PageShell>
      {/* Hero */}
      <Card className="p-8 mb-8 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/50">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
          Mob: {mob.name}
        </h1>
        <p className="text-lg text-slate-300 mb-2">{mob.description}</p>
        <p className="text-sm text-slate-400">
          {mob.videoCount} videos · '{mob.vibe}' vibe
        </p>
      </Card>

      {/* Video Grid */}
      {mobVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mobVideos.map((video) => (
            <VideoCard key={video.videoId} {...video} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-slate-400">No videos in this mob yet.</p>
        </Card>
      )}
    </PageShell>
  );
}

