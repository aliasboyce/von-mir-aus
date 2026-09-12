import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, NotebookPen } from 'lucide-react';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { pickLine } from '../../components/companion/companionRegistry';
import { useT } from '../../i18n';
import { TIMER_DURATIONS_MIN } from '../bridges/BridgeTimerView';

interface ResourceTimerViewProps {
  contextLabel: string;
  onClose: () => void;
  onNaturalComplete?: (durationMin: number) => void;
}

const SLEEP_ELIGIBLE_MIN_MINUTES = 20;
const STOPWATCH_SENTINEL = -1;

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

/**
 * Resources previously had no timer at all — this mirrors
 * BridgeTimerView's state machine deliberately closely (companion tap/
 * sleep behavior, cancel confirmation, stopwatch mode, the natural-
 * completion vs. cancel distinction) rather than inventing a second,
 * differently-behaved timer experience. The one real difference is
 * there's no "level" concept here, so contextLabel is just the
 * resource's own title.
 */
export function ResourceTimerView({ contextLabel, onClose, onNaturalComplete }: ResourceTimerViewProps) {
  const t = useT();
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [done, setDone] = useState(false);
  const [doneLine, setDoneLine] = useState<string | null>(null);
  const [startLine] = useState(() => pickLine({ page: '/entdecken/ressourcen', trigger: 'timer_start' }));
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
        if (isStopwatch) return r + 1;
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setDone(true);
          setDoneLine(pickLine({ page: '/entdecken/ressourcen', trigger: 'timer_ende' }));
          setSleeping(false);
          onNaturalComplete?.(durationMin);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    if (!isStopwatch && durationMin >= SLEEP_ELIGIBLE_MIN_MINUTES) {
      const totalMs = durationMin * 60 * 1000;
      const delay = totalMs * (0.3 + Math.random() * 0.35);
      sleepTimeoutRef.current = setTimeout(() => {
        if (Math.random() < 0.6) {
          setSleepLine(pickLine({ page: '/entdecken/ressourcen', trigger: 'timer_sleep' }));
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

  function completeStopwatch() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const elapsedMin = Math.max(1, Math.round(remaining / 60));
    setDone(true);
    setDoneLine(pickLine({ page: '/entdecken/ressourcen', trigger: 'timer_ende' }));
    setSleeping(false);
    onNaturalComplete?.(elapsedMin);
  }

  function handleCompanionTap() {
    if (sleeping) {
      setSleeping(false);
      setSleepLine(null);
      setTapLine(pickLine({ page: '/entdecken/ressourcen', trigger: 'timer_wake' }));
    } else if (!done && durationMin != null) {
      setTapLine(pickLine({ page: '/entdecken/ressourcen', trigger: 'timer_tap' }));
    } else {
      return;
    }
    if (tapLineTimeoutRef.current) clearTimeout(tapLineTimeoutRef.current);
    tapLineTimeoutRef.current = setTimeout(() => setTapLine(null), 3500);
  }

  function requestClose() {
    if (durationMin == null || done) {
      onClose();
      return;
    }
    setConfirmingCancel(true);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[220] bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 animate-in"
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
            sleepStateOverride={sleeping ? 'sleeping' : undefined}
            onTap={durationMin != null && !confirmingCancel ? handleCompanionTap : undefined}
          />

          {durationMin == null ? (
            <div className="mt-6 text-center max-w-[300px]">
              <p className="text-[13px] text-[var(--color-text-faint)] mb-1">{contextLabel}</p>
              <p className="text-[16px] text-[var(--color-text)] mb-6">{t.bridges.timerPick}</p>
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
                    onClick={() => onNaturalComplete(durationMin === STOPWATCH_SENTINEL ? Math.max(1, Math.round(remaining / 60)) : durationMin)}
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
