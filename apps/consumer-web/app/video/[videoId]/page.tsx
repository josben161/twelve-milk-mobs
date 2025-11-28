'use client';

import Link from 'next/link';
import { use } from 'react';

// Mock data
const mockVideos: Record<
  string,
  {
    videoId: string;
    title: string;
    status: 'processing' | 'validated' | 'rejected';
    hashtags: string[];
    detectedActions: string[];
    tags: { type: string; value: string }[];
  }
> = {
  'vid-001': {
    videoId: 'vid-001',
    title: 'Skatepark Milk Trick',
    status: 'validated',
    hashtags: ['#gotmilk', '#skatepark', '#action'],
    detectedActions: ['skateboarding', 'jumping', 'drinking'],
    tags: [
      { type: 'object', value: 'milk carton' },
      { type: 'scene', value: 'outdoor skatepark' },
      { type: 'emotion', value: 'excitement' },
      { type: 'activity', value: 'extreme sports' },
    ],
  },
  'vid-002': {
    videoId: 'vid-002',
    title: 'Bedroom Dance Session',
    status: 'processing',
    hashtags: ['#milkmob', '#bedroom', '#dance'],
    detectedActions: ['dancing', 'moving'],
    tags: [
      { type: 'object', value: 'milk bottle' },
      { type: 'scene', value: 'indoor bedroom' },
      { type: 'emotion', value: 'joy' },
    ],
  },
  'vid-003': {
    videoId: 'vid-003',
    title: 'Café Study Vibes',
    status: 'rejected',
    hashtags: ['#cafe', '#study'],
    detectedActions: ['sitting', 'reading'],
    tags: [
      { type: 'scene', value: 'café interior' },
      { type: 'emotion', value: 'calm' },
    ],
  },
  'vid-004': {
    videoId: 'vid-004',
    title: 'Action-Packed Milk Moment',
    status: 'validated',
    hashtags: ['#gotmilk', '#action'],
    detectedActions: ['running', 'jumping', 'drinking'],
    tags: [
      { type: 'object', value: 'milk carton' },
      { type: 'scene', value: 'outdoor park' },
      { type: 'emotion', value: 'energy' },
      { type: 'activity', value: 'sports' },
    ],
  },
};

function getStatusColor(status: string) {
  switch (status) {
    case 'validated':
      return 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30';
    case 'processing':
      return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30';
    case 'rejected':
      return 'bg-red-600/20 text-red-300 border-red-600/30';
    default:
      return 'bg-slate-600/20 text-slate-300 border-slate-600/30';
  }
}

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = use(params);
  const video = mockVideos[videoId];

  if (!video) {
    return (
      <main className="py-12">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Video not found</h1>
            <p className="text-slate-400 mb-4">
              The video with ID {videoId} could not be found.
            </p>
            <Link
              href="/my-videos"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300"
            >
              ← Back to My Videos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/my-videos"
          className="inline-flex items-center text-sm text-slate-400 hover:text-indigo-400 mb-6 transition-colors"
        >
          ← Back to My Videos
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 space-y-6">
          {/* Video Player Placeholder */}
          <div className="aspect-video rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="h-16 w-16 text-white/50 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-white/50 text-sm">Video Player</p>
            </div>
          </div>

          {/* Title & Status */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-50">{video.title}</h1>
            <span
              className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium capitalize flex-shrink-0 ${getStatusColor(
                video.status
              )}`}
            >
              {video.status}
            </span>
          </div>

          {/* Hashtags */}
          <div>
            <h2 className="text-sm font-medium text-slate-400 mb-2">
              Hashtags
            </h2>
            <div className="flex flex-wrap gap-2">
              {video.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-600/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Detected Actions & Tags */}
          <div className="border-t border-slate-800 pt-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4">
              Detected actions & tags
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {video.detectedActions.map((action, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300"
                    >
                      <span className="text-slate-500 mr-1">
                        {tag.type}:
                      </span>
                      {tag.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

