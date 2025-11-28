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
      className="group overflow-hidden rounded-2xl border backdrop-blur-sm shadow-lg transition-all duration-300"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = '0 18px 50px var(--accent-soft)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = '0 4px 6px var(--shadow)';
      }}
    >
      <div
        className="relative h-44 w-full"
        style={{
          background: 'linear-gradient(to top right, var(--bg-soft), var(--bg))',
        }}
      >
        {/* Placeholder "thumbnail" */}
        <div
          className="absolute inset-0 flex items-center justify-center text-xs"
          style={{ color: 'var(--text-subtle)' }}
        >
          Video preview
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
          }}
        />
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3
            className="truncate text-sm font-semibold"
            style={{ color: 'var(--text)' }}
          >
            {title}
          </h3>
          <StatusPill status={status} />
        </div>
        {mobLabel && (
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Mob: <span style={{ color: 'var(--text)' }}>{mobLabel}</span>
          </div>
        )}
        {hashtags && hashtags.length > 0 && (
          <div
            className="text-xs truncate"
            style={{ color: 'var(--text-subtle)' }}
          >
            {hashtags.join(', ')}
          </div>
        )}
        <div
          className="flex items-center justify-between text-xs"
          style={{ color: 'var(--text-subtle)' }}
        >
          <span>{formatDate(createdAt)}</span>
          <Link
            href={`/video/${videoId}`}
            className="transition-colors hover:opacity-80"
            style={{ color: 'var(--accent-strong)' }}
          >
            View →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

