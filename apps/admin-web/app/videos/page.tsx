// apps/admin-web/app/videos/page.tsx
import Link from 'next/link';
import { adminVideos } from './data';

function statusChip(status: string) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold';
  switch (status) {
    case 'validated':
      return `${base} bg-[var(--success-surface)] text-[var(--success)] border border-[var(--success)]/30`;
    case 'processing':
      return `${base} bg-[var(--warning-surface)] text-[var(--warning)] border border-[var(--warning)]/30`;
    case 'rejected':
      return `${base} bg-[var(--error-surface)] text-[var(--error)] border border-[var(--error)]/30`;
    default:
      return `${base} bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border)]`;
  }
}

export default function VideosPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-[32px] font-bold text-[var(--text-primary)] leading-tight tracking-tight">
          Videos
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
          Browse and manage all campaign submissions with TwelveLabs AI analysis
        </p>
      </div>

      {/* Videos Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]">
        <table className="min-w-full">
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border)]">
            <tr>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Video
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Community
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Score
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Created
              </th>
              <th className="px-5 py-3.5 text-right text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {adminVideos.map((v) => (
              <tr
                key={v.id}
                className="hover:bg-[var(--bg-surface-hover)] transition-colors duration-[var(--transition-fast)]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-20 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[10px] font-medium text-[var(--text-tertiary)]">
                      Preview
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[14px] font-semibold text-[var(--text-primary)] leading-tight">
                        {v.user}
                      </span>
                      <span className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed line-clamp-1">
                        {v.caption.slice(0, 50)}
                        {v.caption.length > 50 ? '…' : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[13px] text-[var(--text-primary)] font-medium">
                    {v.mob}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={statusChip(v.status)}>{v.status}</span>
                </td>
                <td className="px-5 py-4">
                  {v.score != null ? (
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {Math.round(v.score * 100)}%
                    </span>
                  ) : (
                    <span className="text-[13px] text-[var(--text-tertiary)]">–</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-[13px] text-[var(--text-secondary)]">{v.createdAt}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/videos/${v.id}`}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-[var(--transition-fast)]"
                  >
                    View
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
