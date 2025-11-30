// apps/consumer-web/app/page.tsx
import { PostCard } from '@/components/ui';

const mockFeed = [
  {
    id: 'vid_1',
    user: {
      handle: 'user_1',
      avatarColor: 'indigo',
    },
    mobName: 'Skatepark',
    location: 'Venice Skatepark',
    tags: ['#gotmilk', '#skatepark'],
    caption: 'Tried a new trick with a milk chug 🍶🛹',
    status: 'validated',
    createdAt: '2h',
    video: {
      id: 'vid_1',
    },
  },
  {
    id: 'vid_2',
    user: {
      handle: 'user_2',
      avatarColor: 'emerald',
    },
    mobName: 'Bedroom Dance',
    location: 'Bedtime Beats',
    tags: ['#milkshake', '#dance'],
    caption: 'Milkshake choreo round 2 💃',
    status: 'processing',
    createdAt: '5h',
    video: {
      id: 'vid_2',
    },
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col transition-colors duration-300">
      {mockFeed.map((post) => (
        <PostCard
          key={post.id}
          video={post.video}
          user={post.user}
          caption={post.caption}
          hashtags={post.tags}
          timestamp={post.createdAt}
          mobName={post.mobName}
          location={post.location}
        />
      ))}
    </div>
  );
}
