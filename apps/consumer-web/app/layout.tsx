// apps/consumer-web/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { UserProvider } from '@/components/auth/UserProvider';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'Barn Social Platform',
  description: 'Social Platform feed powered by TwelveLabs',
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
          <UserProvider>
            <Header />

            {/* Spacer to push content below fixed header */}
            <div className="h-11" />

            <div className="min-h-screen flex justify-center transition-colors duration-300 pb-14">
              <div className="flex w-full max-w-[480px] flex-col bg-[var(--bg)] transition-colors duration-300">
                <main className="flex-1 transition-colors duration-300">
                  {children}
                </main>
              </div>
            </div>

            <BottomNav />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
