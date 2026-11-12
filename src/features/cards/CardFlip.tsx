import { useRef, useState } from 'react';
import { CardFace } from './CardFace';
import { CARD_H, CARD_W } from './cardRender';
import { playCardFlip, playSparkle } from './cardSounds';
import type { CardModel } from './cardTypes';

/**
 * Die Karte zum Anfassen: Tippen dreht sie um (mit kleinem Überschwingen), und bei limitierten
 * Karten wandert beim Bewegen/Kippen ein Glanz darüber. Wer „Bewegung reduzieren“ nutzt, bekommt kein Kippen.
 */
export function CardFlip({ card, width, flipped, onFlip, tilt = true }: { card: CardModel; width: number; flipped: boolean; onFlip: () => void; tilt?: boolean }) {
  const height = Math.round((width * CARD_H) / CARD_W);
  const box = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<{ x: number; y: number } | null>(null);
  const special = card.rarity !== 'normal';
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function move(e: React.PointerEvent) {
    if (!tilt || reduce || !box.current) return;
    const r = box.current.getBoundingClientRect();
    setT({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  }
  const tx = t ? (t.x - 0.5) * 2 : 0;
  const ty = t ? (t.y - 0.5) * 2 : 0;

  const shine =
    card.rarity === 'holo'
      ? `linear-gradient(${105 + tx * 40}deg, rgba(255,90,120,0.0) ${20 + tx * 30}%, rgba(255,240,120,0.55) ${38 + tx * 30}%, rgba(120,255,200,0.55) ${50 + tx * 30}%, rgba(120,170,255,0.55) ${62 + tx * 30}%, rgba(255,120,220,0) ${80 + tx * 30}%)`
      : `linear-gradient(${115 + tx * 30}deg, rgba(255,255,255,0) ${30 + tx * 35}%, rgba(255,255,255,0.7) ${48 + tx * 35}%, rgba(255,255,255,0) ${66 + tx * 35}%)`;

  return (
    <div
      ref={box}
      style={{ width, height, perspective: 1200, filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.28))' }}
      onPointerMove={move}
      onPointerLeave={() => setT(null)}
      data-testid="card-flip"
    >
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onFlip();
        }}
        onClick={() => {
          onFlip();
          playCardFlip();
          if (special && flipped) playSparkle();
        }}
        aria-label={card.title}
        className="relative block cursor-pointer"
        style={{
          width,
          height,
          transformStyle: 'preserve-3d',
          transform: `rotateY(${flipped ? 180 : 0}deg) rotateX(${-ty * 5}deg) rotateZ(0deg) scale(${t ? 1.02 : 1})`,
          transition: t ? 'transform 0.12s ease-out' : 'transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <CardFace card={card} side="front" width={width} />
          {special && (
            <div
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, borderRadius: width * 0.072, background: shine, mixBlendMode: card.rarity === 'holo' ? 'color-dodge' : 'soft-light', opacity: t ? 0.8 : 0.35, pointerEvents: 'none', animation: t ? undefined : 'card-shimmer 4.5s ease-in-out infinite' }}
            />
          )}
        </div>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <CardFace card={card} side="back" width={width} />
        </div>
      </div>
    </div>
  );
}
