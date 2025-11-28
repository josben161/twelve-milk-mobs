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
      <body className="transition-colors duration-300" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <ThemeProvider>
          <div className="min-h-screen flex justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--bg)' }}>
            <div
              className="flex w-full max-w-[480px] flex-col border-x transition-colors duration-300"
              style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg)' }}
            >
              {/* Top bar */}
              <header
                className="flex items-center justify-between px-4 py-3 border-b transition-colors duration-300"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold text-white">
                    MM
                  </div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    Milk Mobs
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-4 text-xl">
                    {/* dummy icons with text for now */}
                    <span style={{ color: 'var(--text-muted)' }}>🔔</span>
                    <span style={{ color: 'var(--text-muted)' }}>✉️</span>
                  </div>
                  <ThemeToggle />
                </div>
              </header>

              <main className="flex-1 pb-16 transition-colors duration-300">{children}</main>

              {/* Bottom nav */}
              <nav
                className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[480px] -translate-x-1/2 items-center justify-around border-t py-2 text-xs backdrop-blur-sm transition-colors duration-300"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-soft)',
                  color: 'var(--text-muted)',
                }}
              >
                <Link href="/" className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
                  <span>🏠</span>
                  <span>Home</span>
                </Link>
                <Link href="/upload" className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
                  <span>➕</span>
                  <span>Upload</span>
                </Link>
                <Link href="/my-videos" className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
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
