import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, NotebookPen } from 'lucide-react';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { CompanionGuidanceCard } from '../../components/companion/CompanionGuidanceCard';
import { pickLine } from '../../components/companion/companionRegistry';
import { useT } from '../../i18n';
import { CustomDurationInput } from '../timer/CustomDurationInput';
import { useRegisterModalOpen } from '../../state/ModalStackContext';

interface BridgeTimerViewProps {
  contextLabel: string;
  onClose: () => void;
  /** called once the timer completes naturally (not on early cancel) —
   * lets the caller (e.g. BridgeDetailPage) offer a "save to diary" step
   * with the actual duration that was run. */
  onNaturalComplete?: (durationMin: number) => void;
}

export const TIMER_DURATIONS_MIN = [2, 5, 10, 15, 20, 30, 60, 90, 120];
/** Sentinel for stopwatch mode — counts up from 0 instead of down from a
 * fixed duration, ends only when the person stops it themselves. Kept
 * as a special value of the same durationMin state (rather than a
 * parallel mode flag) so the rest of the existing state machine —
 * companion tap/sleep behavior, the done screen, the diary prompt —
 * needs no duplication, just a few branches on "is this stopwatch". */
const STOPWATCH_SENTINEL = -1;

/** Timers at or above this length get the occasional "I'll rest until you
 * need me" sleep behavior — a 2-minute breathing exercise doesn't need it,
 * but a 30+ minute one benefits from the companion not just staring
 * blankly at the screen the whole time. */
const SLEEP_ELIGIBLE_MIN_MINUTES = 20;

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDurationLabel(min: number, t: ReturnType<typeof useT>): string {
  if (min < 60) return t.bridges.timerMinutes.replace('{n}', String(min));
  const hours = min / 60;
  return t.bridges.timerHours.replace('{n}', hours % 1 === 0 ? String(hours) : hours.toFixed(1).replace('.', ','));
}

