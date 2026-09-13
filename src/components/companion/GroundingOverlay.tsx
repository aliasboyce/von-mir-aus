import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from 'lucide-react';
import { InlineCompanionNote } from './InlineCompanionNote';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { getActiveGroundingSteps } from './groundingManagement';
import { triggerHaptic } from '../../services/haptics';
import { useRegisterModalOpen } from '../../state/ModalStackContext';

interface GroundingOverlayProps {
  onClose: () => void;
}

/**
 * Based on the 5-4-3-2-1 grounding technique (developed by trauma
 * psychotherapist Yvonne Dolan, a variation of Betty Erickson's technique)
 * - see docs/open-issues.md for sources. Deliberately NOT a rigid "find
 * exactly 5 things" countdown - every step is phrased as an open
 * invitation, never a required count, and can be skipped or closed at
 * any point.
 *
 * The sensory steps now have an actual input field, not just a question
 * to silently read - the point is the small act of noticing and naming,
 * not producing a record. Deliberately kept in plain component state
 * (useState) only, never touching any repo or localStorage, so it's
 * structurally impossible for this to leave a saved trace - closing or
 * finishing the exercise simply lets React discard the state.
 *
 * Steps themselves now come from getActiveGroundingSteps() rather than
 * a static i18n array — see groundingManagement.ts — so individual
 * steps can be turned off and the person's own steps can be added, the
 * same "verwaltbar" capability the other Wesen-Inhalte tabs have.
 */
export function GroundingOverlay({ onClose }: GroundingOverlayProps) {
  const t = useT();
  useRegisterModalOpen(true);
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [breathPhase, setBreathPhase] = useState<'in' | 'out'>('in');
  const [steps] = useState(() => getActiveGroundingSteps());
  const isLast = step === steps.length - 1;
  const current = steps[step];
  const isBreathStep = 'isBreath' in current && current.isBreath === true;
  const showInput = current.hasInput;

  useEffect(() => {
    if (!isBreathStep) return;
    // "Atem-Vibration wurde nicht wahrgenommen"-Auftrag — this used to
    // also skip entirely when settings.reduceMotion is on. That's a
    // category error: reduceMotion means "less visual animation", not
    // "no haptic feedback" — vibration isn't motion on screen. The
    // circle's own growing/shrinking already respects reduceMotion
    // separately (see the width/height/transition below); the
    // interval driving it and the haptic pulses at each phase change
    // should keep running regardless, since haptics are likely the
    // more important channel for exactly the people who turn
    // reduceMotion on in the first place.
    // A slow, fixed 4s-in/4s-out rhythm — deliberately simple and
    // unhurried rather than trying to match any specific breathing
    // technique's exact timing, since the point here is a gentle shared
    // moment, not a precise exercise.
    triggerHaptic('select', settings);
    const interval = setInterval(() => {
      setBreathPhase((p) => {
        triggerHaptic('select', settings);
        return p === 'in' ? 'out' : 'in';
      });
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBreathStep, settings.hapticsEnabled]);

  return createPortal(
    <div
      className="fixed inset-0 z-[240] bg-[var(--color-bg)] flex flex-col items-center px-6 py-14 overflow-y-auto animate-in no-print"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label={t.common.close}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
        style={{ top: 'max(20px, env(safe-area-inset-top))' }}
      >
        <X size={20} />
      </button>

      <InlineCompanionNote />

      {step === 0 && <p className="text-[13px] text-[var(--color-text-faint)] mt-5 mb-1">{t.companion.groundingIntro}</p>}

      {isBreathStep ? (
        <div className="flex flex-col items-center mt-5">
          <p className="text-[15px] text-[var(--color-text)] text-center max-w-[280px] leading-relaxed mb-6">
            {t.companion.groundingBreathIntro}
          </p>
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: settings.reduceMotion ? 140 : breathPhase === 'in' ? 160 : 100,
              height: settings.reduceMotion ? 140 : breathPhase === 'in' ? 160 : 100,
              background: 'var(--color-primary-soft)',
              transition: settings.reduceMotion ? 'none' : 'width 4s ease-in-out, height 4s ease-in-out',
            }}
          >
            <span className="text-[14px] text-[var(--color-primary)]">
              {settings.reduceMotion ? '' : breathPhase === 'in' ? t.companion.groundingBreathIn : t.companion.groundingBreathOut}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-[18px] text-[var(--color-text)] text-center max-w-[290px] leading-relaxed mt-5 mb-4">
          {isEn ? current.textEn : current.text}
        </p>
      )}

      {showInput && (
        <div className="w-full max-w-[290px] mb-2">
          <input
            autoFocus
            className="input text-center"
            placeholder={t.companion.groundingInputPlaceholder}
            value={answers[step] ?? ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [step]: e.target.value }))}
          />
          <p className="text-[11px] text-[var(--color-text-faint)] text-center mt-2">{t.companion.groundingNoSave}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 mb-6 mt-4">
        {steps.map((_, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: i === step ? 14 : 5,
              height: 5,
              background: i === step ? 'var(--color-primary)' : 'var(--color-border)',
              transition: settings.reduceMotion ? 'none' : 'width 0.2s ease',
            }}
          />
        ))}
      </div>

      {isLast ? (
        <button onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]">
          {t.common.close}
        </button>
      ) : (
        <>
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]"
          >
            {t.companion.pickerContinue}
            <ArrowRight size={14} />
          </button>
          <button onClick={onClose} className="text-[12px] text-[var(--color-text-faint)] underline mt-3">
            {t.companion.groundingNotHelpingCta}
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
