// apps/admin-web/components/ui/StatCard.tsx

interface StatCardProps {
  label: string;
  value: string | number;
  caption?: string;
}

export function StatCard({ label, value, caption }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[20px] font-semibold text-[var(--text)]">
        {value}
      </p>
      {caption && (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          {caption}
        </p>
      )}
    </div>
  );
}

