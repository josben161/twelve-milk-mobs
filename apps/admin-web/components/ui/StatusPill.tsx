// apps/admin-web/components/ui/StatusPill.tsx

type Status = 'validated' | 'processing' | 'rejected';

interface StatusPillProps {
  status: Status;
}

export function StatusPill({ status }: StatusPillProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold';
  
  const statusStyles: Record<Status, string> = {
    validated: `${baseClasses} bg-green-500/10 text-green-400 border border-green-500/20`,
    processing: `${baseClasses} bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`,
    rejected: `${baseClasses} bg-red-500/10 text-red-400 border border-red-500/20`,
  };

  const statusLabels: Record<Status, string> = {
    validated: 'Validated',
    processing: 'Processing',
    rejected: 'Rejected',
  };

  return (
    <span className={statusStyles[status]}>
      {statusLabels[status]}
    </span>
  );
}

