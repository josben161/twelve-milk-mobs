// apps/consumer-web/app/page.tsx
import Link from 'next/link';

const mockFeed = [
  {
    id: 'vid_1',
    user: 'sk8milk',
    mobName: 'Skatepark',
    location: 'Venice Skatepark',
    tags: ['#gotmilk', '#skatepark'],
    caption: 'Tried a new trick with a milk chug 🍶🛹',
    status: 'validated',
    createdAt: '2h',
  },
  {
    id: 'vid_2',
    user: 'late_night_milk',
    mobName: 'Bedroom Dance',
    location: 'Bedtime Beats',
    tags: ['#milkshake', '#dance'],
    caption: 'Milkshake choreo round 2 💃',
    status: 'processing',
    createdAt: '5h',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 pb-6">
      {mockFeed.map((post) => (
        <article key={post.id} className="border-b border-slate-900 pb-4">
          {/* Header */}
          <header className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold">
                {post.user.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{post.user}</span>
                <span className="text-xs text-slate-400">{post.location}</span>
              </div>
            </div>
            <span className="text-slate-500 text-xl">⋯</span>
          </header>

          {/* Media */}
          <div className="relative mx-3 mb-2 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 aspect-[4/5]">
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Video preview
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-1 text-xl">
            <div className="flex items-center gap-4">
              <button>❤️</button>
              <button>💬</button>
              <button>📤</button>
            </div>
            <button>🔖</button>
          </div>

          {/* Caption */}
          <div className="px-3 pt-1 space-y-1">
            <p className="text-sm">
              <span className="font-semibold mr-1">{post.user}</span>
              {post.caption}
            </p>
            <p className="text-xs text-indigo-300">
              {post.tags.join(' ')}
            </p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">
              {post.mobName} · {post.createdAt} ago
            </p>
            <Link
              href={`/video/${post.id}`}
              className="text-[11px] text-slate-400 underline"
            >
              View analysis
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
