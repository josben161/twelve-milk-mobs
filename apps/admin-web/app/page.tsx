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
    label: 'Active Mobs',
    value: mockStats.mobs.toString(),
    change: '12',
    changeLabel: 'Communities',
    trend: 'neutral' as const,
    icon: '👥',
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-[32px] font-bold text-[var(--text-primary)] leading-tight tracking-tight">
          Campaign Overview
        </h1>
        <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          Monitor performance metrics and content validation across all Milk Mob communities
        </p>
      </div>

      {/* Stat Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-sm)] hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--transition-base)]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-[8px] bg-[var(--bg-elevated)] flex items-center justify-center text-base border border-[var(--border)]">
                  {card.icon}
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                    {card.label}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[28px] font-bold text-[var(--text-primary)] leading-none">
                {card.value}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[13px] font-semibold ${
                    card.trend === 'up'
                      ? 'text-[var(--success)]'
                      : card.trend === 'down'
                      ? 'text-[var(--error)]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {card.change}
                </span>
                <span className="text-[12px] text-[var(--text-tertiary)]">
                  {card.changeLabel}
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Charts and Metrics Section */}
      <section className="grid gap-5 lg:grid-cols-[1fr_420px]">
        {/* Validation Funnel Chart */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-5 space-y-1">
            <h2 className="text-[18px] font-semibold text-[var(--text-primary)] leading-tight">
              Validation Funnel
            </h2>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              Daily content ingestion and validation outcomes over time
            </p>
          </div>
          <div className="relative h-[280px] rounded-[var(--radius-md)] border-2 border-dashed border-[var(--border)] bg-[var(--bg)]/50 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] mb-2">
                <svg className="w-6 h-6 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">Chart visualization</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Quality Metrics Panel */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-sm)]">
          <div className="mb-5 space-y-1">
            <h2 className="text-[18px] font-semibold text-[var(--text-primary)] leading-tight">
              Quality Metrics
            </h2>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              System performance and processing efficiency
            </p>
          </div>
          <div className="space-y-5">
            {/* Validation Score */}
            <div className="pb-5 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                  Average Validation Score
                </span>
                <span className="text-[16px] font-bold text-[var(--text-primary)]">
                  {Math.round(mockStats.avgValidationScore * 100)}%
                </span>
              </div>
              <div className="relative h-2.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--success)] to-[#00b894] rounded-full transition-all duration-[var(--transition-slow)]"
                  style={{ width: `${mockStats.avgValidationScore * 100}%` }}
                />
              </div>
            </div>

            {/* Processing Time */}
            <div className="pb-5 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                  Processing Time
                </span>
                <span className="text-[16px] font-bold text-[var(--text-primary)]">
                  {mockStats.avgTimeToValidate}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                Average time from upload to validation decision
              </p>
            </div>

            {/* Processing Capabilities */}
            <div>
              <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-3">
                Processing Capabilities
              </p>
              <div className="flex flex-wrap gap-2">
                {['Video', 'Audio', 'Text'].map((modality) => (
                  <span
                    key={modality}
                    className="inline-flex items-center px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-semibold bg-[var(--accent-surface)] text-[var(--accent)] border border-[var(--accent)]/20"
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
