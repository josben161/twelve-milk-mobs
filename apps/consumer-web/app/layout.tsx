// apps/consumer-web/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

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
      <body className="bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
        <ThemeProvider>
          <div className="min-h-screen flex justify-center bg-[var(--bg)] transition-colors duration-300">
            <div className="flex w-full max-w-[480px] flex-col border-x border-[var(--border-subtle)] bg-[var(--bg)] transition-colors duration-300">
              {/* 🔹 App chrome header – distinct from posts */}
              <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-soft)]/95 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.3)] transition-colors duration-300">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-semibold text-white">
                    MM
                  </div>
                  <span className="text-sm font-semibold tracking-tight">
                    Milk Mobs
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 text-lg text-[var(--text-muted)]">
                    <button
                      type="button"
                      aria-label="Notifications"
                      className="rounded-full p-1.5 hover:bg-[var(--bg)]/70 transition-colors"
                    >
                      🔔
                    </button>
                    <button
                      type="button"
                      aria-label="Messages"
                      className="rounded-full p-1.5 hover:bg-[var(--bg)]/70 transition-colors"
                    >
                      ✉️
                    </button>
                  </div>
                  <ThemeToggle />
                </div>
              </header>

              {/* main feed area */}
              <main className="flex-1 pb-20 pt-1 transition-colors duration-300">
                {/* tiny spacer so first post doesn’t visually attach to header */}
                <div className="h-1" />
                {children}
              </main>

              {/* IG-style bottom nav */}
              <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[480px] -translate-x-1/2 items-center justify-around border-t border-[var(--border-subtle)] bg-[var(--bg-soft)]/95 py-2 text-xs text-[var(--text-muted)] backdrop-blur-md transition-colors duration-300">
                <Link
                  href="/"
                  className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
                >
                  <span>🏠</span>
                  <span>Home</span>
                </Link>
                <Link
                  href="/upload"
                  className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
                >
                  <span>➕</span>
                  <span>Upload</span>
                </Link>
                <Link
                  href="/my-videos"
                  className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
                >
                  <span>👤</span>
                  <span>Profile</span>
                </Link>
              </nav>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
