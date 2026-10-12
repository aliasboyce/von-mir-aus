import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, GitBranch, Play, Wind, Compass, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FitFilterPanel } from '../../components/shared/FitFilterPanel';
import { FitSummary } from '../../components/shared/FitSummary';
import { useT } from '../../i18n';
import { useFitRows } from '../resources/FitResults';
import { resourcesRepo } from '../resources/resourcesRepo';
import { skillkettenRepo } from '../resources/skillkettenRepo';
import { chainSteps } from '../resources/chainFit';
import { countHiddenUnmarked, isFitFilterActive } from '../../content/fitCriteria';
import type { ArousalBand } from '../polyvagal/arousalBands';

export type ZugangIntent = 'regulate' | 'act' | null;

const SHOW_FIRST = 5;

/**
 * The fork after perceiving (Körper → Zustand → Gefühl): two doors, both
 * always open.
 *  1. Meinen Zustand ändern — regulate with skills and Skillketten that suit
 *     the current nervous-system state, narrowed by what is available right
 *     now (Zeit, Energie, Aufwand, Zugangskanäle — the shared filter).
 *  2. Mein Zustand passt — meet a need / move toward a value, which is the
 *     existing path on (Schutzstrategie → Fürsorge → Bedürfnis → Brücken).
 * The app only leans one way (inside the window → 2, outside → 1, or what
 * the person came for), it never decides.
 */
