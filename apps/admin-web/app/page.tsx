// apps/admin-web/app/page.tsx
import { AdminShell } from '@/components/ui';
import { StatCard } from '@/components/ui';
import { Panel } from '@/components/ui';

const mockStats = {
  totalVideos: 428,
  validated: 312,
  rejected: 46,
  mobs: 12,
  avgValidationScore: 0.87,
  avgTimeToValidate: '3m 42s',
};

const statCards = [
  {
    label: 'Total videos',
    value: mockStats.totalVideos.toLocaleString(),
    caption: '+52 in last 24 hours',
  },
  {
    label: 'Validated',
    value: mockStats.validated.toLocaleString(),
    caption: '73% approval rate',
  },
  {
    label: 'Rejected',
    value: mockStats.rejected.toLocaleString(),
    caption: 'Content did not match brief',
  },
  {
    label: 'Active mobs',
    value: mockStats.mobs.toString(),
    caption: 'e.g. Skatepark, Café Study',
  },
];

export default function AdminHomePage() {
  return (
    <AdminShell>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Campaign overview</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          Monitor ingestion, validation quality, and engagement across all Milk Mob communities.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            caption={card.caption}
          />
        ))}
      </section>

      {/* Charts and Metrics Section */}
      <section className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        {/* Validation Funnel Panel */}
        <Panel className="p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Validation funnel</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Daily content ingestion and validation outcomes over time.
            </p>
          </div>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
            <div className="text-center space-y-2">
              <svg
                className="w-12 h-12 mx-auto text-[var(--text-soft)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-xs text-[var(--text-muted)]">Chart coming soon</p>
            </div>
          </div>
        </Panel>

        {/* Quality Metrics Panel */}
        <Panel className="p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Quality metrics</h2>
            <p className="text-sm text-[var(--text-muted)]">
              System performance and processing efficiency.
            </p>
          </div>
          <div className="space-y-5">
            {/* Average Validation Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--text-muted)]">Average validation score</span>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {Math.round(mockStats.avgValidationScore * 100)}%
                </span>
              </div>
              <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all"
                  style={{ width: `${mockStats.avgValidationScore * 100}%` }}
                />
              </div>
            </div>

            {/* Processing Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--text-muted)]">Average processing time</span>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {mockStats.avgTimeToValidate}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Time from user upload to automated validation decision.
              </p>
            </div>

            {/* Modalities Covered */}
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Modalities covered</p>
              <div className="flex flex-wrap gap-2">
                {['Video', 'Audio', 'Text'].map((modality) => (
                  <span
                    key={modality}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                  >
                    {modality}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </section>
    </AdminShell>
  );
}
