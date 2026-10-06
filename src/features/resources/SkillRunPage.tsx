import { useEffect, useMemo, useRef, useState } from 'react';
import { goBack } from '../../services/navigation';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { TopBar } from '../../components/navigation/TopBar';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { resourcesRepo } from './resourcesRepo';
import { skillUsesRepo, skillOutcome } from './skillUsesRepo';
import { NervousSystemLadderSlider } from '../polyvagal/NervousSystemLadderSlider';
import { AROUSAL_BANDS, bandForValue, polyvagalZoneForValue } from '../polyvagal/arousalBands';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { tensionRepo } from '../polyvagal/tensionRepo';
import { SKILL_CATEGORY_ZONE_COLOR } from './resourceMeta';
import type { SkillUse } from '../../data/types';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** A representative value for each zone, used when the person only
 * names the zone they were in before (not an exact percentage). */
const ZONE_REPRESENTATIVE_VALUE: Record<string, number> = { zone1: 22, zone2: 35, zone3: 50, zone4: 65, zone5: 82, zone6: 7 };

/** The most recent check-in from the last 3 hours, if any — used as
 * the "before" value so nobody has to re-enter what they just entered. */
function recentTension(): number | null {
  const since = Date.now() - 3 * 3600 * 1000;
  const latest = polyvagalRepo
    .getAll()
    .filter((c) => c.tensionValue != null && new Date(c.createdAt).getTime() >= since)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return latest?.tensionValue ?? null;
}

/**
 * "Skill starten -> Timer-Seite ohne Zeitende, aber mit der Anleitung;
 * Skill beenden -> kurze Reflexionsfragen (wo ist die Anspannung jetzt,
 * wo befinde ich mich: Regulations-Regenbogen), im Rueckblick
 * gespeichert"-Auftrag. Three stages on one page: run (count-up clock
 * + numbered steps, nothing to reach, nothing to finish), reflect (the
 * same ladder as every check-in, plus two optional questions), done
 * (positive, non-judgmental feedback). The elapsed time is derived
 * from the start timestamp, not counted tick by tick, so a locked
 * phone or a throttled background tab never loses time.
 */