export function ZugangBranch({
  mode,
  band,
  intent,
  onChoose,
  onFinishRegulate,
  onFinish,
}: {
  mode: 'choose' | 'regulate';
  band: ArousalBand | null;
  intent: ZugangIntent;
  onChoose: (c: 'regulate' | 'need') => void;
  onFinishRegulate: () => void;
  onFinish: () => void;
}) {
  const t = useT();
  const b = t.zugang.branch;
  const rows = useFitRows();
  const [showAll, setShowAll] = useState(false);

  const leaning: 'regulate' | 'need' | null = intent === 'regulate' ? 'regulate' : intent === 'act' ? 'need' : band ? (band.inWindow ? 'need' : 'regulate') : null;
  const zoneLabel = band ? t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones].label : null;

  const zoneSkillIds = useMemo(() => {
    if (!band) return null;
    return new Set(resourcesRepo.getAll().filter((r) => r.skillDetails?.zoneIds?.includes(band.id)).map((r) => r.id));
  }, [band]);
  const chainIdsInZone = useMemo(() => {
    if (!zoneSkillIds) return null;
    return new Set(skillkettenRepo.getAll().filter((k) => chainSteps(k).some((s) => zoneSkillIds.has(s.skillId))).map((k) => k.id));
  }, [zoneSkillIds]);

  if (mode === 'choose') {
    const doors: { key: 'regulate' | 'need'; icon: typeof Wind; title: string; text: string }[] = [
      { key: 'regulate', icon: Wind, title: b.regulateTitle, text: b.regulateText },
      { key: 'need', icon: Compass, title: b.needTitle, text: b.needText },
    ];
    return (
      <div>
        <h2 className="text-[20px] mb-1.5">{b.title}</h2>
        {zoneLabel && <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{b.nowIn.replace('{zone}', zoneLabel)}</p>}
        <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mb-5">{b.intro}</p>
        <div className="flex flex-col gap-3">
          {doors.map((d) => (
            <button key={d.key} type="button" onClick={() => onChoose(d.key)} className="text-left">
              <Card className="flex gap-3 items-start" style={leaning === d.key ? { borderColor: 'var(--color-primary)', borderWidth: 1.5 } : undefined}>
                <d.icon size={20} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span className="block">
                  <span className="block text-[15px] text-[var(--color-text)]">{d.title}</span>
                  <span className="block text-[12.5px] text-[var(--color-text-muted)] leading-snug mt-0.5">{d.text}</span>
                  {leaning === d.key && <span className="inline-block mt-1.5 text-[11.5px] text-[var(--color-primary)]">{b.leaning}</span>}
                </span>
              </Card>
            </button>
          ))}
        </div>
        <button type="button" onClick={onFinish} className="w-full text-left mt-3">
          <Card className="flex gap-3 items-start">
            <Check size={20} className="text-[var(--color-text-faint)] flex-shrink-0 mt-0.5" />
            <span className="block">
              <span className="block text-[15px] text-[var(--color-text)]">{b.doneTitle}</span>
              <span className="block text-[12.5px] text-[var(--color-text-muted)] leading-snug mt-0.5">{b.doneText}</span>
            </span>
          </Card>
        </button>
        <p className="text-[11.5px] text-[var(--color-text-faint)] mt-4 leading-relaxed">{b.freeChoice}</p>
      </div>
    );
  }

  // mode === 'regulate'
  const skillRows = rows.skills.filter((r) => !zoneSkillIds || zoneSkillIds.has(r.id));
  const chainRows = rows.ketten.filter((r) => !chainIdsInZone || chainIdsInZone.has(r.id));
  const hidden = countHiddenUnmarked(
    [...rows.all.skills.filter((r) => !zoneSkillIds || zoneSkillIds.has(r.id)), ...rows.all.ketten.filter((r) => !chainIdsInZone || chainIdsInZone.has(r.id))].map((r) => r.subject),
    rows.filter,
  );
  const groups = [
    { key: 'ketten', title: t.fit.groupKetten, icon: GitBranch, rows: chainRows, start: (id: string) => `/entdecken/ressourcen/skillketten/${id}/start` },
    { key: 'skills', title: t.fit.groupSkills, icon: Sparkles, rows: skillRows, start: (id: string) => `/entdecken/ressourcen/skill-start/${id}` },
  ];
  const empty = groups.every((g) => g.rows.length === 0);

  return (
    <div>
      <h2 className="text-[20px] mb-1.5">{b.regulateTitle}</h2>
      <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mb-4">
        {zoneLabel ? b.regulateSuitsZone.replace('{zone}', zoneLabel) : b.regulateNoZone}
      </p>

      <FitFilterPanel hiddenUnmarked={hidden} />
      {!isFitFilterActive(rows.filter) && <p className="text-[11.5px] text-[var(--color-text-faint)] -mt-2 mb-4">{b.filterTip}</p>}

      {empty ? (
        <div className="rounded-[var(--radius-lg)] p-3.5 mb-4" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13.5px] text-[var(--color-text)] mb-1">{t.fit.noResults}</p>
          <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{t.fit.noResultsHint}</p>
          <Link to="/sicherheit" className="inline-block mt-2 text-[12.5px] text-[var(--color-primary)] underline underline-offset-2">{b.noneSafety}</Link>
        </div>
      ) : (
        groups
          .filter((g) => g.rows.length > 0)
          .map((g) => (
            <div key={g.key} className="mb-4">
              <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5 flex items-center gap-1.5">
                <g.icon size={12} /> {g.title} · {g.rows.length}
              </p>
              <div className="flex flex-col gap-1.5">
                {(showAll ? g.rows : g.rows.slice(0, SHOW_FIRST)).map((row) => (
                  <div key={row.id} className="flex items-stretch gap-1.5">
                    <Link to={row.to} className="flex-1 min-w-0 px-3 py-2.5 rounded-[var(--radius-md)] block" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <span className="block text-[14px] text-[var(--color-text)] mb-1">{row.title}</span>
                      <FitSummary subject={row.subject} />
                    </Link>
                    <Link to={g.start(row.id)} aria-label={`${row.title} – ${b.start}`} className="px-3 rounded-[var(--radius-md)] flex items-center justify-center" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                      <Play size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
      {!showAll && groups.some((g) => g.rows.length > SHOW_FIRST) && (
        <button type="button" onClick={() => setShowAll(true)} className="text-[12.5px] text-[var(--color-primary)] mb-4">
          {b.showAll}
        </button>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <Button fullWidth variant="secondary" size="sm" onClick={() => onChoose('need')}>
          {b.switchToNeed}
        </Button>
        <button type="button" onClick={onFinishRegulate} className="text-[13px] text-[var(--color-text-faint)] underline underline-offset-2">
          {b.finish}
        </button>
      </div>
    </div>
  );
}
