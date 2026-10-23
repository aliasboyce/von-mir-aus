import { useEffect, useRef, useState } from 'react';

export type LetGoRitual = 'papierflieger' | 'zerknuellen' | 'zerreissen';

interface LetGoIllustrationProps {
  ritual: LetGoRitual;
  /** True once the final "fly away / fall / separate" motion should
   * play — automatically for papierflieger, or once the person has
   * dragged far enough for crumple/tear and released. */
  finalizing: boolean;
  thought: string;
  reduceMotion?: boolean;
  /** Called once the ritual has "committed" to finishing — the
   * parent starts the actual removal timer from this point. */
  onFinalize: () => void;
}

/**
 * "Gesamtpruefung"-Auftrag, Section 6 — rebuilt with the concrete
 * problems from the brief in mind:
 *
 * - The paper is now large (up to 420px, most of the viewport on a
 *   phone) instead of a small centered box, so the overlay actually
 *   feels immersive rather than like a small popup on a dark backdrop.
 * - Crumpling and tearing are now GENUINELY interactive — real
 *   pointer (touch + mouse) drag drives the paper's deformation in
 *   real time, not a fixed timer. This only became possible once the
 *   parent overlay's pointer-events-none was removed; no amount of
 *   rebuilding the illustration itself could have fixed that.
 * - Papierflieger keeps the multi-stage held-fold approach (four
 *   distinct clip-path stages, each visible long enough to register)
 *   rather than one continuous blur, now at the larger size.
 * - The actual written thought stays part of the animation the whole
 *   time (rendered inside the paper, not swapped for a generic shape)
 *   and only fades once folding/crumpling/tearing has visibly begun.
 */
function fontSizeFor(text: string): number {
  const len = text.length;
  if (len < 80) return 17;
  if (len < 160) return 15;
  if (len < 300) return 13;
  return 11;
}

const PAPER_W = 'min(85vw, 55vh, 420px)';
const PAPER_H_RATIO = 1.3;

function PaperText({ thought, fade }: { thought: string; fade?: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '11%', pointerEvents: 'none' }}>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: fontSizeFor(thought),
          lineHeight: 1.45,
          color: 'var(--color-text)',
          maxHeight: '100%',
          overflowY: 'auto',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          opacity: fade ? 0 : 1,
          transition: fade ? 'opacity 0.9s ease-in' : 'none',
          pointerEvents: 'none',
        }}
      >
        {thought}
      </div>
      <div
        style={{
          position: 'absolute',
          left: '11%',
          right: '11%',
          bottom: '6%',
          height: 16,
          background: 'linear-gradient(to bottom, transparent, var(--color-surface))',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export function LetGoIllustration({ ritual, finalizing, thought, reduceMotion, onFinalize }: LetGoIllustrationProps) {
  if (reduceMotion) {
    return (
      <ReducedMotionPaper thought={thought} finalizing={finalizing} onFinalize={onFinalize} />
    );
  }
  if (ritual === 'papierflieger') return <PapierfliegerRitual thought={thought} finalizing={finalizing} onFinalize={onFinalize} />;
  if (ritual === 'zerknuellen') return <ZerknuellenRitual thought={thought} finalizing={finalizing} onFinalize={onFinalize} />;
  return <ZerreissenRitual thought={thought} finalizing={finalizing} onFinalize={onFinalize} />;
}

function ReducedMotionPaper({ thought, finalizing, onFinalize }: { thought: string; finalizing: boolean; onFinalize: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onFinalize, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      style={{
        width: PAPER_W,
        aspectRatio: `1 / ${PAPER_H_RATIO}`,
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-border-strong)',
        borderRadius: 8,
        position: 'relative',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        transition: 'opacity 0.6s ease',
        opacity: finalizing ? 0.1 : 1,
      }}
    >
      <PaperText thought={thought} fade={finalizing} />
    </div>
  );
}

// ---------------- Papierflieger: automatic, multi-stage fold ----------------
function PapierfliegerRitual({ thought, finalizing, onFinalize }: { thought: string; finalizing: boolean; onFinalize: () => void }) {
  useEffect(() => {
    // "Loslassen-Animationen einzeln ueberpruefen"-Auftrag — genuine
    // issue found: this used to fire after only 550ms, meaning the
    // person saw their own written words for barely half a second
    // before folding started automatically. For a reflective ritual,
    // that's nowhere near enough time to actually take in what's on
    // the page. Increased to a real pause first.
    const timer = window.setTimeout(onFinalize, 2600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: PAPER_W, aspectRatio: `1 / ${PAPER_H_RATIO}`, position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: finalizing ? 'plane-fly-away 2.4s ease-in both' : undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border-strong)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 50%, 100% 100%, 0% 100%, 0% 50%)',
            animation: finalizing ? 'plane-fold-shape-lg 2.4s ease-in both' : undefined,
          }}
        >
          <PaperText thought={thought} fade={finalizing} />
        </div>
      </div>
    </div>
  );
}

