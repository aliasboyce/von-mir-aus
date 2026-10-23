import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { LichtCompanion } from '../../components/companion/LichtCompanion';
import { useRegisterExternalModalOpen, useRegisterModalOpen } from '../../state/ModalStackContext';
import { useSettings } from '../../state/SettingsContext';
import { dueGate, markOpened, markShown, type DayPhase } from './dayFlowRepo';
import { firstUseStore } from '../../services/testSupport';
import { localDayKey } from '../routines/routinesRepo';
import { useDayFlowTexts } from './dayFlowTexts';

/**
 * The first time the app is opened in the morning (and again in the evening): everything else is
 * hidden, only the companion and one button. The cross brings back everything as usual.
 */
export function DayGate({ pathname }: { pathname: string }) {
  const { settings } = useSettings();
  const [phase, setPhase] = useState<DayPhase | null>(null);
  const [checked, setChecked] = useState(false);
  const eligible = pathname === '/' && !settings.nurJetztMode && !settings.tourActive && settings.introSeen && settings.companionChosen;

  useEffect(() => {
    if (checked || !eligible) return;
    setChecked(true);
    // on the very first day of use the introduction and the tour come first – the invitation starts the day after
    const first = firstUseStore.get();
    if (!first || localDayKey(new Date(first)) === localDayKey()) return;
    const due = dueGate(settings);
    if (due) {
      markShown(due);
      setPhase(due);
    }
  }, [eligible, checked, settings]);

  if (!phase) return null;
  return <GateOverlay phase={phase} onDone={() => setPhase(null)} />;
}

function GateOverlay({ phase, onDone }: { phase: DayPhase; onDone: () => void }) {
  const dx = useDayFlowTexts();
  const navigate = useNavigate();
  useRegisterModalOpen(true);
  useRegisterExternalModalOpen(true);
  const start = phase === 'start';
  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center text-center px-8 animate-in" style={{ background: 'var(--color-bg)' }} role="dialog" aria-modal="true" data-testid={`day-gate-${phase}`}>
      <button
        type="button"
        onClick={onDone}
        aria-label={dx.close}
        data-sound="close"
        className="absolute w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
        style={{ top: 'max(18px, env(safe-area-inset-top))', right: 18 }}
        data-testid="day-gate-close"
      >
        <X size={20} />
      </button>
      <LichtCompanion size="large" joyBurst={null} />
      <p className="text-[17px] text-[var(--color-text)] mt-6 mb-8 leading-relaxed max-w-[280px]">{start ? dx.startGreeting : dx.endGreeting}</p>
      <button
        type="button"
        onClick={() => {
          markOpened(phase);
          onDone();
          navigate(start ? '/tag-beginnen' : '/tag-abschliessen');
        }}
        className="rounded-full px-8 py-3.5 text-[16px] font-medium text-white shadow-[var(--shadow-md)]"
        style={{ background: 'var(--color-primary)' }}
        data-testid="day-gate-open"
      >
        {start ? dx.startButton : dx.endButton}
      </button>
    </div>,
    document.body,
  );
}
