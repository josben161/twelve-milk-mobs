'use client';

import Link from 'next/link';

interface JoinMobButtonProps {
  mobId: string | null;
  mobName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function JoinMobButton({ mobId, mobName, className = '', variant = 'default' }: JoinMobButtonProps) {
  if (!mobId) return null;

  const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg',
    outline: 'border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)]',
    ghost: 'text-[var(--accent)] hover:bg-[var(--accent-soft)]',
  };

  return (
    <Link
      href={`/mob/${mobId}`}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
      {mobName ? `Join ${mobName}` : 'Join Mob'}
    </Link>
  );
}

