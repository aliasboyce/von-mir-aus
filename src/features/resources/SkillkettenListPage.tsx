import { Link } from 'react-router-dom';
import { Plus, GitBranch } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { skillkettenRepo } from './skillkettenRepo';
import { resourcesRepo } from './resourcesRepo';
import { FitFilterPanel } from '../../components/shared/FitFilterPanel';
import { FitSummary } from '../../components/shared/FitSummary';
import { countHiddenUnmarked, filterByFit, isFitFilterActive } from '../../content/fitCriteria';
import { useFitFilter } from '../../state/fitFilterStore';
import { chainFitSubject } from './chainFit';

export function SkillkettenListPage() {
  const t = useT();
  const { filter } = useFitFilter();
  const all = skillkettenRepo.getAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const byId = new Map(resourcesRepo.getAll().map((r) => [r.id, r]));
  const subjectOf = (k: (typeof all)[number]) => chainFitSubject(k, byId);
  const ketten = filterByFit(all, subjectOf, filter);
  const hidden = countHiddenUnmarked(all.map(subjectOf), filter);

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="skillketten" />} />
      <div className="px-5 pb-10">
        <h1 className="text-[24px] mb-1">{t.resources.skillkettenListTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-1">{t.resources.skillkettenListSubtitle}</p>
        <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mb-5">{t.resources.skillkettenConcept}</p>

        <Link to="/entdecken/ressourcen/skillketten/neu">
          <Button fullWidth icon={<Plus size={17} />} className="mb-5">
            {t.resources.skillketteFormTitleNew}
          </Button>
        </Link>

        {all.length > 0 && <FitFilterPanel hiddenUnmarked={hidden} />}

        {ketten.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-faint)]">{isFitFilterActive(filter) && all.length > 0 ? `${t.fit.noResults} ${t.fit.noResultsHint}` : t.resources.skillkettenEmptyState}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {ketten.map((k) => (
              <Link
                key={k.id}
                to={`/entdecken/ressourcen/skillketten/${k.id}`}
                className="flex items-center gap-3 p-3.5 rounded-[var(--radius-lg)]"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <GitBranch size={18} className="text-[var(--color-primary)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[14px] text-[var(--color-text)]">{k.title}</p>
                  {k.subtitle && <p className="text-[12px] text-[var(--color-text-muted)] truncate">{k.subtitle}</p>}
                  <div className="mt-1"><FitSummary subject={subjectOf(k)} /></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
