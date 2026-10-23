import type { ReactNode } from 'react';
import { Acc, Blush, BodyG, CurlMarks, Curls, FurLines, Grad, Harness, HeadG, INK, KEyes, Shade, Shine, Tufts, shade, useUid, type ArtProps } from './kit';

const Tilt = ({ deg, children }: { deg?: number; children: ReactNode }) => (deg ? <g transform={`rotate(${deg} 50 80)`}>{children}</g> : <>{children}</>);

/* ───────────────────────── Pudel (lockig) – nach dem Foto des roten Pudels ───────────────────────── */
export function Pudel({ eyes, pal, opt }: ArtProps) {
  const u = useUid('pu');
  const { body, dark, accent } = pal;
  const nose = pal.nose ?? '#1d1a1f';
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-fast" style={{ transformOrigin: '72px 94px' }}>
          <path d="M72 94 Q84 90 86 78" stroke={dark} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <Curls cx={86} cy={74} rx={2} ry={2} fill={body} n={7} r={5.4} seed={5} />
          <circle cx="86" cy="74" r="6" fill={body} />
          <CurlMarks cx={86} cy={74} rx={4} ry={4} stroke={dark} n={3} r={1.6} seed={9} opacity={0.24} />
        </g>
        <Curls cx={50} cy={88} rx={25} ry={18} fill={shade(body, -0.04)} n={22} r={6} seed={141} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="18.5" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="92" rx="14" ry="11" fill={accent} opacity=".7" />
        <CurlMarks cx={50} cy={88} rx={22} ry={15} stroke={shade(body, -0.28)} n={20} r={3} seed={142} opacity={0.24} />
        <g className="pa-foot pa-foot-l"><Curls cx={37} cy={103} rx={5} ry={2.5} fill={body} n={7} r={5} seed={143} /><ellipse cx="37" cy="103" rx="8.4" ry="5" fill={body} /></g>
        <g className="pa-foot pa-foot-r"><Curls cx={63} cy={103} rx={5} ry={2.5} fill={body} n={7} r={5} seed={144} /><ellipse cx="63" cy="103" rx="8.4" ry="5" fill={body} /></g>
        <CurlMarks cx={37} cy={103} rx={6} ry={3} stroke={shade(body, -0.3)} n={4} r={2} seed={145} opacity={0.3} />
        <CurlMarks cx={63} cy={103} rx={6} ry={3} stroke={shade(body, -0.3)} n={4} r={2} seed={146} opacity={0.24} />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.4} />
        {opt?.harness && <Harness y={84} />}
      </BodyG>
      <HeadG>
        <Tilt deg={opt?.tilt}>
          <g className="pa-ear pa-ear-l" style={{ transformOrigin: '24px 40px' }}>
            <Curls cx={17} cy={58} rx={5} ry={19} fill={dark} n={11} r={6} seed={147} />
            <ellipse cx="17" cy="58" rx="9.4" ry="21" fill={dark} transform="rotate(8 17 58)" />
            <CurlMarks cx={17} cy={58} rx={5} ry={15} stroke={shade(dark, -0.3)} n={8} r={2.4} seed={148} opacity={0.24} />
            <ellipse cx="14" cy="50" rx="2.6" ry="9" fill={shade(dark, 0.3)} opacity=".4" />
          </g>
          <g className="pa-ear pa-ear-r" style={{ transformOrigin: '76px 40px' }}>
            <Curls cx={83} cy={58} rx={5} ry={19} fill={dark} n={11} r={6} seed={149} />
            <ellipse cx="83" cy="58" rx="9.4" ry="21" fill={dark} transform="rotate(-8 83 58)" />
            <CurlMarks cx={83} cy={58} rx={5} ry={15} stroke={shade(dark, -0.3)} n={8} r={2.4} seed={150} opacity={0.24} />
            <ellipse cx="86" cy="50" rx="2.6" ry="9" fill={shade(dark, 0.3)} opacity=".4" />
          </g>
          <Curls cx={50} cy={48} rx={26} ry={26} fill={shade(body, -0.02)} n={20} r={7.4} seed={151} />
          <Curls cx={50} cy={24} rx={12} ry={3} fill={shade(body, 0.1)} n={5} r={6.4} seed={152} from={180} to={360} />
          <Grad id={`${u}h`} c={body} />
          <ellipse cx="50" cy="50" rx="30" ry="27" fill={`url(#${u}h)`} />
          <CurlMarks cx={50} cy={42} rx={24} ry={18} stroke={shade(body, -0.32)} n={22} r={3} seed={153} opacity={0.24} />
          <Shine cx={40} cy={32} rx={14} ry={7} op={0.3} />
          <ellipse cx="50" cy="64" rx="15" ry="11" fill={accent} />
          <Curls cx={50} cy={72} rx={9} ry={3} fill={accent} n={6} r={4.6} seed={154} from={0} to={180} />
          <CurlMarks cx={50} cy={66} rx={11} ry={7} stroke={shade(accent, -0.3)} n={8} r={2.2} seed={155} opacity={0.24} />
          <KEyes state={eyes} y={48} dx={15} rx={4.8} ry={5.9} iris={pal.iris} />
          <Blush dx={26} y={60} opacity={0.35} />
          <path d="M43.4 58 Q50 54 56.6 58 Q54.6 64.4 50 64.4 Q45.4 64.4 43.4 58z" fill={nose} />
          <ellipse cx="47.4" cy="57" rx="2" ry="1" fill="#fff" opacity=".6" />
          <path d="M50 64.4 v2.6 M50 67 q-4 3.6 -7.6 .4 M50 67 q4 3.6 7.6 .4" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 16, chin: 76, eyeY: 48, eyeDx: 15 }} />
        </Tilt>
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Labrador (glatt) – nach dem Foto des Schoko-Welpen ───────────────────────── */
export function Labrador({ eyes, pal, opt }: ArtProps) {
  const u = useUid('lb');
  const { body, belly, dark, accent } = pal;
  const nose = pal.nose ?? shade(body, -0.25);
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-fast" style={{ transformOrigin: '72px 94px' }}>
          <path d="M72 95 C88 92 94 82 90 72" stroke={shade(body, -0.06)} strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M72 95 C88 92 94 82 90 72" stroke={body} strokeWidth="8.6" fill="none" strokeLinecap="round" />
          <path d="M76 92 C88 89 91 81 89 75" stroke={shade(body, 0.3)} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".5" />
        </g>
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="26" ry="19.5" fill={`url(#${u}b)`} />
        <ellipse cx="50" cy="92" rx="13" ry="10" fill={belly} opacity=".85" />
        <Shine cx={40} cy={78} rx={14} ry={6} op={0.32} />
        <ellipse className="pa-foot pa-foot-l" cx="36" cy="104" rx="10.5" ry="5.8" fill={shade(body, 0.04)} />
        <ellipse className="pa-foot pa-foot-r" cx="64" cy="104" rx="10.5" ry="5.8" fill={shade(body, 0.04)} />
        <path d="M31 103v2.6M36 103v2.6M41 103v2.6M59 103v2.6M64 103v2.6M69 103v2.6" stroke={shade(body, -0.35)} strokeWidth="1" strokeLinecap="round" opacity=".55" />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.4} />
        {opt?.harness && <Harness y={84} />}
      </BodyG>
      <HeadG>
        <Tilt deg={opt?.tilt}>
          <g className="pa-ear pa-ear-l" style={{ transformOrigin: '26px 34px' }}>
            <path d="M28 30 Q8 30 12 52 Q16 66 26 62 Q34 50 34 36z" fill={dark} />
            <path d="M24 38 Q14 42 17 54" stroke={shade(dark, 0.22)} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
          </g>
          <g className="pa-ear pa-ear-r" style={{ transformOrigin: '74px 34px' }}>
            <path d="M72 30 Q92 30 88 52 Q84 66 74 62 Q66 50 66 36z" fill={dark} />
            <path d="M76 38 Q86 42 83 54" stroke={shade(dark, 0.22)} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
          </g>
          <Grad id={`${u}h`} c={body} />
          <ellipse cx="50" cy="50" rx="31" ry="28" fill={`url(#${u}h)`} />
          <Shine cx={40} cy={30} rx={15} ry={7} op={0.42} />
          <path d="M34 40 Q40 36 46 39 M54 39 Q60 36 66 40" stroke={shade(body, -0.4)} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".4" />
          <ellipse cx="50" cy="65" rx="17" ry="13" fill={accent} />
          <Shine cx={46} cy={58} rx={9} ry={4} op={0.22} />
          <KEyes state={eyes} y={49} dx={14.5} rx={5.2} ry={6.2} iris={pal.iris ?? '#b8a24a'} />
          <Blush dx={27} y={62} opacity={0.3} />
          <path d="M42.6 58.6 Q50 54 57.4 58.6 Q55 64.6 50 64.6 Q45 64.6 42.6 58.6z" fill={nose} />
          <ellipse cx="47" cy="57.4" rx="2.2" ry="1" fill="#fff" opacity=".55" />
          <path d="M50 64.6 v3 M50 67.6 q-5 4.4 -9.6 .4 M50 67.6 q5 4.4 9.6 .4" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {eyes === 'open' && (
            <g className="pa-tongue" style={{ transformOrigin: '50px 70px' }}>
              <path d="M45 70 q5 1.6 10 0 q.6 7 -5 7 q-5.6 0 -5 -7z" fill="#ff8aa0" />
              <path d="M50 70.8 v4" stroke="#e9627f" strokeWidth="1" strokeLinecap="round" />
            </g>
          )}
          <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 22, chin: 78, eyeY: 49, eyeDx: 14.5 }} />
        </Tilt>
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Collie (Border Collie) – nach den Fotos (rot-weiß / schwarz) ───────────────────────── */
export function Collie({ eyes, pal, opt }: ArtProps) {
  const u = useUid('co');
  const { body, belly, dark, accent } = pal;
  const nose = pal.nose ?? '#3b2a2a';
  const muzzle = pal.x1 ?? belly;
  const small = pal.x2 === 'small';
  const legC = pal.x3 ?? belly;
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '70px 96px' }}>
          <path d="M70 98 C92 98 98 76 90 62" stroke={shade(body, -0.08)} strokeWidth="16" fill="none" strokeLinecap="round" />
          <path d="M70 98 C92 98 98 76 90 62" stroke={body} strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M88 70 C91 66 90 63 89 60" stroke={belly} strokeWidth="13" fill="none" strokeLinecap="round" />
        </g>
        <Tufts cx={50} cy={88} rx={25} ry={19} fill={shade(body, -0.05)} n={26} len={4.6} seed={161} />
        <Grad id={`${u}b`} c={body} cx={40} cy={30} r={80} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={`url(#${u}b)`} />
        <path d={small ? 'M42 76 Q50 70 58 76 Q58 90 50 96 Q42 90 42 76z' : 'M34 76 Q50 68 66 76 Q64 100 50 102 Q36 100 34 76z'} fill={belly} />
        <Tufts cx={50} cy={86} rx={small ? 8 : 15} ry={small ? 11 : 14} fill={belly} n={12} len={4.2} seed={162} from={30} to={150} />
        <FurLines cx={50} cy={88} rx={small ? 6 : 12} ry={9} stroke={shade(belly, -0.18)} n={9} seed={163} opacity={0.24} />
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9.5" ry="5.5" fill={legC} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9.5" ry="5.5" fill={legC} />
        <Tufts cx={37} cy={104} rx={9} ry={4} fill={legC} n={8} len={2.6} seed={164} from={150} to={390} />
        <Tufts cx={63} cy={104} rx={9} ry={4} fill={legC} n={8} len={2.6} seed={165} from={150} to={390} />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.4} />
        {opt?.harness && <Harness y={84} />}
      </BodyG>
      <HeadG>
        <Tilt deg={opt?.tilt}>
          <g className="pa-ear pa-ear-l" style={{ transformOrigin: '30px 34px' }}>
            <path d="M20 46 C14 30 18 14 25 6 Q28 4 31 7 L45 24 C43 33 36 41 30 47z" fill={dark} />
            <path d="M25 38 C21 28 22 18 26 13 L36 25 C34 31 30 35 28 38z" fill={shade(dark, 0.22)} opacity=".6" />
          </g>
          <g className="pa-ear pa-ear-r" style={{ transformOrigin: '70px 34px' }}>
            <path d="M80 46 C86 40 94 34 96 26 Q92 20 85 21 C78 22 70 24 60 28 C60 38 70 44 76 47z" fill={dark} />
            <path d="M84 26 Q90 26 93 29" stroke={shade(dark, 0.25)} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".6" />
          </g>
          <ellipse cx="21" cy="66" rx="10" ry="12" fill={small ? shade(body, 0.06) : belly} />
          <ellipse cx="79" cy="66" rx="10" ry="12" fill={small ? shade(body, 0.06) : belly} />
          <Tufts cx={21} cy={66} rx={9} ry={11} fill={small ? shade(body, 0.06) : belly} n={10} len={3.2} seed={171} from={80} to={280} />
          <Tufts cx={79} cy={66} rx={9} ry={11} fill={small ? shade(body, 0.06) : belly} n={10} len={3.2} seed={172} from={-100} to={100} />
          <Tufts cx={50} cy={50} rx={32} ry={29} fill={shade(body, -0.05)} n={30} len={4} seed={166} />
          <Grad id={`${u}h`} c={body} />
          <ellipse cx="50" cy="50" rx="32" ry="29" fill={`url(#${u}h)`} />
          <Shine cx={40} cy={32} rx={14} ry={7} op={0.3} />
          <path d="M50 20 C56 28 56 40 53 56 L47 56 C44 40 44 28 50 20z" fill={accent} />
          <FurLines cx={50} cy={46} rx={26} ry={18} stroke={shade(body, -0.2)} n={12} seed={167} opacity={0.3} />
          <path d="M16 64 C22 80 36 86 50 86 C64 86 78 80 84 64 C74 64 66 56 50 56 C34 56 26 64 16 64z" fill={muzzle} />
          <FurLines cx={50} cy={74} rx={22} ry={8} stroke={shade(muzzle, -0.2)} n={9} seed={168} opacity={0.24} />
          <KEyes state={eyes} y={49} dx={14.5} rx={5.2} ry={6.4} iris={pal.iris ?? '#b2782a'} />
          <Blush dx={27} y={63} opacity={0.35} />
          <path d="M43.4 59 Q50 55 56.6 59 Q54.6 64.6 50 64.6 Q45.4 64.6 43.4 59z" fill={nose} />
          <ellipse cx="47.4" cy="57.8" rx="2" ry="1" fill="#fff" opacity=".55" />
          <path d="M50 64.6 v3 M50 67.6 q-4.4 4 -8.6 .4 M50 67.6 q4.4 4 8.6 .4" stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 20, chin: 82, eyeY: 49, eyeDx: 14.5 }} />
        </Tilt>
      </HeadG>
    </g>
  );
}

