import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Milk Mobs Demo',
  description: 'TwelveLabs-powered video campaign prototype',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-8 pt-4">
          <header className="mb-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold">
                MM
              </div>
              <span className="text-sm font-semibold tracking-wide">
                Milk Mobs
              </span>
            </Link>
            <nav className="flex items-center gap-3 text-sm text-slate-300">
              <Link href="/" className="hover:text-indigo-400">
                Home
              </Link>
              <Link href="/upload" className="hover:text-indigo-400">
                Upload
              </Link>
              <Link href="/my-videos" className="hover:text-indigo-400">
                My videos
              </Link>
            </nav>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">
            Milk Mobs · TwelveLabs demo · {new Date().getFullYear()}
          </footer>
        </div>
      </body>
    </html>
  );
}
