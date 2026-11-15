import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  /** Feinschliff F8: eine ruhige Orientierungszeile (was als Nächstes erscheint / wie es anfängt) */
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12 px-6 text-[var(--color-text-muted)]">
      {icon && <div className="text-[var(--color-text-faint)]">{icon}</div>}
      <p className="text-[15px] max-w-[240px]">{title}</p>
      {hint && <p className="text-[13px] max-w-[260px] text-[var(--color-text-faint)] leading-relaxed -mt-1">{hint}</p>}
      {action}
    </div>
  );
}