/* ───────────────────────── Glückskatze (Calico) – nach den Fotos des Kätzchens ───────────────────────── */
export function Glueckskatze({ eyes, pal, opt }: ArtProps) {
  const u = useUid('gk');
  const { body, belly, dark, accent } = pal;
  return (
    <g>
      <BodyG>
        <g className="pa-tail pa-tail-slow" style={{ transformOrigin: '68px 96px' }}>
          <path d="M68 96 C92 96 98 70 86 62" stroke={shade(body, -0.06)} strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M68 96 C92 96 98 70 86 62" stroke={body} strokeWidth="8.4" fill="none" strokeLinecap="round" />
          <path d="M80 86 q5 -1 8 2 M84 76 q4 -1 6 1" stroke={dark} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".7" />
        </g>
        <defs><clipPath id={`${u}cb`}><ellipse cx="50" cy="88" rx="25" ry="19" /></clipPath></defs>
        <Tufts cx={50} cy={88} rx={25} ry={19} fill={belly} n={22} len={3.6} seed={171} />
        <ellipse cx="50" cy="88" rx="25" ry="19" fill={belly} />
        <g clipPath={`url(#${u}cb)`}>
          <path d="M20 66 Q44 62 56 70 Q52 84 40 86 Q28 84 20 92z" fill={body} />
          <path d="M60 68 Q80 66 80 82 Q70 86 62 80z" fill={dark} opacity=".92" />
          <path d="M26 74 q6 -2 12 0 M24 80 q6 -2 14 0" stroke={shade(body, -0.22)} strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6" />
        </g>
        <FurLines cx={50} cy={92} rx={12} ry={9} stroke={shade(belly, -0.12)} n={9} seed={172} opacity={0.24} />
        <ellipse className="pa-foot pa-foot-l" cx="37" cy="104" rx="9" ry="5.5" fill={belly} />
        <ellipse className="pa-foot pa-foot-r" cx="63" cy="104" rx="9" ry="5.5" fill={belly} />
        <path d="M33 103v2.4M38 103v2.4M62 103v2.4M67 103v2.4" stroke="#f3a9b0" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
        <path d="M60 94 q4 -1 6 1 q-2 4 -6 4z" fill={body} opacity=".85" />
        <Shade cx={50} cy={74} rx={21} ry={8} op={0.36} />
      </BodyG>
      <HeadG>
        <Tilt deg={opt?.tilt}>
          <g className="pa-ear pa-ear-l" style={{ transformOrigin: '32px 30px' }}>
            <path d="M17 44 L19 12 Q20 8 24 10 L44 24 Z" fill={body} />
            <path d="M23 36 L24.5 18 L38 27 Z" fill={accent} />
            <path d="M24 31 l2 -8 M28 31 l1.5 -6 M31 33 l1.8 -5" stroke={belly} strokeWidth="1" strokeLinecap="round" opacity=".8" />
          </g>
          <g className="pa-ear pa-ear-r" style={{ transformOrigin: '68px 30px' }}>
            <path d="M83 44 L81 12 Q80 8 76 10 L56 24 Z" fill={dark} />
            <path d="M77 36 L75.5 18 L62 27 Z" fill={accent} />
            <path d="M76 31 l-2 -8 M72 31 l-1.5 -6 M69 33 l-1.8 -5" stroke={belly} strokeWidth="1" strokeLinecap="round" opacity=".7" />
          </g>
          <defs><clipPath id={`${u}ch`}><ellipse cx="50" cy="51" rx="33" ry="29" /></clipPath></defs>
          <Tufts cx={50} cy={51} rx={33} ry={29} fill={belly} n={30} len={4.2} seed={173} />
          <Tufts cx={50} cy={58} rx={34} ry={22} fill={belly} n={8} len={7} w={5} seed={174} from={150} to={210} />
          <Tufts cx={50} cy={58} rx={34} ry={22} fill={belly} n={8} len={7} w={5} seed={175} from={-30} to={30} />
          <Grad id={`${u}h`} c={belly} />
          <ellipse cx="50" cy="51" rx="33" ry="29" fill={`url(#${u}h)`} />
          <g clipPath={`url(#${u}ch)`}>
            <path d="M10 20 L62 20 Q58 38 46 44 Q40 50 34 44 Q22 40 10 46z" fill={body} />
            <path d="M52 20 L96 20 L96 56 Q84 52 76 60 Q66 52 60 40 Q56 30 52 20z" fill={dark} />
            <path d="M43 40 Q50 36 57 40 Q58 60 54 70 Q50 74 46 70 Q42 60 43 40z" fill={dark} />
            <path d="M34 22 Q40 18 46 22 Q44 30 38 30z" fill={dark} opacity=".9" />
            <path d="M20 26 l6 6 M26 22 l6 6" stroke={shade(body, -0.2)} strokeWidth="2" strokeLinecap="round" opacity=".5" />
          </g>
          <Shine cx={38} cy={32} rx={13} ry={7} op={0.3} />
          <ellipse cx="42" cy="66" rx="9" ry="6.5" fill={belly} />
          <ellipse cx="58" cy="66" rx="9" ry="6.5" fill={belly} />
          <KEyes state={eyes} y={52} dx={14} rx={5.8} ry={7} iris={pal.iris ?? '#a68a52'} />
          <Blush dx={26} y={62} />
          <path d="M47.2 62 h5.6 l-2.8 3.4 z" fill="#f3a9b0" />
          <path d="M50 65.4 v1.4 M50 66.8 q-2.6 2.8 -5.4 .4 M50 66.8 q2.6 2.8 5.4 .4" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <g className="pa-whiskers" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".9">
            <path d="M30 64 l-13 -2.5 M30 67 l-12 3" /><path d="M70 64 l13 -2.5 M70 67 l12 3" />
          </g>
          <Acc kind={opt?.acc} color={opt?.accColor} a={{ top: 22, chin: 76, eyeY: 52, eyeDx: 14 }} />
        </Tilt>
      </HeadG>
    </g>
  );
}
