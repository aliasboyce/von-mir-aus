import { useRef, useState } from 'react';
import { FEELING_GROUPS } from '../zugang/zugangContent';
import { useSettings } from '../../state/SettingsContext';

import { colorForGroup } from './feelingColors';

const SIZE = 260;
const CENTER = SIZE / 2;
const OUTER_R = 118;
const INNER_R = 44;
const SUB_RING_R = OUTER_R + 54;

function segmentPath(index: number, total: number, innerR: number, outerR: number): string {
  const angle = (2 * Math.PI) / total;
  const start = index * angle - Math.PI / 2;
  const end = start + angle;
  const x1 = CENTER + Math.cos(start) * outerR;
  const y1 = CENTER + Math.sin(start) * outerR;
  const x2 = CENTER + Math.cos(end) * outerR;
  const y2 = CENTER + Math.sin(end) * outerR;
  const ix1 = CENTER + Math.cos(start) * innerR;
  const iy1 = CENTER + Math.sin(start) * innerR;
  const ix2 = CENTER + Math.cos(end) * innerR;
  const iy2 = CENTER + Math.sin(end) * innerR;
  return `M${ix1},${iy1} L${x1},${y1} A${outerR},${outerR} 0 0 1 ${x2},${y2} L${ix2},${iy2} A${innerR},${innerR} 0 0 0 ${ix1},${iy1} Z`;
}

function labelPos(index: number, total: number): { x: number; y: number } {
  const angle = (2 * Math.PI * (index + 0.5)) / total - Math.PI / 2;
  const r = (OUTER_R + INNER_R) / 2;
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r };
}

/** Position for a sub-feeling pill on the surrounding "outer ring" —
 * plain HTML pills placed around a circle via trigonometry, NOT SVG
 * wedge segments. This is the direct fix for the two previous
 * failures documented below: any number of sub-feelings (from 3 up to
 * 23) can be placed this way with fully horizontal, always-legible
 * text, since word length/count never has to fit into a shrinking
 * curved arc. */
function subPillPos(index: number, total: number, rotationDeg: number): { x: number; y: number } {
  const angle = (2 * Math.PI * (index + 0.5)) / total - Math.PI / 2 + (rotationDeg * Math.PI) / 180;
  return { x: CENTER + Math.cos(angle) * SUB_RING_R, y: CENTER + Math.sin(angle) * SUB_RING_R };
}

/**
 * "Textueberlauf bei Desktop-Breite"-Fund — words like
 * "Gleichgueltigkeit" (16) or "Hoffnungslosigkeit" (19) have no space
 * or slash to split on, so the existing word-wrap logic (which only
 * splits ON those characters) left them as one long, un-breakable
 * line — wide enough to run into neighbouring wedges even at the
 * smallest font tier. This inserts a soft break near the middle of
 * any single word over 10 characters, so it wraps onto two lines like
 * the multi-word labels already do, rather than needing an
 * ever-smaller font size that would eventually become illegible.
 */
function breakLongWord(word: string): string[] {
  if (word.length <= 10) return [word];
  const mid = Math.ceil(word.length / 2);
  // Prefer breaking right after the nearest vowel at/after the
  // midpoint, which usually lands on a reasonable German syllable
  // boundary without needing a full hyphenation dictionary.
  const vowels = 'aeiouäöü';
  let splitAt = mid;
  for (let i = mid; i < word.length - 2; i++) {
    if (vowels.includes(word[i].toLowerCase())) {
      splitAt = i + 1;
      break;
    }
  }
  return [word.slice(0, splitAt), word.slice(splitAt)];
}

/**
 * "Gefühlsrad erweitern, drehbar machen, Farben"-Auftrag — third
 * rebuild of this component. The previous two attempts both failed by
 * trying to render sub-feelings AS curved SVG ring segments: first
 * with unreadable 8px rotated text, then with segments literally
 * sub-pixel wide once vocabulary grew (0.78° ≈ 1.6px arc length — a
 * genuine rendering bug, not just a readability issue). The version
 * after that abandoned the ring idea entirely for a flat wrapping chip
 * list, which worked but didn't fulfil the "inner ring = basic
 * feelings, outer ring = more specific feelings" structure asked for
 * here.
 *
 * This version threads the needle: the INNER ring stays true SVG
 * wedges (only 12 of them, plenty of room). The OUTER "ring" is
 * visually a ring — each sub-feeling's pill is centered on a circle
 * around the inner wheel — but every pill is a normal horizontal
 * rounded-rect via HTML/CSS, not a curved SVG segment. Word length and
 * count can never break this the way they broke the two SVG attempts,
 * because nothing has to physically CURVE or SHRINK to fit.
 *
 * Rotation: the inner wheel can be spun with mouse or touch (pointer
 * events cover both). Wedge labels counter-rotate so they stay upright
 * and legible at any spin angle.
 */
