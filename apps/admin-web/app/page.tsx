// apps/admin-web/app/page.tsx
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
    change: '+52',
    changeLabel: 'Last 24 hours',
    trend: 'up' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Validated',
    value: mockStats.validated.toLocaleString(),
    change: '73%',
    changeLabel: 'Approval rate',
    trend: 'neutral' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  {
    label: 'Rejected',
    value: mockStats.rejected.toLocaleString(),
    change: '11%',
    changeLabel: 'Rejection rate',
    trend: 'down' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    ),
  },
  {
    label: 'Active mobs',
    value: mockStats.mobs.toString(),
    change: '12',
    changeLabel: 'Communities',
    trend: 'neutral' as const,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
];

export default function AdminHomePage() {
  return (
    <div className="w-full space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">Campaign overview</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Monitor ingestion, validation quality, and engagement across all Milk Mob communities.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            change={card.change}
            changeLabel={card.changeLabel}
            trend={card.trend}
            icon={card.icon}
          />
        ))}
      </section>

      {/* Charts & Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Validation Funnel Panel */}
        <Panel title="Validation funnel" description="Daily content ingestion and validation outcomes over time.">
          <div className="h-56 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-[var(--text-muted)] mb-2">Awaiting data...</p>
              <p className="text-xs text-[var(--text-soft)]">Chart will appear here when data is available</p>
            </div>
          </div>
        </Panel>

        {/* Quality Metrics Panel */}
        <Panel title="Quality metrics" description="System performance and processing efficiency.">
          <div className="space-y-8">
            {/* Average Validation Score */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--text-muted)]">
                  Average validation score
                </span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {Math.round(mockStats.avgValidationScore * 100)}%
                </span>
              </div>
              <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-indigo-500 rounded-full transition-all"
                  style={{ width: `${mockStats.avgValidationScore * 100}%` }}
                />
              </div>
            </div>

            {/* Processing Time */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--text-muted)]">
                  Average processing time
                </span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {mockStats.avgTimeToValidate}
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Time from user upload to automated validation decision.
              </p>
            </div>

            {/* Modalities Covered */}
            <div>
              <p className="text-sm font-medium text-[var(--text-muted)] mb-4">
                Modalities covered
              </p>
              <div className="flex flex-wrap gap-2">
                {['Video', 'Audio', 'Text'].map((modality) => (
                  <span
                    key={modality}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                  >
                    {modality}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
