import { Acc, Blush, BodyG, FurLines, Grad, HeadG, INK, KEyes, Shade, Shine, Sparkle, Tufts, shade, useUid, type ArtProps } from './kit';

/* ───────────────────────── Eule ───────────────────────── */
export function Eule({ eyes, pal, opt }: ArtProps) {
  const u = useUid('eu');
  const { body, belly, dark, accent } = pal;
  return (
    <g>
      <BodyG bottom={104}>
        <Tufts cx={50} cy={62} rx={37} ry={41} fill={shade(body, -0.05)} n={34} len={3.6} seed={51} />
        <Grad id={`${u}b`} c={body} />
        <ellipse cx="50" cy="62" rx="37" ry="41" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="86" rx="23" ry="17" fill={belly} />
        <Tufts cx={50} cy={86} rx={23} ry={17} fill={belly} n={16} len={3} seed={52} from={20} to={160} />
        <g stroke={shade(body, 0.05)} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".7">
          <path d="M38 80 q3 4 6 0 M46 80 q3 4 6 0 M54 80 q3 4 6 0" />
          <path d="M42 88 q3 4 6 0 M50 88 q3 4 6 0" />
          <path d="M46 96 q3 4 6 0" />
        </g>
        <g className="pa-wing pa-wing-l" style={{ transformOrigin: '20px 56px' }}>
          <ellipse cx="14.5" cy="74" rx="9.5" ry="21" fill={dark} transform="rotate(8 14.5 74)" />
          <path d="M11 66 q-1 8 1 15 M16 66 q0 8 1 16" stroke={shade(dark, 0.14)} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
        <g className="pa-wing pa-wing-r" style={{ transformOrigin: '80px 56px' }}>
          <ellipse cx="85.5" cy="74" rx="9.5" ry="21" fill={dark} transform="rotate(-8 85.5 74)" />
          <path d="M89 66 q1 8 -1 15 M84 66 q0 8 -1 16" stroke={shade(dark, 0.14)} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
        <g fill={accent}>
          <ellipse className="pa-foot pa-foot-l" cx="38" cy="104" rx="3" ry="2.6" /><ellipse cx="44" cy="105" rx="3" ry="2.6" /><ellipse cx="32" cy="105" rx="3" ry="2.6" />
          <ellipse className="pa-foot pa-foot-r" cx="62" cy="104" rx="3" ry="2.6" /><ellipse cx="56" cy="105" rx="3" ry="2.6" /><ellipse cx="68" cy="105" rx="3" ry="2.6" />
        </g>
        <Shade cx={50} cy={78} rx={26} ry={6} op={0.25} />
      </BodyG>
      <HeadG cy={48} bodyTop={64}>
        <path d="M22 34 L16 8 Q17 4 21 6 L40 20 Z" fill={dark} />
        <path d="M78 34 L84 8 Q83 4 79 6 L60 20 Z" fill={dark} />
        <path d="M19 20 l4 6 M81 20 l-4 6" stroke={belly} strokeWidth="1.4" strokeLinecap="round" opacity=".6" />
        <circle cx="35.5" cy="48" r="17" fill={belly} stroke={dark} strokeWidth="1.4" strokeOpacity=".45" />
        <circle cx="64.5" cy="48" r="17" fill={belly} stroke={dark} strokeWidth="1.4" strokeOpacity=".45" />
        <FurLines cx={35.5} cy={48} rx={14} ry={14} stroke={shade(belly, -0.2)} n={12} seed={53} opacity={0.35} angle={0} />
        <FurLines cx={64.5} cy={48} rx={14} ry={14} stroke={shade(belly, -0.2)} n={12} seed={54} opacity={0.35} angle={180} />
        <Shine cx={42} cy={34} rx={14} ry={7} op={0.28} />
        <KEyes state={eyes} y={48} dx={14.5} rx={7} ry={8} iris={pal.iris ?? '#e89a3c'} />
        <Blush dx={28} y={60} rx={4.6} ry={3} />
        <path d="M45.4 55.5 Q50 53.5 54.6 55.5 Q53.6 64 50 66 Q46.4 64 45.4 55.5z" fill={accent} />
        <path d="M47 56.6 Q50 55.4 53 56.6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".6" fill="none" />
        <Sparkle x={88} y={22} s={0.7} fill="#fff" cls="pa-twinkle" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 14, chin: 64, eyeY: 48, eyeDx: 14.5 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Krähe ───────────────────────── */
export function Kraehe({ eyes, pal, opt }: ArtProps) {
  const u = useUid('kr');
  const { body, belly, dark, accent } = pal;
  const head = pal.x2 ?? body;
  const nape = pal.x3;
  const eyeRing = pal.x1 ?? '#fff8ee';
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-flick" style={{ transformOrigin: '66px 98px' }}>
          <ellipse cx="80" cy="98" rx="14" ry="5" fill={dark} transform="rotate(-18 80 98)" />
          <ellipse cx="80" cy="102" rx="14" ry="5" fill={shade(dark, 0.08)} transform="rotate(4 80 102)" />
          <path d="M70 97 l20 -6 M70 102 l22 1" stroke={shade(dark, 0.25)} strokeWidth="1" opacity=".5" />
        </g>
        <Tufts cx={50} cy={88} rx={25} ry={19.5} fill={shade(body, -0.04)} n={22} len={3.6} seed={61} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19.5" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="92" rx="13" ry="11" fill={belly} />
        <path d="M44 86 q3 3 6 0 M50 86 q3 3 6 0 M47 92 q3 3 6 0" stroke={shade(belly, -0.2)} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".5" />
        <g className="pa-wing pa-wing-l" style={{ transformOrigin: '30px 76px' }}>
          <ellipse cx="29" cy="90" rx="9" ry="15" fill={dark} transform="rotate(8 29 90)" />
          <path d="M26 84 q-1 8 1 14 M31 84 q0 8 1 14" stroke={shade(dark, 0.2)} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M23 82 q5 -4 9 -2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".18" fill="none" />
        </g>
        <g className="pa-wing pa-wing-r" style={{ transformOrigin: '70px 76px' }}>
          <ellipse cx="71" cy="90" rx="9" ry="15" fill={dark} transform="rotate(-8 71 90)" />
          <path d="M74 84 q1 8 -1 14 M69 84 q0 8 -1 14" stroke={shade(dark, 0.2)} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <path d="M77 82 q-5 -4 -9 -2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".18" fill="none" />
        </g>
        <g stroke={shade(accent, -0.1)} strokeWidth="2.4" strokeLinecap="round" fill="none">
          <g className="pa-foot pa-foot-l"><path d="M42 106 v-3 M38 106.5 l4 -1 l3 1" /></g>
          <g className="pa-foot pa-foot-r"><path d="M58 106 v-3 M54 106.5 l4 -1 l3 1" /></g>
        </g>
        <Shade cx={50} cy={74} rx={20} ry={7} op={0.4} />
      </BodyG>
      <HeadG>
        <Tufts cx={50} cy={50} rx={32} ry={29} fill={shade(head, -0.05)} n={30} len={3.6} seed={62} />
        <Grad id={`${u}h`} c={head} />
        <ellipse cx="50" cy="50" rx="32" ry="29" fill={`url(#${u}h)`} />
        {nape && <path d="M22 54 Q24 70 40 72 Q30 60 30 44z M78 54 Q76 70 60 72 Q70 60 70 44z" fill={nape} opacity=".9" />}
        <Shine cx={38} cy={32} rx={14} ry={7} op={0.3} />
        <path d="M30 34 Q40 22 56 24" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".16" />
        <FurLines cx={50} cy={44} rx={26} ry={18} stroke={shade(head, 0.18)} n={10} seed={63} opacity={0.3} angle={100} />
        <path d="M46 22 Q44 12 52 10 M52 22 Q54 14 60 15" stroke={shade(head, 0.1)} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <KEyes state={eyes} y={49} dx={15} rx={5.2} ry={6.2} ring={{ r: 8.6, fill: eyeRing }} iris={pal.iris} />
        <Blush dx={27} y={62} fill="#ff9db8" opacity={0.5} />
        <path d="M42.5 56 Q50 51.5 57.5 56 Q55.5 66 50 70.5 Q44.5 66 42.5 56z" fill={accent} />
        <path d="M45.5 57 Q50 54.6 54.5 57" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".55" />
        <path d="M47 62.6 Q50 64.4 53 62.6" stroke={shade(accent, -0.3)} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 21, chin: 70, eyeY: 49, eyeDx: 15 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Esel ───────────────────────── */
export function Esel({ eyes, pal, opt }: ArtProps) {
  const u = useUid('es');
  const { body, belly, dark, accent } = pal;
  const inner = pal.x1 ?? '#f7b4bf';
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '30px 94px' }}>
          <path d="M32 94 Q14 94 15 106" stroke={shade(body, -0.1)} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <ellipse cx="15" cy="104" rx="4.4" ry="6.4" fill={dark} />
        </g>
        <Tufts cx={50} cy={88} rx={25} ry={19} fill={shade(body, -0.05)} n={22} len={3.4} seed={71} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="13" ry="11.5" fill={belly} />
        <FurLines cx={50} cy={91} rx={10} ry={9} stroke={shade(belly, -0.15)} n={8} seed={72} />
        <path d="M32 80 Q50 70 68 80" stroke={dark} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".28" />
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9" ry="5.4" fill={belly} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9" ry="5.4" fill={belly} />
        <ellipse cx="37" cy="106.4" rx="7" ry="2.6" fill={dark} />
        <ellipse cx="63" cy="106.4" rx="7" ry="2.6" fill={dark} />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.38} />
      </BodyG>
      <HeadG>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '36px 38px' }}>
          <Tufts cx={25} cy={22} rx={8.4} ry={22} fill={shade(body, -0.05)} n={14} len={2.2} seed={73} />
          <ellipse cx="25" cy="22" rx="8.4" ry="22" fill={body} transform="rotate(-20 25 22)" />
          <ellipse cx="25.6" cy="23" rx="4.2" ry="16" fill={inner} transform="rotate(-20 25.6 23)" />
          <path d="M12 12 Q16 -2 24 1 Q18 4 14 14z" fill={dark} opacity=".85" />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '64px 38px' }}>
          <Tufts cx={75} cy={22} rx={8.4} ry={22} fill={shade(body, -0.05)} n={14} len={2.2} seed={74} />
          <ellipse cx="75" cy="22" rx="8.4" ry="22" fill={body} transform="rotate(20 75 22)" />
          <ellipse cx="74.4" cy="23" rx="4.2" ry="16" fill={inner} transform="rotate(20 74.4 23)" />
          <path d="M88 12 Q84 -2 76 1 Q82 4 86 14z" fill={dark} opacity=".85" />
        </g>
        <Tufts cx={50} cy={52} rx={32} ry={29} fill={shade(body, -0.05)} n={28} len={3.6} seed={75} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="52" rx="32" ry="29" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={34} rx={14} ry={8} op={0.32} />
        <path d="M39 29 Q38 20 45 21 Q47 15 52 19 Q59 16 61 25 Q62 31 56 32 Q50 36 44 33 Q39 33 39 29z" fill={dark} />
        <path d="M44 24 Q50 20 56 24" stroke="#8b807c" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6" />
        <ellipse cx="50" cy="69" rx="21" ry="15.5" fill={belly} />
        <FurLines cx={50} cy={68} rx={16} ry={10} stroke={shade(belly, -0.18)} n={8} seed={76} opacity={0.4} />
        <KEyes state={eyes} y={49} dx={15} rx={5} ry={6} ring={{ r: 8.4, fill: belly }} />
        <Blush dx={29} y={61} />
        <ellipse cx="43.6" cy="65.4" rx="2.8" ry="3.6" fill={accent} transform="rotate(-18 43.6 65.4)" />
        <ellipse cx="56.4" cy="65.4" rx="2.8" ry="3.6" fill={accent} transform="rotate(18 56.4 65.4)" />
        <path d="M44 74 Q50 79 56 74" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 24, chin: 78, eyeY: 49, eyeDx: 15 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Otter ───────────────────────── */
