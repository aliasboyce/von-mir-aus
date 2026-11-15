import { ChevronLeft } from 'lucide-react';
import { SearchButton } from './SearchButton';
import { goBack } from '../../services/navigation';
import { useNavigate, useLocation } from 'react-router-dom';
import { FavStar } from '../ui/FavStar';
import { classifyPath } from '../../services/favorites';
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
  const loc = useLocation();
  const fav = classifyPath(loc.pathname);

  return (
    <div
      className={[
        'flex items-center justify-between px-5 pt-5 pb-3',
        transparent ? '' : 'bg-[var(--color-bg)]',
      ].join(' ')}
    >
      <button
        onClick={() => (onBack ? onBack() : goBack(navigate))}
        aria-label={t.common.back}
        className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
      >
        <ChevronLeft size={22} />
      </button>
      <div className="flex items-center gap-1">
        {action}
        {fav !== 'none' && fav !== 'native' && (
          <FavStar
            kind={fav.kind}
            id={fav.id}
            testId="topbar-fav"
            size={19}
            getExtra={() => {
              const h = document.querySelector('main h1, main h2');
              const txt = (h?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
              return { path: `${loc.pathname}${loc.search}`, title: txt || undefined };
            }}
          />
        )}
        <SearchButton />
      </div>
    </div>
  );
}
