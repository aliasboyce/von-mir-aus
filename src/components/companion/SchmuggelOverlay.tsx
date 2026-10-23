import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { InlineCompanionNote } from './InlineCompanionNote';
import { WesenInfoButton } from './WesenInfoButton';
import { INFO_SCHMUGGEL, SCHMUGGEL_ACTIVITIES } from './wesenFunctions';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { triggerHaptic } from '../../services/haptics';

const DEFAULT_SECONDS = 10;

/**
 * "10 Sekunden Schmuggel" — a crack in the wall of functioning. One random
 * activity, exactly ten seconds counted down, then the person may go on
 * functioning right away. Nothing is saved.
 */
export function SchmuggelOverlay({ onClose, autoStart = false }: { onClose: () => void; autoStart?: boolean }) {
  const t = useT();
  useRegisterModalOpen(true);
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const [index, setIndex] = useState(() => Math.floor(Math.random() * SCHMUGGEL_ACTIVITIES.length));
  const total = SCHMUGGEL_ACTIVITIES[index].seconds ?? DEFAULT_SECONDS;
  const [stage, setStage] = useState<'ready' | 'running' | 'done'>(autoStart ? 'running' : 'ready');
  const [left, setLeft] = useState(total);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  // opened from the pop-up "Los": the countdown starts right away
  useEffect(() => {
    if (autoStart) start(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickNew(): number {
    let n = index;
    while (n === index && SCHMUGGEL_ACTIVITIES.length > 1) n = Math.floor(Math.random() * SCHMUGGEL_ACTIVITIES.length);
    setIndex(n);
    return SCHMUGGEL_ACTIVITIES[n].seconds ?? DEFAULT_SECONDS;
  }

  function start(seconds: number = total) {
    setLeft(seconds);
    setStage('running');
    triggerHaptic('tap', settings);
    if (timer.current) clearInterval(timer.current);
    let remaining = seconds;
    timer.current = setInterval(() => {
      remaining -= 1;
      setLeft(remaining);
      if (remaining <= 0) {
        if (timer.current) clearInterval(timer.current);
        triggerHaptic('settle', settings);
        setStage('done');
      }
    }, 1000);
  }

  function again() {
    start(pickNew());
  }

  const act = SCHMUGGEL_ACTIVITIES[index];
  const text = en ? act.en : act.de;
  const title = en ? INFO_SCHMUGGEL.title.en : INFO_SCHMUGGEL.title.de;
  const progress = (total - left) / total;
  const R = 62;
  const C = 2 * Math.PI * R;

  return createPortal(
    <div className="fixed inset-0 z-[240] bg-[var(--color-bg)] flex flex-col items-center px-6 py-14 overflow-y-auto animate-in no-print" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute flex gap-2" style={{ top: 'max(20px, env(safe-area-inset-top))', right: 20 }}>
        <WesenInfoButton info={INFO_SCHMUGGEL} />
        <button onClick={onClose} aria-label={t.common.close} className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center">
          <X size={20} />
        </button>
      </div>

      <InlineCompanionNote />
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mt-5 mb-3">{title}</p>

      {stage === 'ready' && (
        <div className="text-center animate-in flex flex-col items-center">
          <p className="text-[18px] text-[var(--color-text)] max-w-[290px] leading-relaxed mb-2">{en ? 'A small crack in the wall of functioning.' : 'Ein kleiner Riss in der Wand des Funktionierens.'}</p>
          <p className="text-[14px] text-[var(--color-text-muted)] max-w-[290px] leading-relaxed mb-8">{en ? 'Just 10 seconds of something completely different. Then you may carry on right away.' : 'Nur 10 Sekunden etwas ganz anderes. Danach darfst du sofort weiter funktionieren.'}</p>
          <button onClick={() => start()} data-testid="schmuggel-start" className="px-7 py-3 rounded-full text-[16px] bg-[var(--color-primary)] text-[var(--color-surface)]">
            {en ? 'Go' : 'Los'}
          </button>
        </div>
      )}

      {stage === 'running' && (
        <div className="text-center flex flex-col items-center" aria-live="polite">
          <p data-testid="schmuggel-activity" className={`${text.length > 110 ? 'text-[18px]' : 'text-[24px]'} text-[var(--color-text)] max-w-[320px] leading-snug mb-8`} style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
            {text}
          </p>
          <div className="relative flex items-center justify-center" style={{ width: 150, height: 150 }}>
            <svg width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
              <circle cx="75" cy="75" r={R} fill="none" stroke="var(--color-border)" strokeWidth="8" />
              <circle
                cx="75" cy="75" r={R} fill="none" stroke="var(--color-primary)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * progress} transform="rotate(-90 75 75)"
                style={{ transition: settings.reduceMotion ? 'none' : 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span data-testid="schmuggel-count" className="absolute text-[48px] text-[var(--color-text)]" style={{ fontFamily: 'var(--font-companion)', fontWeight: 700 }}>{left}</span>
          </div>
        </div>
      )}

      {stage === 'done' && (
        <div className="text-center animate-in flex flex-col items-center">
          <p data-testid="schmuggel-done" className="text-[24px] text-[var(--color-text)] max-w-[290px] leading-snug mb-2" style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
            {en ? 'And on you go.' : 'Und weiter.'}
          </p>
          <p className="text-[14px] text-[var(--color-text-muted)] max-w-[280px] leading-relaxed mb-8">{en ? 'You may go on functioning right away.' : 'Du darfst sofort wieder funktionieren.'}</p>
          <div className="flex flex-col items-center gap-3 w-full max-w-[260px]">
            <button onClick={onClose} className="w-full px-5 py-3 rounded-full text-[15px] bg-[var(--color-primary)] text-[var(--color-surface)]">{en ? 'Done' : 'Fertig'}</button>
            <button onClick={again} className="w-full px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">{en ? 'Once more' : 'Noch einmal'}</button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
