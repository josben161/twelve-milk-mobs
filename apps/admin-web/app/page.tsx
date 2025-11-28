// apps/admin-web/app/page.tsx

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
    icon: '📹',
  },
  {
    label: 'Validated',
    value: mockStats.validated.toLocaleString(),
    change: '73%',
    changeLabel: 'Approval rate',
    trend: 'neutral' as const,
    icon: '✓',
  },
  {
    label: 'Rejected',
    value: mockStats.rejected.toLocaleString(),
    change: '11%',
    changeLabel: 'Rejection rate',
    trend: 'down' as const,
    icon: '✗',
  },
  {
    label: 'Active mobs',
    value: mockStats.mobs.toString(),
    change: '12',
    changeLabel: 'Communities',
    trend: 'neutral' as const,
    icon: '👥',
  },
];

export default function AdminHomePage() {
  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2 text-[var(--text)]">Campaign overview</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Monitor ingestion, validation quality, and engagement across all Milk Mob communities.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shadow-sm px-4 py-3 flex flex-col gap-1"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-xs">
                {card.icon}
              </div>
              <span className="text-xs font-medium text-[var(--text-muted)]">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-[var(--text)]">{card.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`text-xs font-medium ${
                  card.trend === 'up'
                    ? 'text-green-600'
                    : card.trend === 'down'
                    ? 'text-red-600'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {card.change}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{card.changeLabel}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Charts & Panels */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Validation Funnel Panel */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Validation funnel</h2>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Daily content ingestion and validation outcomes over time.
          </p>
          <div className="mt-3 h-56 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center text-xs text-[var(--text-muted)]">
            Chart placeholder
          </div>
        </div>

        {/* Quality Metrics Panel */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Quality metrics</h2>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            System performance and processing efficiency.
          </p>
          <div className="space-y-4">
            {/* Average Validation Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)]">Average validation score</span>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {Math.round(mockStats.avgValidationScore * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-indigo-500 rounded-full"
                  style={{ width: `${mockStats.avgValidationScore * 100}%` }}
                />
              </div>
            </div>

            {/* Processing Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--text-muted)]">Average processing time</span>
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
        </div>
      </section>
    </>
  );
}
