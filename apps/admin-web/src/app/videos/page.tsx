// apps/admin-web/src/app/videos/page.tsx
import Link from 'next/link';

const mockVideos = [
  {
    id: 'vid_1',
    user: 'sk8milk',
    mob: 'Skatepark',
    status: 'validated',
    createdAt: '2024-01-15',
    score: 0.93,
  },
  {
    id: 'vid_2',
    user: 'late_night_milk',
    mob: 'Bedroom Dance',
    status: 'processing',
    createdAt: '2024-01-14',
    score: 0.0,
  },
  {
    id: 'vid_3',
    user: 'cafe_study_milk',
    mob: 'Café Study',
    status: 'validated',
    createdAt: '2024-01-13',
    score: 0.89,
  },
  {
    id: 'vid_4',
    user: 'beach_milk',
    mob: 'Beach Vibes',
    status: 'rejected',
    createdAt: '2024-01-12',
    score: 0.45,
  },
  {
    id: 'vid_5',
    user: 'gym_milk',
    mob: 'Gym Session',
    status: 'validated',
    createdAt: '2024-01-11',
    score: 0.91,
  },
];

export default function VideosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Videos</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          All campaign submissions enriched with TwelveLabs analysis.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]">
        <table className="min-w-full text-sm">
          <thead className="bg-black/10 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-2 text-left">Video</th>
              <th className="px-4 py-2 text-left">Mob</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Score</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockVideos.map((v) => (
              <tr
                key={v.id}
                className="border-t border-[var(--border-subtle)] hover:bg-black/10"
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-12 rounded-md bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                      Vid
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{v.user}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {v.id}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-xs">{v.mob}</td>
                <td className="px-4 py-2 text-xs capitalize">{v.status}</td>
                <td className="px-4 py-2 text-xs">
                  {v.score ? `${Math.round(v.score * 100)}%` : '–'}
                </td>
                <td className="px-4 py-2 text-xs">{v.createdAt}</td>
                <td className="px-4 py-2 text-right text-xs">
                  <Link
                    href={`/videos/${v.id}`}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

