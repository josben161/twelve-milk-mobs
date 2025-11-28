// apps/admin-web/src/app/page.tsx
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
    label: 'Total videos',
    value: mockStats.totalVideos.toLocaleString(),
    caption: '+52 in last 24h',
  },
  {
    label: 'Validated',
    value: mockStats.validated.toLocaleString(),
    caption: '73%',
  },
  {
    label: 'Rejected',
    value: mockStats.rejected.toLocaleString(),
    caption: "Content didn't match brief",
  },
  {
    label: 'Mobs active',
    value: mockStats.mobs.toString(),
    caption: 'e.g. Skatepark / Café Study',
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          High-level view of the Milk Mob campaign performance.
        </p>
      </div>

      {/* Stat cards */}
      <section className="grid gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] px-4 py-3 shadow-sm"
          >
            <p className="text-xs text-[var(--text-muted)]">{card.label}</p>
            <p className="mt-2 text-lg font-semibold">{card.value}</p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              {card.caption}
            </p>
          </div>
        ))}
      </section>

      {/* Video breakdown */}
      <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
          <h2 className="text-sm font-semibold mb-3">Validation funnel</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Mock chart for now - later this shows daily ingests and validation outcomes.
          </p>
          <div className="flex h-40 items-center justify-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-lg">
            Chart placeholder
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
          <h2 className="text-sm font-semibold mb-3">Quality & latency</h2>
          <ul className="space-y-2 text-xs text-[var(--text-muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">
                {Math.round(mockStats.avgValidationScore * 100)}%
              </span>{' '}
              average validation score across all Mobs.
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">
                {mockStats.avgTimeToValidate}
              </span>{' '}
              average time from ingest to final decision.
            </li>
            <li>Processing multiple modalities: video, text, and audio.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
