import { useState } from 'react';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { SearchButton } from '../../components/navigation/SearchButton';
import { HelpButton } from '../../components/navigation/HelpButton';
import { ADDON_GROUPS } from './exploreMapData';
import { ExtraGroups, EVERYDAY_GROUP_KEYS, EVERYDAY_COLOR_VALUE } from './ExploreMap';

const pinStore = createKeyValueStore<string[]>('alltag-pins', []);

/** „Alltag“ as its own place in the bottom menu: everything practical – appointments, medication, parking box, lists. The same entries also stay in Explore. */
export function AlltagPage() {
  const t = useT();
  const en = useSettings().settings.language === 'en';
  const groups = ADDON_GROUPS.filter((g) => EVERYDAY_GROUP_KEYS.includes(g.labelKey));
  const [pins, setPins] = useState<string[]>(() => { const v = pinStore.get(); return Array.isArray(v) ? v : []; });
  function togglePin(key: string) {
    const next = pins.includes(key) ? pins.filter((k) => k !== key) : [...pins, key];
    setPins(next);
    pinStore.set(next);
  }
  const allItems = groups.flatMap((g) => g.items);
  const pinned = pins.map((k) => allItems.find((i) => i.titleKey === k)).filter(Boolean) as typeof allItems;
  const rest = groups.map((g) => ({ ...g, items: g.items.filter((i) => !pins.includes(i.titleKey)) })).filter((g) => g.items.length > 0);
  const shownGroups = pinned.length > 0 ? [{ labelKey: '__pinned', items: pinned }, ...rest] : rest;
  const titles = { __pinned: en ? '📌 Pinned' : '📌 Angepinnt' };
  return (
    <div className="px-5 pt-8 pb-6 animate-in" data-testid="alltag-page">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-[24px]">{t.nav.everyday}</h1>
        <div className="flex items-center gap-1">
          <SearchButton />
          <HelpButton helpKey="entdecken" />
        </div>
      </div>
      <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed mb-5">
        {en ? 'The practical things in your day: appointments, medication, parking box, lists. All of this is also in Explore.' : 'Das Praktische im Tag: Termine, Medikamente, Parkbox, Listen. Alles hier findest du auch unter Entdecken.'}
      </p>
      <p className="text-[12.5px] text-[var(--color-text-faint)] mb-4">{en ? 'Tap the pin on a page to keep it at the top.' : 'Mit der Stecknadel an einer Seite hältst du sie oben fest.'}</p>
      <ExtraGroups groups={shownGroups} color={EVERYDAY_COLOR_VALUE} pins={pins} onTogglePin={togglePin} titles={titles} />
    </div>
  );
}
