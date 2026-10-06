import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TopBar } from '../../components/navigation/TopBar';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { resourcesRepo } from './resourcesRepo';
import { skillkettenRepo } from './skillkettenRepo';
import { skillUsesRepo, skillOutcome } from './skillUsesRepo';
import { NervousSystemLadderSlider } from '../polyvagal/NervousSystemLadderSlider';
import { AROUSAL_BANDS, bandForValue, polyvagalZoneForValue } from '../polyvagal/arousalBands';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { tensionRepo } from '../polyvagal/tensionRepo';
import type { SkillUse } from '../../data/types';

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ZONE_VALUE: Record<string, number> = { zone1: 22, zone2: 35, zone3: 50, zone4: 65, zone5: 82, zone6: 7 };

function recentTension(): number | null {
  const since = Date.now() - 3 * 3600 * 1000;
  const latest = polyvagalRepo
    .getAll()
    .filter((c) => c.tensionValue != null && new Date(c.createdAt).getTime() >= since)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return latest?.tensionValue ?? null;
}

/**
 * "Bei der Skillkette muss es genauso wie bei einzelnen Skills
 * 'Skillkette starten' geben — der Aufbau ist anders, weil mehrere Skills
 * aneinandergereiht sind, das soll deutlich sichtbar nacheinander
 * dargestellt werden. Fuer Rueckblick und Kurve uebernehmen, wenn sich der
 * Zustand danach veraendert hat, genauso wie bei Skills."
 *
 * The chain's skills (up to two per stage, three stages) become one
 * ordered list of steps, drawn as a vertical chain: finished steps are
 * ticked, the current one is open with its instructions, the next ones
 * wait greyed out. Between steps there is an optional quick "where is your
 * tension now?" slider — a changed value is saved as a check-in labelled
 * with the skill just done, so the curve shows the chain step by step.
 * Ending (at any time) opens the same reflection as a single skill, and
 * the run is saved as a SkillUse of kind 'chain' (so reviews, the day
 * curve and the "swung back" count pick it up with no extra wiring).
 */
