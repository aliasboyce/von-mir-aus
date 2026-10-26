import { Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';

/** Die Lupe: öffnet die Suche über die ganze App (auch mit Strg/⌘ + K). Auf der Suchseite selbst unsichtbar. */
export function SearchButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const t = useT();
  if (useLocation().pathname === '/suche') return null;
  return (
    <button
      type="button"
      onClick={() => navigate('/suche')}
      aria-label={t.common.search}
      data-testid="search-btn"
      className={
        className ??
        'w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-faint)] hover:bg-[var(--color-surface-muted)] transition-colors'
      }
    >
      <Search size={19} />
    </button>
  );
}
