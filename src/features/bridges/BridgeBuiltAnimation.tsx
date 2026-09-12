import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';

/**
 * "Bruecke erstellt -> Bau-Animation, mehr ausgebaut"-Auftrag — a
 * fuller ~4s sequence: a sun rises and warms the sky, then the two
 * pillars rise from the ground, then the arch draws itself between
 * them piece by piece, then a brief settled/complete moment, then a
 * soft fade to the real saved card. Portal + ModalStackContext so it
 * correctly covers the full screen and hides the bottom nav, matching
 * the fix already applied to Loslassen.
 */
export function BridgeBuiltAnimation({ title, onDone }: { title: string; onDone: () => void }) {
  const t = useT();
  const [phase, setPhase] = useState<'sunrise' | 'pillars' | 'arch' | 'settled' | 'fading'>('sunrise');
  useRegisterModalOpen(true);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase('pillars'), 900),
      window.setTimeout(() => setPhase('arch'), 1700),
      window.setTimeout(() => setPhase('settled'), 3100),
      window.setTimeout(() => setPhase('fading'), 3800),
      window.setTimeout(() => onDone(), 4300),
    ];
    return () => timers.forEach((tm) => window.clearTimeout(tm));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sunUp = phase !== 'sunrise';
  const pillarsUp = phase === 'pillars' || phase === 'arch' || phase === 'settled';
  const archDrawn = phase === 'arch' || phase === 'settled';

  return createPortal(
    <div
      className="fixed inset-0 z-[235] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #E8D9B5 0%, #F3E8CE 55%, #EDE2C8 100%)',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.45s ease',
      }}
    >
      <svg viewBox="0 0 240 160" width="260" role="img" aria-hidden="true">
        {/* Sun: rises from behind the horizon and settles with a soft glow */}
        <circle
          cx="120"
          cy={sunUp ? 46 : 130}
          r="22"
          fill="#F2C572"
          style={{ transition: 'cy 1.1s cubic-bezier(0.34, 1.15, 0.64, 1)', opacity: 0.9 }}
        />
        <circle
          cx="120"
          cy={sunUp ? 46 : 130}
          r="34"
          fill="#F2C572"
          opacity={sunUp ? 0.18 : 0}
          style={{ transition: 'cy 1.1s cubic-bezier(0.34, 1.15, 0.64, 1), opacity 1s ease' }}
        />

        {/* Ground line */}
        <line x1="10" y1="128" x2="230" y2="128" stroke="#B99A63" strokeWidth="2" opacity="0.5" />

        {/* Two pillars rising out of the ground */}
        <rect x="34" y={pillarsUp ? 78 : 128} width="10" height="50" rx="2" fill="var(--color-primary)" style={{ transition: 'y 0.8s cubic-bezier(0.34, 1.1, 0.64, 1)' }} />
        <rect x="196" y={pillarsUp ? 78 : 128} width="10" height="50" rx="2" fill="var(--color-primary)" style={{ transition: 'y 0.8s cubic-bezier(0.34, 1.1, 0.64, 1) 0.15s' }} />

        {/* The arch, drawing itself between the pillars once they've landed */}
        <path
          d="M 30,90 Q 120,20 210,90"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          style={{
            strokeDasharray: 260,
            strokeDashoffset: archDrawn ? 0 : 260,
            transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: pillarsUp ? 1 : 0,
          }}
        />
        <circle cx="30" cy="90" r="5" fill="var(--color-primary)" style={{ opacity: archDrawn ? 1 : 0, transition: 'opacity 0.3s ease 1.1s' }} />
        <circle cx="210" cy="90" r="5" fill="var(--color-primary)" style={{ opacity: archDrawn ? 1 : 0, transition: 'opacity 0.3s ease 1.1s' }} />
      </svg>
      <p className="text-[14px] text-[var(--color-text-muted)] mt-2 text-center px-8">
        {phase === 'settled' || phase === 'fading' ? title : t.bridges.buildingText}
      </p>
    </div>,
    document.body
  );
}
