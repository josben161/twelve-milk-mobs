// apps/consumer-web/app/page.tsx
import Link from 'next/link';
import {
  HeartIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
  MoreIcon,
} from '@/components/ui/Icons';

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
    <div className="flex flex-col pb-6 transition-colors duration-300">
      {mockFeed.map((post) => (
        <article
          key={post.id}
          className="border-b transition-colors duration-300 pb-6"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/30">
                {post.user.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span
                  className="text-sm font-semibold leading-tight"
                  style={{ color: 'var(--text)' }}
                >
                  {post.user}
                </span>
                <span
                  className="text-xs leading-tight"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {post.location}
                </span>
              </div>
            </div>
            <button
              className="p-1.5 rounded-full hover:bg-[var(--bg-soft)] transition-colors"
              style={{ color: 'var(--text-subtle)' }}
              aria-label="More options"
            >
              <MoreIcon className="h-5 w-5" />
            </button>
          </header>

          {/* Media */}
          <div
            className="relative w-full mb-3 overflow-hidden aspect-[4/5] bg-gradient-to-br from-[var(--bg-soft)] via-[var(--bg)] to-[var(--bg-soft)]"
            style={{
              background: 'linear-gradient(135deg, var(--bg-soft) 0%, var(--bg) 50%, var(--bg-soft) 100%)',
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center text-xs font-medium"
              style={{ color: 'var(--text-subtle)' }}
            >
              Video preview
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-5">
              <button
                className="transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ color: 'var(--text)' }}
                aria-label="Like"
              >
                <HeartIcon className="h-6 w-6" />
              </button>
              <button
                className="transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ color: 'var(--text)' }}
                aria-label="Comment"
              >
                <CommentIcon className="h-6 w-6" />
              </button>
              <button
                className="transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ color: 'var(--text)' }}
                aria-label="Share"
              >
                <ShareIcon className="h-6 w-6" />
              </button>
            </div>
            <button
              className="transition-all duration-200 hover:scale-110 active:scale-95"
              style={{ color: 'var(--text)' }}
              aria-label="Save"
            >
              <BookmarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Caption */}
          <div className="px-4 space-y-2">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              <span className="font-semibold mr-1.5">{post.user}</span>
              {post.caption}
            </p>
            <p
              className="text-xs font-medium"
              style={{ color: 'var(--accent-strong)' }}
            >
              {post.tags.join(' ')}
            </p>
            <p
              className="text-[10px] uppercase tracking-wider font-medium"
              style={{ color: 'var(--text-subtle)' }}
            >
              {post.mobName} · {post.createdAt} ago
            </p>
            <Link
              href={`/video/${post.id}`}
              className="text-[11px] font-medium transition-colors hover:opacity-70 inline-block"
              style={{ color: 'var(--text-muted)' }}
            >
              View analysis →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
