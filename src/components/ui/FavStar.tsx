import { Star } from 'lucide-react';
import { useIsFavorite, toggleFavorite, type FavKind } from '../../services/favorites';
import { useL } from '../../features/projects/useL';

interface Props {
  kind: FavKind;
  id: string;
  /** nur für Seiten: Titel + Adresse, wie sie auf der Favoritenseite stehen sollen */
  getExtra?: () => { path?: string; title?: string };
  size?: number;
  className?: string;
  testId?: string;
}

/** Der eine Stern für „Als Favorit markieren“ – überall gleich, 44 px Tippfläche, nie Pflicht. */
export function FavStar({ kind, id, getExtra, size = 20, className = '', testId = 'fav-star' }: Props) {
  const { L } = useL();
  const on = useIsFavorite(kind, id);
  const label = on ? L('Favorit entfernen', 'Remove favourite') : L('Als Favorit markieren', 'Mark as favourite');
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(kind, id, getExtra?.());
      }}
      className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[var(--color-surface-muted)] ${on ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-faint)]'} ${className}`}
    >
      <Star size={size} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}
