import { Acc, Blush, BodyG, FurLines, Grad, HeadG, INK, KEyes, Shade, Shine, Sparkle, Tufts, shade, useUid, type ArtProps } from './kit';

/* ───────────────────────── Papagei (Ara) ───────────────────────── */
export function Papagei({ eyes, pal, opt }: ArtProps) {
  const u = useUid('pp');
  const { body, belly, dark, accent } = pal;
  const faceC = pal.x1 ?? '#fff8f0';
  const beakTop = pal.x2 ?? '#f3ead8';
  const beakLow = pal.x3 ?? '#3a3a42';
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-flick" style={{ transformOrigin: '60px 98px' }}>
          <path d="M60 96 Q70 110 76 128 Q66 118 56 98z" fill={dark} transform="translate(0 -22) scale(1 .82)" />
          <path d="M58 92 Q76 96 86 110 Q72 104 56 98z" fill={body} />
          <path d="M60 96 Q80 104 90 116 Q76 112 58 100z" fill={accent} opacity=".95" />
          <path d="M84 108 Q90 112 91 116 Q86 114 82 111z" fill={dark} />
        </g>
        <Tufts cx={50} cy={86} rx={24} ry={20} fill={shade(body, -0.05)} n={24} len={3} seed={131} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="86" rx="24" ry="20" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="90" rx="14" ry="13" fill={belly} />
        <path d="M43 83 q3 3 6 0 M51 83 q3 3 6 0 M47 90 q3 3 6 0 M43 96 q3 3 6 0 M51 96 q3 3 6 0" stroke={shade(belly, -0.16)} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".55" />
        <g className="pa-wing pa-wing-l" style={{ transformOrigin: '30px 76px' }}>
          <path d="M33 74 Q16 80 17 100 Q18 108 24 108 Q30 100 34 86z" fill={body} />
          <path d="M29 80 Q18 86 19 100 Q22 100 26 92z" fill={accent} />
          <path d="M19 98 Q19 107 24 108 Q27 104 28 96z" fill={dark} />
        </g>
        <g className="pa-wing pa-wing-r" style={{ transformOrigin: '70px 76px' }}>
          <path d="M67 74 Q84 80 83 100 Q82 108 76 108 Q70 100 66 86z" fill={body} />
          <path d="M71 80 Q82 86 81 100 Q78 100 74 92z" fill={accent} />
          <path d="M81 98 Q81 107 76 108 Q73 104 72 96z" fill={dark} />
        </g>
        <g stroke="#6b6670" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <g className="pa-foot pa-foot-l"><path d="M42 106 v-3 M38.5 107 l3.5 -1.4 l3 1.4" /></g>
          <g className="pa-foot pa-foot-r"><path d="M58 106 v-3 M54.5 107 l3.5 -1.4 l3 1.4" /></g>
        </g>
        <Shade cx={50} cy={72} rx={18} ry={6} op={0.34} />
      </BodyG>
      <HeadG>
        <path d="M44 24 Q42 12 48 10 M50 23 Q52 10 58 12 M56 25 Q62 16 66 20" stroke={shade(body, 0.05)} strokeWidth="4" strokeLinecap="round" fill="none" />
        <Tufts cx={50} cy={50} rx={30} ry={28} fill={shade(body, -0.05)} n={28} len={3.2} seed={132} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="50" rx="30" ry="28" fill={`url(#${u}h)`} />
        <Shine cx={39} cy={32} rx={13} ry={7} op={0.34} />
        <ellipse cx="34" cy="52" rx="13.5" ry="13" fill={faceC} />
        <ellipse cx="66" cy="52" rx="13.5" ry="13" fill={faceC} />
        <g stroke={shade(faceC, -0.35)} strokeWidth=".9" strokeLinecap="round" opacity=".6" fill="none">
          <path d="M26 56 q4 2 8 1 M27 61 q4 2 8 0 M74 56 q-4 2 -8 1 M73 61 q-4 2 -8 0" />
        </g>
        <KEyes state={eyes} y={49} dx={15.5} rx={5} ry={6} ring={{ r: 8, fill: '#fffbe2' }} iris={pal.iris ?? INK} />
        <Blush dx={27} y={62} opacity={0.4} />
        <path d="M41.5 54 Q50 44.5 58.5 54 Q60 64 51.6 69.6 Q49.4 66.4 48.6 63.4 Q42.6 61.6 41.5 54z" fill={beakTop} stroke={shade(beakTop, -0.4)} strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M44.4 53.6 Q50 49 55.6 53.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".75" />
        <path d="M44.2 63.2 Q50 61.2 55.8 63.2 Q54.8 68.6 50 70 Q45.2 68.6 44.2 63.2z" fill={beakLow} />
        <circle cx="46.8" cy="55.6" r=".8" fill={shade(beakTop, -0.4)} /><circle cx="53.2" cy="55.6" r=".8" fill={shade(beakTop, -0.4)} />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 22, chin: 72, eyeY: 49, eyeDx: 15.5 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Drache ───────────────────────── */
export function Drache({ eyes, pal, opt }: ArtProps) {
  const u = useUid('dr');
  const { body, belly, dark, accent } = pal;
  const horn = pal.x1 ?? '#f7ecd0';
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '68px 96px' }}>
          <path d="M68 98 C92 100 100 82 92 68" stroke={shade(body, -0.06)} strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M68 98 C92 100 100 82 92 68" stroke={body} strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M92 58 Q100 66 98 74 Q92 72 86 70z" fill={accent} />
          <path d="M80 96 l2 -5 l3 5z M90 90 l3 -4 l2 5z" fill={dark} />
        </g>
        <g className="pa-wing pa-wing-l" style={{ transformOrigin: '34px 78px' }}>
          <path d="M34 80 Q8 56 6 78 Q12 74 14 84 Q20 78 22 90 Q30 86 36 90z" fill={accent} />
          <path d="M34 80 Q18 66 8 76 M34 82 Q20 74 14 84 M34 85 Q24 82 22 90" stroke={shade(accent, -0.25)} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
        <g className="pa-wing pa-wing-r" style={{ transformOrigin: '66px 78px' }}>
          <path d="M66 80 Q92 56 94 78 Q88 74 86 84 Q80 78 78 90 Q70 86 64 90z" fill={accent} />
          <path d="M66 80 Q82 66 92 76 M66 82 Q80 74 86 84 M66 85 Q76 82 78 90" stroke={shade(accent, -0.25)} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </g>
        <path d="M40 72 l4 -7 l4 6 l4 -7 l4 7 l4 -6 l4 7z" fill={dark} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="14" ry="13" fill={belly} />
        <g stroke={shade(belly, -0.18)} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity=".7">
          <path d="M40 84 q10 4 20 0 M39 90 q11 4 22 0 M41 96 q9 4 18 0" />
        </g>
        <g fill={shade(body, 0.04)}>
          <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9.5" ry="5.5" /><ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9.5" ry="5.5" />
        </g>
        <g fill={horn}><path d="M30 104 l2 3 l2 -3z M36 105 l2 3 l2 -3z M60 105 l2 3 l2 -3z M66 104 l2 3 l2 -3z" /></g>
        <Shine cx={42} cy={80} rx={11} ry={5} op={0.28} />
        <Shade cx={50} cy={74} rx={20} ry={7} op={0.34} />
      </BodyG>
      <HeadG>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '30px 30px' }}>
          <path d="M27 36 Q18 24 22 17 Q31 22 38 31z" fill={horn} />
          <path d="M27 31 Q23 25 24 20" stroke={shade(horn, -0.2)} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '70px 30px' }}>
          <path d="M73 36 Q82 24 78 17 Q69 22 62 31z" fill={horn} />
          <path d="M73 31 Q77 25 76 20" stroke={shade(horn, -0.2)} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
        <path d="M46 22 l4 -8 l4 8z" fill={dark} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="51" rx="32" ry="28" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={34} rx={14} ry={7} op={0.36} />
        <g fill={shade(body, -0.16)} opacity=".5"><circle cx="38" cy="30" r="1.6" /><circle cx="50" cy="27" r="1.3" /><circle cx="62" cy="30" r="1.6" /><circle cx="54" cy="33" r="1" /><circle cx="45" cy="33" r="1" /></g>
        <KEyes state={eyes} y={49} dx={15} rx={5.4} ry={6.6} iris={pal.iris ?? '#ffcf4a'} slit />
        <Blush dx={27} y={63} />
        <ellipse cx="50" cy="63" rx="15" ry="11" fill={belly} />
        <ellipse cx="45.4" cy="60.6" rx="1.6" ry="2.2" fill={shade(body, -0.45)} /><ellipse cx="54.6" cy="60.6" rx="1.6" ry="2.2" fill={shade(body, -0.45)} />
        <path d="M43 67.4 q7 4.6 14 0" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M45.6 68.6 l1.2 2.4 l1.2 -2 M52 68.8 l1.2 2.2 l1.2 -2.2" fill="#fff" stroke="#fff" strokeWidth=".6" strokeLinejoin="round" />
        <g className="pa-puff"><circle cx="74" cy="66" r="2.6" fill="#fff" opacity=".6" /><circle cx="80" cy="60" r="3.4" fill="#fff" opacity=".42" /><circle cx="87" cy="52" r="4.2" fill="#fff" opacity=".28" /></g>
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 20, chin: 74, eyeY: 49, eyeDx: 15 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Dino (kleiner T-Rex) ───────────────────────── */
export function Dino({ eyes, pal, opt }: ArtProps) {
  const u = useUid('di');
  const { body, belly, accent } = pal;
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '70px 94px' }}>
          <path d="M66 86 C84 86 96 92 98 106 C86 104 74 102 62 100z" fill={shade(body, -0.05)} />
          <path d="M72 88 l3 -6 l3 6z M80 90 l3 -6 l3 7z M88 95 l3 -5 l2 7z" fill={accent} />
        </g>
        <path d="M34 74 l-2 -7 l6 4 l1 -8 l5 7 l3 -8 l4 8 l4 -8 l3 8 l5 -7 l2 8 l5 -4 l-1 8z" fill={accent} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="26" ry="20" fill={`url(#${u}b)`} />
        <ellipse cx="51" cy="91" rx="15" ry="14" fill={belly} />
        <g stroke={shade(belly, -0.16)} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity=".7">
          <path d="M42 84 q9 4 18 0 M41 90 q10 4 20 0 M42 96 q9 4 18 0" />
        </g>
        <g fill={shade(body, -0.04)}>
          <ellipse cx="30" cy="86" rx="4.4" ry="3.2" transform="rotate(-24 30 86)" /><ellipse cx="70" cy="86" rx="4.4" ry="3.2" transform="rotate(24 70 86)" />
        </g>
        <g stroke={shade(body, -0.35)} strokeWidth="1.2" strokeLinecap="round"><path d="M26 88 l-2 1.4 M28 90 l-2 1.8 M74 88 l2 1.4 M72 90 l2 1.8" /></g>
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="10" ry="5.6" fill={shade(body, 0.02)} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="10" ry="5.6" fill={shade(body, 0.02)} />
        <g fill="#fff" stroke={shade(body, -0.3)} strokeWidth=".6"><path d="M30 106 l1.6 2.6 l1.6 -2.6z M37 107 l1.6 2.2 l1.6 -2.2z M44 106 l1.4 2.4 l1.6 -2.4z M56 106 l1.6 2.4 l1.4 -2.4z M62 107 l1.6 2.2 l1.6 -2.2z M69 106 l1.6 2.6 l1.6 -2.6z" /></g>
        <Shade cx={50} cy={74} rx={21} ry={7} op={0.34} />
      </BodyG>
      <HeadG>
        <Grad id={`${u}h`} c={body} />
        <path d="M34 28 l-1 -8 l7 5z M46 22 l1 -9 l7 8z M60 25 l3 -8 l5 8z" fill={accent} opacity={0} />
        <ellipse cx="50" cy="50" rx="33" ry="28" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={34} rx={15} ry={7} op={0.36} />
        <path d="M44 24 l3 -7 l3 7z M52 24 l3 -7 l3 7z M36 28 l2 -6 l3 6z" fill={accent} />
        <g fill={shade(body, -0.18)} opacity=".45"><circle cx="38" cy="32" r="1.8" /><circle cx="62" cy="32" r="1.8" /><circle cx="50" cy="30" r="1.4" /></g>
        <path d="M32 42 Q37 38 43 41 M57 41 Q63 38 68 42" stroke={shade(body, -0.3)} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
        <KEyes state={eyes} y={47} dx={15} rx={5.2} ry={6.4} iris={pal.iris} />
        <Blush dx={28} y={60} />
        <ellipse cx="50" cy="62" rx="19" ry="13" fill={belly} />
        <ellipse cx="44.4" cy="57.6" rx="1.4" ry="1.9" fill={shade(body, -0.5)} /><ellipse cx="55.6" cy="57.6" rx="1.4" ry="1.9" fill={shade(body, -0.5)} />
        <path d="M40 66 Q50 74 60 66" stroke={INK} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M44 68.2 l1.4 2.8 l1.4 -2.4 M53 69 l1.4 2.6 l1.4 -2.8" fill="#fff" stroke="#fff" strokeWidth=".6" strokeLinejoin="round" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 22, chin: 76, eyeY: 47, eyeDx: 15 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Eisvogel ───────────────────────── */
