import { Acc, Blush, BodyG, FurLines, Grad, HeadG, INK, KEyes, Shade, Shine, Sparkle, Tufts, shade, useUid, type ArtProps } from './kit';

/* ───────────────────────── Corgi ───────────────────────── */
export function Corgi({ eyes, pal, opt }: ArtProps) {
  const u = useUid('cg');
  const { body, belly, dark, accent } = pal;
  const tan = pal.x1; // tricolour: tan eyebrows & cheeks
  return (
    <g>
      <BodyG>
        {/* the little fluffy rump instead of a tail */}
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '76px 94px' }}>
          <Tufts cx={77} cy={93} rx={6.5} ry={6} fill={belly} n={10} len={3} seed={201} />
          <circle cx="77" cy="93" r="6.4" fill={belly} />
          <circle cx="75.4" cy="91.4" r="2.2" fill="#fff" opacity=".55" />
        </g>
        <Tufts cx={50} cy={89} rx={28} ry={19} fill={shade(body, -0.04)} n={24} len={3.8} seed={202} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="89" rx="28" ry="19" fill={`url(#${u}b)`} />
        {/* white belly & chest, sock-like feet */}
        <path d="M30 94 Q34 76 50 76 Q66 76 70 94 Q66 108 50 108 Q34 108 30 94z" fill={belly} />
        <Tufts cx={50} cy={88} rx={15} ry={12} fill={belly} n={12} len={3} seed={203} from={10} to={170} />
        <FurLines cx={50} cy={92} rx={13} ry={10} stroke={shade(belly, -0.16)} n={8} seed={204} opacity={0.4} />
        <ellipse className="pa-foot pa-foot-l" cx="36" cy="105" rx="9.4" ry="5.2" fill={belly} />
        <ellipse className="pa-foot pa-foot-r" cx="64" cy="105" rx="9.4" ry="5.2" fill={belly} />
        <g stroke={shade(belly, -0.22)} strokeWidth="1" strokeLinecap="round" opacity=".6"><path d="M33 106 v-2 M37 106.6 v-2.4 M61 106.6 v-2.4 M65 106 v-2" /></g>
        <Shade cx={50} cy={74} rx={22} ry={7} op={0.38} />
        <Shine cx={42} cy={82} rx={12} ry={5} op={0.2} />
      </BodyG>
      <HeadG>
        {/* big upright ears */}
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '30px 34px' }}>
          <path d="M17 46 Q6 14 22 3 Q40 10 43 32z" fill={dark} />
          <path d="M22 40 Q15 18 24 10 Q34 16 37 31z" fill="#f7b4bf" opacity=".92" />
          <path d="M26 34 Q22 22 26 16" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".5" />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '70px 34px' }}>
          <path d="M83 46 Q94 14 78 3 Q60 10 57 32z" fill={dark} />
          <path d="M78 40 Q85 18 76 10 Q66 16 63 31z" fill="#f7b4bf" opacity=".92" />
          <path d="M74 34 Q78 22 74 16" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".5" />
        </g>
        <Tufts cx={50} cy={52} rx={33} ry={27} fill={shade(body, -0.04)} n={28} len={4} seed={205} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="52" rx="33" ry="27" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={34} rx={15} ry={7} op={0.38} />
        {/* white blaze and cheeks */}
        <path d="M50 25 C57 33 57 46 56 60 L44 60 C43 46 43 33 50 25z" fill={accent} />
        <path d="M15 58 C19 78 34 84 50 84 C66 84 81 78 85 58 C76 63 66 59 50 59 C34 59 24 63 15 58z" fill={belly} />
        <Tufts cx={50} cy={72} rx={32} ry={12} fill={belly} n={14} len={3} seed={206} from={0} to={180} />
        {tan && (
          <g fill={tan}>
            <ellipse cx="34.5" cy="38" rx="3.6" ry="2.4" transform="rotate(-14 34.5 38)" />
            <ellipse cx="65.5" cy="38" rx="3.6" ry="2.4" transform="rotate(14 65.5 38)" />
            <ellipse cx="22" cy="63" rx="3.6" ry="4.6" opacity=".75" />
            <ellipse cx="78" cy="63" rx="3.6" ry="4.6" opacity=".75" />
          </g>
        )}
        <FurLines cx={50} cy={48} rx={26} ry={16} stroke={shade(body, -0.18)} n={10} seed={207} opacity={0.26} />
        <KEyes state={eyes} y={51} dx={15.5} rx={5.2} ry={6.4} iris={pal.iris ?? '#6a4326'} />
        <Blush dx={27} y={64} />
        <ellipse cx="50" cy="62" rx="6.2" ry="4.3" fill={pal.nose ?? INK} />
        <ellipse cx="48.2" cy="60.6" rx="1.9" ry="1" fill="#fff" opacity=".75" />
        <path d="M50 66 v3 M50 69 q-5.4 4.8 -10.4 0.6 M50 69 q5.4 4.8 10.4 0.6" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {eyes === 'open' && (
          <g className="pa-tongue" style={{ transformOrigin: '50px 71px' }}>
            <path d="M45.4 71.4 q4.6 1.6 9.2 0 q0.6 7 -4.6 7 q-5.2 0 -4.6 -7z" fill="#ff8aa0" />
            <path d="M50 72.2 v4" stroke="#e9627f" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 23, chin: 80, eyeY: 51, eyeDx: 15.5 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Piepmatz ───────────────────────── */
export function Piepmatz({ eyes, pal, opt }: ArtProps) {
  const u = useUid('pm');
  const { body, belly, dark, accent } = pal;
  const cap = pal.x2; // coloured cap (sparrow / tit)
  const cheek = pal.x1; // light cheek patches
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-flick" style={{ transformOrigin: '68px 96px' }}>
          <path d="M66 94 Q82 92 92 98 Q84 100 78 103 Q86 106 90 112 Q76 108 64 102z" fill={dark} />
          <path d="M72 97 l14 2 M72 101 l14 7" stroke={shade(dark, 0.25)} strokeWidth="1" opacity=".5" strokeLinecap="round" />
        </g>
        <Tufts cx={50} cy={86} rx={29} ry={22} fill={shade(body, -0.04)} n={24} len={3.4} seed={211} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="86" rx="29" ry="22" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="20" ry="15.5" fill={belly} />
        <path d="M43 86 q3 3 6 0 M51 86 q3 3 6 0 M47 92 q3 3 6 0 M43 98 q3 3 6 0 M51 98 q3 3 6 0" stroke={shade(belly, -0.16)} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".5" />
        <g className="pa-wing pa-wing-l" style={{ transformOrigin: '28px 78px' }}>
          <path d="M30 76 Q14 80 15 96 Q16 104 24 102 Q31 96 33 84z" fill={dark} />
          <path d="M20 88 q3 6 8 8 M18 94 q4 5 9 6" stroke={shade(dark, 0.3)} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".55" />
        </g>
        <g className="pa-wing pa-wing-r" style={{ transformOrigin: '72px 78px' }}>
          <path d="M70 76 Q86 80 85 96 Q84 104 76 102 Q69 96 67 84z" fill={dark} />
          <path d="M80 88 q-3 6 -8 8 M82 94 q-4 5 -9 6" stroke={shade(dark, 0.3)} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".55" />
        </g>
        <g stroke={accent} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <g className="pa-foot pa-foot-l"><path d="M42 105 v-2 M38.6 106.6 l3.4 -1.6 l3 1.6" /></g>
          <g className="pa-foot pa-foot-r"><path d="M58 105 v-2 M54.6 106.6 l3.4 -1.6 l3 1.6" /></g>
        </g>
        <Shade cx={50} cy={72} rx={19} ry={6} op={0.32} />
      </BodyG>
      <HeadG>
        <defs>
          <clipPath id={`${u}c`}>
            <ellipse cx="50" cy="50" rx="33" ry="29" />
          </clipPath>
          {cap && (
            <linearGradient id={`${u}k`} gradientUnits="userSpaceOnUse" x1="0" y1="18" x2="0" y2="47">
              <stop offset="0" stopColor={cap} stopOpacity="1" />
              <stop offset="0.55" stopColor={cap} stopOpacity="0.9" />
              <stop offset="1" stopColor={cap} stopOpacity="0" />
            </linearGradient>
          )}
        </defs>
        {/* the little feather tuft */}
        <g className="pa-crest" style={{ transformOrigin: '50px 22px' }}>
          <path d="M44 24 Q40 12 47 9 M50 23 Q50 9 57 10 M56 25 Q62 15 67 19" stroke={cap ?? dark} strokeWidth="4.2" strokeLinecap="round" fill="none" />
        </g>
        <Tufts cx={50} cy={50} rx={33} ry={29} fill={shade(body, -0.04)} n={30} len={3.6} seed={212} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="50" rx="33" ry="29" fill={`url(#${u}h)`} />
        {cap && <path clipPath={`url(#${u}c)`} d="M10 52 Q10 14 50 14 Q90 14 90 52 L90 56 L10 56z" fill={`url(#${u}k)`} />}
        <Shine cx={40} cy={32} rx={15} ry={7} op={0.34} />
        <ellipse cx="50" cy="63" rx="22" ry="14" fill={belly} opacity={cheek ? 0.55 : 0.85} />
        {cheek && (
          <g fill={cheek}>
            <ellipse cx="29" cy="62" rx="8.4" ry="6.6" />
            <ellipse cx="71" cy="62" rx="8.4" ry="6.6" />
          </g>
        )}
        <FurLines cx={50} cy={46} rx={26} ry={16} stroke={shade(body, 0.2)} n={9} seed={213} opacity={0.3} />
        <KEyes state={eyes} y={49} dx={16} rx={5.4} ry={6.6} iris={pal.iris} />
        <Blush dx={27} y={61} fill="#ff9db0" opacity={0.5} />
        {/* a tiny round beak */}
        <path d="M44.6 56 Q50 51 55.4 56 Q54.4 64 50 66.4 Q45.6 64 44.6 56z" fill={accent} />
        <path d="M46.6 56.4 Q50 53.4 53.4 56.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".6" />
        <path d="M45.8 60.6 Q50 62.4 54.2 60.6" stroke={shade(accent, -0.3)} strokeWidth="1" strokeLinecap="round" fill="none" opacity=".7" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 21, chin: 70, eyeY: 49, eyeDx: 16 }} />
      </HeadG>
    </g>
  );
}
void Sparkle;
