import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: ReactNode;
}

export function Chip({ selected = false, icon, className = '', children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-full)] px-4 py-2 text-[14px] font-medium transition-colors duration-200',
        selected
          ? 'bg-[var(--color-primary)] text-[var(--color-surface)]'
          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
        className,
      ].join(' ')}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
