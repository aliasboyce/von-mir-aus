import { Acc, Blush, BodyG, FurLines, Grad, HeadG, INK, KEyes, Shade, Shine, Sparkle, Tufts, shade, useUid, type ArtProps } from './kit';

/* ───────────────────────── Schweinchen ───────────────────────── */
export function Schweinchen({ eyes, pal, opt }: ArtProps) {
  const u = useUid('sw');
  const { body, belly, dark, accent } = pal;
  const saddle = pal.x1;
  return (
    <g>
      <BodyG>
        <path className="pa-tail pa-tail-fast" d="M72 92 q12 -2 10 -10 q-2 -6 -8 -3 q-3 3 0 5" stroke={dark} strokeWidth="3.2" fill="none" strokeLinecap="round" style={{ transformOrigin: '72px 92px' }} />
        <Tufts cx={50} cy={88} rx={27} ry={19.5} fill={shade(body, -0.05)} n={20} len={2.4} seed={101} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="27" ry="19.5" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="15" ry="11.5" fill={belly} />
        <FurLines cx={50} cy={90} rx={12} ry={9} stroke={shade(belly, -0.12)} n={6} seed={102} opacity={0.3} />
        {saddle && <path d="M27 80 Q50 74 73 80 L74 98 Q50 104 26 98z" fill={saddle} opacity=".96" />}
        <ellipse className="pa-foot pa-foot-l" cx="36" cy="104" rx="9" ry="5.4" fill={shade(body, 0.04)} />
        <ellipse className="pa-foot pa-foot-r" cx="64" cy="104" rx="9" ry="5.4" fill={shade(body, 0.04)} />
        <path d="M31 105.4 h10 M59 105.4 h10" stroke={dark} strokeWidth="2.4" strokeLinecap="round" />
        <Shade cx={50} cy={74} rx={23} ry={8} op={0.34} />
      </BodyG>
      <HeadG>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '30px 32px' }}>
          <path d="M19 40 Q10 12 38 19 Q38 33 19 40z" fill={shade(body, -0.04)} />
          <path d="M22 33 Q19 21 32 23 Q31 30 22 33z" fill={pal.x2 ?? '#ff9fb4'} />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '70px 32px' }}>
          <path d="M81 40 Q90 12 62 19 Q62 33 81 40z" fill={shade(body, -0.04)} />
          <path d="M78 33 Q81 21 68 23 Q69 30 78 33z" fill={pal.x2 ?? '#ff9fb4'} />
        </g>
        <Tufts cx={50} cy={52} rx={35} ry={30} fill={shade(body, -0.05)} n={26} len={2.6} seed={103} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="52" rx="35" ry="30" fill={`url(#${u}h)`} />
        <Shine cx={38} cy={34} rx={15} ry={8} op={0.38} />
        <KEyes state={eyes} y={47} dx={18} rx={4.9} ry={5.9} />
        <Blush dx={30} y={59} rx={6} ry={4} fill="#ff7f9b" opacity={0.5} />
        <ellipse cx="50" cy="62" rx="15.5" ry="11.8" fill={accent} />
        <ellipse cx="50" cy="59" rx="9" ry="4" fill="#fff" opacity=".2" />
        <ellipse cx="44.4" cy="62" rx="2.7" ry="3.8" fill={shade(accent, -0.3)} />
        <ellipse cx="55.6" cy="62" rx="2.7" ry="3.8" fill={shade(accent, -0.3)} />
        <path d="M43 73 q7 5 14 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 24, chin: 78, eyeY: 47, eyeDx: 18 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Axolotl ───────────────────────── */
