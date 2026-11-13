import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { SearchButton } from '../../components/navigation/SearchButton';
import { HelpButton } from '../../components/navigation/HelpButton';
import { ADDON_GROUPS } from './exploreMapData';
import { ExtraGroups, EVERYDAY_GROUP_KEYS, EVERYDAY_COLOR_VALUE } from './ExploreMap';

/** „Alltag“ as its own place in the bottom menu: everything practical – appointments, medication, parking box, lists. The same entries also stay in Explore. */
export function AlltagPage() {
  const t = useT();
  const en = useSettings().settings.language === 'en';
  const groups = ADDON_GROUPS.filter((g) => EVERYDAY_GROUP_KEYS.includes(g.labelKey));
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
      <ExtraGroups groups={groups} color={EVERYDAY_COLOR_VALUE} />
    </div>
  );
}
