import { createContext, useContext, useMemo, type CSSProperties, type ReactNode, type PointerEvent as RPE } from 'react';
import { approxTextWidth } from '../../components/canvas/svgText';
import { doodleOf } from './doodles';
import { AppCardBody, ProsConsBody, TableBody, TodoBody } from './MindmapBlocksView';
import { blobPath, bracketsPath, folderPath, isRoundShape, tornPath } from './mindmapShapes';
import { headShape, headsOf } from './mindmapRoutes';
import {
  bgColor,
  dashArray,
  edgeGeometry,
  edgeStroke,
  fontCss,
  groupCentres,
  imgBorder,
  imgRatio,
  isBlock,
  layoutNode,
  luminance,
  mapBounds,
  mindmapRepo,
  nodeStyle,
  penWidth,
  readableOn,
  shapePath,
  strokePath,
  zOf,
  type Bounds,
  type EdgeGeometry,
  type MMAnim,
  type MMEdge,
  type MMNode,
  type MindMap,
} from './mindmapModel';
import './mindmap.css';

/* --------------------------------------------------------------- context */

interface SceneCtx {
  /** unique id prefix for filters of this <svg> (several maps can be on one page) */
  uid: string;
  resolveMap?: (id: string) => MindMap | undefined;
  depth: number;
}
const Ctx = createContext<SceneCtx>({ uid: 'mm', depth: 0 });

let uidCounter = 0;
export function useSceneUid(): string {
  return useMemo(() => `mm${++uidCounter}`, []);
}

/** a lookup for linked maps, read once when a scene mounts */
export function useMapLookup(): (id: string) => MindMap | undefined {
  return useMemo(() => {
    // read lazily: most maps contain no links, and thumbnails should stay cheap
    let all: Map<string, MindMap> | undefined;
    return (id: string) => {
      all ??= new Map(mindmapRepo.getAll().map((m) => [m.id, m]));
      let m = all.get(id);
      if (!m) {
        // a map created a moment ago (sub map) is not in the first read yet
        all = new Map(mindmapRepo.getAll().map((x) => [x.id, x]));
        m = all.get(id);
      }
      return m;
    };
  }, []);
}