// ---------------- Zerknüllen: real drag-driven crumple ----------------
const CRUMPLE_STAGES = [
  'polygon(2% 2%, 98% 2%, 98% 98%, 2% 98%)',
  'polygon(4% 6%, 92% 2%, 98% 40%, 90% 55%, 96% 88%, 60% 96%, 30% 90%, 6% 96%, 10% 60%, 2% 35%)',
  'polygon(15% 10%, 75% 4%, 90% 30%, 70% 42%, 92% 60%, 65% 78%, 78% 92%, 40% 96%, 20% 80%, 30% 60%, 10% 50%, 25% 30%)',
  'polygon(30% 20%, 65% 15%, 78% 38%, 60% 45%, 75% 62%, 55% 78%, 62% 90%, 38% 88%, 28% 68%, 40% 55%, 22% 45%, 35% 32%)',
];
const CRUMPLE_THRESHOLD = 130;

function ZerknuellenRitual({ thought, finalizing, onFinalize }: { thought: string; finalizing: boolean; onFinalize: () => void }) {
  const [dragDist, setDragDist] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const committed = useRef(false);
  // Own bug caught while fixing the window-listener issue below: the
  // effect only re-binds when `dragging` changes, so a handleEnd
  // closure captured at drag-start would read a STALE dragDist (always
  // its start-of-drag value, effectively 0) instead of the live one —
  // silently breaking the "release past threshold" commit for mouse
  // users. A ref always holds the current value regardless of when the
  // closure was created, so handleEnd reads this instead of state.
  const dragDistRef = useRef(0);

  function handleStart(x: number, y: number) {
    if (finalizing) return;
    startPos.current = { x, y };
    setDragging(true);
  }
  function handleMove(x: number, y: number) {
    if (!startPos.current) return;
    const dx = x - startPos.current.x;
    const dy = y - startPos.current.y;
    const next = Math.min(CRUMPLE_THRESHOLD, Math.sqrt(dx * dx + dy * dy));
    dragDistRef.current = next;
    setDragDist(next);
  }
  function handleEnd() {
    setDragging(false);
    startPos.current = null;
    if (dragDistRef.current >= CRUMPLE_THRESHOLD && !committed.current) {
      committed.current = true;
      onFinalize();
    } else if (!finalizing) {
      dragDistRef.current = 0;
      setDragDist(0);
    }
  }

  // "Loslassen-Animationen einzeln ueberpruefen"-Auftrag — genuine
  // issue found: mouse listeners were only bound to the paper element
  // itself, so onMouseLeave ended the drag the instant the cursor left
  // its bounds — an easy, frustrating thing to trigger by accident with
  // a fast or angled mouse drag on a large paper. Touch never had this
  // problem (touchmove tracks the finger regardless of element
  // boundaries). Fixed by tracking the drag at the window level once
  // it starts, matching how drag interactions are normally built.
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onUp = () => handleEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const progress = dragDist / CRUMPLE_THRESHOLD; // 0..1
  const stageIndex = Math.min(CRUMPLE_STAGES.length - 1, Math.floor(progress * CRUMPLE_STAGES.length));
  const liveScale = 1 - progress * 0.4;
  const liveRotate = progress * 22;
  const liveDarken = progress * 0.4;

  return (
    <div style={{ width: PAPER_W, aspectRatio: `1 / ${PAPER_H_RATIO}`, position: 'relative', touchAction: 'none' }}>
      <div
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(rgba(0,0,0,${liveDarken}), rgba(0,0,0,${liveDarken})), var(--color-surface)`,
          border: '1.5px solid var(--color-border-strong)',
          boxShadow: `0 ${12 + progress * 14}px ${32 + progress * 20}px rgba(0,0,0,${0.18 + progress * 0.2})`,
          cursor: finalizing ? 'default' : 'grab',
          clipPath: finalizing ? undefined : CRUMPLE_STAGES[stageIndex],
          transform: finalizing ? undefined : `scale(${liveScale}) rotate(${liveRotate}deg)`,
          transition: dragging ? 'none' : 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
          animation: finalizing ? 'crumple-fall-lg 2.4s ease-in both' : undefined,
        }}
      >
        <PaperText thought={thought} fade={finalizing || progress > 0.35} />
      </div>
      {!finalizing && (
        <p
          style={{
            position: 'absolute',
            bottom: -34,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 13,
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          {dragging ? '✊' : '👆 halten & ziehen'}
        </p>
      )}
    </div>
  );
}

// ---------------- Zerreißen: real drag-driven tear ----------------
const TEAR_THRESHOLD = 90;
const tearPathLeft = 'polygon(0 0, 46% 0, 52% 8%, 44% 18%, 55% 30%, 42% 42%, 58% 55%, 45% 68%, 54% 82%, 48% 100%, 0 100%)';
const tearPathRight = 'polygon(46% 0, 100% 0, 100% 100%, 48% 100%, 54% 82%, 45% 68%, 58% 55%, 42% 42%, 55% 30%, 44% 18%, 52% 8%)';

function ZerreissenRitual({ thought, finalizing, onFinalize }: { thought: string; finalizing: boolean; onFinalize: () => void }) {
  const [dragDist, setDragDist] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const committed = useRef(false);
  // Same ref-based fix as ZerknuellenRitual — see comment there.
  const dragDistRef = useRef(0);

  function handleStart(x: number) {
    if (finalizing) return;
    startX.current = x;
    setDragging(true);
  }
  function handleMove(x: number) {
    if (startX.current === null) return;
    const next = Math.min(TEAR_THRESHOLD, Math.abs(x - startX.current));
    dragDistRef.current = next;
    setDragDist(next);
  }
  function handleEnd() {
    setDragging(false);
    startX.current = null;
    if (dragDistRef.current >= TEAR_THRESHOLD && !committed.current) {
      committed.current = true;
      onFinalize();
    } else if (!finalizing) {
      dragDistRef.current = 0;
      setDragDist(0);
    }
  }

  // Same fix as ZerknuellenRitual — window-level mouse tracking once
  // dragging starts, so leaving the paper's bounds mid-drag (easy with
  // a fast or wide horizontal pull) doesn't end the gesture early.
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => handleMove(e.clientX);
    const onUp = () => handleEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const progress = dragDist / TEAR_THRESHOLD;
  const gap = progress * 26;

  return (
    <div
      style={{ width: PAPER_W, aspectRatio: `1 / ${PAPER_H_RATIO}`, position: 'relative', touchAction: 'none' }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--color-surface)',
          clipPath: tearPathLeft,
          boxShadow: '-4px 4px 20px rgba(0,0,0,0.15)',
          transform: finalizing ? undefined : `translateX(${-gap}px) rotate(${-progress * 4}deg)`,
          transition: dragging ? 'none' : 'transform 0.3s ease-out',
          animation: finalizing ? 'tear-left-piece-lg 2.4s ease-in both' : undefined,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <PaperText thought={thought} fade={finalizing || progress > 0.4} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--color-surface)',
          clipPath: tearPathRight,
          boxShadow: '4px 4px 20px rgba(0,0,0,0.15)',
          transform: finalizing ? undefined : `translateX(${gap}px) rotate(${progress * 4}deg)`,
          transition: dragging ? 'none' : 'transform 0.3s ease-out',
          animation: finalizing ? 'tear-right-piece-lg 2.4s ease-in both' : undefined,
        }}
      />
      {!finalizing && (
        <p
          style={{
            position: 'absolute',
            bottom: -34,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 13,
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          {dragging ? '✋' : '👈 👉 halten & auseinanderziehen'}
        </p>
      )}
    </div>
  );
}
