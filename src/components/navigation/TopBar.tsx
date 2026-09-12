import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useT } from '../../i18n';

interface TopBarProps {
  onBack?: () => void;
  action?: ReactNode;
  transparent?: boolean;
}

export function TopBar({ onBack, action, transparent = false }: TopBarProps) {
  const navigate = useNavigate();
  const t = useT();

  return (
    <div
      className={[
        'flex items-center justify-between px-5 pt-5 pb-3',
        transparent ? '' : 'bg-[var(--color-bg)]',
      ].join(' ')}
    >
      <button
        onClick={() => (onBack ? onBack() : navigate(-1))}
        aria-label={t.common.back}
        className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
      >
        <ChevronLeft size={22} />
      </button>
      <div>{action}</div>
    </div>
  );
}
