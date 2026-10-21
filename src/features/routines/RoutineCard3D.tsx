import { forwardRef } from 'react';
import type { RoutineCard } from './routinesRepo';
import './routines.css';

interface Props {
  card: Pick<RoutineCard, 'text' | 'emoji' | 'color' | 'image'> & Partial<Pick<RoutineCard, 'polaroid' | 'noSymbol'>>;
  /** colour only: no symbol on the card (decided by the routine or the card itself) */
  noSymbol?: boolean;
  /** 'full' fills the player; 'mini' is the preview in the editor / lists */
  size?: 'full' | 'mini' | 'tiny';
  /** extra content under the text (timer ring, resource chip …) */
  children?: React.ReactNode;
  /** the big symbol badge can be replaced (e.g. by a timer ring) */
  badge?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The soft 3D card. The look comes from layered shadows, a glossy highlight and a symbol badge that
 * floats a little in front (translateZ) – no heavy filters, only transform/opacity, so it stays smooth.
 */
export const RoutineCard3D = forwardRef<HTMLDivElement, Props>(function RoutineCard3D({ card, size = 'full', children, badge, className = '', style, noSymbol }, ref) {
  const hasPhoto = !!card.image;
  const hideSymbol = noSymbol ?? card.noSymbol ?? false;
  const polaroid = card.polaroid;
  const dims =
    size === 'full'
      ? { badge: 112, emoji: 56, text: 26, pad: 28, radius: 34 }
      : size === 'mini'
        ? { badge: 64, emoji: 32, text: 15, pad: 16, radius: 24 }
        : { badge: 40, emoji: 20, text: 11, pad: 8, radius: 16 };
  const pol = size === 'tiny' ? 46 : badge ? Math.round(dims.badge * 1.35) : Math.round(dims.badge * 1.9);
  return (
    <div
      ref={ref}
      className={`rt-card ${hasPhoto ? 'rt-card--photo' : ''} ${className}`}
      style={{ ['--rt-color' as string]: card.color, borderRadius: dims.radius, ...style }}
    >
      {hasPhoto && <div className="rt-card__photo" style={{ backgroundImage: `url(${card.image})` }} aria-hidden="true" />}
      <div className="rt-card__body flex flex-col items-center justify-center text-center h-full w-full" style={{ padding: dims.pad, gap: size === 'tiny' ? 4 : 18 }}>
        {polaroid && (
          <div
            className="rt-polaroid"
            style={{ width: pol, padding: `${Math.round(pol * 0.055)}px ${Math.round(pol * 0.055)}px ${Math.round(pol * 0.2)}px`, transform: 'rotate(-3deg)' }}
            data-testid="rt-polaroid"
          >
            <div style={{ width: '100%', aspectRatio: '1 / 1', backgroundImage: `url(${polaroid})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 2 }} />
            {!hideSymbol && !badge && (
              <span className="rt-polaroid__sym" style={{ width: dims.badge * 0.62, height: dims.badge * 0.62, fontSize: dims.emoji * 0.62 }} aria-hidden="true">{card.emoji}</span>
            )}
          </div>
        )}
        {badge ? (
          badge
        ) : hideSymbol || polaroid ? null : (
          <div className="rt-card__badge rounded-full flex items-center justify-center" style={{ width: dims.badge, height: dims.badge, fontSize: dims.emoji }} aria-hidden="true">
            <span style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))' }}>{card.emoji}</span>
          </div>
        )}
        {card.text && (
          <p
            className="leading-snug font-medium [overflow-wrap:anywhere]"
            style={{ fontSize: dims.text, color: hasPhoto ? '#fff' : 'var(--color-text)', textShadow: hasPhoto ? '0 2px 10px rgba(0,0,0,0.45)' : 'none', maxWidth: size === 'full' ? 320 : undefined }}
          >
            {card.text}
          </p>
        )}
        {children}
      </div>
    </div>
  );
});