export function Otter({ eyes, pal, opt }: ArtProps) {
  const u = useUid('ot');
  const { body, belly, dark } = pal;
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '68px 96px' }}>
          <path d="M66 98 C86 104 98 92 95 78 C90 88 80 92 66 90z" fill={shade(body, -0.08)} />
        </g>
        <Tufts cx={50} cy={88} rx={25} ry={19} fill={shade(body, -0.05)} n={22} len={3.2} seed={81} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="90" rx="16" ry="13" fill={belly} />
        <FurLines cx={50} cy={90} rx={13} ry={10} stroke={shade(belly, -0.16)} n={10} seed={82} />
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9.5" ry="5.4" fill={shade(body, 0.06)} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9.5" ry="5.4" fill={shade(body, 0.06)} />
        <ellipse cx="40" cy="89" rx="5.6" ry="4.6" fill={body} />
        <ellipse cx="60" cy="89" rx="5.6" ry="4.6" fill={body} />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.36} />
      </BodyG>
      <HeadG>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '28px 30px' }}>
          <circle cx="23" cy="29" r="7.4" fill={body} />
          <circle cx="23.4" cy="29.6" r="3.8" fill={belly} />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '72px 30px' }}>
          <circle cx="77" cy="29" r="7.4" fill={body} />
          <circle cx="76.6" cy="29.6" r="3.8" fill={belly} />
        </g>
        <Tufts cx={50} cy={51} rx={33} ry={29} fill={shade(body, -0.05)} n={30} len={3.6} seed={83} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="51" rx="33" ry="29" fill={`url(#${u}h)`} />
        <path d="M22 56 C24 44 36 38 50 38 C64 38 76 44 78 56 C80 72 66 82 50 82 C34 82 20 72 22 56z" fill={belly} opacity=".92" />
        <ellipse cx="50" cy="40" rx="13" ry="6" fill={body} opacity=".35" />
        <Shine cx={40} cy={34} rx={14} ry={7} op={0.3} />
        <KEyes state={eyes} y={50} dx={15} rx={4.9} ry={5.9} />
        <Blush dx={26} y={62} />
        <ellipse cx="50" cy="65" rx="12" ry="9" fill={shade(belly, 0.35)} />
        <path d="M45 59.6 Q50 56 55 59.6 Q53 64 50 64 Q47 64 45 59.6z" fill={pal.nose ?? INK} />
        <ellipse cx="47.6" cy="58.8" rx="1.6" ry=".9" fill="#fff" opacity=".7" />
        <path d="M50 64 v2.4 M50 66.4 q-3 3 -6 .2 M50 66.4 q3 3 6 .2" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <g fill={dark} opacity=".7"><circle cx="38.6" cy="66" r=".9" /><circle cx="36.6" cy="68.6" r=".9" /><circle cx="61.4" cy="66" r=".9" /><circle cx="63.4" cy="68.6" r=".9" /></g>
        <g className="pa-whiskers" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".8">
          <path d="M33 66 l-11 -2 M33 69 l-10 3" /><path d="M67 66 l11 -2 M67 69 l10 3" />
        </g>
        <g className="pa-drop"><path d="M12 38 q-3 5 0 7 q3 -2 0 -7z" fill="#a8dcff" opacity=".9" /></g>
        <g className="pa-drop pa-drop-2"><path d="M90 44 q-2.4 4 0 5.6 q2.4 -1.6 0 -5.6z" fill="#a8dcff" opacity=".9" /></g>
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 22, chin: 78, eyeY: 50, eyeDx: 15 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Erdmännchen ───────────────────────── */
export function Erdmaennchen({ eyes, pal, opt }: ArtProps) {
  const u = useUid('em');
  const { body, belly, dark, accent } = pal;
  return (
    <g>
      <BodyG bottom={108}>
        <path className="pa-tail pa-tail-slow" d="M36 104 Q12 106 12 86" stroke={shade(body, -0.08)} strokeWidth="5.4" fill="none" strokeLinecap="round" style={{ transformOrigin: '36px 104px' }} />
        <path className="pa-tail pa-tail-slow" d="M12 90 L12 86" stroke={dark} strokeWidth="5.4" fill="none" strokeLinecap="round" style={{ transformOrigin: '36px 104px' }} />
        <Tufts cx={50} cy={84} rx={21} ry={25} fill={shade(body, -0.05)} n={24} len={3.4} seed={91} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="84" rx="21" ry="25" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="86" rx="12.6" ry="19" fill={belly} />
        <FurLines cx={50} cy={86} rx={10} ry={16} stroke={shade(belly, -0.15)} n={12} seed={92} />
        <g stroke={shade(body, -0.25)} strokeWidth="2.2" strokeLinecap="round" opacity=".7">
          <path d="M31 74 q3 2 6 1.4 M30 82 q3 2 6 1.4 M69 74 q-3 2 -6 1.4 M70 82 q-3 2 -6 1.4" />
        </g>
        <ellipse cx="41.5" cy="82" rx="4.8" ry="7" fill={shade(body, 0.06)} transform="rotate(-18 41.5 82)" />
        <ellipse cx="58.5" cy="82" rx="4.8" ry="7" fill={shade(body, 0.06)} transform="rotate(18 58.5 82)" />
        <ellipse className="pa-foot pa-foot-l" cx="40" cy="106" rx="8.4" ry="4.4" fill={dark} />
        <ellipse className="pa-foot pa-foot-r" cx="60" cy="106" rx="8.4" ry="4.4" fill={dark} />
        <Shade cx={50} cy={66} rx={16} ry={6} op={0.38} />
      </BodyG>
      <HeadG cy={44} bodyTop={64} bottom={108}>
        <g className="pa-scout" style={{ transformOrigin: '50px 62px' }}>
          <circle cx="21" cy="44" r="6.4" fill={dark} />
          <circle cx="79" cy="44" r="6.4" fill={dark} />
          <Tufts cx={50} cy={42} rx={29} ry={26} fill={shade(body, -0.05)} n={26} len={3.4} seed={93} />
          <Grad id={`${u}h`} c={body} />
          <ellipse cx="50" cy="42" rx="29" ry="26" fill={`url(#${u}h)`} />
          <Shine cx={40} cy={28} rx={13} ry={6} op={0.32} />
          <ellipse cx="50" cy="26" rx="9" ry="5" fill={shade(body, 0.22)} opacity=".7" />
          <ellipse cx="35.6" cy="46" rx="10.4" ry="11.6" fill={accent} transform="rotate(-14 35.6 46)" />
          <ellipse cx="64.4" cy="46" rx="10.4" ry="11.6" fill={accent} transform="rotate(14 64.4 46)" />
          <KEyes state={eyes} y={46} dx={14.5} rx={5.2} ry={6.2} />
          <ellipse cx="50" cy="57" rx="11.5" ry="9" fill={belly} />
          <Blush dx={27} y={60} rx={4.6} ry={3} />
          <ellipse cx="50" cy="52.6" rx="3.8" ry="2.8" fill={INK} />
          <ellipse cx="49" cy="51.8" rx="1.1" ry=".6" fill="#fff" opacity=".7" />
          <path d="M50 55.2 v2.4 M50 57.6 q-3 3 -6 .4 M50 57.6 q3 3 6 .4" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 18, chin: 66, eyeY: 46, eyeDx: 14.5 }} />
        </g>
      </HeadG>
    </g>
  );
}
