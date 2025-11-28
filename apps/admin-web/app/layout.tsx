// apps/admin-web/app/layout.tsx
import type { Metadata } from 'next';
import { SidebarNav } from '@/components/layout/SidebarNav';
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
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <div className="flex min-h-screen">
          {/* Left Sidebar */}
          <aside className="hidden sm:flex w-[248px] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg)]">
            {/* Logo Section - 48px tall */}
            <div className="h-12 flex items-center gap-2.5 px-4 border-b border-[var(--border-subtle)]">
              <div className="h-7 w-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                MM
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-[var(--text)] leading-tight truncate">Milk Mobs</span>
                <span className="text-[10px] text-[var(--text-muted)] leading-tight truncate">
                  Campaign Manager
                </span>
              </div>
            </div>

            {/* Navigation */}
            <SidebarNav />

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--border-subtle)] mt-auto">
              <p className="text-[10px] text-[var(--text-soft)] leading-relaxed">
                Powered by <span className="font-medium text-[var(--text-muted)]">TwelveLabs</span>
              </p>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* Top App Bar - 48px tall */}
            <header className="h-12 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg)] px-6">
              <div className="sm:hidden flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white">
                  MM
                </div>
                <span className="text-sm font-semibold text-[var(--text)]">Milk Mobs</span>
              </div>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--text)]">Got Milk</span>
                  <span className="text-[var(--text-soft)]">·</span>
                  <span>Gen Z Campaign</span>
                </div>
                <div className="h-4 w-px bg-[var(--border-subtle)]" />
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-semibold text-white">
                    JB
                  </div>
                  <span className="hidden sm:inline text-[var(--text-muted)]">joseph@milkco.com</span>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 bg-[var(--bg)] overflow-y-auto">
              <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
