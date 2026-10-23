/**
 * "Regenbogenkreis zu dick, passt nicht ins Design — stattdessen eine
 * duenne, weisse, schimmernde Linie, minimalistisch zentriert um das
 * Wesen herum, das Wesen liegt davor"-Auftrag — a full redesign of the
 * original thick rainbow pie. Now a thin stroked ring (not a filled
 * wedge), soft white with a gentle glow instead of a rainbow, and
 * positioned to sit directly behind the companion rather than above
 * the digital time. The remaining-time fraction still reads directly
 * off how much of the ring is drawn — just far more understated.
 */
export function VisualCountdown({ elapsedFraction, size = 108 }: { elapsedFraction: number; size?: number }) {
  const clamped = Math.max(0, Math.min(1, elapsedFraction));
  const strokeWidth = 2;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  // starts as a full ring (remaining = 100%) and draws down as time
  // elapses, same reveal direction as before, just as a thin stroke.
  const remainingLength = (1 - clamped) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)' }}
      role="img"
      aria-hidden="true"
    >
      {/* faint full track so the ring's total shape is always visible,
       * not just the lit portion */}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.75)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - remainingLength}
        style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.55))', transition: 'stroke-dashoffset 0.9s linear' }}
      />
    </svg>
  );
}
