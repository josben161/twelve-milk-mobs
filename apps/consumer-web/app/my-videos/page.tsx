'use client';

import type { VideoRecord } from '@twelve/core-types';
import { PageShell, VideoCard } from '@/components/ui';

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

export default function MyVideosPage() {
  return (
    <PageShell>
      <h1 className="text-3xl font-bold mb-8">My Videos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockVideos.map((video) => (
          <VideoCard
            key={video.videoId}
            videoId={video.videoId}
            title={video.title}
            status={video.status}
            createdAt={video.createdAt}
            hashtags={video.hashtags}
          />
        ))}
      </div>
    </PageShell>
  );
}

