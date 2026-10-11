import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { GitBranch, Sparkles, Wrench, MapPin } from 'lucide-react';
import { useT } from '../../i18n';
import { useFitFilter } from '../../state/fitFilterStore';
import { FitSummary } from '../../components/shared/FitSummary';
import { createCustomCategoryStore } from '../../services/customCategories';
import { filterByFit, isFitFilterActive, subjectOfResource, type FitSubject } from '../../content/fitCriteria';
import { skillkettenRepo } from './skillkettenRepo';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';
import { chainFitSubject } from './chainFit';

const customCategoryStore = createCustomCategoryStore('resource-custom-categories');

interface Row {
  id: string;
  title: string;
  to: string;
  subject: FitSubject;
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
    const toRow = (r: (typeof resources)[number], type: 'skills' | 'hilfsmittel'): Row => ({
      id: r.id,
      title: r.title,
      to: `/entdecken/ressourcen/${type}?open=${r.id}`,
      subject: subjectOfResource(r),
    });
    const skills: Row[] = [];
    const hilfsmittel: Row[] = [];
    const orte: Row[] = [];
    resources.forEach((r) => {
      const group = RESOURCE_CATEGORY_TO_GROUP[r.category] ?? customGroup.get(r.category);
      if (group === 'faehigkeiten') skills.push(toRow(r, 'skills'));
      else if (r.category === 'orte') orte.push(toRow(r, 'hilfsmittel'));
      else hilfsmittel.push(toRow(r, 'hilfsmittel'));
    });
    const ketten: Row[] = skillkettenRepo.getAll().map((k) => ({
      id: k.id,
      title: k.title,
      to: `/entdecken/ressourcen/skillketten/${k.id}`,
      subject: chainFitSubject(k, byId),
    }));
    const pick = (rows: Row[]) => filterByFit(rows, (r) => r.subject, filter);
    return { filter, ketten: pick(ketten), skills: pick(skills), hilfsmittel: pick(hilfsmittel), orte: pick(orte), all: { ketten, skills, hilfsmittel, orte } };
  }, [filter]);
}

export function FitResults() {
  const t = useT();
  const f = t.fit;
  const r = useFitRows();
  if (!isFitFilterActive(r.filter)) return null;

  const groups = [
    { key: 'ketten', title: f.groupKetten, icon: GitBranch, rows: r.ketten },
    { key: 'skills', title: f.groupSkills, icon: Sparkles, rows: r.skills },
    { key: 'hilfsmittel', title: f.groupHilfsmittel, icon: Wrench, rows: r.hilfsmittel },
    { key: 'orte', title: f.groupOrte, icon: MapPin, rows: r.orte },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="mb-6">
      <h2 className="text-[16px] mb-2">{f.resultsTitle}</h2>
      {groups.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13.5px] text-[var(--color-text)] mb-1">{f.noResults}</p>
          <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{f.noResultsHint}</p>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} className="mb-3">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5 flex items-center gap-1.5">
              <g.icon size={12} /> {g.title} · {g.rows.length}
            </p>
            <div className="flex flex-col gap-1.5">
              {g.rows.map((row) => (
                <Link key={row.id} to={row.to} className="px-3 py-2.5 rounded-[var(--radius-md)] block" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <span className="block text-[14px] text-[var(--color-text)] mb-1">{row.title}</span>
                  <FitSummary subject={row.subject} />
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
