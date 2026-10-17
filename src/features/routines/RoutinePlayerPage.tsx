import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
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
import { routinesRepo, runsFor, saveRun, tickGardenForCard, formatDuration, type Routine, type RoutineCard, type RoutineRun } from './routinesRepo';
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
  return <Player routine={routine} />;
}

function Player({ routine }: { routine: Routine }) {
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
  const frontRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [finished, setFinished] = useState<{ run: RoutineRun; previous?: RoutineRun; ticked: string[]; skipped: number } | null>(null);
  const card = cards[idx];

  // ----- timer (starts by itself when the card appears) -----
  const [remainingMs, setRemainingMs] = useState<number | null>(card.timerSec ? card.timerSec * 1000 : null);
  const [paused, setPaused] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const timerRef = useRef({ endAt: 0, left: 0 });
  useEffect(() => {
    setTimeUp(false);
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
      });
      const ticked = Array.from(new Set(cards.filter((c, i) => c.gardenId && results.current[i]?.done).map((c) => gardenRepo.getById(c.gardenId!)?.name).filter(Boolean) as string[]));
      setFinished({ run, previous, ticked, skipped: results.current.filter((r) => !r.done).length + rest.length });
      setPhase('done');
    },
    [cards, navigate, routine],
  );

  function advance(done: boolean) {
    const sec = Math.max(0, Math.round((Date.now() - cardStart.current) / 1000));
    results.current.push({ cardId: card.id, text: card.text, sec, done });
    if (done) tickGardenForCard(card.gardenId);
    if (idx >= cards.length - 1) {
      finish();
    } else {
      setLeaving(false);
      setIdx(idx + 1);
    }
  }

  function completeCard(done: boolean) {
    if (leaving) return;
    setLeaving(true);
    playSound(done ? 'select' : 'close', settings);
    triggerHaptic('tap', settings);
    const el = frontRef.current;
    if (el && !reduce) {
      el.style.transition = 'transform 420ms cubic-bezier(.2,.75,.25,1), opacity 380ms ease-out';
      el.style.transform = done ? 'translate3d(135vw,-20px,0) rotate(14deg) rotateY(-22deg)' : 'translate3d(0,40px,0) scale(0.9)';
      el.style.opacity = '0';
    }
    window.setTimeout(() => advance(done), reduce ? 0 : 400);
  }

  // ----- swipe -----
  const drag = useRef({ down: false, moved: false, startX: 0, startY: 0, dx: 0, t0: 0, id: -1 });
  function applyDrag(dx: number, animate: boolean) {
    const el = frontRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 380ms cubic-bezier(.34,1.4,.5,1)' : 'none';
    el.style.transform = reduce ? `translate3d(${dx}px,0,0)` : `translate3d(${dx}px,0,0) rotate(${dx / 30}deg) rotateY(${dx / -16}deg)`;
    if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, Math.min(1, dx / 120)));
  }
  function onPointerDown(e: React.PointerEvent) {
    if (leaving || phase !== 'run') return;
    if ((e.target as HTMLElement).closest('[data-nodrag]')) return;
    drag.current = { down: true, moved: false, startX: e.clientX, startY: e.clientY, dx: 0, t0: Date.now(), id: e.pointerId };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
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
    d.dx = dx > 0 ? dx : dx / 4; // dragging left only wiggles a little
    applyDrag(d.dx, false);
  }
  function onPointerUp() {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    if (!d.moved) return;
    const velocity = d.dx / Math.max(1, Date.now() - d.t0);
    if (d.dx > DRAG_DONE_PX || (d.dx > 45 && velocity > 0.5)) completeCard(true);
    else applyDrag(0, true);
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
            <span className="text-[34px] leading-none">{card.emoji}</span>
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

          <div className="flex-1 flex items-center justify-center px-5 min-h-0">
            <div className="rt-stage w-full" style={{ maxWidth: 380, height: 'min(62vh, 520px)' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
              {next && (
                <RoutineCard3D
                  card={{ ...next, text: '', image: undefined }}
                  badge={<span />}
                  className="absolute inset-0"
                  style={{ transform: 'translate3d(0,16px,-60px) scale(0.93)', opacity: 0.8, filter: 'saturate(0.9)' }}
                />
              )}
              <RoutineCard3D
                key={card.id}
                ref={frontRef}
                card={card}
                badge={ring}
                className={`absolute inset-0 ${reduce ? '' : 'rt-enter'}`}
                style={{ touchAction: 'pan-y' }}
              >
                {timeUp && <p className="text-[14px] text-[var(--color-text-muted)]" style={{ color: card.image ? '#fff' : undefined }}>{rt.timeUp}</p>}
                {(linkedResource || linkedPerson) && (
                  <button type="button" data-nodrag onClick={() => setLinkedOpen(true)} className="w-full max-w-[300px] text-left" data-testid="routine-linked">
                    {linkedResource ? (
                      <ResourceTile resource={linkedResource} compact />
                    ) : (
                      <span className="flex items-center gap-2 rounded-[18px] px-3 py-2 bg-[rgba(255,255,255,0.7)] text-[14px] text-[var(--color-text)]">🤝 {linkedPerson!.name}</span>
                    )}
                  </button>
                )}
                <div ref={hintRef} className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center pointer-events-none" style={{ opacity: 0, background: card.color, color: '#fff', boxShadow: `0 0 28px ${card.color}` }}>
                  <Check size={28} />
                </div>
              </RoutineCard3D>
            </div>
          </div>

          <div className="px-5 pt-3 flex flex-col items-center gap-2" style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
            <Button fullWidth onClick={() => completeCard(true)} className={timeUp && !reduce ? 'rt-pulse' : ''} icon={<Check size={17} />} data-testid="routine-done">
              {rt.done}
            </Button>
            <button type="button" onClick={() => completeCard(false)} className="text-[13px] text-[var(--color-text-faint)] py-1.5 underline underline-offset-2" data-testid="routine-skip">
              {rt.notNow}
            </button>
            <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] text-center">{rt.swipeHint}</p>
          </div>

          {confirmEnd && (
            <div className="absolute inset-0 z-10 flex items-end justify-center bg-[rgba(44,42,34,0.35)]" onClick={() => setConfirmEnd(false)}>
              <div className="w-full max-w-[440px] bg-[var(--color-surface)] rounded-t-[24px] p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{rt.endEarlyConfirm}</p>
                <Button fullWidth variant="secondary" onClick={() => finish()} data-testid="routine-end-confirm">{rt.endEarly}</Button>
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
          <div className="mt-6 flex flex-col gap-2 w-full" style={{ maxWidth: 320 }}>
            <Button fullWidth onClick={() => goBack(navigate, '/entdecken/garten')} data-testid="routine-close-done">{rt.close}</Button>
            <Link to="/wochenrueckblick" replace className="text-[13px] text-[var(--color-primary)] underline underline-offset-2">{rt.toReview}</Link>
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
