// apps/admin-web/app/layout.tsx
import type { Metadata } from 'next';
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
    <html lang="en">
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased">
        <div className="min-h-screen flex">
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
      </body>
    </html>
  );
}
