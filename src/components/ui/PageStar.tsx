import { useLocation } from 'react-router-dom';
import { FavStar } from './FavStar';
import { classifyPath } from '../../services/favorites';

/** Stern „Als Favorit markieren“ für Seiten ohne eigene Kopfleiste (Hub-Seiten): merkt die aktuelle Seite. */
export function PageStar({ className = '' }: { className?: string }) {
  const loc = useLocation();
  const fav = classifyPath(loc.pathname);
  if (fav === 'none' || fav === 'native') return null;
  return (
    <FavStar
      kind={fav.kind}
      id={fav.id}
      testId="page-fav"
      size={19}
      className={className}
      getExtra={() => {
        const h = document.querySelector('main h1, main h2');
        const txt = (h?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
        return { path: `${loc.pathname}${loc.search}`, title: txt || undefined };
      }}
    />
  );
}
