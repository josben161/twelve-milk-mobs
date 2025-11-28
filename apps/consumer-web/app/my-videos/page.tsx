'use client';

import Link from 'next/link';
import type { VideoRecord } from '@twelve/core-types';

// Mock data
const mockVideos: (VideoRecord & { title: string })[] = [
  {
    videoId: 'vid-001',
    userId: 'user-123',
    s3Key: 'videos/vid-001.mp4',
    hashtags: ['#gotmilk', '#skatepark'],
    createdAt: '2024-01-15T10:30:00Z',
    status: 'validated',
    title: 'Skatepark Milk Trick',
  },
  {
    videoId: 'vid-002',
    userId: 'user-123',
    s3Key: 'videos/vid-002.mp4',
    hashtags: ['#milkmob', '#bedroom'],
    createdAt: '2024-01-14T15:20:00Z',
    status: 'processing',
    title: 'Bedroom Dance Session',
  },
  {
    videoId: 'vid-003',
    userId: 'user-123',
    s3Key: 'videos/vid-003.mp4',
    hashtags: ['#cafe', '#study'],
    createdAt: '2024-01-13T09:15:00Z',
    status: 'rejected',
    title: 'Café Study Vibes',
  },
  {
    videoId: 'vid-004',
    userId: 'user-123',
    s3Key: 'videos/vid-004.mp4',
    hashtags: ['#gotmilk', '#action'],
    createdAt: '2024-01-12T14:45:00Z',
    status: 'validated',
    title: 'Action-Packed Milk Moment',
  },
];

function getStatusColor(status: VideoRecord['status']) {
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MyVideosPage() {
  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Videos</h1>

        <div className="space-y-4">
          {mockVideos.map((video) => (
            <div
              key={video.videoId}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail placeholder */}
                <div className="h-24 w-40 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex-shrink-0" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-slate-50 truncate">
                      {video.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize flex-shrink-0 ${getStatusColor(
                        video.status
                      )}`}
                    >
                      {video.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                    <span>{formatDate(video.createdAt)}</span>
                    <span>•</span>
                    <span className="truncate">
                      {video.hashtags.join(', ')}
                    </span>
                  </div>

                  <Link
                    href={`/video/${video.videoId}`}
                    className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

