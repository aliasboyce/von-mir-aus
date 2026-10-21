import { Acc, Blush, BodyG, Curls, FurLines, Grad, HeadG, INK, KEyes, Shade, Shine, Tufts, shade, useUid, type ArtProps } from './kit';

/* ───────────────────────── Katze (einfarbig / getigert) ───────────────────────── */
export function Katze({ eyes, pal, opt }: ArtProps) {
  const u = useUid('kz');
  const { body, belly, dark, accent } = pal;
  const nose = pal.nose ?? '#ff8fa6';
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '68px 96px' }}>
          <path d="M68 96 C92 96 98 70 86 62" stroke={shade(body, -0.06)} strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M68 96 C92 96 98 70 86 62" stroke={body} strokeWidth="8.4" fill="none" strokeLinecap="round" />
          <path d="M71 93 C90 93 95 74 86 66" stroke={shade(body, 0.28)} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".45" />
          <path d="M80 82 q4 -1 7 1 M84 74 q4 -1 6 1" stroke={dark} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".6" />
        </g>
        <Tufts cx={50} cy={88} rx={25} ry={19} fill={shade(body, -0.04)} n={22} len={3.6} seed={4} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="13" ry="12" fill={belly} />
        <FurLines cx={50} cy={91} rx={11} ry={10} stroke={shade(belly, -0.12)} n={9} seed={7} />
        <FurLines cx={40} cy={86} rx={14} ry={11} stroke={dark} n={8} seed={8} opacity={0.22} />
        <Tufts cx={37} cy={104} rx={9} ry={5.2} fill={belly} n={10} len={2.4} w={2.4} seed={2} from={150} to={390} />
        <Tufts cx={63} cy={104} rx={9} ry={5.2} fill={belly} n={10} len={2.4} w={2.4} seed={3} from={150} to={390} />
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9" ry="5.5" fill={belly} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9" ry="5.5" fill={belly} />
        <path className="pa-toes" d="M33 103v2.4M38 103v2.4M63 103v2.4M68 103v2.4" stroke={shade(body, -0.1)} strokeWidth="1" strokeLinecap="round" opacity=".5" />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.4} />
      </BodyG>
      <HeadG>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '32px 30px' }}>
          <path d="M17 44 L19 12 Q20 8 24 10 L44 24 Z" fill={body} />
          <path d="M23 36 L24.5 18 L38 27 Z" fill={accent} />
          <path d="M24 31 l2 -8 M28 31 l1.5 -6 M31 33 l1.8 -5" stroke={belly} strokeWidth="1" strokeLinecap="round" opacity=".7" />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '68px 30px' }}>
          <path d="M83 44 L81 12 Q80 8 76 10 L56 24 Z" fill={body} />
          <path d="M77 36 L75.5 18 L62 27 Z" fill={accent} />
          <path d="M76 31 l-2 -8 M72 31 l-1.5 -6 M69 33 l-1.8 -5" stroke={belly} strokeWidth="1" strokeLinecap="round" opacity=".7" />
        </g>
        <Tufts cx={50} cy={51} rx={33} ry={29} fill={shade(body, -0.04)} n={30} len={4.2} seed={11} />
        <Tufts cx={50} cy={58} rx={34} ry={22} fill={shade(body, -0.02)} n={8} len={7} w={5} seed={12} from={150} to={210} />
        <Tufts cx={50} cy={58} rx={34} ry={22} fill={shade(body, -0.02)} n={8} len={7} w={5} seed={13} from={-30} to={30} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="51" rx="33" ry="29" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={34} rx={15} ry={9} op={0.4} />
        <g stroke={dark} strokeWidth="3.4" strokeLinecap="round" opacity=".8">
          <path d="M50 23 v8" />
          <path d="M41 24.5 l1.8 6.5" />
          <path d="M59 24.5 l-1.8 6.5" />
        </g>
        <g stroke={dark} strokeWidth="2.6" strokeLinecap="round" opacity=".5">
          <path d="M18 52 h7M19 59 h6" />
          <path d="M82 52 h-7M81 59 h-6" />
        </g>
        <FurLines cx={50} cy={50} rx={28} ry={22} stroke={shade(body, -0.16)} n={14} seed={14} opacity={0.3} angle={80} />
        <ellipse cx="43.5" cy="64.5" rx="8" ry="6.5" fill={belly} />
        <ellipse cx="56.5" cy="64.5" rx="8" ry="6.5" fill={belly} />
        <KEyes state={eyes} y={52} dx={14} rx={5.6} ry={6.8} iris={pal.iris} slit={!!pal.iris} />
        <Blush dx={26} y={62} />
        <path d="M47.2 60 h5.6 l-2.8 3.4 z" fill={nose} />
        <path d="M50 63.4 v1.6 M50 65 q-2.6 2.8 -5.4 0.4 M50 65 q2.6 2.8 5.4 0.4" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <g className="pa-whiskers" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".85">
          <path d="M30 64 l-13 -2.5 M30 67 l-12 3" />
          <path d="M70 64 l13 -2.5 M70 67 l12 3" />
        </g>
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 22, chin: 76, eyeY: 52, eyeDx: 14 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Hund (Mischling) ───────────────────────── */
export function Hund({ eyes, pal, opt }: ArtProps) {
  const u = useUid('hd');
  const { body, belly, dark, accent } = pal;
  const collar = pal.x1 ?? '#e5566b';
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-fast" style={{ transformOrigin: '72px 94px' }}>
          <path d="M72 94 C86 90 92 78 88 70" stroke={shade(body, -0.05)} strokeWidth="12.4" fill="none" strokeLinecap="round" />
          <path d="M72 94 C86 90 92 78 88 70" stroke={body} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M76 91 C86 88 90 79 87 73" stroke={shade(body, 0.3)} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".5" />
        </g>
        <Tufts cx={50} cy={88} rx={25} ry={19} fill={shade(body, -0.04)} n={22} len={3.6} seed={21} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="12" ry="11" fill={belly} />
        <FurLines cx={50} cy={91} rx={10} ry={9} stroke={shade(belly, -0.14)} n={8} seed={22} />
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9.5" ry="5.5" fill={belly} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9.5" ry="5.5" fill={belly} />
        <path d="M33 103v2.4M38 103v2.4M62 103v2.4M67 103v2.4" stroke={shade(belly, -0.2)} strokeWidth="1" strokeLinecap="round" opacity=".6" />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.4} />
        <path d="M31 77 Q50 90 69 77" stroke={collar} strokeWidth="4.2" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="86" r="3.6" fill="#ffcf4a" stroke="#e0a928" strokeWidth=".8" />
      </BodyG>
      <HeadG>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '26px 36px' }}>
          <Tufts cx={19} cy={52} rx={11} ry={21} fill={dark} n={16} len={3} seed={23} />
          <ellipse cx="19" cy="52" rx="11" ry="21" fill={dark} transform="rotate(14 19 52)" />
          <ellipse cx="17" cy="48" rx="4.5" ry="10" fill={shade(dark, 0.14)} opacity=".6" transform="rotate(14 17 48)" />
          <FurLines cx={19} cy={54} rx={7} ry={15} stroke={shade(dark, -0.2)} n={8} seed={24} opacity={0.4} />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '74px 36px' }}>
          <Tufts cx={81} cy={52} rx={11} ry={21} fill={dark} n={16} len={3} seed={25} />
          <ellipse cx="81" cy="52" rx="11" ry="21" fill={dark} transform="rotate(-14 81 52)" />
          <ellipse cx="83" cy="48" rx="4.5" ry="10" fill={shade(dark, 0.14)} opacity=".6" transform="rotate(-14 83 48)" />
          <FurLines cx={81} cy={54} rx={7} ry={15} stroke={shade(dark, -0.2)} n={8} seed={26} opacity={0.4} />
        </g>
        <Tufts cx={50} cy={50} rx={32} ry={29} fill={shade(body, -0.04)} n={28} len={3.8} seed={27} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="50" rx="32" ry="29" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={33} rx={14} ry={8} op={0.4} />
        <path d="M50 22 C57 28 57 42 54 52 L46 52 C43 42 43 28 50 22z" fill={accent} opacity=".92" />
        <ellipse cx="65" cy="50" rx="10" ry="11" fill={dark} opacity=".5" />
        <FurLines cx={50} cy={46} rx={26} ry={20} stroke={shade(body, -0.18)} n={12} seed={28} opacity={0.28} />
        <ellipse cx="50" cy="66" rx="17" ry="12.5" fill={belly} />
        <KEyes state={eyes} y={50} dx={14.5} rx={5.4} ry={6.6} />
        <Blush dx={27} y={63} />
        <ellipse cx="50" cy="59.5" rx="6.6" ry="4.6" fill={pal.nose ?? INK} />
        <ellipse cx="48.2" cy="58" rx="2" ry="1.1" fill="#fff" opacity=".75" />
        <path d="M50 64 v3.2 M50 67.2 q-5.5 5 -10.5 0.6 M50 67.2 q5.5 5 10.5 0.6" stroke={INK} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        {eyes === 'open' && (
          <g className="pa-tongue" style={{ transformOrigin: '50px 69px' }}>
            <path d="M45 69.6 q5 1.6 10 0 q0.6 7.4 -5 7.4 q-5.6 0 -5 -7.4z" fill="#ff8aa0" />
            <path d="M50 70.4 v4.2" stroke="#e9627f" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 22, chin: 76, eyeY: 50, eyeDx: 14.5 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Wolf ───────────────────────── */
export function Wolf({ eyes, pal, opt }: ArtProps) {
  const u = useUid('wf');
  const { body, belly, dark } = pal;
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '70px 96px' }}>
          <path d="M70 98 C92 98 98 74 90 56" stroke={shade(body, -0.06)} strokeWidth="18" fill="none" strokeLinecap="round" />
          <path d="M70 98 C92 98 98 74 90 56" stroke={body} strokeWidth="15" fill="none" strokeLinecap="round" />
          <path d="M90 64 C92 60 91 57 90 55" stroke={belly} strokeWidth="15" fill="none" strokeLinecap="round" />
          <path d="M74 94 C90 94 94 76 88 62" stroke={shade(body, 0.3)} strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".4" />
        </g>
        <Tufts cx={50} cy={88} rx={25} ry={19} fill={shade(body, -0.04)} n={24} len={4.2} seed={31} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={`url(#${u}b)`} />
        <path d="M36 80 Q50 98 64 80 Q60 100 50 100 Q40 100 36 80z" fill={belly} />
        <Tufts cx={50} cy={86} rx={14} ry={14} fill={belly} n={12} len={4} seed={32} from={20} to={160} />
        <FurLines cx={50} cy={90} rx={12} ry={9} stroke={shade(belly, -0.16)} n={9} seed={33} />
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9.5" ry="5.5" fill={shade(body, 0.12)} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9.5" ry="5.5" fill={shade(body, 0.12)} />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.4} />
      </BodyG>
      <HeadG>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '30px 28px' }}>
          <path d="M15 42 L17 6 Q18 2 22 5 L44 24 Z" fill={body} />
          <path d="M22 36 L23.4 15 L37 27 Z" fill={dark} />
          <path d="M24 33 l2 -9 M28 33 l1.4 -6" stroke={belly} strokeWidth="1.1" strokeLinecap="round" opacity=".6" />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '70px 28px' }}>
          <path d="M85 42 L83 6 Q82 2 78 5 L56 24 Z" fill={body} />
          <path d="M78 36 L76.6 15 L63 27 Z" fill={dark} />
          <path d="M76 33 l-2 -9 M72 33 l-1.4 -6" stroke={belly} strokeWidth="1.1" strokeLinecap="round" opacity=".6" />
        </g>
        <path d="M19 52 L4 58 L17 61 L6 70 L22 68 L26 73 Z" fill={belly} />
        <path d="M81 52 L96 58 L83 61 L94 70 L78 68 L74 73 Z" fill={belly} />
        <Tufts cx={50} cy={50} rx={33} ry={29} fill={shade(body, -0.04)} n={30} len={4.2} seed={34} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="50" rx="33" ry="29" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={33} rx={15} ry={8} op={0.35} />
        <path d="M50 22 C54 29 54 37 52 43 L48 43 C46 37 46 29 50 22z" fill={dark} opacity=".4" />
        <circle cx="35" cy="40" r="1.7" fill={belly} opacity=".85" />
        <circle cx="65" cy="40" r="1.7" fill={belly} opacity=".85" />
        <FurLines cx={50} cy={46} rx={27} ry={18} stroke={shade(body, -0.18)} n={12} seed={35} opacity={0.3} />
        <path d="M17 62 C22 78 36 84 50 84 C64 84 78 78 83 62 C74 62 66 56 50 56 C34 56 26 62 17 62z" fill={belly} />
        <FurLines cx={50} cy={72} rx={22} ry={8} stroke={shade(belly, -0.15)} n={10} seed={36} opacity={0.4} />
        <KEyes state={eyes} y={50} dx={14.5} rx={5.4} ry={6.6} iris={pal.iris} />
        <Blush dx={27} y={63} />
        <path d="M44 59 Q50 55.5 56 59 Q54 64.5 50 64.5 Q46 64.5 44 59z" fill={pal.nose ?? INK} />
        <ellipse cx="47.8" cy="58" rx="1.8" ry="1" fill="#fff" opacity=".7" />
        <path d="M50 64.5 v3 M50 67.5 q-4.4 4 -8.6 0.4 M50 67.5 q4.4 4 8.6 0.4" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 20, chin: 80, eyeY: 50, eyeDx: 14.5 }} />
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Bär ───────────────────────── */
export function Baer({ eyes, pal, opt }: ArtProps) {
  const u = useUid('br');
  const { body, belly, dark } = pal;
  return (
    <g>
      <BodyG>
        <Tufts cx={50} cy={88} rx={27} ry={20} fill={shade(body, -0.04)} n={24} len={4} seed={41} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="27" ry="20" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="91" rx="15" ry="12.5" fill={belly} />
        <FurLines cx={50} cy={91} rx={12} ry={10} stroke={shade(belly, -0.16)} n={9} seed={42} />
        <Tufts cx={25} cy={88} rx={8} ry={11} fill={shade(body, -0.04)} n={10} len={3} seed={43} />
        <Tufts cx={75} cy={88} rx={8} ry={11} fill={shade(body, -0.04)} n={10} len={3} seed={44} />
        <ellipse cx="25" cy="88" rx="8" ry="11" fill={body} transform="rotate(14 25 88)" />
        <ellipse cx="75" cy="88" rx="8" ry="11" fill={body} transform="rotate(-14 75 88)" />
        <ellipse className="pa-foot pa-foot-l" cx="36" cy="104" rx="10" ry="5.8" fill={shade(body, 0.08)} />
        <ellipse className="pa-foot pa-foot-r" cx="64" cy="104" rx="10" ry="5.8" fill={shade(body, 0.08)} />
        <ellipse cx="36" cy="105" rx="5" ry="3" fill={dark} />
        <ellipse cx="64" cy="105" rx="5" ry="3" fill={dark} />
        <Shade cx={50} cy={74} rx={22} ry={8} op={0.42} />
      </BodyG>
      <HeadG>
        <g className="pa-ear pa-ear-l" style={{ transformOrigin: '27px 28px' }}>
          <Tufts cx={24} cy={24} rx={11.5} ry={11.5} fill={shade(body, -0.04)} n={12} len={2.6} seed={45} />
          <circle cx="24" cy="24" r="11.5" fill={body} />
          <circle cx="24.5" cy="25" r="6.2" fill={dark} />
        </g>
        <g className="pa-ear pa-ear-r" style={{ transformOrigin: '73px 28px' }}>
          <Tufts cx={76} cy={24} rx={11.5} ry={11.5} fill={shade(body, -0.04)} n={12} len={2.6} seed={46} />
          <circle cx="76" cy="24" r="11.5" fill={body} />
          <circle cx="75.5" cy="25" r="6.2" fill={dark} />
        </g>
        <Tufts cx={50} cy={51} rx={34} ry={30} fill={shade(body, -0.04)} n={32} len={4.2} seed={47} />
        <Grad id={`${u}h`} c={body} />
        <ellipse cx="50" cy="51" rx="34" ry="30" fill={`url(#${u}h)`} />
        <Shine cx={40} cy={32} rx={15} ry={8} op={0.35} />
        <FurLines cx={50} cy={46} rx={28} ry={21} stroke={shade(body, -0.18)} n={14} seed={48} opacity={0.3} />
        <ellipse cx="50" cy="65" rx="15.5" ry="12" fill={dark} />
        <FurLines cx={50} cy={65} rx={12} ry={8} stroke={shade(dark, -0.14)} n={8} seed={49} opacity={0.35} />
        <KEyes state={eyes} y={50} dx={16} rx={5} ry={6} />
        <Blush dx={27} y={62} />
        <path d="M44.5 58.6 Q50 54.8 55.5 58.6 Q53.5 63.6 50 63.6 Q46.5 63.6 44.5 58.6z" fill={pal.nose ?? INK} />
        <ellipse cx="47.8" cy="57.4" rx="1.8" ry="1" fill="#fff" opacity=".7" />
        <path d="M50 63.6 v2.4 M50 66 q-3.6 3.4 -7 0.2 M50 66 q3.6 3.4 7 0.2" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <g className="pa-bee">
          <ellipse cx="86" cy="30" rx="4.2" ry="3" fill="#ffd34d" />
          <path d="M85 27.2v5.6M88 27.6v4.8" stroke={INK} strokeWidth="1.3" />
          <ellipse className="pa-wing-b" cx="85" cy="26.2" rx="2.6" ry="1.6" fill="#fff" opacity=".85" />
          <ellipse className="pa-wing-b" cx="88" cy="26.6" rx="2.6" ry="1.6" fill="#fff" opacity=".85" />
        </g>
        <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 20, chin: 78, eyeY: 50, eyeDx: 16 }} />
      </HeadG>
    </g>
  );
}
void Curls;
