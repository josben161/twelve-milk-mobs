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
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2 text-[var(--text)]">Campaign overview</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Monitor ingestion, validation quality, and engagement across all Milk Mob communities.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shadow-sm px-5 py-4 flex flex-col items-center text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-sm flex-shrink-0">
                {card.icon}
              </div>
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--text)] mb-2 leading-tight">
              {card.value}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-auto">
              <span
                className={`text-xs font-semibold ${
                  card.trend === 'up'
                    ? 'text-[var(--success)]'
                    : card.trend === 'down'
                    ? 'text-[var(--error)]'
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
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Validation Funnel Panel */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-1.5">Validation funnel</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
            Daily content ingestion and validation outcomes over time.
          </p>
          <div className="h-56 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-[var(--text-muted)] opacity-50"
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
              <p className="text-xs text-[var(--text-muted)]">Chart placeholder</p>
            </div>
          </div>
        </div>

        {/* Quality Metrics Panel */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-1.5">Quality metrics</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
            System performance and processing efficiency.
          </p>
          <div className="space-y-5">
            {/* Average Validation Score */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Average validation score
                </span>
                <span className="text-base font-bold text-[var(--text)]">
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
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Average processing time
                </span>
                <span className="text-base font-bold text-[var(--text)]">
                  {mockStats.avgTimeToValidate}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Time from user upload to automated validation decision.
              </p>
            </div>

            {/* Modalities Covered */}
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2.5">
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
        </div>
      </section>
    </div>
  );
}