export function SceneProvider({ uid, resolveMap, depth = 0, children }: { uid: string; resolveMap?: (id: string) => MindMap | undefined; depth?: number; children: ReactNode }) {
  const value = useMemo(() => ({ uid, resolveMap, depth }), [uid, resolveMap, depth]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** filters for hand drawn borders and pencil strokes – one set per <svg> */
export function SceneDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <filter id={`${uid}-sketch`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
      </filter>
      <filter id={`${uid}-pencil`} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="g" />
        <feDisplacementMap in="SourceGraphic" in2="g" scale="1.6" result="d" />
        <feComponentTransfer in="d">
          <feFuncA type="linear" slope="0.92" />
        </feComponentTransfer>
      </filter>
      {(
        [
          ['s', 5, 0.5, 1.5, 0.05],
          ['m', 14, 0.9, 3.5, 0.02],
          ['l', 34, 2, 9, 0.011],
        ] as const
      ).map(([k, disp, blur, edge, freq]) => (
        <filter key={k} id={`${uid}-water-${k}`} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="3" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={disp} result="d" />
          <feGaussianBlur in="d" stdDeviation={blur} result="b" />
          <feMorphology in="b" operator="erode" radius={edge} result="er" />
          <feGaussianBlur in="er" stdDeviation={edge * 1.2} result="erb" />
          <feComposite in="b" in2="erb" operator="arithmetic" k1="0" k2="1" k3="-0.55" k4="0" result="pool" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0.72" result="ga" />
          <feComposite in="pool" in2="ga" operator="in" />
        </filter>
      ))}
    </defs>
  );
}

/* ------------------------------------------------------------ animations */

const ANIM_BASE: Record<MMAnim, number> = { none: 0, spin: 7, spinback: 7, swing: 2.6, pulse: 1.8, bounce: 1.1, wiggle: 0.55, float: 3.6, blink: 1.5, orbit: 5, jelly: 1.3, shake: 0.28 };
const SPEED_F = { 1: 0.5, 2: 1, 3: 2 } as const;
export const animDuration = (a: MMAnim, speed: 1 | 2 | 3 | undefined) => ANIM_BASE[a] / SPEED_F[speed ?? 2];

/** a looping animation that starts in step with all others (so grouped pieces turn together) */
function animStyle(a: MMAnim, speed: 1 | 2 | 3 | undefined): CSSProperties {
  const dur = animDuration(a, speed);
  const phase = typeof performance !== 'undefined' ? -((performance.now() / 1000) % dur) : 0;
  return { animationDuration: `${dur}s`, animationDelay: `${phase}s` };
}

function Animated({ anim, speed, enabled, children }: { anim: MMAnim | undefined; speed: 1 | 2 | 3 | undefined; enabled: boolean; children: ReactNode }) {
  const active = enabled && anim && anim !== 'none';
  const style = useMemo(() => (active ? animStyle(anim as MMAnim, speed) : undefined), [active, anim, speed]);
  if (!active) return <>{children}</>;
  return (
    <g className={`mm-a mm-a-${anim}`} style={style}>
      {children}
    </g>
  );
}

/* ------------------------------------------------------------------ nodes */

interface BorderLook {
  width: number;
  dash?: string;
  cap?: 'round' | 'butt';
  double: boolean;
  sketch: boolean;
  none: boolean;
}
function borderLook(node: MMNode, base: number): BorderLook {
  const kind = node.border ?? (node.shape === 'frame' && (!node.variant || node.variant === 'classic') ? 'dashed' : 'solid');
  const w = node.sw ?? base;
  if (kind === 'none') return { width: 0, double: false, sketch: false, none: true };
  if (kind === 'thick') return { width: Math.max(w * 2.2, 5), double: false, sketch: false, none: false };
  if (kind === 'dashed') return { width: w, dash: node.shape === 'frame' && node.sw === undefined && (!node.variant || node.variant === 'classic') ? '12 8' : `${Math.max(w, 2) * 3.4} ${Math.max(w, 2) * 2.4}`, double: false, sketch: false, none: false };
  if (kind === 'dotted') return { width: Math.max(w, 2.4), dash: `0.1 ${Math.max(w, 2.4) * 2.3}`, cap: 'round', double: false, sketch: false, none: false };
  if (kind === 'double') return { width: Math.max(w, 2) * 3, double: true, sketch: false, none: false };
  if (kind === 'sketch') return { width: w, double: false, sketch: true, none: false };
  return { width: w, double: false, sketch: false, none: false };
}

const rectD = (w: number, h: number, r = 10) => {
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  return `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
};

/** a single letter, digit or sign shown big and bold as a symbol */
export const isGlyph = (s?: string) => !!s && /^[A-Za-zÄÖÜäöüß0-9&?!+#%@€$*=]$/.test(s);

/** One node as SVG, centred on its position. Used by the editor, the thumbnails and the printout alike. */
export function NodeView({
  node,
  bg,
  selected = false,
  lifted = false,
  pop = false,
  float = false,
  placeholder = '',
  dragOffset,
  animate = false,
  groupCentre,
  memoDot = false,
}: {
  node: MMNode;
  bg: string;
  selected?: boolean;
  lifted?: boolean;
  pop?: boolean;
  float?: boolean;
  placeholder?: string;
  dragOffset?: { x: number; y: number };
  /** play the node's own animation */
  animate?: boolean;
  /** centre of the group this node turns with (when the group moves as one piece) */
  groupCentre?: { x: number; y: number; anim: MMAnim };
  /** show a small dot when the element has a side note (editor only) */
  memoDot?: boolean;
}) {
  const ctx = useContext(Ctx);
  const L = layoutNode(node);
  const st = nodeStyle(node, bg);
  const x = dragOffset?.x ?? node.x;
  const y = dragOffset?.y ?? node.y;
  const isFrame = node.shape === 'frame';
  const isNote = node.shape === 'note';
  const isDraw = node.shape === 'draw';
  const isDoodle = node.shape === 'doodle';
  const isMap = node.shape === 'maplink';
  const block = isBlock(node);
  const dark = luminance(bg) < 0.25;
  const fv = isFrame ? node.variant ?? 'classic' : 'classic';
  const nv = isNote ? node.variant ?? 'sticky' : 'sticky';
  const bl = borderLook(node, st.strokeWidth);
  const framed = node.shape === 'plain' && node.border && node.border !== 'none';
  const roundOn = isRoundShape(node.shape, node.round);
  let d = shapePath(node.shape, L.w, L.h, node.round) || (framed ? rectD(L.w, L.h, 10) : '');
  if (isFrame) {
    if (fv === 'tab') d = folderPath(L.w, L.h, Math.min(L.w * 0.6, Math.max(L.fs * 9, approxTextWidth(node.text, L.fs) + L.fs * 3)), L.fs * 2.5, roundOn);
    else if (fv === 'ellipse') d = shapePath('oval', L.w, L.h);
    else if (fv === 'blob') d = blobPath(L.w, L.h);
  }
  if (isNote && nv === 'torn') d = tornPath(L.w, L.h);
  const empty = !node.text.trim() && !node.symbol && node.shape !== 'image' && !isDraw && !isDoodle && !isMap && !block;
  const fop = node.fop ?? 1;
  const fold = isNote && (nv === 'sticky' || nv === 'curl') ? Math.min(nv === 'curl' ? 34 : 22, L.h * (nv === 'curl' ? 0.3 : 0.22)) : 0;
  const phase = (node.id.charCodeAt(node.id.length - 1) % 9) * -0.8;
  const cleanId = node.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `${ctx.uid}-${cleanId}`;
  const tilt = node.shape === 'sticker' ? ((node.id.charCodeAt(node.id.length - 1) % 7) - 3) * 2 : 0;
  const ff = fontCss(node.font);
  const textProps = {
    fontFamily: ff,
    fontStyle: node.italic ? ('italic' as const) : undefined,
  };
  const weight = node.bold ? 800 : node.size >= 3 || node.shape === 'plain' ? 600 : 500;
  const asGroup = !!groupCentre;
  const ringD = d || rectD(L.w, L.h, isDoodle || isDraw ? 8 : 4);
  const ring = selected ? (
    <path d={ringD} fill="none" stroke="#3e7c63" strokeWidth={3} opacity={0.55} className="mm-ring" strokeDasharray={isDoodle || isDraw ? '6 5' : undefined} transform={isDoodle || isDraw ? 'scale(1.04)' : 'scale(1.07)'} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
  ) : null;
  const penFilter = node.pen === 'pencil' ? `url(#${ctx.uid}-pencil)` : undefined;
  const hasFill = st.fill !== 'none';
  const shadowOk = hasFill && fop > 0.55 && !(isNote && nv === 'plain');
  const frameTitleOnBand = isFrame && fv === 'header';
  const frameRoundTitle = isFrame && (fv === 'ellipse' || fv === 'blob');
  const bandH = L.fs * 2.5;
  const glyph = isGlyph(node.symbol);
  const glyphFill = node.tc ?? (node.shape === 'sticker' || node.nofill || (!node.fc && node.look !== 'solid') ? node.color : st.text);
  const frameLineColor = node.bc ?? node.color;
  const frameBodyOnly = isFrame && (fv === 'brackets' || fv === 'underline');

  const main = isDraw ? (
    <g transform={L.k !== 1 ? `scale(${L.k})` : undefined}>
      <path d={strokePath(node.pts)} fill="none" stroke="transparent" strokeWidth={Math.max(penWidth(node), 18 / L.k)} strokeLinecap="round" strokeLinejoin="round" />
      {node.pen === 'water' ? (
        <WaterStroke node={node} L={L} uid={ctx.uid} />
      ) : (
        <path
          d={strokePath(node.pts)}
          fill="none"
          stroke={node.color}
          strokeWidth={node.pen === 'pencil' ? penWidth(node) * 0.8 : penWidth(node)}
          strokeLinecap={node.pen === 'marker' ? 'square' : 'round'}
          strokeLinejoin="round"
          opacity={node.pen === 'marker' ? 0.42 : node.pen === 'pencil' ? 0.85 : 1}
          filter={penFilter}
          style={{ pointerEvents: 'none', mixBlendMode: node.pen === 'marker' && !dark ? 'multiply' : undefined }}
        />
      )}
    </g>
  ) : isDoodle ? (
    <DoodleBody node={node} L={L} st={st} uid={ctx.uid} />
  ) : isMap ? (
    <MapLinkBody node={node} L={L} st={st} bg={bg} lifted={lifted} />
  ) : block ? (
    node.shape === 'todo' ? <TodoBody node={node} L={L} st={st} dark={dark} lifted={lifted} fop={fop} placeholder={placeholder} /> :
    node.shape === 'table' ? <TableBody node={node} L={L} st={st} dark={dark} lifted={lifted} fop={fop} /> :
    node.shape === 'proscons' ? <ProsConsBody node={node} L={L} st={st} dark={dark} lifted={lifted} fop={fop} /> :
    <AppCardBody node={node} L={L} st={st} dark={dark} lifted={lifted} fop={fop} />
  ) : node.shape === 'plain' || node.shape === 'sticker' ? (
    <>
      <rect x={-L.w / 2} y={-L.h / 2} width={L.w} height={L.h} fill="transparent" />
      {framed && !bl.none && <path d={d} fill="none" stroke={node.bc ?? node.color} strokeWidth={bl.width} strokeDasharray={bl.dash} strokeLinecap={bl.cap} filter={bl.sketch ? `url(#${ctx.uid}-sketch)` : undefined} />}
    </>
  ) : (
    <>
      {!hasFill && !isFrame && <path d={d} fill="transparent" />}
      {isNote && (nv === 'index' || nv === 'graph') && (
        <clipPath id={`${clipId}-nc`}>
          <path d={d} />
        </clipPath>
      )}
      <path
        d={d}
        fill={frameBodyOnly && fv === 'underline' ? 'none' : st.fill}
        stroke={bl.none || bl.double || frameBodyOnly ? 'none' : st.stroke}
        strokeWidth={bl.none ? 0 : bl.width}
        strokeDasharray={bl.dash}
        strokeLinecap={bl.cap}
        className={lifted ? 'mm-shadow-lg' : isFrame && fv !== 'card' ? undefined : shadowOk ? 'mm-shadow' : undefined}
        fillOpacity={(isFrame ? 0.55 : 1) * fop}
        filter={bl.sketch ? `url(#${ctx.uid}-sketch)` : undefined}
        style={isFrame ? { pointerEvents: 'none' } : undefined}
      />
      {bl.double && !bl.none && (
        <>
          <path d={d} fill="none" stroke={st.stroke} strokeWidth={bl.width} style={{ pointerEvents: 'none' }} />
          <path d={d} fill="none" stroke={st.fill === 'none' ? bg : st.fill} strokeWidth={bl.width / 3} style={{ pointerEvents: 'none' }} />
        </>
      )}
      {isFrame && fv === 'header' && (
        <path d={`M ${-L.w / 2} ${-L.h / 2 + bandH} V ${-L.h / 2 + (roundOn ? 22 : 0)} ${roundOn ? `A 22 22 0 0 1 ${-L.w / 2 + 22} ${-L.h / 2}` : `V ${-L.h / 2}`} H ${L.w / 2 - (roundOn ? 22 : 0)} ${roundOn ? `A 22 22 0 0 1 ${L.w / 2} ${-L.h / 2 + 22}` : ''} V ${-L.h / 2 + bandH} Z`} fill={frameLineColor} fillOpacity={0.9 * fop} style={{ pointerEvents: 'none' }} />
      )}
      {isFrame && fv === 'card' && <rect x={-L.w / 2} y={-L.h / 2} width={L.w} height={7} rx={roundOn ? 3 : 0} fill={frameLineColor} style={{ pointerEvents: 'none' }} />}
      {isFrame && fv === 'brackets' && <path d={bracketsPath(L.w, L.h, Math.min(46, L.w / 3))} fill="none" stroke={frameLineColor} strokeWidth={bl.none ? 0 : Math.max(3, bl.width * 1.6)} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />}
      {isFrame && fv === 'underline' && <path d={`M ${-L.w / 2} ${-L.h / 2 + bandH} H ${L.w / 2}`} stroke={frameLineColor} strokeWidth={Math.max(2, bl.width)} strokeLinecap="round" style={{ pointerEvents: 'none' }} />}
      {isNote && nv === 'index' && (
        <g clipPath={`url(#${clipId}-nc)`} style={{ pointerEvents: 'none' }}>
          <line x1={-L.w / 2} x2={L.w / 2} y1={-L.h / 2 + L.fs * 2.1} y2={-L.h / 2 + L.fs * 2.1} stroke="#d9778a" strokeOpacity={0.8} strokeWidth={1.6} />
          {Array.from({ length: Math.max(0, Math.floor((L.h - L.fs * 3) / (L.fs * 1.5))) }, (_, i) => (
            <line key={i} x1={-L.w / 2} x2={L.w / 2} y1={-L.h / 2 + L.fs * 3.6 + i * L.fs * 1.5} y2={-L.h / 2 + L.fs * 3.6 + i * L.fs * 1.5} stroke="#4a8f9e" strokeOpacity={0.35} strokeWidth={1.1} />
          ))}
        </g>
      )}
      {isNote && nv === 'graph' && (
        <g clipPath={`url(#${clipId}-nc)`} style={{ pointerEvents: 'none' }} stroke="#4a8f9e" strokeOpacity={0.28} strokeWidth={1}>
          {Array.from({ length: Math.floor(L.w / 16) + 1 }, (_, i) => <line key={`v${i}`} x1={-L.w / 2 + i * 16} x2={-L.w / 2 + i * 16} y1={-L.h / 2} y2={L.h / 2} />)}
          {Array.from({ length: Math.floor(L.h / 16) + 1 }, (_, i) => <line key={`h${i}`} x1={-L.w / 2} x2={L.w / 2} y1={-L.h / 2 + i * 16} y2={-L.h / 2 + i * 16} />)}
        </g>
      )}
      {isNote && nv === 'tape' && (
        <g transform={`translate(0,${-L.h / 2}) rotate(-3)`} style={{ pointerEvents: 'none' }}>
          <rect x={-Math.min(40, L.w * 0.22)} y={-L.fs * 0.7} width={Math.min(80, L.w * 0.44)} height={L.fs * 1.4} fill="#fff7d6" fillOpacity={0.75} stroke="#00000022" />
        </g>
      )}
      {isNote && nv === 'pin' && (
        <g transform={`translate(0,${-L.h / 2 + 4})`} style={{ pointerEvents: 'none' }}>
          <circle r={9} fill="#d9534f" stroke="#a23a37" strokeWidth={1.2} />
          <circle cx={-2.5} cy={-2.5} r={3} fill="#ffffff" fillOpacity={0.6} />
        </g>
      )}
    </>
  );

  const body = (
    <g transform={`translate(${x},${y})`} data-node-id={node.id} data-testid={`mm-node-${node.id}`} style={{ cursor: 'pointer' }}>
      <Animated anim={node.anim} speed={node.animSpeed} enabled={animate && !asGroup && !lifted}>
        <g transform={node.rot ? `rotate(${node.rot})` : undefined}>
          <g className={`${pop ? 'mm-pop' : ''} ${lifted ? 'mm-lift' : ''}`}>
            <g className={float ? 'mm-float' : ''} style={float ? ({ animationDelay: `${phase}s` } as CSSProperties) : undefined}>
              {ring}
              <g opacity={node.op}>
                {main}
                {node.shape === 'image' && node.img && <ImageBody node={node} L={L} clipId={clipId} />}
                {fold > 0 && <path d={`M ${L.w / 2 - fold} ${L.h / 2} L ${L.w / 2} ${L.h / 2 - fold} L ${L.w / 2 - fold} ${L.h / 2 - fold} Z`} fill="#000" opacity={nv === 'curl' ? 0.2 : 0.13} />}
                {node.symbol && !block && (
                  <text
                    x={L.textDx ?? 0}
                    y={L.symbolY + L.symbolSize * (glyph ? 0.36 : 0.34)}
                    fontSize={glyph ? L.symbolSize * 0.95 : L.symbolSize}
                    textAnchor="middle"
                    fontWeight={glyph ? 800 : undefined}
                    fontFamily={glyph ? fontCss(node.font ?? 'display') : undefined}
                    fill={glyph ? glyphFill : undefined}
                    transform={tilt ? `rotate(${tilt} 0 ${L.symbolY})` : undefined}
                    className={node.shape === 'sticker' ? 'mm-sticker-glyph' : undefined}
                    style={{ userSelect: 'none' }}
                  >
                    {node.symbol}
                  </text>
                )}
                {!block && (isFrame || isMap
                  ? L.lines.map((line, i) => (
                      <text key={i} x={frameRoundTitle ? 0 : -L.w / 2 + L.fs * 1.1} y={L.textTop + i * L.lh + (frameRoundTitle ? L.fs * 1.5 : 0)} textAnchor={frameRoundTitle ? 'middle' : undefined} fontSize={L.fs} fill={frameTitleOnBand ? node.tc ?? readableOn(frameLineColor) : node.tc ?? st.text} fontWeight={node.bold ? 800 : 600} {...textProps} style={{ userSelect: 'none' }}>
                        {line}
                      </text>
                    ))
                  : L.lines.map((line, i) => (
                      <text key={i} x={L.textDx ?? 0} y={L.textTop + i * L.lh} fontSize={L.fs} fill={st.text} textAnchor="middle" fontWeight={weight} {...textProps} style={{ userSelect: 'none' }}>
                        {line}
                      </text>
                    )))}
                {empty && placeholder && !isFrame && (
                  <text x={L.textDx ?? 0} y={L.fs * 0.35} fontSize={L.fs} fill={st.text} opacity={0.45} textAnchor="middle" {...textProps} style={{ userSelect: 'none' }}>
                    {placeholder}
                  </text>
                )}
                {isFrame && empty && placeholder && (
                  <text x={-L.w / 2 + L.fs * 1.1} y={L.textTop} fontSize={L.fs} fill={st.text} opacity={0.45} style={{ userSelect: 'none' }}>
                    {placeholder}
                  </text>
                )}
              </g>
              {memoDot && node.memo && <circle cx={L.w / 2 - 2} cy={-L.h / 2 + 2} r={7} fill="#e8a83d" stroke="#ffffff" strokeWidth={2} pointerEvents="none" data-testid="mm-memo-dot" />}
            </g>
          </g>
        </g>
      </Animated>
    </g>
  );

  if (!asGroup || !animate || lifted) return body;
  // the whole group turns (or pulses …) around its common centre
  return (
    <g transform={`translate(${groupCentre.x},${groupCentre.y})`}>
      <Animated anim={groupCentre.anim} speed={node.animSpeed} enabled>
        <g transform={`translate(${-groupCentre.x},${-groupCentre.y})`}>{body}</g>
      </Animated>
    </g>
  );
}

/** watercolour: soft, layered paint with a darker edge – for small marks and for big washes */
function WaterStroke({ node, L, uid }: { node: MMNode; L: ReturnType<typeof layoutNode>; uid: string }) {
  const pw = penWidth(node);
  const d = strokePath(node.pts);
  const size = pw < 16 ? 's' : pw < 60 ? 'm' : 'l';
  const pad = pw * 0.9 + 12;
  return (
    <g filter={`url(#${uid}-water-${size})`} style={{ pointerEvents: 'none' }}>
      <rect x={-L.w / L.k / 2 - pad} y={-L.h / L.k / 2 - pad} width={L.w / L.k + pad * 2} height={L.h / L.k + pad * 2} fill="none" />
      <path d={d} fill="none" stroke={node.color} strokeWidth={pw} strokeLinecap="round" strokeLinejoin="round" opacity={0.42} />
      <path d={d} fill="none" stroke={node.color} strokeWidth={pw * 0.72} strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
      <path d={d} fill="none" stroke={node.color} strokeWidth={pw * 0.42} strokeLinecap="round" strokeLinejoin="round" opacity={0.24} />
    </g>
  );
}

function ImageBody({ node, L, clipId }: { node: MMNode; L: ReturnType<typeof layoutNode>; clipId: string }) {
  const bd = imgBorder(node) * L.k;
  const w = L.w - bd * 2;
  const h = w / imgRatio(node);
  const x = -L.w / 2 + bd;
  const y = -L.h / 2 + bd;
  const r = node.imgStyle === 'round' ? w / 2 : node.imgStyle === 'rounded' ? Math.min(w, h) * 0.12 : 2;
  return (
    <>
      <clipPath id={`mmclip-${clipId}`}>
        <rect x={x} y={y} width={w} height={h} rx={r} />
      </clipPath>
      <image href={node.img} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#mmclip-${clipId})`} style={{ pointerEvents: 'none' }} />
      <rect x={-L.w / 2} y={-L.h / 2} width={L.w} height={L.h} fill="transparent" />
    </>
  );
}

function DoodleBody({ node, L, st, uid }: { node: MMNode; L: ReturnType<typeof layoutNode>; st: ReturnType<typeof nodeStyle>; uid: string }) {
  const dd = doodleOf(node.doodle);
  const sx = L.w / dd.w;
  const sy = L.h / dd.h;
  const avg = (sx + sy) / 2;
  const kind = node.border ?? dd.dash ?? 'solid';
  const sw = (node.sw ?? 3) * (kind === 'thick' ? 2.2 : 1);
  const dash = kind === 'dashed' ? `${Math.max(sw, 2) * 3.2} ${Math.max(sw, 2) * 2.4}` : kind === 'dotted' ? `0.1 ${Math.max(sw, 2.4) * 2.3}` : undefined;
  const round = kind === 'dotted';
  const fillable = (dd.fill || !!dd.fillD) && node.look !== 'outline';
  const sketch = kind === 'sketch';
  const fop = node.fop ?? 1;
  return (
    <g transform={`scale(${sx},${sy})`}>
      <path d={dd.d} fill={dd.fill || dd.fillD || dd.group === 'shapes' || dd.group === 'nature' ? 'transparent' : 'none'} stroke="transparent" strokeWidth={Math.max(sw, 18) / avg} strokeLinecap="round" strokeLinejoin="round" />
      {dd.fillD && <path d={dd.fillD} fill={fillable ? st.fill : 'none'} fillOpacity={fop} stroke="none" style={{ pointerEvents: 'none' }} />}
      <path
        d={dd.d}
        fill={fillable && !dd.fillD ? st.fill : 'none'}
        fillOpacity={fop}
        fillRule="evenodd"
        stroke={kind === 'none' ? 'none' : st.stroke}
        strokeWidth={sw / avg}
        strokeDasharray={dash ? dash.split(' ').map((v) => Number(v) / avg).join(' ') : undefined}
        strokeLinecap={round ? 'round' : 'round'}
        strokeLinejoin="round"
        filter={sketch ? `url(#${uid}-sketch)` : undefined}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  );
}

function MapLinkBody({ node, L, st, bg, lifted }: { node: MMNode; L: ReturnType<typeof layoutNode>; st: ReturnType<typeof nodeStyle>; bg: string; lifted: boolean }) {
  const ctx = useContext(Ctx);
  const target = node.mapId ? ctx.resolveMap?.(node.mapId) : undefined;
  const titleH = L.lines.length ? L.lines.length * L.lh + 10 : 30;
  const x = -L.w / 2 + 8;
  const y = -L.h / 2 + titleH;
  const w = L.w - 16;
  const h = L.h - titleH - 8;
  const d = shapePath('maplink', L.w, L.h);
  const bl = borderLook(node, st.strokeWidth);
  return (
    <>
      <path d={d} fill={st.fill} stroke={bl.none ? 'none' : st.stroke} strokeWidth={bl.width} strokeDasharray={bl.dash} strokeLinecap={bl.cap} className={lifted ? 'mm-shadow-lg' : 'mm-shadow'} />
      <text x={L.w / 2 - 14} y={-L.h / 2 + L.fs * 1.5} fontSize={L.fs * 1.1} textAnchor="end" style={{ userSelect: 'none' }}>
        ↗
      </text>
      {target && ctx.depth < 2 && target.nodes.length > 0 ? (
        <MiniMap map={target} x={x} y={y} w={w} h={h} depth={ctx.depth + 1} />
      ) : (
        <g opacity={0.55}>
          <rect x={x} y={y} width={w} height={h} rx={10} fill={luminance(bg) < 0.25 ? '#1f242a' : '#f4f0e6'} />
          <text x={0} y={y + h / 2 + L.fs * 0.35} fontSize={L.fs} textAnchor="middle" fill={st.text} style={{ userSelect: 'none' }}>
            {target ? (target.nodes.length ? '…' : '∅') : '?'}
          </text>
        </g>
      )}
    </>
  );
}

/** a small, still picture of another map inside a link card */
function MiniMap({ map, x, y, w, h, depth }: { map: MindMap; x: number; y: number; w: number; h: number; depth: number }) {
  const ctx = useContext(Ctx);
  const b = useMemo(() => mapBounds(map), [map]);
  const pad = 24;
  const bw = b.maxX - b.minX + pad * 2;
  const bh = b.maxY - b.minY + pad * 2;
  const bgc = bgColor(map.bg.tone);
  const value = useMemo(() => ({ ...ctx, depth }), [ctx, depth]);
  return (
    <Ctx.Provider value={value}>
      <svg x={x} y={y} width={w} height={h} viewBox={`${b.minX - pad} ${b.minY - pad} ${bw} ${bh}`} preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none', overflow: 'hidden' }}>
        <rect x={b.minX - pad} y={b.minY - pad} width={bw} height={bh} fill={bgc} />
        <MapItems map={map} bg={bgc} />
      </svg>
    </Ctx.Provider>
  );
}

export function EdgeLabel({ text, x, y, color, bg, size = 14 }: { text: string; x: number; y: number; color: string; bg: string; size?: number }) {
  const w = approxTextWidth(text, size) + size * 1.5;
  const dark = luminance(bg) < 0.25;
  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.9} rx={size} fill={dark ? '#2f353c' : '#ffffff'} stroke={color} strokeWidth={2} />
      <text x={0} y={size * 0.35} fontSize={size} textAnchor="middle" fill={dark ? '#f1ede4' : '#26231f'} style={{ userSelect: 'none' }}>
        {text}
      </text>
    </g>
  );
}

