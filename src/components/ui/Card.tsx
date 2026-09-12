import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
  padding?: 'md' | 'lg' | 'none';
}

export function Card({
  children,
  interactive = false,
  padding = 'md',
  className = '',
  ...rest
}: CardProps) {
  const paddingClass = padding === 'none' ? '' : padding === 'lg' ? 'p-6' : 'p-4';
  return (
    <div
      className={[
        'card',
        'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]',
        'shadow-[var(--shadow-sm)]',
        paddingClass,
        interactive
          ? 'cursor-pointer transition-transform duration-200 hover:shadow-[var(--shadow-md)] active:scale-[0.99]'
          : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