export function SkillketteRunPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const kette = id ? skillkettenRepo.getById(id) : undefined;

  const steps = useMemo(() => {
    if (!kette) return [];
    const stages = [
      { stage: kette.stufeHoch, color: '#c9522f', title: t.resources.skillketteStufeHochTitle, range: '70–100 %', labels: [t.resources.skillketteAktionKoerperchemie, t.resources.skillketteAktionMotorik] },
      { stage: kette.stufeMittel, color: '#e8a83d', title: t.resources.skillketteStufeMittelTitle, range: '40–70 %', labels: [t.resources.skillketteAktionSensorik, t.resources.skillketteAktionKognitiv] },
      { stage: kette.stufeNiedrig, color: '#6fbf73', title: t.resources.skillketteStufeNiedrigTitle, range: '0–40 %', labels: [t.resources.skillketteAktionKomfort, t.resources.skillketteAktionAchtsamkeit] },
    ];
    const out: { skillId: string; title: string; schritte: string[]; description?: string; stageTitle: string; stageRange: string; ziel?: string; dauer?: string; color: string; actionLabel: string }[] = [];
    stages.forEach((s) => {
      [s.stage.aktion1SkillId, s.stage.aktion2SkillId].forEach((sid, idx) => {
        const skill = sid ? resourcesRepo.getById(sid) : undefined;
        if (skill) out.push({ skillId: skill.id, title: skill.title, schritte: skill.skillDetails?.schritte ?? [], description: skill.description, stageTitle: s.title, stageRange: s.range, ziel: s.stage.ziel, dauer: s.stage.dauer, color: s.color, actionLabel: s.labels[idx] });
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kette?.id]);

  const [phase, setPhase] = useState<'run' | 'reflect' | 'done'>('run');
  const [startedAt] = useState(() => new Date());
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [current, setCurrent] = useState(0);
  const [doneIdx, setDoneIdx] = useState<number[]>([]);
  const [before, setBefore] = useState<number | null>(() => recentTension());
  const [mid, setMid] = useState<number | null>(null);
  const [after, setAfter] = useState(50);
  const [helped, setHelped] = useState<SkillUse['helped']>();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState<SkillUse | null>(null);

  useEffect(() => {
    if (phase !== 'run') return;
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, [phase]);

  const elapsed = Math.max(0, Math.floor(((endedAt?.getTime() ?? now) - startedAt.getTime()) / 1000));
  const chainLabel = kette ? `${t.skillRun.chainPrefix}: ${kette.title}` : '';

  const outcomeText = useMemo(() => {
    if (!saved) return '';
    const r = t.skillRun;
    const kind = skillOutcome(saved);
    const fill = (s: string) => s.replace('{before}', String(saved.tensionBefore ?? '')).replace('{after}', String(saved.tensionAfter ?? ''));
    return kind === 'moved-toward' ? fill(r.outcomeToward) : kind === 'same' ? fill(r.outcomeSame) : kind === 'moved-away' ? fill(r.outcomeAway) : r.outcomeUnknown;
  }, [saved, t]);

  if (!kette) {
    return (
      <div className="animate-in">
        <TopBar />
        <div className="px-5 text-[14px] text-[var(--color-text-muted)]">{t.resources.skillkettenEmptyState}</div>
      </div>
    );
  }
  const k = kette;

  /** Saves the optional mid-chain value as a real check-in, labelled with the skill just finished. */
  function saveMid(skillTitle: string) {
    if (mid == null) return;
    const iso = new Date().toISOString();
    polyvagalRepo.save({ id: createId('pv'), createdAt: iso, zone: polyvagalZoneForValue(mid), tensionValue: mid, afterSkillTitle: skillTitle });
    tensionRepo.save({ id: createId('tension'), createdAt: iso, value: mid });
  }

  function completeStep() {
    const s = steps[current];
    if (!s) return;
    saveMid(s.title);
    setDoneIdx((d) => (d.includes(current) ? d : [...d, current]));
    setMid(null);
    if (current < steps.length - 1) setCurrent(current + 1);
    else finishRun();
  }

  function finishRun() {
    setEndedAt(new Date());
    setAfter(mid ?? before ?? 50);
    setPhase('reflect');
  }

  function save() {
    const end = endedAt ?? new Date();
    const use: SkillUse = {
      id: createId('skuse'),
      skillId: `chain:${k.id}`,
      skillTitle: chainLabel,
      kind: 'chain',
      chainSteps: doneIdx.sort((a, b) => a - b).map((i) => steps[i].title),
      startedAt: startedAt.toISOString(),
      endedAt: end.toISOString(),
      durationSec: Math.round((end.getTime() - startedAt.getTime()) / 1000),
      tensionBefore: before ?? undefined,
      tensionAfter: after,
      helped,
      note: note.trim() || undefined,
    };
    skillUsesRepo.save(use);
    const iso = end.toISOString();
    polyvagalRepo.save({ id: createId('pv'), createdAt: iso, zone: polyvagalZoneForValue(after), tensionValue: after, afterSkillTitle: chainLabel });
    tensionRepo.save({ id: createId('tension'), createdAt: iso, value: after });
    setSaved(use);
    setPhase('done');
  }

  const zoneChips = (
    <div className="flex flex-wrap gap-1.5">
      {AROUSAL_BANDS.map((b) => (
        <button key={b.id} onClick={() => setBefore(ZONE_VALUE[b.id])} className="rounded-full px-3 py-1 text-[12px] border" style={{ borderColor: b.color, color: b.color }}>
          {t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones].label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-12">
        <p className="text-[12px] uppercase tracking-wide mb-1 text-[var(--color-primary)]">{t.skillRun.chainStartCta}</p>
        <h1 className="text-[24px] mb-1">{k.title}</h1>
        {k.subtitle && <p className="text-[14px] text-[var(--color-text-muted)] italic mb-3">{k.subtitle}</p>}

        {phase === 'run' && (
          <>
            <div className="rounded-[var(--radius-xl)] py-5 my-4 text-center" style={{ background: 'var(--color-surface-muted)' }}>
              <p className="text-[44px] font-light tabular-nums leading-none text-[var(--color-primary)]">{formatTime(elapsed)}</p>
              <p className="text-[12.5px] text-[var(--color-text-muted)] mt-2.5 px-6 leading-relaxed">{t.skillRun.chainHint}</p>
            </div>

            {steps.length === 0 ? (
              <p className="text-[14px] text-[var(--color-text-muted)] mb-5">{t.skillRun.chainNoSkills}</p>
            ) : (
              <ol className="relative mb-6">
                {steps.map((s, i) => {
                  const isDone = doneIdx.includes(i);
                  const isCurrent = i === current && !isDone;
                  const newStage = i === 0 || steps[i - 1].stageTitle !== s.stageTitle;
                  return (
                    <li key={i}>
                      {newStage && (
                        <p className="text-[12px] font-semibold mt-5 mb-2 flex items-center gap-1.5" style={{ color: s.color }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                          {s.stageTitle} · {s.stageRange}
                        </p>
                      )}
                      <div className="flex gap-3">
                        {/* the chain: a numbered node with a line down to the next one */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold"
                            style={isDone ? { background: s.color, color: '#fff' } : isCurrent ? { background: 'var(--color-surface)', border: `2.5px solid ${s.color}`, color: s.color } : { background: 'var(--color-surface-muted)', color: 'var(--color-text-faint)' }}
                          >
                            {isDone ? <Check size={16} /> : i + 1}
                          </span>
                          {i < steps.length - 1 && <span className="w-[3px] flex-1 min-h-[18px] my-1 rounded-full" style={{ background: isDone ? s.color : 'var(--color-border)' }} />}
                        </div>
                        <div className="flex-1 pb-4" style={{ opacity: isDone ? 0.6 : isCurrent ? 1 : 0.55 }}>
                          <p className="text-[11px] text-[var(--color-text-faint)]">{s.actionLabel}</p>
                          <p className="text-[15.5px] font-medium text-[var(--color-text)]">{s.title}</p>
                          {isCurrent && (
                            <div className="mt-2 animate-in">
                              {s.ziel && <p className="text-[13px] italic text-[var(--color-text-muted)] mb-2">{s.ziel}</p>}
                              {s.schritte.length > 0 ? (
                                <ol className="flex flex-col gap-1.5 mb-3">
                                  {s.schritte.map((st, si) => (
                                    <li key={si} className="text-[14px] text-[var(--color-text)] leading-snug flex gap-2">
                                      <span className="text-[var(--color-text-faint)] tabular-nums">{si + 1}.</span>
                                      <span>{st}</span>
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                s.description && <p className="text-[13.5px] text-[var(--color-text)] leading-relaxed mb-3 whitespace-pre-line">{s.description}</p>
                              )}
                              {s.dauer && <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.resources.skillketteDauerLabel}: {s.dauer}</p>}
                              <div className="rounded-[var(--radius-md)] p-3 mb-3" style={{ background: 'var(--color-surface-muted)' }}>
                                <p className="text-[12px] text-[var(--color-text-muted)] mb-2">{t.skillRun.chainMidCheck}</p>
                                <input type="range" min={0} max={100} value={mid ?? before ?? 50} onChange={(e) => setMid(Number(e.target.value))} className="w-full" aria-label={t.skillRun.chainMidCheck} />
                                {mid != null && (
                                  <p className="text-[12.5px] mt-1" style={{ color: bandForValue(mid).color }}>
                                    {mid} % · {t.polyvagal.arousalZones[bandForValue(mid).labelKey as keyof typeof t.polyvagal.arousalZones].label}
                                  </p>
                                )}
                              </div>
                              <Button fullWidth onClick={completeStep}>
                                {i === steps.length - 1 ? t.skillRun.chainLast : t.skillRun.chainNext}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {before == null && (
              <div className="mb-5">
                <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2">{t.skillRun.before}</p>
                {zoneChips}
              </div>
            )}
            {before != null && (
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-5">
                {t.skillRun.beforeKnown}: <span style={{ color: bandForValue(before).color }}>{before} %</span>{' '}
                <button className="underline underline-offset-2 ml-1" onClick={() => setBefore(null)}>✎</button>
              </p>
            )}

            <Button fullWidth variant="secondary" data-sound="complete" onClick={finishRun}>
              {t.skillRun.chainEnd}
            </Button>
            <button onClick={() => navigate(-1)} className="w-full text-center text-[13px] text-[var(--color-text-faint)] mt-3 py-2">
              {t.skillRun.cancel}
            </button>
          </>
        )}

        {phase === 'reflect' && (
          <div className="mt-3">
            <h2 className="text-[18px] mb-1">{t.skillRun.reflectTitle}</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-2">
              {t.skillRun.reflectIntro} · {t.skillRun.duration.replace('{min}', String(Math.max(1, Math.round(elapsed / 60))))}
            </p>
            {doneIdx.length > 0 && (
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-5">
                {t.skillRun.chainStepsDone}: {[...doneIdx].sort((a, b) => a - b).map((i) => steps[i].title).join(' → ')}
              </p>
            )}
            <p className="text-[14px] font-medium text-[var(--color-text)] mb-2">{t.skillRun.qNow}</p>
            <NervousSystemLadderSlider onSelect={() => undefined} value={after} onValueChange={setAfter} hideSupportLinks />
            {before == null && (
              <div className="mt-6">
                <p className="text-[14px] font-medium text-[var(--color-text)] mb-2">{t.skillRun.qBefore}</p>
                {zoneChips}
              </div>
            )}
            <div className="mt-6">
              <p className="text-[14px] font-medium text-[var(--color-text)] mb-2">{t.skillRun.qHelped}</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['ja', t.skillRun.helpedYes],
                    ['etwas', t.skillRun.helpedSome],
                    ['nein', t.skillRun.helpedNo],
                    ['unsicher', t.skillRun.helpedUnsure],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setHelped(helped === key ? undefined : key)}
                    className="rounded-full px-4 py-2 text-[13px] border"
                    style={helped === key ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-surface)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-[14px] font-medium text-[var(--color-text)] mb-2">{t.skillRun.qNote}</p>
              <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button fullWidth className="mt-6" onClick={save}>
              {t.skillRun.save}
            </Button>
          </div>
        )}

        {phase === 'done' && saved && (
          <div className="mt-4 rounded-[var(--radius-xl)] p-5" style={{ background: 'var(--color-primary-soft)' }}>
            <p className="text-[16px] font-medium text-[var(--color-text)] mb-2">{t.skillRun.doneTitle}</p>
            <p className="text-[14px] text-[var(--color-text)] leading-relaxed mb-1">{outcomeText}</p>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-5">{t.skillRun.duration.replace('{min}', String(Math.max(1, Math.round(saved.durationSec / 60))))}</p>
            <div className="flex flex-col gap-2">
              <Link to="/entdecken/ressourcen/skillketten">
                <Button fullWidth variant="secondary">{t.skillRun.backToSkills}</Button>
              </Link>
              <Link to="/wochenrueckblick">
                <Button fullWidth variant="ghost">{t.skillRun.toReview}</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