export function Axolotl({ eyes, pal, opt }: ArtProps) {
  const u = useUid('ax');
  const { body, belly, dark, accent } = pal;
  const gill = (side: 1 | -1, i: number, d: string, tip: [number, number]) => (
    <g key={`${side}${i}`} className={`pa-gill pa-gill-${i}`} style={{ transformOrigin: `${50 + side * 28}px 52px` }}>
      <path d={d} stroke={dark} strokeWidth="5.8" fill="none" strokeLinecap="round" />
      <path d={d} stroke={shade(dark, 0.22)} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".6" />
      <circle cx={tip[0]} cy={tip[1]} r="4.2" fill={accent} />
      <circle cx={tip[0] - 1} cy={tip[1] - 1} r="1.3" fill="#fff" opacity=".7" />
    </g>
  );
  const m = (x: number) => 100 - x;
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '70px 98px' }}>
          <ellipse cx="82" cy="99" rx="17" ry="7.4" fill={shade(body, -0.05)} transform="rotate(-10 82 99)" />
          <path d="M70 99 Q82 94 96 94" stroke={accent} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".8" />
        </g>
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="89" rx="24" ry="17" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="92" rx="14" ry="11" fill={belly} />
        <Shine cx={42} cy={82} rx={12} ry={5} op={0.3} />
        <g fill={shade(body, -0.05)}>
          <ellipse className="pa-foot pa-foot-l" cx="31" cy="101" rx="7" ry="4.6" /><ellipse className="pa-foot pa-foot-r" cx="69" cy="101" rx="7" ry="4.6" />
        </g>
        <g fill={shade(body, 0.2)}><circle cx="27.4" cy="104" r="1.5" /><circle cx="31" cy="105" r="1.5" /><circle cx="34.6" cy="104" r="1.5" /><circle cx="65.4" cy="104" r="1.5" /><circle cx="69" cy="105" r="1.5" /><circle cx="72.6" cy="104" r="1.5" /></g>
        <Shade cx={50} cy={76} rx={20} ry={6} op={0.3} />
      </BodyG>
      <HeadG cy={54} bodyTop={74}>
        {gill(-1, 0, 'M22 44 Q12 42 8 32', [8, 31])}
        {gill(-1, 1, 'M20 51 Q9 51 5 45', [5, 44.6])}
        {gill(-1, 2, 'M21 58 Q10 61 6 59', [6, 59])}
        {gill(1, 0, `M${m(22)} 44 Q${m(12)} 42 ${m(8)} 32`, [m(8), 31])}
        {gill(1, 1, `M${m(20)} 51 Q${m(9)} 51 ${m(5)} 45`, [m(5), 44.6])}
        {gill(1, 2, `M${m(21)} 58 Q${m(10)} 61 ${m(6)} 59`, [m(6), 59])}
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="54" rx="36" ry="27" fill={`url(#${u}h)`} />
        <Shine cx={38} cy={38} rx={15} ry={7} op={0.34} />
        <g fill={dark} opacity=".35"><circle cx="40" cy="34" r="1.6" /><circle cx="48" cy="30" r="1.3" /><circle cx="58" cy="33" r="1.6" /><circle cx="64" cy="38" r="1.1" /><circle cx="34" cy="39" r="1.1" /></g>
        {pal.x1 && <g fill={pal.x1} opacity=".75"><circle cx="30" cy="62" r="1.3" /><circle cx="72" cy="60" r="1.3" /><circle cx="44" cy="44" r="1.1" /><circle cx="56" cy="46" r="1.1" /></g>}
        <KEyes state={eyes} y={50} dx={21} rx={4.6} ry={5.4} iris={pal.iris} />
        <Blush dx={32} y={61} rx={5.6} ry={3.6} />
        <path d="M36 62 Q50 74 64 62" stroke={INK} strokeWidth="1.9" fill="none" strokeLinecap="round" />
        <path d="M35.6 61.4 l-1.8 -1.6 M64.4 61.4 l1.8 -1.6" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
        <path className="pa-bubble" d="M12 20 a2.4 2.4 0 1 0 .01 0z" fill="none" stroke="#bfe6ff" strokeWidth="1.2" />
        <path className="pa-bubble pa-bubble-2" d="M88 14 a1.8 1.8 0 1 0 .01 0z" fill="none" stroke="#bfe6ff" strokeWidth="1.2" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 29, chin: 74, eyeY: 50, eyeDx: 21 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Gans ───────────────────────── */
