import { useEffect, useState } from 'react';
import { useSettings } from '../../state/SettingsContext';
import { playCompanionSound } from '../../services/sounds';
import { getAnyLichtwesen } from './customLichtwesen';
import { LichtwesenEyes } from './LichtwesenEyes';
import './companion.css';

interface LichtCompanionProps {
  /** small = fixed floating companion (nav corner), large = selection screen preview */
  size?: 'small' | 'large';
  onTap?: () => void;
  /** true while the companion currently has something to say — grows it
   * moderately so it's more noticeable in the moment it actually speaks,
   * without being permanently oversized. */
  presence?: boolean;
  /** briefly plays one of several short joy animations on top of the
   * normal idle movement — set for a moment after a real completion
   * (creating something, finishing an entry), then cleared by the caller. */
  joyBurst?: 'hop' | 'spin' | 'wobble' | 'dance' | null;
  /** shows this specific being instead of reading settings.selectedBrainId
   * — for the rare screens (first-launch name step) that need to show a
   * particular being before any selection has actually been saved yet. */
  beingOverride?: import('./lichtwesen').LichtwesenConfig;
  /** overrides the sleep/settling/waking visual state locally, WITHOUT
   * touching settings.brainState — used by long timers, which want the
   * companion to visually doze off during a long wait without changing
   * the person's actual global sleep setting for the rest of the app.
   * 'meditating' is a separate, calmer-but-awake state (slow breathing
   * motion, eyes open) for shorter timers where "asleep" would feel
   * like too much — see the "Timer-Wesen"-Auftrag. */
  sleepStateOverride?: 'awake' | 'settling' | 'sleeping' | 'waking' | 'meditating';
}

