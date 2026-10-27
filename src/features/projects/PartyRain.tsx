import { useSettings } from '../../state/SettingsContext';

const EMOJIS = ['🎉', '✨', '🌟', '🎊', '💛', '🌿', '💫', '🌸', '🥳', '🎈'];

/** Konfetti-Regen aus Emojis – ruhig und kurz; wer „Bewegung reduzieren“ nutzt, sieht ihn nicht. */
export function PartyRain() {
  const { settings } = useSettings();
  if (settings.reduceMotion) return null;
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden" aria-hidden="true" data-testid="project-party">
      {Array.from({ length: 26 }, (_, i) => (
        <span key={i} className="absolute text-[26px]" style={{ left: `${(i * 37) % 96}%`, top: '-6%', animation: `party-fall ${3.4 + (i % 5) * 0.5}s ease-in ${(i % 9) * 140}ms both` }}>{EMOJIS[i % EMOJIS.length]}</span>
      ))}
    </div>
  );
}