export function SkillRunPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const skill = id ? resourcesRepo.getById(id) : undefined;

  const [stage, setStage] = useState<'run' | 'reflect' | 'done'>('run');
  const [startedAt] = useState(() => new Date());
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [before, setBefore] = useState<number | null>(() => recentTension());
  const [after, setAfter] = useState(50);
  const [helped, setHelped] = useState<SkillUse['helped']>();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState<SkillUse | null>(null);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (stage !== 'run') return;
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, [stage]);

  // Best effort: keep the screen on while a skill runs (not every
  // browser supports it; failing silently is fine).
  useEffect(() => {
    if (stage !== 'run') return;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((l) => (wakeLock.current = l)).catch(() => undefined);
    return () => {
      wakeLock.current?.release().catch(() => undefined);
      wakeLock.current = null;
    };
  }, [stage]);

  const elapsedSec = Math.max(0, Math.floor(((endedAt?.getTime() ?? now) - startedAt.getTime()) / 1000));
  const catColor = skill ? SKILL_CATEGORY_ZONE_COLOR[skill.category] ?? 'var(--color-primary)' : 'var(--color-primary)';
  const steps = skill?.skillDetails?.schritte ?? [];
  const beforeBand = before != null ? bandForValue(before) : null;
  const beforeZoneId = beforeBand?.id ?? null;

  const outcomeText = useMemo(() => {
    if (!saved) return '';
    const r = t.skillRun;
    const kind = skillOutcome(saved);
    const fill = (s: string) => s.replace('{before}', String(saved.tensionBefore ?? '')).replace('{after}', String(saved.tensionAfter ?? ''));
    if (kind === 'moved-toward') return fill(r.outcomeToward);
    if (kind === 'same') return fill(r.outcomeSame);
    if (kind === 'moved-away') return fill(r.outcomeAway);
    return r.outcomeUnknown;
  }, [saved, t]);

  if (!skill) {
    return (
      <div className="animate-in">
        <TopBar />
        <div className="px-5 text-[14px] text-[var(--color-text-muted)]">{t.skillRun.notFound}</div>
      </div>
    );
  }

  function finishRun() {
    const end = new Date();
    setEndedAt(end);
    setAfter(before ?? 50);
    setStage('reflect');
  }

  function cancelRun() {
    if (elapsedSec > 10 && !window.confirm(t.skillRun.cancelConfirm)) return;
    goBack(navigate);
  }

  function save() {
    if (!skill) return;
    const end = endedAt ?? new Date();
    const use: SkillUse = {
      id: createId('skuse'),
      skillId: skill.id,
      skillTitle: skill.title,
      startedAt: startedAt.toISOString(),
      endedAt: end.toISOString(),
      durationSec: Math.round((end.getTime() - startedAt.getTime()) / 1000),
      tensionBefore: before ?? undefined,
      tensionAfter: after,
      helped,
      note: note.trim() || undefined,
    };
    skillUsesRepo.save(use);
    // The value measured at the end is also a real check-in, so the
    // day curve shows the point AFTER the skill (labelled with it).
    const nowIso = end.toISOString();
    polyvagalRepo.save({ id: createId('pv'), createdAt: nowIso, zone: polyvagalZoneForValue(after), tensionValue: after, afterSkillTitle: skill.title });
    tensionRepo.save({ id: createId('tension'), createdAt: nowIso, value: after });
    setSaved(use);
    setStage('done');
  }

  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-12">
        <p className="text-[12px] uppercase tracking-wide mb-1" style={{ color: catColor }}>
          {t.skillRun.startCta}
        </p>
        <h1 className="text-[24px] mb-1">{skill.title}</h1>
        {skill.skillDetails?.subtitle && <p className="text-[14px] text-[var(--color-text-muted)] italic mb-3">{skill.skillDetails.subtitle}</p>}

        {stage === 'run' && (
          <>
            <div className="rounded-[var(--radius-xl)] py-7 my-4 text-center" style={{ background: `${typeof catColor === 'string' && catColor.startsWith('#') ? catColor : '#6fbf73'}14` }}>
              <p className="text-[56px] font-light tabular-nums leading-none" style={{ color: catColor }} aria-live="off">
                {formatTime(elapsedSec)}
              </p>
              <p className="text-[12.5px] text-[var(--color-text-muted)] mt-3 px-6 leading-relaxed">{t.skillRun.runningHint}</p>
            </div>

            <div className="mb-5">
              <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2">{t.skillRun.stepsTitle}</p>
              {steps.length === 0 ? (
                <>
                  {skill.description ? (
                    <p className="text-[14px] text-[var(--color-text)] leading-relaxed whitespace-pre-line">{skill.description}</p>
                  ) : (
                    <p className="text-[13px] text-[var(--color-text-faint)]">{t.skillRun.noStepsHint}</p>
                  )}
                </>
              ) : (
                <ol className="flex flex-col gap-2">
                  {steps.map((s, i) => {
                    const isDone = doneSteps.includes(i);
                    return (
                      <li key={i}>
                        <button
                          onClick={() => setDoneSteps((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]))}
                          className="w-full text-left flex items-start gap-3 p-3.5 rounded-[var(--radius-lg)]"
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', opacity: isDone ? 0.55 : 1 }}
                        >
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-full text-[12px] flex items-center justify-center mt-0.5"
                            style={isDone ? { background: catColor, color: '#fff' } : { border: `1.5px solid ${catColor}`, color: catColor }}
                          >
                            {isDone ? <Check size={14} /> : i + 1}
                          </span>
                          <span className="text-[15px] text-[var(--color-text)] leading-snug" style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                            {s}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
              {steps.length > 0 && skill.description && <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mt-5 pt-4 whitespace-pre-line" style={{ borderTop: '1px solid var(--color-border)' }}>{skill.description}</p>}
            </div>

            {before == null && (
              <div className="mb-5">
                <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2">{t.skillRun.before}</p>
                <div className="flex flex-wrap gap-1.5">
                  {AROUSAL_BANDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBefore(ZONE_REPRESENTATIVE_VALUE[b.id])}
                      className="rounded-full px-3 py-1 text-[12px] border"
                      style={{ borderColor: b.color, color: b.color }}
                    >
                      {t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {before != null && beforeBand && (
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-5">
                {t.skillRun.beforeKnown}: <span style={{ color: beforeBand.color }}>{before} %</span>{' '}
                <button className="underline underline-offset-2 ml-1" onClick={() => setBefore(null)}>
                  ✎
                </button>
              </p>
            )}

            <Button fullWidth data-sound="complete" onClick={finishRun}>
              {t.skillRun.endCta}
            </Button>
            <button onClick={cancelRun} className="w-full text-center text-[13px] text-[var(--color-text-faint)] mt-3 py-2">
              {t.skillRun.cancel}
            </button>
          </>
        )}

        {stage === 'reflect' && (
          <div className="mt-3">
            <h2 className="text-[18px] mb-1">{t.skillRun.reflectTitle}</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-5">
              {t.skillRun.reflectIntro} · {t.skillRun.duration.replace('{min}', String(Math.max(1, Math.round(elapsedSec / 60))))}
            </p>

            <p className="text-[14px] font-medium text-[var(--color-text)] mb-2">{t.skillRun.qNow}</p>
            <NervousSystemLadderSlider onSelect={() => undefined} value={after} onValueChange={setAfter} hideSupportLinks />

            {before == null && (
              <div className="mt-6">
                <p className="text-[14px] font-medium text-[var(--color-text)] mb-2">{t.skillRun.qBefore}</p>
                <div className="flex flex-wrap gap-1.5">
                  {AROUSAL_BANDS.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBefore(ZONE_REPRESENTATIVE_VALUE[b.id])}
                      className="rounded-full px-3 py-1 text-[12px] border"
                      style={beforeZoneId === b.id ? { background: b.color, borderColor: b.color, color: '#fff' } : { borderColor: b.color, color: b.color }}
                    >
                      {t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones].label}
                    </button>
                  ))}
                </div>
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

        {stage === 'done' && saved && (
          <div className="mt-4 rounded-[var(--radius-xl)] p-5" style={{ background: 'var(--color-primary-soft)' }}>
            <p className="text-[16px] font-medium text-[var(--color-text)] mb-2">{t.skillRun.doneTitle}</p>
            <p className="text-[14px] text-[var(--color-text)] leading-relaxed mb-1">{outcomeText}</p>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-5">{t.skillRun.duration.replace('{min}', String(Math.max(1, Math.round(saved.durationSec / 60))))}</p>
            <div className="flex flex-col gap-2">
              <Link to="/entdecken/ressourcen/skills">
                <Button fullWidth variant="secondary">
                  {t.skillRun.backToSkills}
                </Button>
              </Link>
              <Link to="/wochenrueckblick">
                <Button fullWidth variant="ghost">
                  {t.skillRun.toReview}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