function HeadMark({ head, p, angle, size, color, w, bg }: { head: ReturnType<typeof headsOf>['h1']; p: { x: number; y: number }; angle: number; size: number; color: string; w: number; bg: string }) {
  const hs = headShape(head, size);
  if (!hs) return null;
  const deg = (angle * 180) / Math.PI;
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${deg})`} data-head={head}>
      <path
        d={hs.d}
        fill={hs.kind === 'solid' ? color : hs.kind === 'hollow' ? bg : 'none'}
        stroke={color}
        strokeWidth={hs.kind === 'solid' ? 1 : Math.max(2, w * 0.8)}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}

export function EdgeView({ edge, geom, selected = false, onPointerDown, flowEnabled = true, bg = '#ffffff' }: { edge: MMEdge; geom: EdgeGeometry; selected?: boolean; onPointerDown?: (e: RPE<SVGElement>) => void; flowEnabled?: boolean; bg?: string }) {
  const w = edgeStroke(edge);
  const dash = dashArray(edge.dash, w);
  const head = (9 + w * 2.6) * (edge.hs ?? 1);
  const { h0, h1 } = headsOf(edge);
  return (
    <g data-edge-id={edge.id} data-testid={`mm-edge-${edge.id}`} opacity={edge.op}>
      {selected && <path d={geom.path} stroke="#3e7c63" strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.22} />}
      <path
        d={geom.path}
        stroke={edge.color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dash}
        fill="none"
        className={edge.flow && flowEnabled && edge.dash !== 'solid' ? 'mm-flow' : edge.flow && flowEnabled ? 'mm-flow-solid' : undefined}
        style={edge.flow && flowEnabled ? ({ '--mm-dash': edge.dash === 'dotted' ? w * 2.3 : w * 5.6 } as CSSProperties) : undefined}
      />
      <HeadMark head={h1} p={geom.p1} angle={geom.a1} size={head} color={edge.color} w={w} bg={bg} />
      <HeadMark head={h0} p={geom.p0} angle={geom.a0} size={head} color={edge.color} w={w} bg={bg} />
      {onPointerDown && <path d={geom.path} stroke="transparent" strokeWidth={Math.max(22, w + 14)} fill="none" strokeLinecap="round" strokeLinejoin="round" onPointerDown={onPointerDown} style={{ cursor: 'pointer' }} />}
    </g>
  );
}

/* --------------------------------------------------------- drawing order */

export type DrawItem = { kind: 'node'; node: MMNode; z: number } | { kind: 'edge'; edge: MMEdge; z: number };

/** nodes and lines in one list, back to front (a line sits just behind the one of its ends that is further in front) */
export function orderedItems(map: Pick<MindMap, 'nodes' | 'edges'>): DrawItem[] {
  const zs = new Map(map.nodes.map((n, i) => [n.id, zOf(n, i)]));
  const items: DrawItem[] = map.nodes.map((n) => ({ kind: 'node', node: n, z: zs.get(n.id) ?? 0 }));
  for (const e of map.edges) {
    const a = zs.get(e.from);
    const b = zs.get(e.to);
    if (a === undefined || b === undefined) continue;
    // lines never hide behind a frame that only holds their ends
    items.push({ kind: 'edge', edge: e, z: Math.max(a, b) - 0.5 });
  }
  return items.map((it, i) => ({ it, i })).sort((p, q) => p.it.z - q.it.z || p.i - q.i).map((p) => p.it);
}

/** nodes, lines and line labels of a map as plain SVG (no interaction) */
export function MapItems({ map, bg, animate = false }: { map: Pick<MindMap, 'nodes' | 'edges'>; bg: string; animate?: boolean }) {
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const centres = animate ? groupCentres(map.nodes) : undefined;
  return (
    <>
      {orderedItems(map).map((it) => {
        if (it.kind === 'node') return <NodeView key={it.node.id} node={it.node} bg={bg} animate={animate} groupCentre={centres?.get(it.node.id)} />;
        const a = byId.get(it.edge.from);
        const c = byId.get(it.edge.to);
        if (!a || !c) return null;
        return <EdgeView key={it.edge.id} edge={it.edge} geom={edgeGeometry(it.edge, a, c, layoutNode(a), layoutNode(c))} flowEnabled={false} bg={bg} />;
      })}
      {map.edges.map((e) => {
        if (!e.label) return null;
        const a = byId.get(e.from);
        const c = byId.get(e.to);
        if (!a || !c) return null;
        const g = edgeGeometry(e, a, c, layoutNode(a), layoutNode(c));
        return <EdgeLabel key={`l-${e.id}`} text={e.label} x={g.mid.x} y={g.mid.y} color={e.color} bg={bg} />;
      })}
    </>
  );
}

/** the page pattern behind a map (dots, grid, waves …) as an SVG fragment in world coordinates */
export function BackgroundPattern({ kind, dark, uid }: { kind: MindMap['bg']['kind']; dark: boolean; uid: string }) {
  const ink = dark ? 'rgba(255,255,255,0.16)' : 'rgba(60,50,30,0.16)';
  const faint = dark ? 'rgba(255,255,255,0.08)' : 'rgba(60,50,30,0.08)';
  const id = `${uid}-bgp`;
  let pattern: ReactNode = null;
  switch (kind) {
    case 'dots':
      pattern = (
        <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill={ink} />
        </pattern>
      );
      break;
    case 'dotsL':
      pattern = (
        <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="3" fill={ink} />
        </pattern>
      );
      break;
    case 'grid':
      pattern = (
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 H 0 V 40" fill="none" stroke={ink} strokeWidth="1" />
        </pattern>
      );
      break;
    case 'graph':
      pattern = (
        <pattern id={id} width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 10 0 V 100 M 20 0 V 100 M 30 0 V 100 M 40 0 V 100 M 50 0 V 100 M 60 0 V 100 M 70 0 V 100 M 80 0 V 100 M 90 0 V 100 M 0 10 H 100 M 0 20 H 100 M 0 30 H 100 M 0 40 H 100 M 0 50 H 100 M 0 60 H 100 M 0 70 H 100 M 0 80 H 100 M 0 90 H 100" stroke={faint} strokeWidth="0.7" />
          <path d="M 100 0 H 0 V 100" fill="none" stroke={ink} strokeWidth="1.1" />
        </pattern>
      );
      break;
    case 'lines':
      pattern = (
        <pattern id={id} width="60" height="38" patternUnits="userSpaceOnUse">
          <path d="M 0 37 H 60" stroke={ink} strokeWidth="1" />
        </pattern>
      );
      break;
    case 'crosses':
      pattern = (
        <pattern id={id} width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 14 18 H 22 M 18 14 V 22" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
        </pattern>
      );
      break;
    case 'tri':
      pattern = (
        <pattern id={id} width="48" height="42" patternUnits="userSpaceOnUse">
          <path d="M 24 8 L 34 26 H 14 Z" fill="none" stroke={ink} strokeWidth="1.3" strokeLinejoin="round" />
        </pattern>
      );
      break;
    case 'stars':
      pattern = (
        <pattern id={id} width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 18 12 l 2.2 5 5.3 0.4 -4 3.5 1.3 5.2 -4.8 -2.8 -4.8 2.8 1.3 -5.2 -4 -3.5 5.3 -0.4 Z" fill={ink} />
          <circle cx="52" cy="48" r="1.8" fill={ink} />
        </pattern>
      );
      break;
    case 'waves':
      pattern = (
        <pattern id={id} width="48" height="30" patternUnits="userSpaceOnUse">
          <path d="M 0 15 q 12 -12 24 0 t 24 0" fill="none" stroke={ink} strokeWidth="1.3" />
        </pattern>
      );
      break;
    case 'checker':
      pattern = (
        <pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill={faint} />
          <rect x="40" y="40" width="40" height="40" fill={faint} />
        </pattern>
      );
      break;
    default:
      return null;
  }
  return (
    <>
      <defs>{pattern}</defs>
      <rect x="-100000" y="-100000" width="200000" height="200000" fill={`url(#${id})`} style={{ pointerEvents: 'none' }} />
    </>
  );
}

