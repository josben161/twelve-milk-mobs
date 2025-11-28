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
    <div className="min-h-full bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Campaign banner */}
        <section className="mt-2 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-r from-indigo-600/80 via-indigo-500 to-violet-500 px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.8)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-100/80">
                Got Milk · Gen Z campaign
              </p>
              <h1 className="mt-1 text-lg font-semibold text-white">
                Campaign Overview
              </h1>
              <p className="mt-1 text-xs text-indigo-100/90 max-w-xl">
                Monitor performance, validation quality, and engagement across all
                Milk Mob communities. Powered by TwelveLabs video understanding.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-indigo-100/90 mt-3 md:mt-0">
              <div>
                <p className="opacity-80">Avg validation score</p>
                <p className="text-sm font-semibold">
                  {Math.round(mockStats.avgValidationScore * 100)}%
                </p>
              </div>
              <div>
                <p className="opacity-80">Avg processing time</p>
                <p className="text-sm font-semibold">
                  {mockStats.avgTimeToValidate}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stat cards */}
        <section className="grid gap-4 md:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] px-4 py-3 shadow-sm"
            >
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                {card.label}
              </p>
              <p className="mt-2 text-xl font-semibold">{card.value}</p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                {card.caption}
              </p>
            </div>
          ))}
        </section>

        {/* Funnel + quality metrics */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
          {/* Validation funnel card */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold">Validation funnel</h2>
              <span className="text-[11px] text-[var(--text-muted)]">
                Daily ingest & decision trend
              </span>
            </div>
            <p className="mb-4 text-xs text-[var(--text-muted)]">
              This will show volume of videos ingested and how they flow through
              processing, validation and rejection over time.
            </p>
            <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,_#1f2937,_#020617)] text-xs text-[var(--text-muted)]">
              <span className="mb-1 text-[var(--text)]/80">
                Chart visualization
              </span>
              <span>Coming soon</span>
            </div>
          </div>

          {/* Quality metrics card */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Quality metrics</h2>
            <dl className="space-y-3 text-xs text-[var(--text-muted)]">
              <div>
                <dt className="mb-1 flex items-center justify-between">
                  <span>Average validation score</span>
                  <span className="font-semibold text-emerald-300">
                    {Math.round(mockStats.avgValidationScore * 100)}%
                  </span>
                </dt>
                <dd className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                    style={{ width: `${mockStats.avgValidationScore * 100}%` }}
                  />
                </dd>
              </div>
              <div>
                <dt className="mb-1 flex items-center justify-between">
                  <span>Average processing time</span>
                  <span className="font-semibold text-sky-300">
                    {mockStats.avgTimeToValidate}
                  </span>
                </dt>
                <dd className="text-[11px]">
                  Time from user upload to automated validation decision.
                </dd>
              </div>
              <div>
                <dt className="mb-1">Processing capabilities</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {['Video', 'Audio', 'Text'].map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-0.5 text-[11px] text-slate-200"
                    >
                      {m}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