export function FeelingsWheel({ openId, onSelect, colorVersion }: { openId: string | null; onSelect: (id: string) => void; colorVersion?: number }) {
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const total = FEELING_GROUPS.length;
  const openGroup = FEELING_GROUPS.find((g) => g.id === openId);
  // colorVersion changes -> forces re-render to pick up new custom
  // colors from localStorage without needing global state plumbing.
  void colorVersion;

  const [rotation, setRotation] = useState(0);
  const dragState = useRef<{ startAngle: number; startRotation: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function angleFromCenter(clientX: number, clientY: number): number {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  }

  function handlePointerDown(e: React.PointerEvent) {
    // setPointerCapture can throw for pointer ids the browser doesn't
    // recognize as currently active (seen with some synthetic/testing
    // event sources) — guarded so a throw here can never prevent
    // dragState from being set, which would otherwise silently break
    // the drag before it starts.
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // Rotation still works without capture; capture only prevents
      // the drag from ending early if the pointer leaves the SVG.
    }
    dragState.current = { startAngle: angleFromCenter(e.clientX, e.clientY), startRotation: rotation };
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const current = angleFromCenter(e.clientX, e.clientY);
    setRotation(dragState.current.startRotation + (current - dragState.current.startAngle));
  }
  function handlePointerUp() {
    dragState.current = null;
  }

  return (
    <div className="relative" style={{ paddingTop: openGroup ? SUB_RING_R - OUTER_R + 30 : 0, paddingBottom: openGroup ? SUB_RING_R - OUTER_R + 30 : 0 }}>
      <div className="relative mx-auto" style={{ maxWidth: 'clamp(260px, 40vw, 380px)' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width="100%"
          role="img"
          aria-hidden="true"
          style={{ aspectRatio: '1 / 1', display: 'block', touchAction: 'none', cursor: 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <g transform={`rotate(${rotation} ${CENTER} ${CENTER})`}>
            {FEELING_GROUPS.map((g, i) => {
              const active = openId === g.id;
              const pos = labelPos(i, total);
              const words = (g.label.includes('/') ? g.label.split('/').map((w) => w.trim()) : g.label.split(' ')).flatMap(breakLongWord);
              const longestWord = Math.max(...words.map((w) => w.length));
              const fontSize = longestWord > 10 ? 9 : longestWord > 7 ? 10 : 11.5;
              return (
                <g key={g.id} onClick={() => onSelect(g.id)} style={{ cursor: 'pointer' }}>
                  <path
                    d={segmentPath(i, total, INNER_R, OUTER_R)}
                    fill={colorForGroup(g.id, g.color)}
                    opacity={active ? 1 : 0.68}
                    stroke="var(--color-surface)"
                    strokeWidth="2"
                  />
                  {/* counter-rotate the label group so text stays
                   * upright and legible regardless of wheel spin */}
                  <g transform={`rotate(${-rotation} ${pos.x} ${pos.y})`}>
                    <text x={pos.x} y={pos.y} textAnchor="middle" fontSize={fontSize} fontWeight={active ? 700 : 500} fill="#fff">
                      {words.map((w, wi) => (
                        <tspan key={wi} x={pos.x} dy={wi === 0 ? (words.length > 1 ? '-0.2em' : '0.35em') : '1.2em'}>
                          {w}
                        </tspan>
                      ))}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
          <circle cx={CENTER} cy={CENTER} r={INNER_R - 4} fill="var(--color-surface)" />
        </svg>

        {/* outer "ring" of the selected group's specific feelings —
         * plain horizontal HTML pills placed on a circle via
         * trigonometry, see subPillPos() comment above for why. */}
        {openGroup && (
          <div className="absolute inset-0 pointer-events-none animate-in">
            {(isEn ? openGroup.subEn : openGroup.sub).map((sub, i, arr) => {
              const pos = subPillPos(i, arr.length, rotation);
              const oc = colorForGroup(openGroup.id, openGroup.color);
              return (
                <button
                  key={sub}
                  onClick={() => {}}
                  className="absolute pointer-events-auto px-2 py-1 rounded-full text-[11px] whitespace-nowrap"
                  style={{
                    left: `${(pos.x / SIZE) * 100}%`,
                    top: `${(pos.y / SIZE) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    background: `${oc}26`,
                    color: 'var(--color-text)',
                    border: `1px solid ${oc}66`,
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openGroup && (
        <p className="text-center text-[11px] text-[var(--color-text-faint)] mt-2">{isEn ? 'Tap the wheel to spin it' : 'Rad antippen und ziehen zum Drehen'}</p>
      )}
    </div>
  );
}
