'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, HomeIconFilled, PlusIcon, UserIcon, UserIconFilled } from '@/components/ui/Icons';

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center border-t border-[var(--border-subtle)] bg-[var(--bg-soft)]/95 backdrop-blur-xl transition-colors duration-300">
      <div className="flex w-full max-w-[480px] items-center justify-around h-14">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors duration-200 ${
            isActive('/')
              ? 'text-[var(--text)]'
              : 'text-[var(--text-muted)]'
          }`}
        >
          {isActive('/') ? (
            <HomeIconFilled className="h-6 w-6" />
          ) : (
            <HomeIcon className="h-6 w-6" />
          )}
          <span className="text-[10px] font-medium leading-none">Home</span>
        </Link>
        <Link
          href="/upload"
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors duration-200 ${
            isActive('/upload')
              ? 'text-[var(--text)]'
              : 'text-[var(--text-muted)]'
          }`}
        >
          <div
            className={`h-6 w-6 rounded-full flex items-center justify-center transition-all duration-200 ${
              isActive('/upload')
                ? 'bg-[var(--accent)] shadow-md'
                : 'bg-[var(--border-subtle)]'
            }`}
          >
            <PlusIcon
              className={`h-3.5 w-3.5 ${
                isActive('/upload') ? 'text-white' : 'text-[var(--text-muted)]'
              }`}
            />
          </div>
          <span className="text-[10px] font-medium leading-none">Upload</span>
        </Link>
        <Link
          href="/my-videos"
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors duration-200 ${
            isActive('/my-videos')
              ? 'text-[var(--text)]'
              : 'text-[var(--text-muted)]'
          }`}
        >
          {isActive('/my-videos') ? (
            <UserIconFilled className="h-6 w-6" />
          ) : (
            <UserIcon className="h-6 w-6" />
          )}
          <span className="text-[10px] font-medium leading-none">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

