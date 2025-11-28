'use client';

import Link from 'next/link';
import { use } from 'react';

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
      <main className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
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
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mob: {mob.name}</h1>
          <p className="text-lg text-slate-300 mb-2">{mob.description}</p>
          <p className="text-sm text-slate-400">
            {mob.videoCount} videos · '{mob.vibe}' vibe
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mob.videoIds.map((videoId) => (
            <Link
              key={videoId}
              href={`/video/${videoId}`}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail placeholder */}
                <div className="h-20 w-32 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-50 mb-2 truncate">
                    {mockVideoTitles[videoId] || videoId}
                  </h3>
                  <span className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300">
                    See video →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {mob.videoIds.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <p className="text-slate-400">No videos in this mob yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}

