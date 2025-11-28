// apps/admin-web/src/app/videos/[videoId]/page.tsx
// Placeholder for video detail page - to be implemented

export default function VideoDetailPage({
  params,
}: {
  params: { videoId: string };
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Video Detail</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Video ID: {params.videoId}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-6">
        <p className="text-sm text-[var(--text-muted)]">
          Video detail page coming soon...
        </p>
      </div>
    </div>
  );
}

