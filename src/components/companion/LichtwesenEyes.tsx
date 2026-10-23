import type { LichtwesenEyeStyle } from './lichtwesen';

interface EyesProps {
  style: LichtwesenEyeStyle;
  color: string;
  blinking: boolean;
  /** true = single big centered eye (current design), false = classic two-eye layout */
  bigEye?: boolean;
}

/**
 * Renders the pupil/iris treatment inside the single big eye (centered at
 * 50,54 with radius 19) — each style gives a different pupil shape/position
 * so every being reads distinctly even though they share the same eye ring.
 */
export function LichtwesenEyes({ style, color, blinking, bigEye = true }: EyesProps) {
  if (!bigEye) return null;

  if (blinking) {
    return <path d="M38 54q12 6 24 0" stroke={color} strokeWidth="3.4" fill="none" strokeLinecap="round" />;
  }

  switch (style) {
    case 'round':
      return (
        <>
          <circle cx="50" cy="55" r="9" fill={color} />
          <circle cx="53.5" cy="51.5" r="2.6" fill="#fff" />
        </>
      );
    case 'half-closed':
      return (
        <>
          <path d="M36 54a14 8 0 0128 0z" fill={color} opacity="0.14" />
          <circle cx="50" cy="57" r="7" fill={color} />
        </>
      );
    case 'soft-closed':
      return <path d="M37 55q13 -9 26 0" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'direct':
      return (
        <>
          <circle cx="50" cy="55" r="8" fill={color} />
          <circle cx="52.5" cy="52.5" r="2.2" fill="#fff" />
          <path d="M40 44h20" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.4" />
        </>
      );
    case 'curved-happy':
      return <path d="M37 58q13 -13 26 0" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />;
    case 'narrow-peek':
      return <ellipse cx="50" cy="55" rx="6" ry="9" fill={color} />;
    case 'wide-fresh':
      return (
        <>
          <circle cx="50" cy="54" r="11" fill={color} />
          <circle cx="54" cy="50" r="3.2" fill="#fff" />
        </>
      );
    case 'star-sparkle':
      return (
        <>
          <circle cx="50" cy="55" r="9" fill={color} />
          <circle cx="53.5" cy="51.5" r="2.6" fill="#fff" />
          <path d="M63 40l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z" fill={color} opacity="0.85" />
        </>
      );
    case 'sharp-focused':
      return <circle cx="50" cy="55" r="5.5" fill={color} />;
    case 'steady-trust':
      return (
        <>
          <circle cx="50" cy="55" r="10" fill={color} />
          <circle cx="53" cy="52" r="3" fill="#fff" />
        </>
      );
    default:
      return null;
  }
}
