// apps/admin-web/app/videos/[videoId]/page.tsx

interface Props {
    params: { videoId: string };
  }
  
  export default function VideoDetailTest({ params }: Props) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Video detail test</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Route is working. videoId =
          <span className="ml-1 font-mono text-slate-200">{params.videoId}</span>
        </p>
      </div>
    );
  }
  