// apps/admin-web/app/page.tsx
const mockStats = {
  totalVideos: 428,
  validated: 312,
  rejected: 46,
  processing: 70,
  mobs: 12,
  avgValidationScore: 0.87,
  avgTimeToValidate: '3m 42s',
};

const statCards = [
  {
    label: 'Total Videos',
    value: mockStats.totalVideos.toLocaleString(),
    change: '+52',
    changeLabel: 'Last 24 hours',
    trend: 'up' as const,
  },
  {
    label: 'Validated',
    value: mockStats.validated.toLocaleString(),
    change: '73%',
    changeLabel: 'Approval rate',
    trend: 'neutral' as const,
  },
  {
    label: 'Rejected',
    value: mockStats.rejected.toLocaleString(),
    change: '11%',
    changeLabel: 'Rejection rate',
    trend: 'down' as const,
  },
  {
    label: 'Active Mobs',
    value: mockStats.mobs.toString(),
    change: '12',
    changeLabel: 'Communities',
    trend: 'neutral' as const,
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Campaign Overview</h1>
        <p className="mt-1.5 text-[15px] text-[var(--text-secondary)]">
          Monitor performance metrics and content validation across all Milk Mob communities
        </p>
      </div>

      {/* Stat cards */}
      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm hover:border-[var(--border-strong)] transition-colors"
          >
            <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-2">{card.label}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">{card.value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-sm font-semibold ${
                card.trend === 'up' ? 'text-[var(--success)]' : 
                card.trend === 'down' ? 'text-[var(--error)]' : 
                'text-[var(--text-secondary)]'
              }`}>
                {card.change}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">{card.changeLabel}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Charts and metrics */}
      <section className="grid gap-5 lg:grid-cols-[1fr_400px]">
        {/* Validation funnel */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Validation Funnel</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Daily content ingestion and validation outcomes over time
            </p>
          </div>
          <div className="flex h-64 items-center justify-center text-sm text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-subtle)] rounded-lg bg-[var(--bg)]/50">
            <div className="text-center">
              <p className="font-medium mb-1">Chart visualization</p>
              <p className="text-xs">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Quality metrics */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Quality Metrics</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              System performance and processing efficiency
            </p>
          </div>
          <div className="space-y-4">
            <div className="pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-[var(--text-secondary)]">Average Validation Score</span>
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {Math.round(mockStats.avgValidationScore * 100)}%
                </span>
              </div>
              <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--success)] rounded-full"
                  style={{ width: `${mockStats.avgValidationScore * 100}%` }}
                />
              </div>
            </div>
            <div className="pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-[var(--text-secondary)]">Processing Time</span>
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {mockStats.avgTimeToValidate}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Average time from upload to validation decision
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-2">Processing Capabilities</p>
              <div className="flex flex-wrap gap-2">
                {['Video', 'Audio', 'Text'].map((modality) => (
                  <span
                    key={modality}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20"
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

