import { Wrench, Sparkles, Bookmark, MapPin, Activity, Users } from 'lucide-react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { TopBar } from '../../components/navigation/TopBar';
import { ReorderableTiles } from '../../components/navigation/ReorderableTiles';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { NEED_META, NEED_ORDER } from '../innerWeather/weatherMeta';
import type { NeedDirection } from '../../data/types';
import { useT } from '../../i18n';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';
import { FitFilterPanel } from '../../components/shared/FitFilterPanel';
import { FitResults, useFitRows } from './FitResults';
import { countHiddenUnmarked } from '../../content/fitCriteria';

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
  const fitRows = useFitRows();
  const hiddenUnmarked = [fitRows.all.ketten, fitRows.all.skills, fitRows.all.hilfsmittel, fitRows.all.orte, fitRows.all.aktivitaeten].reduce((n, rows) => n + countHiddenUnmarked(rows.map((r) => r.subject), fitRows.filter), 0);
  // "Links mit ?open= gingen seit dem Umbau ins Leere" — eight places in the
  // app (favorites, recently used, network, needs compass, safety plan, ...)
  // still link to /entdecken/ressourcen?open=<id>. This page is only the hub
  // now, so forward to the page that actually holds that item.
  const openId = searchParams.get('open');
  const opened = openId ? resourcesRepo.getById(openId) : undefined;
  if (opened) {
    const type =
      RESOURCE_CATEGORY_TO_GROUP[opened.category] === 'faehigkeiten'
        ? 'skills'
        : opened.category === 'orte'
          ? 'orte'
          : opened.category === 'aktivitaeten'
            ? 'aktivitaeten'
            : 'hilfsmittel';
    return <Navigate to={`/entdecken/ressourcen/${type}?open=${opened.id}`} replace />;
  }

  // Coming from the check-in's need step: ?need=<NeedDirection> — the page then shows what fits
  // that need (Skills, Hilfsmittel, Quellen …), narrowed further by "Was geht gerade?".
  const needParam = searchParams.get('need') as NeedDirection | null;
  const need = needParam && NEED_ORDER.includes(needParam) ? needParam : null;

  const tiles = [
    { key: 'skills', to: '/entdecken/ressourcen/skills', icon: Sparkles, title: t.resources.skillsTitle, subtitle: t.resources.skillsSubtitle },
    { key: 'hilfsmittel', to: '/entdecken/ressourcen/hilfsmittel', icon: Wrench, title: t.resources.hilfsmittelTitle, subtitle: t.resources.hilfsmittelSubtitle },
    { key: 'orte', to: '/entdecken/ressourcen/orte', icon: MapPin, title: t.resources.orteTitle, subtitle: t.resources.orteSubtitle },
    { key: 'aktivitaeten', to: '/entdecken/ressourcen/aktivitaeten', icon: Activity, title: t.resources.aktivitaetenTitle, subtitle: t.resources.aktivitaetenSubtitle },
    { key: 'personen', to: '/sicherheit/netzwerk', icon: Users, title: t.resources.personenTitle, subtitle: t.resources.personenSubtitle },
    { key: 'lesezeichen', to: '/entdecken/lesezeichen', icon: Bookmark, title: t.bookmarks.title, subtitle: t.bookmarks.subtitle },
  ];

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="ressourcen" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.resources.hubTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.resources.hubSubtitle}</p>

        {need && (
          <div className="rounded-[var(--radius-lg)] p-4 mb-4" style={{ background: 'var(--color-primary-soft)', border: '1.5px solid var(--color-primary)' }}>
            <p className="text-[13.5px] font-semibold text-[var(--color-text)] mb-1">
              {NEED_META[need].icon} {t.resources.needHubTitle.replace('{need}', NEED_META[need].label(t))}
            </p>
            <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.resources.needHubHint}</p>
            <Link to="/entdecken/ressourcen" replace className="text-[12.5px] text-[var(--color-primary)] underline underline-offset-2">
              {t.resources.needHubShowAll}
            </Link>
          </div>
        )}

        <FitFilterPanel hiddenUnmarked={hiddenUnmarked} />
        <FitResults need={need} />

        <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-4">{t.resources.hubDefinition}</p>

        <ReorderableTiles section="ressourcen-hub" tiles={tiles} />
      </div>
    </div>
  );
}
