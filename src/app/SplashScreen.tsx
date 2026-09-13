import { useEffect, useRef, useState } from 'react';
import { LichtCompanion } from '../components/companion/LichtCompanion';
import { useSettings } from '../state/SettingsContext';
import { createKeyValueStore } from '../services/storage/keyValueStore';

/**
 * "Start-Bild beim App-Start"-Auftrag — a brief, quiet moment before
 * the home screen: companion + app name, then a rotating one-line
 * phrase, then the companion floats to EXACTLY where it already sits
 * on the home screen underneath (measured live), landing there as
 * everything fades. Shown once per browser session (sessionStorage);
 * skips itself entirely if reduceMotion is on.
 *
 * "Uebergang wirkt noch etwas abrupt"-Auftrag — the previous version
 * jumped straight from phase 'out' (companion still mid-float) to
 * 'done' (the ENTIRE overlay, including its opaque background,
 * instantly unmounted). The float itself was smooth, but that final
 * disappearance was a hard cut. Added a 'fadeOut' phase: once the
 * float finishes, the whole overlay's own opacity eases to 0 (a
 * proper crossfade onto the real page, which is already sitting
 * ready underneath) before it actually unmounts.
 */
const SESSION_KEY = 'von-mir-aus-splash-shown';
const PHRASE_INDEX_KEY = 'splash-phrase-index';
const phraseIndexStore = createKeyValueStore<number>(PHRASE_INDEX_KEY, 0);

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

// "Langsamer einblenden"-Auftrag — title/phrase fade-in durations
// raised noticeably (900->1400, 700->1100).
// "Blende darf noch etwas mehr sein / Text soll langsam ein- UND
// ausblenden"-Auftrag — fade-in raised further, and the title/phrase
// fade-OUT (previously a quick 60% of the float duration) now takes
// its own full, slow beat instead of rushing to keep up with the
// companion's float.
const TITLE_IN_MS = 1700;
const PHRASE_DELAY_MS = 700;
const PHRASE_IN_MS = 1300;
const SECOND_LINE_DELAY_MS = 1100;
const HOLD_MS = 1000;
const TEXT_OUT_MS = 1000;
const FLOAT_OUT_MS = 950;
const FADE_OUT_MS = 450;

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'fadeOut' | 'done'>(() => {
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
  const companionWrapRef = useRef<HTMLDivElement>(null);
  const [floatTransform, setFloatTransform] = useState('translate(0, 0) scale(1)');

  useEffect(() => {
    if (phase === 'done') return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // best-effort only
    }
    const holdStart = TITLE_IN_MS + PHRASE_DELAY_MS + PHRASE_IN_MS;
    const fadeOutStart = holdStart + HOLD_MS + Math.max(FLOAT_OUT_MS, TEXT_OUT_MS);
    const timers = [
      window.setTimeout(() => setPhase('hold'), holdStart),
      window.setTimeout(() => {
        // Measure right before starting the float-out (not earlier —
        // the real home companion needs a moment to have settled into
        // its actual layout position first) and compute the exact
        // delta from the splash companion's current center to the
        // real one's center, so the CSS transition below can animate
        // precisely onto it instead of an approximated offset.
        const from = companionWrapRef.current?.getBoundingClientRect();
        const to = document.querySelector('[data-hero-companion-anchor] [data-no-tap-feedback]')?.getBoundingClientRect();
        if (from && to) {
          const fromCenterX = from.left + from.width / 2;
          const fromCenterY = from.top + from.height / 2;
          const toCenterX = to.left + to.width / 2;
          const toCenterY = to.top + to.height / 2;
          const scale = to.width / from.width;
          setFloatTransform(`translate(${toCenterX - fromCenterX}px, ${toCenterY - fromCenterY}px) scale(${scale})`);
        }
        setPhase('out');
      }, holdStart + HOLD_MS),
      window.setTimeout(() => setPhase('fadeOut'), fadeOutStart),
      window.setTimeout(() => setPhase('done'), fadeOutStart + FADE_OUT_MS),
    ];
    if (phrase.isLast) {
      timers.push(window.setTimeout(() => setShowSecondLine(true), TITLE_IN_MS + PHRASE_DELAY_MS + SECOND_LINE_DELAY_MS));
    }
    return () => timers.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'done') return <>{children}</>;

  const floating = phase === 'out' || phase === 'fadeOut';
  const fadingOutWhole = phase === 'fadeOut';

  return (
    <>
      {/* Mounted first (underneath), so the real hero companion exists
          in the DOM and can be measured before the float-out starts. */}
      {children}
      <div
        className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
        style={{
          background: 'var(--color-bg)',
          pointerEvents: floating ? 'none' : undefined,
          opacity: fadingOutWhole ? 0 : 1,
          transition: `opacity ${FADE_OUT_MS}ms ease`,
        }}
      >
        <div
          ref={companionWrapRef}
          style={{
            transition: `transform ${FLOAT_OUT_MS}ms cubic-bezier(0.45, 0, 0.2, 1), opacity ${FLOAT_OUT_MS}ms ease`,
            transform: floating ? floatTransform : 'translate(0, 0) scale(1)',
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
            transition: `opacity ${floating ? TEXT_OUT_MS : TITLE_IN_MS}ms ease`,
          }}
        >
          von mir aus
        </p>
        <div
          className="mt-2 text-center px-8"
          style={{
            opacity: floating ? 0 : 1,
            transition: `opacity ${floating ? TEXT_OUT_MS : PHRASE_IN_MS}ms ease ${floating ? 0 : PHRASE_DELAY_MS}ms`,
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
    </>
  );
}
