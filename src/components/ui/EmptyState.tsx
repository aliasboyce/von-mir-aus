import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12 px-6 text-[var(--color-text-muted)]">
      {icon && <div className="text-[var(--color-text-faint)]">{icon}</div>}
      <p className="text-[15px] max-w-[240px]">{title}</p>
      {action}
    </div>
  );
}
