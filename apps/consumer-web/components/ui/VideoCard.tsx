'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { StatusPill } from './StatusPill';
import type { VideoStatus } from '@twelve/core-types';

interface Props {
  videoId: string;
  title: string;
  status: VideoStatus;
  createdAt: string;
  hashtags?: string[];
  mobLabel?: string;
  compact?: boolean;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function VideoCard({
  videoId,
  title,
  status,
  createdAt,
  hashtags,
  mobLabel,
  compact = false,
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm shadow-lg transition hover:border-indigo-500/70 hover:shadow-[0_18px_50px_rgba(79,70,229,0.6)]"
    >
      <div className="relative h-44 w-full bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-950">
        {/* Placeholder "thumbnail" */}
        <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
          Video preview
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent" />
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-50">
            {title}
          </h3>
          <StatusPill status={status} />
        </div>
        {mobLabel && (
          <div className="text-xs text-slate-400">
            Mob: <span className="text-slate-200">{mobLabel}</span>
          </div>
        )}
        {hashtags && hashtags.length > 0 && (
          <div className="text-xs text-slate-500 truncate">
            {hashtags.join(', ')}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{formatDate(createdAt)}</span>
          <Link
            href={`/video/${videoId}`}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