export function Gans({ eyes, pal, opt }: ArtProps) {
  const u = useUid('ga');
  const { body, belly, accent } = pal;
  const feet = pal.x2 ?? accent;
  const wingC = pal.x3 ?? shade(body, -0.07);
  return (
    <g>
      <BodyG>
        <path className="pa-tail pa-tail-flick" d="M76 88 Q92 82 94 70 Q86 76 74 78z" fill={wingC} style={{ transformOrigin: '74px 86px' }} />
        <Tufts cx={50} cy={85} rx={31} ry={21.5} fill={shade(body, -0.05)} n={26} len={3.4} seed={111} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="85" rx="31" ry="21.5" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="18" ry="12" fill={belly} />
        <path d="M40 90 q3 3 6 0 M47 90 q3 3 6 0 M44 96 q3 3 6 0 M52 96 q3 3 6 0" stroke={shade(belly, -0.12)} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".5" />
        <g className="pa-wing pa-wing-l" style={{ transformOrigin: '28px 74px' }}>
          <path d="M24 73 Q10 90 32 98 Q36 84 32 73z" fill={wingC} />
          <path d="M22 84 q4 6 10 8 M26 78 q4 6 8 8" stroke={pal.x1 ? shade(wingC, 0.25) : '#fff'} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".7" />
        </g>
        <g className="pa-wing pa-wing-r" style={{ transformOrigin: '72px 74px' }}>
          <path d="M76 73 Q90 90 68 98 Q64 84 68 73z" fill={wingC} />
          <path d="M78 84 q-4 6 -10 8 M74 78 q-4 6 -8 8" stroke={pal.x1 ? shade(wingC, 0.25) : '#fff'} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".7" />
        </g>
        <g fill={feet}>
          <path className="pa-foot pa-foot-l" d="M31 103 q7 -3 14 0 l-7 7z" />
          <path className="pa-foot pa-foot-r" d="M55 103 q7 -3 14 0 l-7 7z" />
        </g>
        <Tufts cx={50} cy={64} rx={13} ry={20} fill={shade(body, -0.05)} n={14} len={2.6} seed={112} />
        <ellipse cx="50" cy="64" rx="13" ry="20" fill={`url(#${u}b)`} />
        <path d="M44 56 q2 4 4 0 M52 60 q2 4 4 0 M45 66 q2 4 4 0" stroke={shade(body, -0.14)} strokeWidth="1" fill="none" strokeLinecap="round" opacity=".4" />
        <Shade cx={50} cy={72} rx={14} ry={6} op={0.25} />
      </BodyG>
      <HeadG cy={40} bodyTop={44}>
        <Tufts cx={50} cy={40} rx={28} ry={25} fill={shade(body, -0.05)} n={24} len={3.2} seed={113} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="40" rx="28" ry="25" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={26} rx={13} ry={6} op={0.34} />
        <path d="M45 16 q-3 -6 1 -8 M52 15 q1 -6 6 -5" stroke={shade(body, -0.08)} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        {pal.x1 && <><ellipse cx="34" cy="36" rx="7.4" ry="6.6" fill={pal.x1} /><ellipse cx="66" cy="36" rx="7.4" ry="6.6" fill={pal.x1} /></>}
        <KEyes state={eyes} y={36} dx={16} rx={4.8} ry={5.7} iris={pal.iris} />
        <Blush dx={27} y={47} />
        <path d="M37 47 Q50 41 63 47 Q63 56 50 59 Q37 56 37 47z" fill={accent} />
        <path d="M40 47.6 Q50 43.6 60 47.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".5" />
        <path d="M41 52 Q50 57 59 52" stroke={shade(accent, -0.25)} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="46.6" cy="47.6" r="0.95" fill={shade(accent, -0.25)} /><circle cx="53.4" cy="47.6" r="0.95" fill={shade(accent, -0.25)} />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 15, chin: 58, eyeY: 36, eyeDx: 16 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Einhorn ───────────────────────── */
const RAINBOW = ['#ffb3d1', '#ffd3a8', '#fff1a6', '#bdf0c6', '#b5dcff', '#d9c4ff'];
export function Einhorn({ eyes, pal, opt }: ArtProps) {
  const u = useUid('ei');
  const { body, belly, dark, accent } = pal;
  const mane = pal.x1 ? [pal.x1, pal.x2 ?? pal.x1, pal.x3 ?? pal.x1, pal.x2 ?? pal.x1, pal.x1, pal.x3 ?? pal.x1] : RAINBOW;
  const hoof = dark;
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '70px 96px' }}>
          {mane.slice(0, 5).map((c, i) => (
            <path key={i} d={`M70 ${98 - i * 0.6} C${88 + i} ${100 - i * 2.6} ${98 - i * 0.4} ${84 - i * 2.2} ${90 - i * 0.8} ${68 - i * 1.4}`} stroke={c} strokeWidth="4.6" fill="none" strokeLinecap="round" />
          ))}
        </g>
        <Tufts cx={50} cy={88} rx={25} ry={19} fill={shade(body, -0.05)} n={22} len={3} seed={121} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="13" ry="11" fill={belly} opacity=".8" />
        <FurLines cx={50} cy={90} rx={10} ry={9} stroke={shade(belly, -0.12)} n={6} seed={122} opacity={0.3} />
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9.2" ry="5.4" fill={shade(body, 0.1)} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9.2" ry="5.4" fill={shade(body, 0.1)} />
        <path d="M30 106 h14 M56 106 h14" stroke={hoof} strokeWidth="3.2" strokeLinecap="round" />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.34} />
      </BodyG>
      <HeadG cy={53}>
        <g className="pa-mane" fill="none" strokeLinecap="round">
          {[...mane].reverse().map((c, i) => {
            const dx = (5 - i) * 3.4;
            return <path key={i} d={`M${30 - dx * 0.3} 34 Q${12 - dx} 48 ${20 - dx} 68 Q${24 - dx} 80 ${16 - dx * 0.8} 92`} stroke={c} strokeWidth="5.2" />;
          })}
        </g>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '34px 30px' }}>
          <path d="M24 34 L22 12 Q23 8 27 10 L41 22 Z" fill={body} />
          <path d="M27 30 L26.4 17 L35 24 Z" fill="#ffc6da" />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '66px 30px' }}>
          <path d="M76 34 L78 12 Q77 8 73 10 L59 22 Z" fill={body} />
          <path d="M73 30 L73.6 17 L65 24 Z" fill="#ffc6da" />
        </g>
        <Tufts cx={50} cy={53} rx={33} ry={29} fill={shade(body, -0.05)} n={28} len={3.4} seed={123} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="53" rx="33" ry="29" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={36} rx={15} ry={8} op={0.4} />
        <g className="pa-horn" style={{ transformOrigin: '50px 28px' }}>
          <defs>
            <linearGradient id={`${u}hn`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={accent} /><stop offset="1" stopColor={shade(accent, 0.55)} />
            </linearGradient>
          </defs>
          <path d="M50 -2 L43 28 Q50 31 57 28 Z" fill={`url(#${u}hn)`} />
          <path d="M45 22 l10 -3.6 M46.6 15 l7 -2.6 M48 8 l4.2 -1.6" stroke={shade(accent, -0.2)} strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <g className="pa-mane">
          {mane.slice(0, 5).map((c, i) => (
            <path key={i} d={`M${27 + i * 1.2} ${38 - i * 1.4} Q${40 + i} ${20 + i * 1.6} ${60 + i * 2.2} ${33 + i * 0.4} Q${50 + i} ${29 + i * 2} ${42 - i} ${44 + i * 0.6}z`} fill={c} opacity=".96" />
          ))}
        </g>
        <KEyes state={eyes} y={52} dx={15} rx={5.4} ry={6.6} iris={pal.iris ?? '#8a63d2'} lashes star />
        <Blush dx={27} y={63} fill="#ff86ac" opacity={0.55} />
        <ellipse cx="50" cy="67" rx="11.5" ry="7.6" fill={pal.nose ?? '#ffd3e4'} />
        <ellipse cx="46.4" cy="66" rx="1.3" ry="1.8" fill="#e68aa8" /><ellipse cx="53.6" cy="66" rx="1.3" ry="1.8" fill="#e68aa8" />
        <path d="M45 71 q5 3.6 10 0" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <Sparkle x={12} y={20} s={1} fill="#ffe27a" cls="pa-twinkle" />
        <Sparkle x={88} y={26} s={0.8} fill="#ffb3d1" cls="pa-twinkle pa-twinkle-2" />
        <Sparkle x={92} y={52} s={0.6} fill="#b5dcff" cls="pa-twinkle pa-twinkle-3" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 26, chin: 76, eyeY: 52, eyeDx: 15, cx: 50 }} />
      </HeadG>
    </g>
  );
}
