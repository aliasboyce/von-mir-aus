import { Wrench, Sparkles, Bookmark } from 'lucide-react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { TopBar } from '../../components/navigation/TopBar';
import { ReorderableTiles } from '../../components/navigation/ReorderableTiles';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useT } from '../../i18n';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';

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
  const [searchParams] = useSearchParams();
  // "Links mit ?open= gingen seit dem Umbau ins Leere" — eight places in the
  // app (favorites, recently used, network, needs compass, safety plan, ...)
  // still link to /entdecken/ressourcen?open=<id>. This page is only the hub
  // now, so forward to the page that actually holds that item.
  const openId = searchParams.get('open');
  const opened = openId ? resourcesRepo.getById(openId) : undefined;
  if (opened) {
    const type = RESOURCE_CATEGORY_TO_GROUP[opened.category] === 'faehigkeiten' ? 'skills' : 'hilfsmittel';
    return <Navigate to={`/entdecken/ressourcen/${type}?open=${opened.id}`} replace />;
  }

  const tiles = [
    { key: 'hilfsmittel', to: '/entdecken/ressourcen/hilfsmittel', icon: Wrench, title: t.resources.hilfsmittelTitle, subtitle: t.resources.hilfsmittelSubtitle },
    { key: 'skills', to: '/entdecken/ressourcen/skills', icon: Sparkles, title: t.resources.skillsTitle, subtitle: t.resources.skillsSubtitle },
    { key: 'lesezeichen', to: '/entdecken/lesezeichen', icon: Bookmark, title: t.bookmarks.title, subtitle: t.bookmarks.subtitle },
  ];

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="ressourcen" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.resources.hubTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.resources.hubSubtitle}</p>

        <ReorderableTiles section="ressourcen-hub" tiles={tiles} />
      </div>
    </div>
  );
}
