import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { InlineCompanionNote } from './InlineCompanionNote';
import { useHeroCompanion } from '../../state/HeroCompanionContext';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { Button } from '../ui/Button';

/**
 * Real navigation, not screenshots or icon cards - each stop actually
 * routes to the real page so the person sees the genuine buttons and
 * layout while the companion explains it. Routes stay a plain constant
 * (URLs aren't translated); title/text come from i18n (t.companion.tourStops)
 * so the tour works correctly in both languages, not just German.
 */
const TOUR_PATHS = [
  '/',
  '/inneres-wetter',
  '/inneres-wetter',
  '/zugang',
  '/entdecken/gefuehle',
  '/entdecken/nervensystem',
  '/entdecken/schutzstrategien',
  '/entdecken',
  '/entdecken/beduerfnis-kompass',
  '/entdecken/wertekompass',
  '/entdecken/denkmaschine',
  '/entdecken/loslassen',
  '/entdecken/garten',
  '/entdecken/ressourcen',
  '/entdecken/ressourcen',
  '/bruecken',
  '/bruecken',
  '/entdecken/timer',
  '/sicherheit/netzwerk',
  '/sicherheit/netzwerk',
  '/sicherheit/plan',
  '/sicherheit/tagebuch',
  '/entdecken/medi-log',
  '/krisenmodus',
  '/helfermodus',
  '/',
  '/',
  '/system-karte',
  '/quellen',
  '/einstellungen',
];

interface AppTourOverlayProps {
  /** called when the person closes the tour early (X button) — just stops
   * the tour, doesn't force any navigation */
  onClose: () => void;
  /** called only when the tour is completed all the way to the end —
   * distinct from onClose so the intended "tour → first check-in" flow
   * only happens on real completion, not on an early skip */
  onFinish: () => void;
}

export function AppTourOverlay({ onClose, onFinish }: AppTourOverlayProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const t = useT();
  const { heroMounted } = useHeroCompanion();
  const [index, setIndex] = useState(0);
  // One extra "virtual" step after the last real stop, for the warm
  // closing message — doesn't navigate anywhere (stays on the last real
  // page), just adds a final card before actually finishing.
  const isClosing = index === TOUR_PATHS.length;
  const stop = isClosing
    ? { path: TOUR_PATHS[TOUR_PATHS.length - 1], title: t.companion.tourClosingTitle, text: t.companion.tourClosingText }
    : { path: TOUR_PATHS[index], ...t.companion.tourStops[index] };

  useEffect(() => {
    navigate(stop.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[250] px-4 pb-4 animate-in no-print"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div
        className="mx-auto rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] border border-[var(--color-border)] p-4"
        style={{ maxWidth: 480 }}
      >
        <div className="flex items-start gap-3 mb-3">
          {/* The current real page might already show its own large
           * companion (Home does). Drawing a second one here would be
           * exactly the "companion appears twice" problem this app has
           * been specifically fixed for elsewhere — only render the
           * tour's own companion note when nothing on screen already
           * shows one. */}
          {!heroMounted && <InlineCompanionNote />}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[var(--color-text)] mb-0.5">{stop.title}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{stop.text}</p>
          </div>
          <button onClick={onClose} aria-label={t.companion.closeTour} className="p-1 text-[var(--color-text-faint)] flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-3">
          {TOUR_PATHS.map((_, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: i === index ? 14 : 5,
                height: 5,
                background: i === index ? 'var(--color-primary)' : 'var(--color-border)',
                transition: settings.reduceMotion ? 'none' : 'width 0.2s ease',
              }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="ghost" onClick={() => setIndex((i) => i - 1)}>
              {t.common.back}
            </Button>
          )}
          <Button fullWidth onClick={() => (isClosing ? onFinish() : setIndex((i) => i + 1))}>
            {isClosing ? t.companion.tourClosingCta : t.companion.pickerContinue}
          </Button>
        </div>
      </div>
    </div>
  );
}
