import { Link } from 'react-router-dom';
import { Gift, BookA, Layers } from 'lucide-react';
import { SearchButton } from '../../components/navigation/SearchButton';
import { HelpButton } from '../../components/navigation/HelpButton';
import { ExploreMap } from './ExploreMap';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';

/**
 * Entdecken: nur noch die Karte – alles, was es in der App gibt, an einem Ort.
 * Oben bewusst fast leer: Titel, Suche, Hilfe und zwei klare Türen
 * (Etwas erhalten, Wörterbuch), die jeweils eine eigene Seite haben.
 */
export function ExplorePage() {
  const t = useT();
  const lang = useSettings().settings.language === 'en' ? 'en' : 'de';
  const en = lang === 'en';
  const doors = [
    { to: '/erhalten', icon: Gift, label: en ? 'Received something' : 'Etwas erhalten', testid: 'explore-erhalten-link' },
    { to: '/entdecken/glossar', icon: BookA, label: en ? 'Dictionary' : 'Wörterbuch', testid: 'explore-glossar-link' },
    { to: '/sammelalbum', icon: Layers, label: en ? 'Collection album' : 'Sammelalbum', testid: 'explore-album-link' },
  ];
  return (
    <div className="px-5 pt-8 pb-6 animate-in">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-[24px]">{t.nav.explore}</h1>
        <div className="flex items-center gap-1">
          <SearchButton />
          <HelpButton helpKey="entdecken" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {doors.map((d) => (
          <Link
            key={d.to}
            to={d.to}
            data-testid={d.testid}
            className="flex flex-col items-center gap-1.5 text-center rounded-[var(--radius-lg)] px-2 py-3 text-[13px] leading-tight text-[var(--color-text)]"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
              <d.icon size={18} />
            </span>
            {d.label}
          </Link>
        ))}
      </div>
      <ExploreMap />
    </div>
  );
}
