// apps/admin-web/app/videos/page.tsx
import Link from 'next/link';
import { adminVideos } from './data';

function statusChip(status: string) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold';
  switch (status) {
    case 'validated':
      return `${base} bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30`;
    case 'processing':
      return `${base} bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30`;
    case 'rejected':
      return `${base} bg-[var(--error)]/15 text-[var(--error)] border border-[var(--error)]/30`;
    default:
      return `${base} bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]`;
  }
}

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Videos</h1>
        <p className="mt-1.5 text-[15px] text-[var(--text-secondary)]">
          Browse and manage all campaign submissions with TwelveLabs AI analysis
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm">
        <table className="min-w-full">
          <thead className="bg-[var(--bg)]/50 border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Video</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Community</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Score</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Created</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminVideos.map((v) => (
              <tr
                key={v.id}
                className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 rounded-md bg-gradient-to-br from-[var(--bg-hover)] to-[var(--bg)] border border-[var(--border-subtle)] flex items-center justify-center text-[10px] font-medium text-[var(--text-tertiary)]">
                      Preview
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{v.user}</span>
                      <span className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {v.caption.slice(0, 45)}
                        {v.caption.length > 45 ? '…' : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-[var(--text-primary)] font-medium">{v.mob}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={statusChip(v.status)}>{v.status}</span>
                </td>
                <td className="px-5 py-4">
                  {v.score != null ? (
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {Math.round(v.score * 100)}%
                    </span>
                  ) : (
                    <span className="text-sm text-[var(--text-tertiary)]">–</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-[var(--text-secondary)]">{v.createdAt}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/videos/${v.id}`}
                    className="inline-flex items-center text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    View →
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