/** A still picture of a whole mind map: thumbnails, the printout, image export. */
export function MindmapDrawing({
  map,
  bounds,
  paper = false,
  children,
  maxHeight,
  testId,
  pad = 36,
}: {
  map: Pick<MindMap, 'nodes' | 'edges' | 'bg'>;
  bounds?: Bounds;
  /** print: always a white page, no tinted background */
  paper?: boolean;
  children?: ReactNode;
  maxHeight?: string;
  testId?: string;
  pad?: number;
}) {
  const b = bounds ?? mapBounds(map);
  const bgc = paper ? '#ffffff' : bgColor(map.bg.tone);
  const w = b.maxX - b.minX + pad * 2;
  const h = b.maxY - b.minY + pad * 2;
  const uid = useSceneUid();
  const resolveMap = useMapLookup();
  return (
    <svg viewBox={`${b.minX - pad} ${b.minY - pad} ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%', height: maxHeight ? '100%' : 'auto', maxHeight }} data-testid={testId}>
      <SceneProvider uid={uid} resolveMap={resolveMap}>
        <SceneDefs uid={uid} />
        <rect x={b.minX - pad} y={b.minY - pad} width={w} height={h} fill={bgc} />
        {!paper && map.bg.img && (
          <>
            <image href={map.bg.img} x={b.minX - pad} y={b.minY - pad} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
            {(map.bg.imgDim ?? 0) > 0 && <rect x={b.minX - pad} y={b.minY - pad} width={w} height={h} fill={bgc} opacity={map.bg.imgDim} />}
          </>
        )}
        <MapItems map={map} bg={bgc} />
        {children}
      </SceneProvider>
    </svg>
  );
}

export { readableOn };
