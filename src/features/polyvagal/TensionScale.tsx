import { useT } from '../../i18n';

/**
 * "Zu erschreckend, gestalte den Regler nach den Farben"-Auftrag —
 * rebuilt after direct feedback that labels like "Frühwarnzone — Zeit
 * für Regulation" felt alarming. Two real changes:
 *
 * 1. The slider track is now a smooth, continuous gradient (dark green
 *    through yellow-green, gold, orange, to dark red) instead of three
 *    hard-edged color blocks — reads as "a spectrum", not "zones with
 *    warning labels".
 * 2. The text under the number is now CONTEXT-DEPENDENT via
 *    `descriptionStyle`: 'none' (Zugang — no text at all, the color
 *    itself is the only signal), or 'gentle' (check-in's "Meine
 *    Spannung" — a soft, GFK-toned question/nudge instead of a
 *    clinical zone name, never "Achtung" or "Zeit für X" framing).
 *
 * Colors still derive from the same 0-30/30-70/70-100 thresholds
 * described in the person's source material — only the PRESENTATION
 * changed, not the underlying meaning.
 */
export function tensionZoneFor(value: number): 'low' | 'mid' | 'high' {
  if (value < 30) return 'low';
  if (value < 70) return 'mid';
  return 'high';
}

const GRADIENT_STOPS = '#3d6b35 0%, #7a9a3f 25%, #e4c23b 45%, #e4a63b 60%, #d1793f 78%, #b5533f 100%';

/** Interpolates the same stops the slider track uses, so the number
 * and hint text visually match whatever the thumb is sitting on. */
export function tensionColorFor(value: number): string {
  const stops: [number, string][] = [
    [0, '#3d6b35'],
    [25, '#7a9a3f'],
    [45, '#e4c23b'],
    [60, '#e4a63b'],
    [78, '#d1793f'],
    [100, '#b5533f'],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (value >= p0 && value <= p1) {
      const t = (value - p0) / (p1 - p0);
      return mixHex(c0, c1, t);
    }
  }
  return stops[stops.length - 1][1];
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function TensionScale({
  value,
  onChange,
  descriptionStyle = 'none',
}: {
  value: number;
  onChange: (v: number) => void;
  /** 'none': no text under the number (Zugang). 'gentle': a soft,
   * question-style nudge (check-in's "Meine Spannung"). */
  descriptionStyle?: 'none' | 'gentle';
}) {
  const t = useT();
  const zone = tensionZoneFor(value);
  const color = tensionColorFor(value);
  const gentleHint = zone === 'low' ? t.tension.gentleLowHint : zone === 'mid' ? t.tension.gentleMidHint : t.tension.gentleHighHint;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <p className="text-[42px] leading-none font-medium mb-1" style={{ color }}>
          {value}%
        </p>
        {descriptionStyle === 'gentle' && (
          <p className="text-[13px]" style={{ color }}>
            {gentleHint}
          </p>
        )}
      </div>

      <div className="relative" style={{ height: 28 }}>
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
          style={{ height: 10, background: `linear-gradient(to right, ${GRADIENT_STOPS})` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: 28 }}
          aria-label={t.tension.valueLabel}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2"
          style={{ left: `${value}%`, width: 22, height: 22, background: color, borderColor: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}
          aria-hidden="true"
        />
      </div>
      <div className="flex justify-between text-[11px] text-[var(--color-text-faint)]">
        <span>{t.tension.lowLabel}</span>
        <span>{t.tension.highLabel}</span>
      </div>
    </div>
  );
}
