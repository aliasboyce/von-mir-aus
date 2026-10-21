import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { GitBranch, Sparkles, Wrench, MapPin, Activity, BookMarked } from 'lucide-react';
import { useT } from '../../i18n';
import { useFitFilter } from '../../state/fitFilterStore';
import { FitSummary } from '../../components/shared/FitSummary';
import { ResourceTile, ChainTile } from '../../components/shared/ItemTile';
import { createCustomCategoryStore } from '../../services/customCategories';
import { filterByFit, isFitFilterActive, subjectOfResource, type FitSubject } from '../../content/fitCriteria';
import { skillkettenRepo } from './skillkettenRepo';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';
import { chainFitSubject } from './chainFit';
import { resourceFitsNeed, bookmarkFitsNeed } from '../../content/needResources';
import { bookmarksRepo, bookmarkCategoriesStore } from '../bookmarks/bookmarksRepo';
import type { NeedDirection, Resource } from '../../data/types';

const customCategoryStore = createCustomCategoryStore('resource-custom-categories');

const PREVIEW_COUNT = 6;

interface Row {
  id: string;
  title: string;
  to: string;
  subject: FitSubject;
  /** the resource behind the row (for need matching) */
  res?: Resource;
  /** a skill chain row */
  chain?: boolean;
}

/**
 * What fits right now, across all four kinds of things at once — shown on the
 * Ressourcen start page under the "Was geht gerade?" panel, grouped as
 * Skillketten, Skills, Hilfsmittel and Orte. Nothing is shown while no
 * criterion is set; the library pages behind the tiles stay as they are.
 */
export function useFitRows() {
  const { filter } = useFitFilter();
  return useMemo(() => {
    const resources = resourcesRepo.getAll();
    const byId = new Map(resources.map((r) => [r.id, r]));
    const customGroup = new Map(customCategoryStore.getAll().map((c) => [c.id, c.group]));
    const toRow = (r: (typeof resources)[number], type: 'skills' | 'hilfsmittel' | 'orte' | 'aktivitaeten'): Row => ({
      id: r.id,
      title: r.title,
      to: `/entdecken/ressourcen/${type}?open=${r.id}`,
      subject: subjectOfResource(r),
      res: r,
    });
    const skills: Row[] = [];
    const hilfsmittel: Row[] = [];
    const orte: Row[] = [];
    const aktivitaeten: Row[] = [];
    resources.forEach((r) => {
      const group = RESOURCE_CATEGORY_TO_GROUP[r.category] ?? customGroup.get(r.category);
      if (group === 'faehigkeiten') skills.push(toRow(r, 'skills'));
      else if (r.category === 'orte' || group === 'orte_gruppe') orte.push(toRow(r, 'orte'));
      else if (r.category === 'aktivitaeten' || group === 'aktivitaeten') aktivitaeten.push(toRow(r, 'aktivitaeten'));
      else hilfsmittel.push(toRow(r, 'hilfsmittel'));
    });
    const ketten: Row[] = skillkettenRepo.getAll().map((k) => ({
      id: k.id,
      title: k.title,
      to: `/entdecken/ressourcen/skillketten/${k.id}`,
      subject: chainFitSubject(k, byId),
      chain: true,
    }));
    const pick = (rows: Row[]) => filterByFit(rows, (r) => r.subject, filter);
    return { filter, ketten: pick(ketten), skills: pick(skills), hilfsmittel: pick(hilfsmittel), orte: pick(orte), aktivitaeten: pick(aktivitaeten), all: { ketten, skills, hilfsmittel, orte, aktivitaeten } };
  }, [filter]);
}

export function FitResults({ need }: { need?: NeedDirection | null }) {
  const t = useT();
  const f = t.fit;
  const r = useFitRows();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const active = isFitFilterActive(r.filter);
  if (!active && !need) return null;

  const byNeed = (rows: Row[]) => (need ? rows.filter((row) => !row.res || resourceFitsNeed(row.res, need)) : rows);
  // Sources carry no fit profile (time/effort/access), so they only show for a need.
  const categoryLabels = new Map(bookmarkCategoriesStore.getAll().map((c) => [c.id, c.label]));
  const quellen: Row[] = need
    ? bookmarksRepo
        .getAll()
        .filter((b) => bookmarkFitsNeed(b, need, categoryLabels.get(b.categoryId) ?? ''))
        .map((b) => ({ id: b.id, title: b.title, to: b.url, subject: {} as FitSubject }))
    : [];

  // Order asked for: 1 Skills, 2 Hilfsmittel, 3 Quellen — then places and activities.
  const groups = [
    { key: 'skills', title: f.groupSkills, icon: Sparkles, rows: byNeed(r.skills) },
    ...(need ? [] : [{ key: 'ketten', title: f.groupKetten, icon: GitBranch, rows: r.ketten }]),
    { key: 'hilfsmittel', title: f.groupHilfsmittel, icon: Wrench, rows: byNeed(r.hilfsmittel) },
    { key: 'quellen', title: f.groupQuellen, icon: BookMarked, rows: quellen },
    { key: 'orte', title: f.groupOrte, icon: MapPin, rows: byNeed(r.orte) },
    { key: 'aktivitaeten', title: f.groupAktivitaeten, icon: Activity, rows: byNeed(r.aktivitaeten) },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="mb-6">
      <h2 className="text-[16px] mb-2">{f.resultsTitle}</h2>
      {groups.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13.5px] text-[var(--color-text)] mb-1">{need && !active ? t.resources.needHubNothing : f.noResults}</p>
          <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{f.noResultsHint}</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} className="mb-3">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5 flex items-center gap-1.5">
              <g.icon size={12} /> {g.title} · {g.rows.length}
            </p>
            <div className="flex flex-col gap-1.5">
              {(expanded[g.key] || g.rows.length <= PREVIEW_COUNT ? g.rows : g.rows.slice(0, PREVIEW_COUNT)).map((row) => {
                const external = g.key === 'quellen';
                if (external) {
                  const isWeb = /^https?:\/\//i.test(row.to);
                  const tile = (
                    <div className="px-3 py-2.5 rounded-[var(--radius-md)] block" style={{ background: 'color-mix(in srgb, var(--color-surface) 90%, #9a7bc4 8%)', border: '1px solid #9a7bc455' }}>
                      <span className="block text-[10.5px] uppercase tracking-wide mb-0.5" style={{ color: '#9a7bc4' }}>🔖 {g.title}</span>
                      <span className="block text-[14px] text-[var(--color-text)]">{row.title}</span>
                    </div>
                  );
                  return isWeb ? (
                    <a key={row.id} href={row.to} target="_blank" rel="noopener noreferrer">{tile}</a>
                  ) : (
                    <Link key={row.id} to="/entdecken/lesezeichen">{tile}</Link>
                  );
                }
                const extra = <FitSummary subject={row.subject} />;
                return (
                  <Link key={row.id} to={row.to} className="block">
                    {row.res ? (
                      <ResourceTile resource={row.res} extra={extra} />
                    ) : (
                      <ChainTile chain={{ title: row.title }} extra={extra} />
                    )}
                  </Link>
                );
              })}
              {g.rows.length > PREVIEW_COUNT && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [g.key]: !e[g.key] }))}
                  className="text-[12.5px] text-[var(--color-primary)] text-left px-1 py-1"
                >
                  {expanded[g.key] ? t.fit.showLess : t.fit.showAll.replace('{n}', String(g.rows.length))}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
