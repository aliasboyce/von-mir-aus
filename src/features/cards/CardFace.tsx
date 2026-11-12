import { memo, useEffect, useRef } from 'react';
import { CARD_H, CARD_W, cardNeedsAsync, drawCard, prepareCardImage } from './cardRender';
import type { CardModel } from './cardTypes';
import { useSettings } from '../../state/SettingsContext';

// bereits gemalte Karten merken: Blättern und Neu-Einblenden kostet dann fast nichts
const painted = new Map<string, HTMLCanvasElement>();
function remember(key: string, src: HTMLCanvasElement) {
  const copy = document.createElement('canvas');
  copy.width = src.width;
  copy.height = src.height;
  copy.getContext('2d')?.drawImage(src, 0, 0);
  painted.set(key, copy);
  if (painted.size > 90) painted.delete(painted.keys().next().value as string);
}

/** Eine Kartenseite als Canvas in der gewünschten Breite (Höhe folgt dem Kartenformat). */
export const CardFace = memo(function CardFace({ card, side = 'front', width, flat = false, className = '' }: { card: CardModel; side?: 'front' | 'back'; width: number; flat?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lang = useSettings().settings.language === 'en' ? 'en' : 'de';
  const height = Math.round((width * CARD_H) / CARD_W);
  const sig = JSON.stringify({ ...card, side, lang, flat });

  useEffect(() => {
    let alive = true;
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const scale = Math.max(0.2, (width * dpr) / CARD_W);
    canvas.width = Math.round(CARD_W * scale);
    canvas.height = Math.round(CARD_H * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cacheKey = `${sig}|${canvas.width}`;
    const hit = painted.get(cacheKey);
    if (hit) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(hit, 0, 0);
      return;
    }
    const paint = (img: HTMLImageElement | null, final = false) => {
      if (!alive) return;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawCard(ctx, card, img, { side, lang, flat });
      if (final || !(side === 'front' && cardNeedsAsync(card))) remember(cacheKey, canvas);
    };
    // erst sofort (mit Symbol), dann – sobald das Foto da ist – mit Foto
    paint(null);
    if (side === 'front' && cardNeedsAsync(card)) void prepareCardImage(card).then((img) => paint(img, true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, width]);

  return <canvas ref={ref} width={CARD_W} height={CARD_H} style={{ width, height, display: 'block' }} className={className} role="img" aria-label={card.title} />;
});
