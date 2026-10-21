import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { goBack } from '../../services/navigation';
import { playSound } from '../../services/sounds';
import { triggerHaptic } from '../../services/haptics';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterExternalModalOpen, useRegisterModalOpen } from '../../state/ModalStackContext';
import { LichtCompanion } from '../../components/companion/LichtCompanion';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ResourceTile } from '../../components/shared/ItemTile';
import { resourcesRepo } from '../resources/resourcesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { RoutineCard3D } from './RoutineCard3D';
import { MediaEmbed, OwnMediaView } from './MediaEmbed';
import { NervousSystemLadderSlider } from '../polyvagal/NervousSystemLadderSlider';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { tensionRepo } from '../polyvagal/tensionRepo';
import { polyvagalZoneForValue, bandForValue } from '../polyvagal/arousalBands';
import { createId } from '../../services/storage/repository';
import { logActivity } from '../../services/activityLog';
import { logMediForCard, mediNameOf, recordResourceUse } from './routineEffects';
import { routineRunsRepo, cardNoSymbol, routinesRepo, runsFor, saveRun, tickGardenForCard, formatDuration, cardsForEnergy, energyOptions, ENERGY_COLORS, type EnergyLevel, type Routine, type RoutineCard, type RoutineRun } from './routinesRepo';
import { useRoutineTexts } from './routineTexts';
import './routines.css';

const DRAG_DONE_PX = 100;

/**
 * Plays a routine: always exactly ONE card, filling the screen. When the step is done the card is
 * swiped to the right (or "Erledigt" is tapped) and the next one slides in. A card may carry a timer
 * that starts by itself. At the end the Wesen cheers and dances, a check mark draws itself, glitter,
 * and the same soft sparkle sound as when the Wesen collects time sparks in "Lauf mit dem Wesen".
 */
export function RoutinePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const routine = id ? routinesRepo.getById(id) : undefined;
  const rt = useRoutineTexts();
  const navigate = useNavigate();
  if (!routine || routine.cards.length === 0) {
    return (
      <div className="px-5 pt-10 text-[14px] text-[var(--color-text-muted)]">
        <p className="mb-4">{rt.runNotFound}</p>
        <Button onClick={() => goBack(navigate, '/entdecken/garten')}>{rt.close}</Button>
      </div>
    );
  }
  return <EnergyGate routine={routine} />;
}

