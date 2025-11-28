// apps/admin-web/app/videos/[videoId]/page.tsx
import { Panel } from '@/components/ui';
import { StatusPill } from '@/components/ui';
import { adminVideos } from '../data';

interface Props {
  params: { videoId: string };
}

export default function VideoDetailPage({ params }: Props) {
  const video = adminVideos.find((v) => v.id === params.videoId);

  if (!video) {
    return (
      <>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Video not found</h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            The video you're looking for doesn't exist.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Video analysis</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          {video.user} · {video.mob} · {video.createdAt}
        </p>
      </div>

      {/* Two Column Layout */}
      <section className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Video Preview Panel */}
          <Panel className="p-6">
            <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg)] border border-[var(--border-subtle)] mb-4 flex items-center justify-center">
              <span className="text-sm text-[var(--text-muted)]">Video preview</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-1">Caption</p>
                <p className="text-sm text-[var(--text-muted)]">{video.caption}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-2">Hashtags</p>
                <div className="flex flex-wrap gap-2">
                  {video.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-1">Location</p>
                <p className="text-sm text-[var(--text-muted)]">{video.location}</p>
              </div>
            </div>
          </Panel>

          {/* Semantic Timeline Panel */}
          <Panel className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Semantic timeline</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Key moments detected by TwelveLabs analysis.
              </p>
            </div>
            <div className="space-y-3">
              {video.timeline.map((entry, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-16">
                    <span className="text-xs font-medium text-[var(--text-muted)]">{entry.t}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text)]">{entry.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* TwelveLabs Summary Panel */}
          <Panel className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-1">TwelveLabs summary</h2>
              <p className="text-xs text-[var(--text-muted)]">
                AI-detected actions, objects, and scenes.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Actions detected</p>
                <div className="flex flex-wrap gap-2">
                  {video.actions.map((action) => (
                    <span
                      key={action}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Objects & scenes</p>
                <div className="flex flex-wrap gap-2">
                  {video.objectsScenes.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Decision Inputs Panel */}
          <Panel className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Decision inputs</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Validation score and status determination.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-[var(--accent-soft)] border-2 border-[var(--accent)] flex items-center justify-center">
                    <span className="text-lg font-bold text-[var(--accent)]">
                      {video.score != null ? Math.round(video.score * 100) : '–'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">Validation score</p>
                  <StatusPill status={video.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">
                  {video.status === 'validated'
                    ? 'This video matches the campaign brief and has been approved for the feed.'
                    : video.status === 'processing'
                    ? 'This video is currently being analyzed and validated.'
                    : 'This video did not meet the campaign requirements and was rejected.'}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </>
  );
}
