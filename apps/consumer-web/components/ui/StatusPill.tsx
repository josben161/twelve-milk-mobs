import type { VideoStatus } from '@twelve/core-types';

export function StatusPill({ status }: { status: VideoStatus }) {
  const map: Record<VideoStatus, { label: string; classes: string; style?: React.CSSProperties }> = {
    uploaded: {
      label: 'Uploaded',
      classes: 'border',
      style: {
        backgroundColor: 'var(--bg-soft)',
        color: 'var(--text-muted)',
        borderColor: 'var(--border-subtle)',
      },
    },
    processing: {
      label: 'Processing',
      classes: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
    },
    validated: {
      label: 'Validated',
      classes: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40',
    },
    rejected: {
      label: 'Rejected',
      classes: 'bg-rose-500/10 text-rose-300 border-rose-500/40',
    },
  };

  const { label, classes, style } = map[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-300 ${classes}`}
      style={style}
    >
      {label}
    </span>
  );
}

