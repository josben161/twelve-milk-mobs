// apps/admin-web/app/videos/page.tsx
import Link from 'next/link';
import { AdminShell } from '@/components/ui';
import { Panel } from '@/components/ui';
import { StatusPill } from '@/components/ui';
import { adminVideos } from './data';

export default function VideosPage() {
  return (
    <AdminShell>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Videos</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          All campaign submissions with current validation status and TwelveLabs analysis.
        </p>
      </div>

      {/* Videos Table */}
      <Panel>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Video
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Mob
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {adminVideos.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg)] border border-[var(--border-subtle)] flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[var(--text)] truncate">
                          {v.user}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                          {v.caption}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--text)]">{v.mob}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={v.status} />
                  </td>
                  <td className="px-4 py-3">
                    {v.score != null ? (
                      <span className="text-sm font-semibold text-[var(--text)]">
                        {Math.round(v.score * 100)}%
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--text-soft)]">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--text-muted)]">{v.createdAt}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/videos/${v.id}`}
                      className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AdminShell>
  );
}
