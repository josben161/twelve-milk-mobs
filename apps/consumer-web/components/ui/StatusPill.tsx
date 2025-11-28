import type { VideoStatus } from '@twelve/core-types';

export function StatusPill({ status }: { status: VideoStatus }) {
  const map: Record<VideoStatus, { label: string; classes: string }> = {
    uploaded: {
      label: 'Uploaded',
      classes: 'bg-slate-800 text-slate-200 border-slate-700',
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

  const { label, classes } = map[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

