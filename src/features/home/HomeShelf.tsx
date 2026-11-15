import { Link } from 'react-router-dom';
import { CalendarDays, Inbox, Pill, Star } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Feinschliff „Schnellzugriff am Wesen“: vier leise Symbole (Kalender, Parkbox, Medi-Log, Favoriten),
 * wie kleine Kiesel, die rechts und links neben dem Wesen schweben. Nur Linien in Textfarbe, halbtransparent –
 * dadurch passt es zu jedem Design und jedem Begleiter. Abschaltbar in den Einstellungen (settings.homeShelf).
 * Entfernen = <HomeShelf /> aus der HomePage nehmen.
 */
interface Item { key: string; to: string; icon: ReactNode; de: string; en: string; side: 'l' | 'r'; row: 0 | 1 }
const ITEMS: Item[] = [
  { key: 'kalender', to: '/kalender', icon: <CalendarDays size={21} strokeWidth={1.6} />, de: 'Kalender', en: 'Calendar', side: 'l', row: 0 },
  { key: 'parkbox', to: '/parkbox', icon: <Inbox size={21} strokeWidth={1.6} />, de: 'Parkbox', en: 'Park box', side: 'l', row: 1 },
  { key: 'medi', to: '/entdecken/medi-log', icon: <Pill size={21} strokeWidth={1.6} />, de: 'Medi-Log', en: 'Medication log', side: 'r', row: 0 },
  { key: 'favoriten', to: '/favoriten', icon: <Star size={21} strokeWidth={1.6} />, de: 'Favoriten', en: 'Favourites', side: 'r', row: 1 },
];

export function HomeShelf({ isEn }: { isEn: boolean }) {
  return (
    <nav className="home-shelf" aria-label={isEn ? 'Quick access' : 'Schnellzugriff'} data-testid="home-shelf">
      {ITEMS.map((it, i) => (
        <Link
          key={it.key}
          to={it.to}
          aria-label={isEn ? it.en : it.de}
          title={isEn ? it.en : it.de}
          data-testid={`home-shelf-${it.key}`}
          className={`home-shelf__item home-shelf__item--${it.side}${it.row}`}
          style={{ animationDelay: `${i * 0.9}s` }}
        >
          {it.icon}
        </Link>
      ))}
    </nav>
  );
}
