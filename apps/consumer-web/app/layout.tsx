// apps/consumer-web/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

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
    <html lang="en">
      <body className="bg-[#020617] text-slate-50">
        <div className="min-h-screen flex justify-center">
          <div className="flex w-full max-w-[480px] flex-col border-x border-slate-900 bg-[#020617]">
            {/* Top bar */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold">
                  MM
                </div>
                <span className="font-semibold text-sm">Milk Mobs</span>
              </div>
              <div className="flex items-center gap-4 text-slate-300 text-xl">
                {/* dummy icons with text for now */}
                <span>🔔</span>
                <span>✉️</span>
              </div>
            </header>

            <main className="flex-1 pb-16">{children}</main>

            {/* Bottom nav */}
            <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[480px] -translate-x-1/2 items-center justify-around border-t border-slate-900 bg-[#020617]/95 py-2 text-xs text-slate-400">
              <Link href="/" className="flex flex-col items-center gap-0.5">
                <span>🏠</span>
                <span>Home</span>
              </Link>
              <Link href="/upload" className="flex flex-col items-center gap-0.5">
                <span>➕</span>
                <span>Upload</span>
              </Link>
              <Link href="/my-videos" className="flex flex-col items-center gap-0.5">
                <span>👤</span>
                <span>Profile</span>
              </Link>
            </nav>
          </div>
        </div>
      </body>
    </html>
  );
}
