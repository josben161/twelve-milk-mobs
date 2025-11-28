// apps/admin-web/app/mobs/[mobId]/page.tsx
// Placeholder for mob detail page - to be implemented

export default function MobDetailPage({
  params,
}: {
  params: { mobId: string };
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Mob Detail</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Mob ID: {params.mobId}
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-6">
        <p className="text-sm text-[var(--text-muted)]">
          Mob detail page coming soon...
        </p>
      </div>
    </div>
  );
}

