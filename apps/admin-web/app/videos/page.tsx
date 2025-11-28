// apps/admin-web/app/videos/page.tsx
import Link from 'next/link';
import { adminVideos } from './data';

function statusChip(status: string) {
  const base =
    'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium';
  switch (status) {
    case 'validated':
      return `${base} bg-emerald-500/15 text-emerald-300 border border-emerald-500/40`;
    case 'processing':
      return `${base} bg-amber-500/15 text-amber-300 border border-amber-500/40`;
    case 'rejected':
      return `${base} bg-rose-500/15 text-rose-300 border border-rose-500/40`;
    default:
      return `${base} bg-slate-700/40 text-slate-300 border border-slate-600`;
  }
}

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
          <thead className="bg-black/20 text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
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
            {adminVideos.map((v) => (
              <tr
                key={v.id}
                className="border-t border-[var(--border-subtle)] hover:bg-black/20"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-14 rounded-md bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                      Preview
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{v.user}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {v.caption.slice(0, 40)}
                        {v.caption.length > 40 ? '…' : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{v.mob}</td>
                <td className="px-4 py-3 text-xs">
                  <span className={statusChip(v.status)}>{v.status}</span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {v.score != null ? `${Math.round(v.score * 100)}%` : '–'}
                </td>
                <td className="px-4 py-3 text-xs">{v.createdAt}</td>
                <td className="px-4 py-3 text-right text-xs">
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
