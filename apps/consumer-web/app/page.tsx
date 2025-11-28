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
    <div className="flex flex-col gap-6 pb-6 transition-colors duration-300">
      {mockFeed.map((post) => (
        <article
          key={post.id}
          className="border-b pb-4 transition-colors duration-300"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold text-white">
                {post.user.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  {post.user}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {post.location}
                </span>
              </div>
            </div>
            <span
              className="text-xl"
              style={{ color: 'var(--text-subtle)' }}
            >
              ⋯
            </span>
          </header>

          {/* Media */}
          <div
            className="relative mx-3 mb-2 overflow-hidden rounded-xl aspect-[4/5]"
            style={{
              background: 'linear-gradient(to bottom right, var(--bg-soft), var(--bg))',
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center text-xs"
              style={{ color: 'var(--text-subtle)' }}
            >
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
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              <span className="font-semibold mr-1">{post.user}</span>
              {post.caption}
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--accent-strong)' }}
            >
              {post.tags.join(' ')}
            </p>
            <p
              className="text-[11px] uppercase tracking-wide"
              style={{ color: 'var(--text-subtle)' }}
            >
              {post.mobName} · {post.createdAt} ago
            </p>
            <Link
              href={`/video/${post.id}`}
              className="text-[11px] underline transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              View analysis
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
