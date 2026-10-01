import { Wrench, Sparkles, Bookmark } from 'lucide-react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { ReorderableTiles } from '../../components/navigation/ReorderableTiles';
import { useT } from '../../i18n';

/**
 * "Ressourcen-Unterteilung nochmal neu"-Auftrag — /entdecken/ressourcen
 * is now this hub instead of going straight to the resource list.
 * Three doorways: Hilfsmittel and Skills (both reuse ResourcesPage,
 * see its own doc comment for how the split works), and Gespeicherte
 * Quellen — the existing bookmarks feature, moved here from its own
 * standalone spot on the main Entdecken page rather than duplicated.
 * More sub-categories are coming later per the person's own plan;
 * this is deliberately just the three-doorway shell for now.
 */
export function ResourcesHubPage() {
  const t = useT();

  const tiles = [
    { key: 'hilfsmittel', to: '/entdecken/ressourcen/hilfsmittel', icon: Wrench, title: t.resources.hilfsmittelTitle, subtitle: t.resources.hilfsmittelSubtitle },
    { key: 'skills', to: '/entdecken/ressourcen/skills', icon: Sparkles, title: t.resources.skillsTitle, subtitle: t.resources.skillsSubtitle },
    { key: 'lesezeichen', to: '/entdecken/lesezeichen', icon: Bookmark, title: t.bookmarks.title, subtitle: t.bookmarks.subtitle },
  ];

  return (
    <div className="px-5 pt-8 pb-6 animate-in">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[24px]">{t.resources.hubTitle}</h1>
        <HelpButton helpKey="ressourcen" />
      </div>
      <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.resources.hubSubtitle}</p>

      <ReorderableTiles section="ressourcen-hub" tiles={tiles} />
    </div>
  );
}