export function LichtCompanion({
  size = 'small',
  onTap,
  presence = false,
  joyBurst = null,
  beingOverride,
  sleepStateOverride,
}: LichtCompanionProps) {
  const { settings } = useSettings();
  const being = beingOverride ?? getAnyLichtwesen(settings.selectedBrainId);
  const [blinking, setBlinking] = useState(false);
  const effectiveState = sleepStateOverride ?? settings.brainState;
  const isSleeping = effectiveState === 'sleeping';
  const isSettling = effectiveState === 'settling';
  const isWaking = effectiveState === 'waking';
  const isMeditating = effectiveState === 'meditating';
  const baseDimension = size === 'large' ? 108 : 76;
  const dimension = baseDimension;

  useEffect(() => {
    if (isSleeping || isSettling || isWaking || settings.reduceMotion) return;
    let timeout: ReturnType<typeof setTimeout>;
    function scheduleBlink() {
      timeout = setTimeout(
        () => {
          setBlinking(true);
          setTimeout(() => setBlinking(false), 140);
          scheduleBlink();
        },
        2200 + Math.random() * 2800,
      );
    }
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, [isSleeping, isSettling, isWaking, settings.reduceMotion]);

  function handleTap() {
    // "Suesser Ton beim Antippen, wie gekitzelt"-Auftrag
    playCompanionSound('giggle', settings);
    onTap?.();
  }

  if (!settings.brainEnabled && size === 'small') return null;

  const eyesClosed = isSleeping || isSettling || isWaking;

  return (
    <div
      style={{
        display: 'inline-block',
        transform: presence ? 'scale(1.28)' : 'scale(1)',
        // Only the small, corner-docked floating companion should grow
        // "into" a fixed corner — the large hero/selection-screen usage
        // (FirstNameStep, companion picker) is meant to sit centered on
        // its own, and scaling from a corner there visibly dragged it
        // off-center relative to the text centered underneath it, even
        // though the surrounding layout was correctly centered.
        transformOrigin: size === 'large' ? 'center' : 'bottom right',
        transition: settings.reduceMotion ? 'none' : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <button
        type="button"
        onClick={handleTap}
        data-no-tap-feedback
        aria-label={being.name}
        className={[
          'lichtwesen',
          isSettling
            ? 'lichtwesen--settling'
            : isSleeping
              ? 'lichtwesen--sleeping'
              : isWaking
                ? 'lichtwesen--waking'
                : isMeditating
                  ? 'lichtwesen--meditating'
                  : `lichtwesen--awake lichtwesen--movement-${being.movement}`,
          joyBurst ? `lichtwesen--joy-${joyBurst}` : '',
        ].join(' ')}
        style={{ width: dimension, height: dimension }}
      >
      <span
        className="lichtwesen__glow"
        style={{ background: `radial-gradient(circle, ${being.glow} 0%, transparent 72%)` }}
      />
      <svg viewBox="0 0 100 110" width={dimension} height={dimension} aria-hidden="true">
        {/* antenna */}
        <path
          d="M42 20C40 12 44 6 50 3"
          stroke={being.color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle cx="50" cy="3" r="2.4" fill={being.glow} />

        {/* fluffy body: layered soft-edged circles to fake a plush silhouette */}
        <g opacity="0.9">
          <circle cx="30" cy="35" r="10" fill={being.color} opacity="0.55" />
          <circle cx="70" cy="34" r="10" fill={being.color} opacity="0.55" />
          <circle cx="22" cy="55" r="9" fill={being.color} opacity="0.5" />
          <circle cx="78" cy="55" r="9" fill={being.color} opacity="0.5" />
          <circle cx="26" cy="75" r="8" fill={being.color} opacity="0.45" />
          <circle cx="74" cy="75" r="8" fill={being.color} opacity="0.45" />
        </g>
        <circle cx="50" cy="56" r="34" fill={being.color} />
        <circle cx="50" cy="56" r="34" fill="#fff" opacity="0.1" />

        {being.bodyDots && (
          <g opacity="0.5">
            <circle cx="27" cy="42" r="2.6" fill="#fff" />
            <circle cx="74" cy="45" r="2" fill="#fff" />
            <circle cx="68" cy="72" r="2.3" fill="#fff" />
            <circle cx="30" cy="75" r="1.8" fill="#fff" />
            <circle cx="50" cy="82" r="2" fill="#fff" />
          </g>
        )}

        {/* one big eye, plush ring around it */}
        <circle cx="50" cy="54" r="19" fill="#fff" />
        <circle cx="50" cy="54" r="19" fill="none" stroke={being.color} strokeWidth="3" opacity="0.35" />
        {eyesClosed ? (
          <path d="M39 54q11 8 22 0" stroke={being.color} strokeWidth="3.4" fill="none" strokeLinecap="round" />
        ) : (
          <LichtwesenEyes style={being.eyeStyle} color={being.color} blinking={blinking} bigEye />
        )}

        {/* tiny mouth */}
        {!eyesClosed && (
          <path d="M45 78q5 4 10 0" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85" />
        )}

        {/* sparkle particles */}
        <circle cx="14" cy="24" r="2" fill={being.glow} opacity="0.9" />
        <circle cx="88" cy="30" r="1.4" fill={being.glow} opacity="0.8" />
        <circle cx="82" cy="16" r="1.7" fill={being.glow} opacity="0.7" />
      </svg>
      {isSleeping && (
        <svg viewBox="0 0 24 24" width={dimension * 0.28} height={dimension * 0.28} className="lichtwesen__moon" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z" fill="var(--color-surface)" />
        </svg>
      )}
      {isMeditating && (
        <svg viewBox="0 0 24 24" width={dimension * 0.3} height={dimension * 0.3} className="lichtwesen__leaf" aria-hidden="true">
          <path d="M4 20c8-1 14-7 15-15C10 6 5 12 4 20z" fill="var(--color-primary)" opacity="0.85" />
          <path d="M6 18C11 13 15 9 18 6" stroke="var(--color-surface)" strokeWidth="1" fill="none" opacity="0.6" />
        </svg>
      )}
      </button>
    </div>
  );
}
