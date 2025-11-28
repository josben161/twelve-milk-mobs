// apps/admin-web/app/videos/[videoId]/page.tsx
import { notFound } from 'next/navigation';
import { adminVideos } from '../data';

interface Props {
  params: { videoId: string };
}

export default function VideoDetailPage({ params }: Props) {
  const video = adminVideos.find((v) => v.id === params.videoId);
  if (!video) return notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb / header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Video analysis</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {video.user} · {video.mob} · {video.createdAt}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end text-xs text-[var(--text-muted)]">
          <span>Video ID: {video.id}</span>
          <span>Location: {video.location}</span>
        </div>
      </div>

      {/* Main layout: video left, analysis right */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Left: preview + caption */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] overflow-hidden">
            <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--text-muted)]">
                Video preview
              </div>
            </div>
            <div className="border-t border-[var(--border-subtle)] px-4 py-3 space-y-2">
              <p className="text-sm">
                <span className="font-semibold mr-1">@{video.user}</span>
                {video.caption}
              </p>
              <p className="text-xs text-indigo-300">
                {video.hashtags.join(' ')}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">
                {video.mob} · {video.location}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <h2 className="text-sm font-semibold mb-3">Semantic timeline</h2>
            <ul className="space-y-2 text-xs text-[var(--text-muted)]">
              {video.timeline.map((entry, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="w-16 flex-shrink-0 font-mono text-[11px] text-slate-300">
                    {entry.t}
                  </span>
                  <span>{entry.event}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: TL analysis summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <h2 className="text-sm font-semibold mb-2">TwelveLabs summary</h2>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              High-level semantics extracted from the video across actions,
              objects, and scenes. In the real integration this comes directly
              from TwelveLabs APIs.
            </p>

            <div className="mb-3">
              <h3 className="text-xs font-semibold text-slate-200 mb-1">
                Actions detected
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {video.actions.map((a) => (
                  <span
                    key={a}
                    className="inline-flex rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[11px] text-indigo-200 border border-indigo-500/40"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-200 mb-1">
                Objects & scenes
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {video.objectsScenes.map((o) => (
                  <span
                    key={o}
                    className="inline-flex rounded-full bg-slate-700/40 px-2.5 py-0.5 text-[11px] text-slate-200 border border-slate-600/70"
                  >
                    {o}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Score & decision box */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4 space-y-2 text-xs">
            <h2 className="text-sm font-semibold mb-1">Decision inputs</h2>
            <p className="text-[var(--text-muted)]">
              Model confidence that this video matches the creative brief,
              safety guidelines, and campaign tone.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/60 text-sm font-semibold text-emerald-200">
                {video.score != null ? `${Math.round(video.score * 100)}%` : '–'}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Match score
                </span>
                <span className="text-xs text-slate-200">
                  {video.status === 'validated'
                    ? 'Meets brief – eligible for spotlight.'
                    : video.status === 'rejected'
                    ? 'Flagged – does not match tone or content rules.'
                    : 'Still processing – final decision pending.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
