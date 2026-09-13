import { useEffect, useState } from 'react';
import { LichtCompanion } from '../components/companion/LichtCompanion';
import { useSettings } from '../state/SettingsContext';
import { createKeyValueStore } from '../services/storage/keyValueStore';

/**
 * "Start-Bild beim App-Start"-Auftrag — a brief, quiet moment before
 * the home screen: companion + app name, then a rotating one-line
 * phrase, then the companion "floats back" toward its resting corner
 * as everything fades, landing on the real home screen. Shown once
 * per browser session (sessionStorage) — reopening in a fresh tab
 * shows it again, navigating inside the app never re-triggers it, and
 * it never blocks anyone (timed, not dismiss-gated) or shows itself
 * at all if reduceMotion is on.
 */
const SESSION_KEY = 'von-mir-aus-splash-shown';
const PHRASE_INDEX_KEY = 'splash-phrase-index';
const phraseIndexStore = createKeyValueStore<number>(PHRASE_INDEX_KEY, 0);

// The last entry is deliberately two lines shown one after another
// (see below) rather than a single string — kept as a 2-tuple so the
// rotation logic below can treat every entry uniformly by index while
// still rendering that last one specially.
const PHRASES: string[] = [
  '… irgendwo muss man ja anfangen.',
  '… ich fang einfach mal bei mir an.',
  '… kann das Leben losgehen.',
  '… dann versuchen wir\u2019s eben von hier aus.',
  '… ich mach\u2019s einfach mal möglich.',
  '… mal sehen, was von mir aus möglich ist.',
  '… schau ma mal was wird.',
];
const LAST_PHRASE_SECOND_LINE = '… was wird.';

function nextPhraseAndAdvance(): { text: string; isLast: boolean } {
  const idx = phraseIndexStore.get() ?? 0;
  const safeIdx = ((idx % PHRASES.length) + PHRASES.length) % PHRASES.length;
  phraseIndexStore.set((safeIdx + 1) % PHRASES.length);
  return { text: PHRASES[safeIdx], isLast: safeIdx === PHRASES.length - 1 };
}

const TITLE_IN_MS = 900;
const PHRASE_DELAY_MS = 500;
const PHRASE_IN_MS = 700;
const SECOND_LINE_DELAY_MS = 900;
const HOLD_MS = 900;
const FLOAT_OUT_MS = 900;

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'done'>(() => {
    if (settings.reduceMotion) return 'done';
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return 'done';
    } catch {
      return 'done';
    }
    return 'in';
  });
  const [phrase] = useState(() => nextPhraseAndAdvance());
  const [showSecondLine, setShowSecondLine] = useState(false);

  useEffect(() => {
    if (phase === 'done') return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // best-effort only
    }
    const holdStart = TITLE_IN_MS + PHRASE_DELAY_MS + PHRASE_IN_MS;
    const timers = [
      window.setTimeout(() => setPhase('hold'), holdStart),
      window.setTimeout(() => setPhase('out'), holdStart + HOLD_MS),
      window.setTimeout(() => setPhase('done'), holdStart + HOLD_MS + FLOAT_OUT_MS),
    ];
    if (phrase.isLast) {
      timers.push(window.setTimeout(() => setShowSecondLine(true), TITLE_IN_MS + PHRASE_DELAY_MS + SECOND_LINE_DELAY_MS));
    }
    return () => timers.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'done') return <>{children}</>;

  const floating = phase === 'out';

  return (
    <>
      <div
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
        style={{ background: 'var(--color-bg)', pointerEvents: floating ? 'none' : undefined }}
      >
        <div
          style={{
            transition: `transform ${FLOAT_OUT_MS}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${FLOAT_OUT_MS}ms ease`,
            // "Wesen schwebt nach hinten zur Ausgangsposition"-Auftrag —
            // during the float-out, the companion visually drifts toward
            // its actual resting corner (bottom-right, matching
            // companion.css's floating-dock position and the intro
            // flow's own hero placement) instead of the whole splash
            // just fading uniformly in place. Approximate screen-relative
            // offset rather than a pixel-perfect handoff to the real
            // dock element — the destination differs slightly by
            // viewport/whether the intro or home screen follows, so a
            // convincing "drifts toward the corner" motion matters more
            // here than an exact handoff.
            transform: floating ? 'translate(38vw, 34vh) scale(0.35)' : 'translate(0, 0) scale(1)',
          }}
        >
          <LichtCompanion size="large" />
        </div>
        <p
          className="mt-5 text-[22px]"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
            opacity: floating ? 0 : 1,
            transition: `opacity ${floating ? FLOAT_OUT_MS : TITLE_IN_MS}ms ease`,
          }}
        >
          von mir aus
        </p>
        <div
          className="mt-2 text-center px-8"
          style={{
            opacity: floating ? 0 : 1,
            transition: `opacity ${floating ? FLOAT_OUT_MS : PHRASE_IN_MS}ms ease ${floating ? 0 : PHRASE_DELAY_MS}ms`,
          }}
        >
          <p className="text-[14px]" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
            {phrase.text}
          </p>
          {phrase.isLast && (
            <p
              className="text-[14px]"
              style={{
                color: 'var(--color-text-muted)',
                opacity: showSecondLine ? 0.7 : 0,
                transition: `opacity ${PHRASE_IN_MS}ms ease`,
              }}
            >
              {LAST_PHRASE_SECOND_LINE}
            </p>
          )}
        </div>
      </div>
      {/* Mount the real app underneath right away so the first paint
          after the splash is already the fully-loaded home screen. */}
      {children}
    </>
  );
}
