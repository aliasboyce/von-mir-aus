import { useEffect, useRef } from 'react';
import { CARD_H, CARD_W, drawCard, prepareCardImage } from './cardRender';
import type { CardModel } from './cardTypes';
import { useSettings } from '../../state/SettingsContext';

/** Eine Kartenseite als Canvas in der gewünschten Breite (Höhe folgt dem Kartenformat). */
export function CardFace({ card, side = 'front', width, flat = false, className = '' }: { card: CardModel; side?: 'front' | 'back'; width: number; flat?: boolean; className?: string }) {
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
    const paint = (img: HTMLImageElement | null) => {
      if (!alive) return;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawCard(ctx, card, img, { side, lang, flat });
    };
    // erst sofort (mit Symbol), dann – sobald das Foto da ist – mit Foto
    paint(null);
    if (side === 'front' && (card.image || card.mediaId)) void prepareCardImage(card).then((img) => img && paint(img));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, width]);

  return <canvas ref={ref} width={CARD_W} height={CARD_H} style={{ width, height, display: 'block' }} className={className} role="img" aria-label={card.title} />;
}