export function BridgeTimerView({ contextLabel, onClose, onNaturalComplete }: BridgeTimerViewProps) {
  const t = useT();
  useRegisterModalOpen(true);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [done, setDone] = useState(false);
  const [doneLine, setDoneLine] = useState<string | null>(null);
  const [startLine] = useState(() => pickLine({ page: '/bruecken', trigger: 'timer_start' }));
  const [tapLine, setTapLine] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [sleepLine, setSleepLine] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapLineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (durationMin == null || done) return;
    const isStopwatch = durationMin === STOPWATCH_SENTINEL;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (isStopwatch) return r + 1; // counts UP, no natural end
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setDone(true);
          setDoneLine(pickLine({ page: '/bruecken', trigger: 'timer_ende' }));
          setSleeping(false);
          onNaturalComplete?.(durationMin);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    // Only longer timers get a chance to have the companion doze off —
    // triggered once, randomly within a window roughly a third to two
    // thirds into the timer, so it doesn't happen at a predictable moment
    // every single time. Stopwatch mode has no known total length, so it
    // never gets this behavior.
    if (!isStopwatch && durationMin >= SLEEP_ELIGIBLE_MIN_MINUTES) {
      const totalMs = durationMin * 60 * 1000;
      const delay = totalMs * (0.3 + Math.random() * 0.35);
      sleepTimeoutRef.current = setTimeout(() => {
        if (Math.random() < 0.6) {
          setSleepLine(pickLine({ page: '/bruecken', trigger: 'timer_sleep' }));
          setSleeping(true);
        }
      }, delay);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMin]);

  function start(min: number) {
    setDurationMin(min);
    setRemaining(min * 60);
  }

  function startStopwatch() {
    setDurationMin(STOPWATCH_SENTINEL);
    setRemaining(0);
  }

  // Stopping a running stopwatch is the equivalent of a timer reaching
  // zero naturally — it's the person's deliberate "I'm done" signal, not
  // an abandonment, so it goes through onNaturalComplete with however
  // many whole minutes actually elapsed (rounding up, never a 0-minute
  // entry for something that took, say, 40 seconds — see completeStopwatch).
  function completeStopwatch() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const elapsedMin = Math.max(1, Math.round(remaining / 60));
    setDone(true);
    setDoneLine(pickLine({ page: '/bruecken', trigger: 'timer_ende' }));
    setSleeping(false);
    onNaturalComplete?.(elapsedMin);
  }

  function handleCompanionTap() {
    if (sleeping) {
      setSleeping(false);
      setSleepLine(null);
      setTapLine(pickLine({ page: '/bruecken', trigger: 'timer_wake' }));
    } else if (!done && durationMin != null) {
      setTapLine(pickLine({ page: '/bruecken', trigger: 'timer_tap' }));
    } else {
      return;
    }
    if (tapLineTimeoutRef.current) clearTimeout(tapLineTimeoutRef.current);
    tapLineTimeoutRef.current = setTimeout(() => setTapLine(null), 3500);
  }

  function requestClose() {
    // Picking a duration but not yet running, or already done — closing
    // needs no confirmation, there's nothing mid-way to interrupt.
    if (durationMin == null || done) {
      onClose();
      return;
    }
    setConfirmingCancel(true);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[240] bg-[var(--color-bg)] flex flex-col items-center px-6 py-14 overflow-y-auto animate-in"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={requestClose}
        aria-label={t.common.close}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
        style={{ top: 'max(20px, env(safe-area-inset-top))' }}
      >
        <X size={20} />
      </button>

      {confirmingCancel ? (
        <div className="text-center max-w-[280px] animate-in">
          <InlineCompanionNote />
          <p className="text-[15px] text-[var(--color-text)] leading-relaxed mt-4 mb-6">{t.bridges.timerCancelConfirm}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setConfirmingCancel(false)}
              className="px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]"
            >
              {t.bridges.timerStayHere}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] text-[var(--color-text-muted)]">
              {t.bridges.timerEndNow}
            </button>
          </div>
        </div>
      ) : (
        <>
          <InlineCompanionNote
            joyBurst={done ? 'hop' : null}
            // "Timer-Wesen"-Auftrag — the companion now does something
            // calm for the whole active duration, not just on long
            // timers: 'meditating' (slow breathing, eyes open) is the
            // default while running, with the existing occasional
            // 'sleeping' override on longer timers taking priority when
            // it triggers, exactly as before.
            sleepStateOverride={sleeping ? 'sleeping' : durationMin != null && !done && !confirmingCancel ? 'meditating' : undefined}
            onTap={durationMin != null && !confirmingCancel ? handleCompanionTap : undefined}
          />

          {durationMin == null ? (
            <div className="mt-6 text-center max-w-[300px]">
              <p className="text-[13px] text-[var(--color-text-faint)] mb-1">{contextLabel}</p>
              <p className="text-[16px] text-[var(--color-text)] mb-3">{t.bridges.timerPick}</p>
              <div className="text-left mb-3">
                <CompanionGuidanceCard text={t.bridges.guidanceTimerStep} />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {TIMER_DURATIONS_MIN.map((min) => (
                  <button
                    key={min}
                    onClick={() => start(min)}
                    className="px-4 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                  >
                    {formatDurationLabel(min, t)}
                  </button>
                ))}
              </div>
              <button
                onClick={startStopwatch}
                className="mt-3 px-4 py-2.5 rounded-full text-[14px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              >
                {t.bridges.timerStopwatchCta}
              </button>
              <CustomDurationInput onStart={start} />
            </div>
          ) : !done ? (
            <div className="mt-6 text-center">
              <p className="text-[13px] text-[var(--color-text-faint)] mb-2">{contextLabel}</p>
              {sleeping && sleepLine ? (
                <p className="text-[14px] text-[var(--color-text-muted)] mb-3 max-w-[260px] italic">{sleepLine}</p>
              ) : tapLine ? (
                <p className="text-[14px] text-[var(--color-primary)] mb-3 max-w-[260px] animate-in">{tapLine}</p>
              ) : (
                startLine && <p className="text-[14px] text-[var(--color-text-muted)] mb-3 max-w-[260px]">{startLine}</p>
              )}
              <p className="text-[56px] font-light tabular-nums text-[var(--color-text)]">{formatTime(remaining)}</p>
              {durationMin === STOPWATCH_SENTINEL && (
                <button
                  onClick={completeStopwatch}
                  className="mt-5 px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]"
                >
                  {t.bridges.timerStopwatchDone}
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 text-center max-w-[280px] animate-in">
              <p className="text-[18px] text-[var(--color-text)] mb-2">{t.bridges.timerDoneTitle}</p>
              <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{doneLine ?? t.bridges.timerDoneText}</p>
              <div className="flex flex-col gap-2">
                {onNaturalComplete && (
                  <button
                    onClick={() => onNaturalComplete(durationMin)}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]"
                  >
                    <NotebookPen size={14} />
                    {t.bridges.timerAddToDiary}
                  </button>
                )}
                <button onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] text-[var(--color-text-muted)]">
                  {t.common.close}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}
