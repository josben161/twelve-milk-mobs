'use client';

import Link from 'next/link';

interface MobBadgeProps {
  mobId: string | null;
  mobName?: string;
  className?: string;
}

export function MobBadge({ mobId, mobName, className = '' }: MobBadgeProps) {
  if (!mobId) return null;

  return (
    <Link
      href={`/mob/${mobId}`}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:from-indigo-500/30 hover:via-purple-500/30 hover:to-pink-500/30 transition-all duration-200 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
      {mobName || 'Mob'}
    </Link>
  );
}

