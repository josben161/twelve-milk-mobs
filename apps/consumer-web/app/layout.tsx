// apps/consumer-web/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  HomeIcon,
  PlusIcon,
  UserIcon,
  BellIcon,
  MessageIcon,
} from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'Milk Mobs',
  description: 'Instagram-style Milk Mob feed powered by TwelveLabs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* preload theme so we avoid flash of wrong mode */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  var resolvedTheme = theme === 'system' || !theme ? systemTheme : theme;
                  if (resolvedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="text-[var(--text)] transition-colors duration-300">
        <ThemeProvider>
          {/* Premium header with gradient - always visible at top of viewport */}
          <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-soft)]/98 via-[var(--bg-soft)]/95 to-[var(--bg-soft)]/98 backdrop-blur-xl transition-colors duration-300">
            <div className="flex w-full max-w-[480px] mx-auto items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-[11px] font-bold text-white shadow-lg shadow-indigo-500/30">
                  MM
                </div>
                <span className="text-base font-bold tracking-tight bg-gradient-to-r from-[var(--text)] to-[var(--text-muted)] bg-clip-text text-transparent">
                  Social 
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="rounded-full p-2 hover:bg-[var(--bg)]/60 transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <BellIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Messages"
                  className="rounded-full p-2 hover:bg-[var(--bg)]/60 transition-all duration-200 hover:scale-110 active:scale-95"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <MessageIcon className="h-5 w-5" />
                </button>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Spacer to push content below fixed header */}
          <div className="h-[65px]" />

          <div className="min-h-screen flex justify-center transition-colors duration-300 pb-20">
            <div className="flex w-full max-w-[480px] flex-col border-x border-[var(--border-subtle)] bg-[var(--bg)]/80 backdrop-blur-xl transition-colors duration-300 shadow-2xl">
              {/* main feed area */}
              <main className="flex-1 transition-colors duration-300">
                {children}
              </main>
            </div>
          </div>

          {/* Premium bottom nav - always visible at bottom of viewport */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] bg-gradient-to-t from-[var(--bg-soft)]/98 via-[var(--bg-soft)]/95 to-[var(--bg-soft)]/98 backdrop-blur-xl transition-colors duration-300 shadow-[0_-1px_0_var(--border-subtle)]">
            <div className="flex w-full max-w-[480px] mx-auto items-center justify-around py-2.5 text-[10px]">
                <Link
                  href="/"
                  className="flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <HomeIcon className="h-6 w-6" />
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  href="/upload"
                  className="flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                    <PlusIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium">Upload</span>
                </Link>
              <Link
                href="/my-videos"
                className="flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ color: 'var(--text-muted)' }}
              >
                <UserIcon className="h-6 w-6" />
                <span className="font-medium">Profile</span>
              </Link>
            </div>
          </nav>
        </ThemeProvider>
      </body>
    </html>
  );
}