/** Has the routine more than one energy version? Then ask first ("Schwerer Tag: nur die Kleinsten" … "Alle Schritte"). */
function EnergyGate({ routine }: { routine: Routine }) {
  const rt = useRoutineTexts();
  const navigate = useNavigate();
  const options = useMemo(() => energyOptions(routine.cards), [routine]);
  const [level, setLevel] = useState<EnergyLevel | null>(options.length < 2 ? 3 : null);
  useRegisterModalOpen(level === null);
  useRegisterExternalModalOpen(level === null);
  if (level === null) {
    const labelFor = (i: number) => (i === 0 ? [rt.energyHard, rt.energyHardSub] : i === options.length - 1 ? [rt.energyAll, ''] : [rt.energyMid, '']);
    return createPortal(
      <div className="fixed inset-0 z-[220] flex flex-col px-5" style={{ background: 'var(--color-bg)', paddingTop: 'max(18px, env(safe-area-inset-top))', paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }} data-testid="routine-energy-gate">
        <div className="flex items-center mb-6">
          <button type="button" onClick={() => goBack(navigate, '/entdecken/garten')} aria-label={rt.energyNotNow} className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center" data-testid="routine-energy-close"><X size={19} /></button>
        </div>
        <div className="flex-1 flex flex-col justify-center max-w-[440px] w-full mx-auto">
          <p className="text-[34px] text-center mb-2">{routine.emoji}</p>
          <h1 className="text-[22px] text-center mb-1">{routine.title}</h1>
          <p className="text-[15px] text-[var(--color-text)] text-center mb-1">{rt.energyTitle}</p>
          <p className="text-[13px] text-[var(--color-text-faint)] text-center mb-6 leading-relaxed">{rt.energySub}</p>
          <div className="flex flex-col gap-3">
            {options.map((o, i) => {
              const [name, sub] = labelFor(i);
              return (
                <button key={o.level} type="button" onClick={() => setLevel(o.level)} data-testid={`routine-energy-pick-${o.level}`} className="text-left rounded-[var(--radius-lg)] px-5 py-4 flex items-center gap-4 border-2 bg-[var(--color-surface)]" style={{ borderColor: 'var(--color-border)', minHeight: 72 }}>
                  <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: ENERGY_COLORS[o.level] }} aria-hidden="true" />
                  <span className="flex-1">
                    <span className="block text-[17px] text-[var(--color-text)]">{name}{sub ? `: ${sub.toLowerCase()}` : ''}</span>
                    <span className="block text-[12.5px] text-[var(--color-text-muted)]">{o.count === 1 ? rt.energyCard1 : rt.energyCards.replace('{n}', String(o.count))}</span>
                  </span>
                  <ChevronRight size={20} className="text-[var(--color-text-faint)]" />
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => goBack(navigate, '/entdecken/garten')} className="mt-6 text-[13.5px] text-[var(--color-text-muted)] underline underline-offset-2 self-center py-2" data-testid="routine-energy-notnow">{rt.energyNotNow}</button>
        </div>
      </div>,
      document.body,
    );
  }
  return <PlayerForLevel routine={routine} level={level} multi={options.length >= 2} />;
}

function PlayerForLevel({ routine, level, multi }: { routine: Routine; level: EnergyLevel; multi: boolean }) {
  const shown = useMemo(() => (multi ? { ...routine, cards: cardsForEnergy(routine.cards, level) } : routine), [routine, level, multi]);
  return <Player routine={shown} energy={multi ? level : undefined} />;
}

function Player({ routine, energy }: { routine: Routine; energy?: EnergyLevel }) {
  const rt = useRoutineTexts();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const reduce = settings.reduceMotion;
  useRegisterModalOpen(true);
  useRegisterExternalModalOpen(true);

  const cards = routine.cards;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'run' | 'done'>('run');
  const [leaving, setLeaving] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [linkedOpen, setLinkedOpen] = useState(false);
  const startedAt = useRef(new Date());
  const cardStart = useRef(Date.now());
  const results = useRef<{ cardId: string; text: string; sec: number; done: boolean }[]>([]);
  /** what finished cards ticked off elsewhere in the app (medication log, resources, skills) */
  const effects = useRef<{ took: string[]; resources: string[]; skills: string[] }>({ took: [], resources: [], skills: [] });
  const frontRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [finished, setFinished] = useState<{ run: RoutineRun; previous?: RoutineRun; ticked: string[]; skipped: number } | null>(null);
  const card = cards[idx];
  // optional: right after the routine, the current tension can be entered (and is easy to wave away)
  const [tStage, setTStage] = useState<'ask' | 'slider' | 'saved' | 'no'>('ask');
  const [tVal, setTVal] = useState(40);

  // ----- timer (starts by itself when the card appears) -----
  const [remainingMs, setRemainingMs] = useState<number | null>(card.timerSec ? card.timerSec * 1000 : null);
  const [paused, setPaused] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [mediaDone, setMediaDone] = useState(false);
  const timerRef = useRef({ endAt: 0, left: 0 });
  useEffect(() => {
    setTimeUp(false);
    setMediaDone(false);
    setPaused(false);
    cardStart.current = Date.now();
    if (!card.timerSec) {
      setRemainingMs(null);
      return;
    }
    timerRef.current = { endAt: Date.now() + card.timerSec * 1000, left: card.timerSec * 1000 };
    setRemainingMs(card.timerSec * 1000);
    const iv = window.setInterval(() => {
      const tr = timerRef.current;
      if (tr.endAt === 0) return; // paused
      const left = Math.max(0, tr.endAt - Date.now());
      tr.left = left;
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(iv);
        setTimeUp(true);
        playSound('settle', settings);
        triggerHaptic('settle', settings);
      }
    }, 200);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  function togglePause() {
    if (remainingMs == null || timeUp) return;
    const tr = timerRef.current;
    if (!paused) {
      tr.left = Math.max(0, tr.endAt - Date.now());
      tr.endAt = 0;
      setPaused(true);
    } else {
      tr.endAt = Date.now() + tr.left;
      setPaused(false);
    }
  }

  // ----- finishing -----
  const finish = useCallback(
    () => {
      const now = new Date();
      const done = results.current.filter((r) => r.done);
      if (done.length === 0) {
        goBack(navigate, '/entdecken/garten');
        return;
      }
      const rest = cards.slice(results.current.length).map((c) => ({ cardId: c.id, text: c.text, sec: 0, done: false }));
      const previous = runsFor(routine.id)[0];
      const run = saveRun(routine, {
        startedAt: startedAt.current.toISOString(),
        endedAt: now.toISOString(),
        durationSec: Math.max(1, Math.round((now.getTime() - startedAt.current.getTime()) / 1000)),
        cards: [...results.current, ...rest],
        ...(energy ? { energy } : {}),
        ...(effects.current.took.length ? { took: effects.current.took } : {}),
        ...(effects.current.resources.length ? { usedResources: effects.current.resources } : {}),
        ...(effects.current.skills.length ? { skillsDone: effects.current.skills } : {}),
      });
      const ticked = Array.from(new Set(cards.filter((c, i) => c.gardenId && results.current[i]?.done).map((c) => gardenRepo.getById(c.gardenId!)?.name).filter(Boolean) as string[]));
      setFinished({ run, previous, ticked, skipped: results.current.filter((r) => !r.done).length + rest.length });
      setPhase('done');
    },
    [cards, navigate, routine, energy],
  );

  /** a finished card ticks things off in the rest of the app: medication log, resource and skill use, contact */
  function applyCardEffects(c: RoutineCard, sec: number) {
    const lang2 = settings.language === 'en' ? 'en' : 'de';
    try {
      if (c.medi) {
        const n = logMediForCard(c.medi, routine.title, lang2);
        if (n) effects.current.took.push(n);
      }
      if (c.linked?.kind === 'resource') {
        const r = recordResourceUse(c.linked.id, routine.title, new Date(Date.now() - Math.max(1, sec) * 1000), lang2);
        if (r) (r.skill ? effects.current.skills : effects.current.resources).push(r.title);
      } else if (c.linked?.kind === 'person') {
        const p = networkRepo.getById(c.linked.id);
        if (p) {
          logActivity('contact', p.name, p.id);
          effects.current.resources.push(p.name);
        }
      }
    } catch {
      // a side effect must never stop the routine
    }
  }

  function saveTension() {
    if (!finished) return;
    const nowIso = new Date().toISOString();
    const band = bandForValue(tVal);
    routineRunsRepo.save({ ...finished.run, tensionAfter: tVal, stateAfter: band.id });
    polyvagalRepo.save({ id: createId('pv'), createdAt: nowIso, zone: polyvagalZoneForValue(tVal), tensionValue: tVal, afterRoutineTitle: routine.title });
    tensionRepo.save({ id: createId('tension'), createdAt: nowIso, value: tVal });
    setTStage('saved');
  }

  function advance(done: boolean) {
    const sec = Math.max(0, Math.round((Date.now() - cardStart.current) / 1000));
    results.current.push({ cardId: card.id, text: card.text, sec, done });
    if (done) {
      tickGardenForCard(card.gardenId);
      applyCardEffects(card, sec);
    }
    pose.current = { x: 0, y: 0, rot: 0 };
    if (peekRef.current) {
      peekRef.current.style.transform = 'translate3d(0,16px,-60px) scale(0.93)';
      peekRef.current.style.opacity = '0.8';
    }
    if (idx >= cards.length - 1) {
      finish();
    } else {
      setLeaving(false);
      setIdx(idx + 1);
    }
  }

  // ----- physics: the card is really pushed by the finger, flies off with the momentum it got, and the next one moves up -----
  const peekRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const pose = useRef({ x: 0, y: 0, rot: 0 });
  const [sparks, setSparks] = useState<{ id: number; dx: number; dy: number; c: string }[]>([]);

  function setPose(x: number, y: number, extraOpacity = 1) {
    const el = frontRef.current;
    if (!el) return;
    const rot = Math.max(-38, Math.min(38, x / 14));
    pose.current = { x, y, rot };
    el.style.transformOrigin = '50% 115%';
    el.style.transform = reduce ? `translate3d(${x}px,0,0)` : `translate3d(${x}px,${y}px,0) rotate(${rot}deg)`;
    el.style.opacity = String(extraOpacity);
    const p = Math.min(1, Math.abs(x) / DRAG_DONE_PX);
    if (peekRef.current) {
      peekRef.current.style.transform = `translate3d(0,${(16 * (1 - p)).toFixed(1)}px,${(-60 * (1 - p)).toFixed(1)}px) scale(${(0.93 + 0.07 * p).toFixed(3)})`;
      peekRef.current.style.opacity = String(0.8 + 0.2 * p);
    }
    if (hintRef.current) {
      hintRef.current.style.opacity = String(Math.max(0, Math.min(1, x / 110)));
    }
    if (skipHintRef.current) {
      skipHintRef.current.style.opacity = String(Math.max(0, Math.min(1, -x / 110)));
    }
  }
  const skipHintRef = useRef<HTMLDivElement>(null);

  function burstSparks() {
    const colors = [card.color, '#fff', '#ffe08a', '#bfe9c2'];
    setSparks(Array.from({ length: 14 }, (_, i) => ({ id: Date.now() + i, dx: (Math.random() - 0.3) * 260, dy: (Math.random() - 0.7) * 260, c: colors[i % colors.length] })));
    window.setTimeout(() => setSparks([]), 900);
  }

  /** Let go with momentum: keeps moving the way it was pushed until it has left the screen. */
  function fling(dir: 1 | -1, v0: number, vy0 = 0) {
    if (leaving) return;
    setLeaving(true);
    const done = dir === 1;
    playSound(done ? 'select' : 'close', settings);
    triggerHaptic('tap', settings);
    if (done && !reduce) burstSparks();
    if (reduce) {
      window.setTimeout(() => advance(done), 0);
      return;
    }
    cancelAnimationFrame(rafRef.current);
    let { x, y } = pose.current;
    let v = dir * Math.max(1.15, Math.abs(v0)); // px per ms, at least a decent push
    let vy = Math.max(-0.5, Math.min(0.5, vy0));
    const limit = window.innerWidth * 0.95 + 200;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      v *= 1 + 0.0009 * dt; // keeps gathering a little speed, like a card sliding away
      vy += 0.0012 * dt; // slight fall
      x += v * dt;
      y += vy * dt;
      const fade = Math.max(0, 1 - Math.max(0, Math.abs(x) - window.innerWidth * 0.5) / (window.innerWidth * 0.55));
      setPose(x, y, fade);
      if (Math.abs(x) < limit) rafRef.current = requestAnimationFrame(step);
      else advance(done);
    };
    rafRef.current = requestAnimationFrame(step);
  }

  /** Let go without enough push: a soft spring brings the card back, with a little overshoot. */
  function springBack() {
    cancelAnimationFrame(rafRef.current);
    if (reduce) {
      setPose(0, 0);
      return;
    }
    let { x, y } = pose.current;
    let vx = 0;
    let vy = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(32, now - last) / 16.7;
      last = now;
      vx += (-0.085 * x - 0.2 * vx) * dt;
      vy += (-0.085 * y - 0.2 * vy) * dt;
      x += vx * dt;
      y += vy * dt;
      setPose(x, y);
      if (Math.abs(x) > 0.4 || Math.abs(vx) > 0.05 || Math.abs(y) > 0.4) rafRef.current = requestAnimationFrame(step);
      else setPose(0, 0);
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function completeCard(done: boolean) {
    if (leaving) return;
    // buttons give the card a push of its own
    fling(done ? 1 : -1, 1.2);
  }

  // ----- swipe -----
  const drag = useRef({ down: false, moved: false, startX: 0, startY: 0, dx: 0, dy: 0, id: -1, samples: [] as { t: number; x: number; y: number }[], crossed: false });
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  function onPointerDown(e: React.PointerEvent) {
    if (leaving || phase !== 'run') return;
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return;
    cancelAnimationFrame(rafRef.current);
    drag.current = { down: true, moved: false, startX: e.clientX - pose.current.x, startY: e.clientY - pose.current.y, dx: 0, dy: 0, id: e.pointerId, samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }], crossed: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) {
        d.down = false;
        return;
      }
      d.moved = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // pointer capture is optional
      }
    }
    d.dx = dx;
    d.dy = dy * 0.45; // the card follows up/down a little, but sideways is what counts
    const now = performance.now();
    d.samples.push({ t: now, x: e.clientX, y: e.clientY });
    while (d.samples.length > 2 && now - d.samples[0].t > 90) d.samples.shift();
    if (!d.crossed && Math.abs(dx) > DRAG_DONE_PX) {
      d.crossed = true;
      triggerHaptic('select', settings);
    } else if (d.crossed && Math.abs(dx) < DRAG_DONE_PX * 0.8) d.crossed = false;
    setPose(d.dx, d.dy);
  }
  function onPointerUp() {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (!d.moved) return;
    const s = d.samples;
    const a = s[0];
    const b = s[s.length - 1];
    const dt = Math.max(1, b.t - a.t);
    const vx = (b.x - a.x) / dt;
    const vy = (b.y - a.y) / dt;
    const dir: 1 | -1 = d.dx >= 0 ? 1 : -1;
    const pushed = Math.abs(d.dx) > DRAG_DONE_PX || (Math.abs(d.dx) > 40 && Math.abs(vx) > 0.45 && Math.sign(vx) === dir);
    if (pushed) fling(dir, vx, vy * 0.45);
    else springBack();
  }

  // ----- finish screen: sparkle sounds + dancing Wesen -----
  const [joy, setJoy] = useState<'dance' | 'hop' | 'wobble' | 'spin' | null>(null);
  const cheer = useMemo(() => rt.cheers[Math.floor(Math.random() * rt.cheers.length)], [rt]);
  useEffect(() => {
    if (phase !== 'done') return;
    const timeouts = [0, 170, 400, 700].map((ms) => window.setTimeout(() => playSound('sparkle', settings), ms));
    triggerHaptic('settle', settings);
    const seq: ('dance' | 'hop' | 'wobble' | 'spin')[] = ['dance', 'hop', 'dance', 'wobble', 'dance', 'spin'];
    let i = 0;
    setJoy(seq[0]);
    const iv = window.setInterval(() => {
      i += 1;
      setJoy(seq[i % seq.length]);
    }, 900);
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      window.clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const lang = settings.language === 'en' ? 'en' : 'de';
  const linkedResource = card.linked?.kind === 'resource' ? resourcesRepo.getById(card.linked.id) : undefined;
  const linkedPerson = card.linked?.kind === 'person' ? networkRepo.getById(card.linked.id) : undefined;
  const next: RoutineCard | undefined = cards[idx + 1];
  const mediName = card.medi ? mediNameOf(card.medi) : undefined;

  const bg = `radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, ${phase === 'run' ? card.color : routine.color} 26%, var(--color-bg)) 0%, var(--color-bg) 70%)`;

  const ring = remainingMs != null && card.timerSec ? (
    <button
      type="button"
      data-nodrag
      onClick={togglePause}
      aria-label={paused ? rt.paused : rt.timer}
      className="relative flex items-center justify-center"
      style={{ width: 150, height: 150 }}
      data-testid="routine-timer"
    >
      <svg width="150" height="150" viewBox="0 0 150 150" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="75" cy="75" r="68" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="7" />
        <circle
          cx="75" cy="75" r="68" fill="none" stroke={card.color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 68}
          strokeDashoffset={(2 * Math.PI * 68) * (1 - remainingMs / (card.timerSec * 1000))}
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>
      <span className="rt-card__badge rounded-full flex flex-col items-center justify-center" style={{ width: 112, height: 112 }}>
        {timeUp ? (
          <span className="text-[40px]">🌿</span>
        ) : (
          <>
            {!cardNoSymbol(routine, card) && !card.polaroid && <span className="text-[34px] leading-none">{card.emoji}</span>}
            <span className="text-[13px] tabular-nums text-[var(--color-text-muted)] mt-1">{formatClock(remainingMs)}</span>
          </>
        )}
      </span>
    </button>
  ) : undefined;

  const overlay = (
    <div className="fixed inset-0 z-[220] flex flex-col" style={{ background: bg, paddingTop: 'max(14px, env(safe-area-inset-top))', paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }} data-testid="routine-player">
      {phase === 'run' && (
        <>
          <div className="flex items-center gap-3 px-4 pb-2">
            <button type="button" onClick={() => setConfirmEnd(true)} aria-label={rt.endEarly} data-sound="close" className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center flex-shrink-0" data-testid="routine-close">
              <X size={19} />
            </button>
            <div className="flex-1 flex items-center justify-center gap-1.5" aria-label={rt.cardOf.replace('{n}', String(idx + 1)).replace('{m}', String(cards.length))}>
              {cards.map((c, i) => (
                <span key={c.id} className="rounded-full" style={{ width: i === idx ? 22 : 8, height: 8, background: i <= idx ? card.color : 'var(--color-border)', opacity: i < idx ? 0.55 : 1, transition: reduce ? 'none' : 'all 0.35s ease' }} />
              ))}
            </div>
            <span className="w-10 text-right text-[12px] text-[var(--color-text-faint)] tabular-nums">{idx + 1}/{cards.length}</span>
          </div>

          {/* the two directions, always visible: left = not right now, right = done; they glow up while the card is pushed */}
          <div ref={skipHintRef} className="absolute inset-y-0 left-0 w-1/2 pointer-events-none flex items-center justify-start pl-5" style={{ opacity: 0, background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-text-muted) 22%, transparent) 0%, transparent 100%)' }} aria-hidden="true">
            <span className="flex flex-col items-center gap-1 text-[var(--color-text-muted)]"><ArrowLeft size={30} /><span className="text-[12.5px] font-medium">{rt.swipeLeftLabel}</span></span>
          </div>
          <div ref={hintRef} className="absolute inset-y-0 right-0 w-1/2 pointer-events-none flex items-center justify-end pr-5" style={{ opacity: 0, background: `linear-gradient(270deg, color-mix(in srgb, ${card.color} 38%, transparent) 0%, transparent 100%)` }} aria-hidden="true">
            <span className="flex flex-col items-center gap-1" style={{ color: card.color }}><Check size={34} strokeWidth={3} /><span className="text-[12.5px] font-medium text-[var(--color-text)]">{rt.swipeRightLabel}</span></span>
          </div>
          <ChevronLeft size={26} strokeWidth={2.8} className={`absolute left-0.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none ${reduce ? '' : 'rt-nudge-l'}`} aria-hidden="true" data-testid="routine-edge-left" />
          <ChevronRight size={26} strokeWidth={2.8} className={`absolute right-0.5 top-1/2 -translate-y-1/2 pointer-events-none ${reduce ? '' : 'rt-nudge-r'}`} style={{ color: card.color }} aria-hidden="true" data-testid="routine-edge-right" />

          <div className="flex-1 flex items-center justify-center px-5 min-h-0">
            <div className="rt-stage w-full" style={{ maxWidth: 380, height: 'min(62vh, 520px)' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
              {next && (
                <RoutineCard3D
                  ref={peekRef}
                  card={{ ...next, text: '', image: undefined, polaroid: undefined }}
                  noSymbol={true}
                  badge={<span />}
                  className="absolute inset-0"
                  style={{ transform: 'translate3d(0,16px,-60px) scale(0.93)', opacity: 0.8, filter: 'saturate(0.9)' }}
                />
              )}
              <RoutineCard3D
                key={card.id}
                ref={frontRef}
                card={card}
                noSymbol={cardNoSymbol(routine, card)}
                badge={ring}
                className={`absolute inset-0 ${reduce ? '' : 'rt-enter'}`}
                style={{ touchAction: 'pan-y' }}
              >
                {timeUp && <p className="text-[14px] text-[var(--color-text-muted)]" style={{ color: card.image ? '#fff' : undefined }}>{rt.timeUp}</p>}
                {card.media?.url && (
                  <MediaEmbed
                    key={card.id}
                    url={card.media.url}
                    color={card.color}
                    onEnded={() => {
                      setMediaDone(true);
                      playSound('settle', settings);
                      triggerHaptic('settle', settings);
                      if (card.media?.autoNext) window.setTimeout(() => fling(1, 1.2), 1600);
                    }}
                  />
                )}
                {card.ownMedia && (
                  <OwnMediaView
                    key={`own-${card.id}`}
                    file={card.ownMedia}
                    color={card.color}
                    onEnded={() => {
                      setMediaDone(true);
                      playSound('settle', settings);
                      triggerHaptic('settle', settings);
                      if (card.media?.autoNext) window.setTimeout(() => fling(1, 1.2), 1600);
                    }}
                  />
                )}
                {mediaDone && <p className="text-[14px] text-[var(--color-text-muted)]" style={{ color: card.image ? '#fff' : undefined }} data-testid="routine-media-ended">{rt.mediaEnded}</p>}
                {card.medi && mediName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-[rgba(255,255,255,0.78)] text-[13px] text-[var(--color-text)]" data-testid="routine-medi-chip">💊 {mediName}</span>
                )}
                {(linkedResource || linkedPerson) && (
                  <button type="button" data-nodrag onClick={() => setLinkedOpen(true)} className="w-full max-w-[300px] text-left" data-testid="routine-linked">
                    {linkedResource ? (
                      <ResourceTile resource={linkedResource} compact />
                    ) : (
                      <span className="flex items-center gap-2 rounded-[18px] px-3 py-2 bg-[rgba(255,255,255,0.7)] text-[14px] text-[var(--color-text)]">🤝 {linkedPerson!.name}</span>
                    )}
                  </button>
                )}
              </RoutineCard3D>
              {sparks.map((sp) => (
                <span key={sp.id} className="rt-spark" style={{ background: sp.c, ['--dx' as string]: `${sp.dx}px`, ['--dy' as string]: `${sp.dy}px` }} />
              ))}
            </div>
          </div>

          <div className="px-5 pt-3 flex flex-col items-center gap-2" style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
            <div className="flex gap-2.5 w-full">
              <button type="button" onClick={() => completeCard(false)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-3 text-[14px] border bg-[var(--color-surface)] text-[var(--color-text-muted)]" style={{ borderColor: 'var(--color-border-strong)' }} data-testid="routine-skip">
                <ArrowLeft size={16} /> {rt.swipeLeftLabel}
              </button>
              <Button onClick={() => completeCard(true)} className={`flex-[1.35] ${(timeUp || mediaDone) && !reduce ? 'rt-pulse' : ''}`} icon={<Check size={17} />} data-testid="routine-done">
                {rt.done} <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
            <p className="text-[12px] text-[var(--color-text-muted)] text-center" data-testid="routine-legend">{rt.swipeLegend}</p>
          </div>

          {confirmEnd && (
            <div className="absolute inset-0 z-10 flex items-end justify-center bg-[rgba(44,42,34,0.35)]" onClick={() => setConfirmEnd(false)}>
              <div className="w-full max-w-[440px] bg-[var(--color-surface)] rounded-t-[24px] p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{rt.endEarlyConfirm}</p>
                <Button fullWidth variant="secondary" onClick={() => finish()} data-testid="routine-end-confirm">{rt.endEarly}</Button>
                <Button fullWidth variant="ghost" onClick={() => { cancelAnimationFrame(rafRef.current); goBack(navigate, '/entdecken/garten'); }} data-testid="routine-abort">{rt.abortRun}</Button>
                <p className="text-[11.5px] text-[var(--color-text-faint)] text-center leading-snug -mt-1">{rt.abortNote}</p>
                <button type="button" onClick={() => setConfirmEnd(false)} className="text-[13px] text-[var(--color-text-muted)] py-1.5">{rt.cancel}</button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === 'done' && finished && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden" data-testid="routine-finished">
          {!reduce && SPARKLES.map((s, i) => (
            <span key={i} className="rt-twinkle" style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, animationDelay: `${s.delay}s`, color: i % 3 === 0 ? '#e8a83d' : i % 3 === 1 ? routine.color : '#d9778a' }}>✦</span>
          ))}
          <div className="rt-pop" style={{ marginBottom: 6 }}>
            <LichtCompanion size="large" joyBurst={reduce ? null : joy} />
          </div>
          <div className="rt-pop rt-check rounded-full flex items-center justify-center mb-4" style={{ width: 84, height: 84, background: routine.color, boxShadow: `0 10px 30px ${routine.color}88, inset 0 2px 0 rgba(255,255,255,0.5)`, animationDelay: '0.15s' }}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
          </div>
          <h1 className="text-[28px] mb-1 rt-rise" style={{ animationDelay: '0.3s' }}>{rt.finishedTitle}</h1>
          <p className="text-[15px] text-[var(--color-text)] mb-1 rt-rise" style={{ animationDelay: '0.4s' }}>{rt.finishedLine.replace('{title}', routine.title)}</p>
          <p className="text-[14.5px] text-[var(--color-primary)] mb-3 rt-rise" style={{ animationDelay: '0.5s' }} data-testid="routine-cheer">{cheer}</p>
          <p className="text-[13.5px] text-[var(--color-text-muted)] rt-rise" style={{ animationDelay: '0.6s' }} data-testid="routine-time">{rt.tookTime.replace('{time}', formatDuration(finished.run.durationSec, lang))}</p>
          {finished.previous && (
            <p className="text-[12.5px] text-[var(--color-text-faint)] mt-1 rt-rise" style={{ animationDelay: '0.7s' }}>
              {rt.compareLast.replace('{time}', formatDuration(finished.previous.durationSec, lang))} {rt.compareNote}
            </p>
          )}
          {finished.ticked.length > 0 && <p className="text-[13px] text-[var(--color-text)] mt-3 rt-rise" style={{ animationDelay: '0.8s' }}>🌱 {rt.gardenTicked.replace('{names}', finished.ticked.join(', '))}</p>}
          {finished.skipped > 0 && <p className="text-[12.5px] text-[var(--color-text-faint)] mt-1">{rt.skippedNote.replace('{n}', String(finished.skipped))}</p>}
          {finished.run.took && finished.run.took.length > 0 && <p className="text-[13px] text-[var(--color-text)] mt-2" data-testid="routine-took">💊 {lang === 'en' ? 'Entered in your medication log:' : 'Im Medikamenten-Log eingetragen:'} {finished.run.took.join(', ')}</p>}
          {((finished.run.skillsDone?.length ?? 0) > 0 || (finished.run.usedResources?.length ?? 0) > 0) && (
            <p className="text-[13px] text-[var(--color-text)] mt-1" data-testid="routine-used">✓ {lang === 'en' ? 'Noted as used for your look-back:' : 'Für deinen Rückblick als genutzt vermerkt:'} {[...(finished.run.skillsDone ?? []), ...(finished.run.usedResources ?? [])].join(', ')}</p>
          )}
          {tStage === 'ask' && (
            <div className="mt-4 rounded-[var(--radius-lg)] px-4 py-3 w-full flex flex-col gap-2 rt-rise" style={{ maxWidth: 340, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} data-testid="routine-tension-ask">
              <p className="text-[13.5px] text-[var(--color-text)]">{lang === 'en' ? 'Would you like to note your current tension? Totally optional.' : 'Magst du kurz deine aktuelle Anspannung eintragen? Ganz freiwillig.'}</p>
              <div className="flex gap-2">
                <Button size="sm" fullWidth onClick={() => setTStage('slider')} data-testid="routine-tension-yes">{lang === 'en' ? 'Yes, briefly' : 'Ja, kurz'}</Button>
                <Button size="sm" fullWidth variant="ghost" onClick={() => setTStage('no')} data-testid="routine-tension-no">{lang === 'en' ? 'No thanks' : 'Nein danke'}</Button>
              </div>
            </div>
          )}
          {tStage === 'saved' && <p className="text-[13px] text-[var(--color-primary)] mt-3" data-testid="routine-tension-saved">✓ {lang === 'en' ? `Saved: tension ${tVal}.` : `Eingetragen: Anspannung ${tVal}.`}</p>}
          <div className="mt-6 flex flex-col gap-2 w-full" style={{ maxWidth: 320 }}>
            <Button fullWidth onClick={() => goBack(navigate, '/entdecken/garten')} data-testid="routine-close-done">{rt.close}</Button>
            <Link to="/wochenrueckblick" replace className="text-[13px] text-[var(--color-primary)] underline underline-offset-2">{rt.toReview}</Link>
          </div>
        </div>
      )}

      {phase === 'done' && tStage === 'slider' && (
        <div className="absolute inset-0 z-10 overflow-y-auto px-5 py-6 flex flex-col" style={{ background: 'var(--color-bg)' }} data-testid="routine-tension-panel">
          <div className="max-w-[420px] w-full mx-auto flex flex-col gap-3">
            <h2 className="text-[19px]">{lang === 'en' ? 'How tense are you right now?' : 'Wie angespannt bist du gerade?'}</h2>
            <p className="text-[13px] text-[var(--color-text-muted)]">{lang === 'en' ? 'Just move the slider. There is no right or wrong.' : 'Schieb einfach den Regler. Es gibt kein Richtig oder Falsch.'}</p>
            <NervousSystemLadderSlider onSelect={() => undefined} value={tVal} onValueChange={setTVal} hideSupportLinks />
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" onClick={() => setTStage('no')} data-testid="routine-tension-cancel">{lang === 'en' ? 'Skip' : 'Lieber nicht'}</Button>
              <Button fullWidth onClick={saveTension} data-testid="routine-tension-save">{lang === 'en' ? 'Save' : 'Eintragen'}</Button>
            </div>
          </div>
        </div>
      )}

      <Modal open={linkedOpen} onClose={() => setLinkedOpen(false)} title={linkedResource?.title ?? linkedPerson?.name ?? ''} zIndex={260}>
        {linkedResource && (
          <div className="flex flex-col gap-3">
            {linkedResource.description && <p className="text-[14px] text-[var(--color-text)] leading-relaxed whitespace-pre-line">{linkedResource.description}</p>}
            {(linkedResource.skillDetails?.schritte ?? []).length > 0 && (
              <ol className="flex flex-col gap-1.5">
                {linkedResource.skillDetails!.schritte!.map((s, i) => (
                  <li key={i} className="text-[14px] text-[var(--color-text)] flex gap-2"><span className="text-[var(--color-text-faint)] tabular-nums">{i + 1}.</span>{s}</li>
                ))}
              </ol>
            )}
          </div>
        )}
        {linkedPerson && (
          <div className="flex flex-col gap-2 text-[14px] text-[var(--color-text)]">
            {linkedPerson.role && <p>{linkedPerson.role}</p>}
            {linkedPerson.phone && <a href={`tel:${linkedPerson.phone}`} className="text-[var(--color-primary)] underline">{linkedPerson.phone}</a>}
            {linkedPerson.whatHelps && <p className="text-[var(--color-text-muted)]">{linkedPerson.whatHelps}</p>}
          </div>
        )}
      </Modal>
    </div>
  );

  return createPortal(overlay, document.body);
}

function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const SPARKLES = [
  { x: 12, y: 14, size: 22, delay: 0 }, { x: 82, y: 10, size: 28, delay: 0.4 }, { x: 22, y: 36, size: 16, delay: 1.1 },
  { x: 88, y: 34, size: 20, delay: 0.8 }, { x: 8, y: 62, size: 26, delay: 1.5 }, { x: 90, y: 60, size: 16, delay: 0.2 },
  { x: 30, y: 82, size: 20, delay: 1.9 }, { x: 74, y: 84, size: 24, delay: 0.6 }, { x: 50, y: 6, size: 14, delay: 1.3 },
  { x: 60, y: 92, size: 14, delay: 1.0 },
];
