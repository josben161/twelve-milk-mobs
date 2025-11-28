// apps/admin-web/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import { AdminThemeProvider } from '@/components/theme/AdminThemeProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Milk Mobs Admin',
  description: 'Brand & campaign control center for Milk Mobs',
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
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <AdminThemeProvider>
          <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <TopBar />
              <main className="flex-1">
                <div className="mx-auto max-w-6xl px-6 py-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </AdminThemeProvider>
      </body>
    </html>
  );
}