export function Eisvogel({ eyes, pal, opt }: ArtProps) {
  const u = useUid('ev');
  const { body, belly, dark, accent } = pal;
  const beak = pal.x1 ?? '#2a2a33';
  const cheek = pal.x2 ?? accent;
  const throat = pal.x3 ?? '#fffaf0';
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-flick" style={{ transformOrigin: '60px 98px' }}>
          <ellipse cx="78" cy="102" rx="12" ry="4.4" fill={dark} transform="rotate(-14 78 102)" />
        </g>
        <Tufts cx={50} cy={86} rx={29} ry={22} fill={shade(body, -0.05)} n={22} len={2.8} seed={141} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="86" rx="29" ry="22" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="90" rx="21" ry="16" fill={belly} />
        <path d="M43 86 q3 3 6 0 M51 86 q3 3 6 0 M47 93 q3 3 6 0 M43 99 q3 3 6 0 M51 99 q3 3 6 0" stroke={shade(belly, -0.16)} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".5" />
        <g className="pa-wing pa-wing-l" style={{ transformOrigin: '30px 76px' }}>
          <ellipse cx="29" cy="90" rx="8.8" ry="15" fill={dark} transform="rotate(8 29 90)" />
          <g fill={shade(dark, 0.4)} opacity=".7"><circle cx="26" cy="84" r="1" /><circle cx="30" cy="90" r="1" /><circle cx="27" cy="96" r="1" /></g>
        </g>
        <g className="pa-wing pa-wing-r" style={{ transformOrigin: '70px 76px' }}>
          <ellipse cx="71" cy="90" rx="8.8" ry="15" fill={dark} transform="rotate(-8 71 90)" />
          <g fill={shade(dark, 0.4)} opacity=".7"><circle cx="74" cy="84" r="1" /><circle cx="70" cy="90" r="1" /><circle cx="73" cy="96" r="1" /></g>
        </g>
        <g stroke="#e0603a" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <g className="pa-foot pa-foot-l"><path d="M42 106 v-3 M39 106.6 l3 -1 l2.6 1" /></g>
          <g className="pa-foot pa-foot-r"><path d="M58 106 v-3 M55 106.6 l3 -1 l2.6 1" /></g>
        </g>
        <Shade cx={50} cy={74} rx={18} ry={6} op={0.34} />
        <path className="pa-fish" d="M72 100 q5 -4 10 0 q-5 4 -10 0z M82 100 l4 -3 v6z" fill="#cfe7ff" opacity={0} />
      </BodyG>
      <HeadG>
        <path d="M42 24 Q40 14 46 12 M50 23 Q50 12 56 13 M57 25 Q62 17 66 21" stroke={shade(body, 0.1)} strokeWidth="3.6" strokeLinecap="round" fill="none" />
        <Tufts cx={50} cy={50} rx={31} ry={28} fill={shade(body, -0.05)} n={28} len={3.2} seed={142} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="50" rx="31" ry="28" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={32} rx={14} ry={7} op={0.34} />
        <g fill={shade(body, 0.35)} opacity=".6"><circle cx="38" cy="32" r="1.1" /><circle cx="46" cy="28" r="1.1" /><circle cx="54" cy="29" r="1.1" /><circle cx="62" cy="33" r="1.1" /><circle cx="50" cy="35" r="1" /></g>
        <ellipse cx="29" cy="58" rx="10" ry="9" fill={cheek} />
        <ellipse cx="71" cy="58" rx="10" ry="9" fill={cheek} />
        <ellipse cx="50" cy="68" rx="12" ry="9" fill={throat} />
        <ellipse cx="38" cy="52" rx="5" ry="3.4" fill={throat} opacity=".9" transform="rotate(-16 38 52)" />
        <ellipse cx="62" cy="52" rx="5" ry="3.4" fill={throat} opacity=".9" transform="rotate(16 62 52)" />
        <KEyes state={eyes} y={47} dx={15} rx={4.8} ry={5.8} iris={pal.iris} />
        <Blush dx={27} y={60} opacity={0.35} />
        <path d="M43.6 55 Q50 50.4 56.4 55 Q55.6 66 50 71.6 Q44.4 66 43.6 55z" fill={beak} />
        <path d="M46.2 55.6 Q50 52.6 53.8 55.6" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".5" />
        <path d="M44.4 62.4 Q50 64.6 55.6 62.4" stroke={shade(beak, 0.35)} strokeWidth="1" strokeLinecap="round" fill="none" opacity=".6" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 20, chin: 72, eyeY: 47, eyeDx: 15 }} />
      </HeadG>
    </g>
  );
}
void FurLines; void Sparkle;
