import type { ReactNode, PointerEvent as RPE } from 'react';
import { approxTextWidth } from '../../components/canvas/svgText';
import { arrowHead, bgColor, dashArray, edgeGeometry, layoutNode, mapBounds, nodeStyle, readableOn, shapePath, STROKE, type Bounds, type EdgeGeometry, type MMEdge, type MMNode, type MindMap } from './mindmapModel';
import './mindmap.css';

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
}: {
  node: MMNode;
  bg: string;
  selected?: boolean;
  lifted?: boolean;
  pop?: boolean;
  float?: boolean;
  placeholder?: string;
  dragOffset?: { x: number; y: number };
}) {
  const L = layoutNode(node);
  const st = nodeStyle(node, bg);
  const x = dragOffset?.x ?? node.x;
  const y = dragOffset?.y ?? node.y;
  const d = shapePath(node.shape, L.w, L.h);
  const isFrame = node.shape === 'frame';
  const empty = !node.text.trim() && !node.symbol;
  const fold = node.shape === 'note' ? Math.min(22, L.h * 0.22) : 0;
  const phase = (node.id.charCodeAt(node.id.length - 1) % 9) * -0.8;
  return (
    <g transform={`translate(${x},${y})`} data-node-id={node.id} data-testid={`mm-node-${node.id}`} style={{ cursor: 'pointer' }}>
      <g className={`${pop ? 'mm-pop' : ''} ${lifted ? 'mm-lift' : ''}`}>
        <g className={float ? 'mm-float' : ''} style={float ? ({ animationDelay: `${phase}s` } as React.CSSProperties) : undefined}>
          {selected && (
            <path d={d || `M ${-L.w / 2} ${-L.h / 2} h ${L.w} v ${L.h} h ${-L.w} Z`} fill="none" stroke="#3e7c63" strokeWidth={3} opacity={0.55} className="mm-ring" transform="scale(1.07)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          )}
          {node.shape === 'plain' ? (
            <rect x={-L.w / 2} y={-L.h / 2} width={L.w} height={L.h} fill="transparent" />
          ) : (
            <path
              d={d}
              fill={st.fill}
              stroke={st.stroke}
              strokeWidth={st.strokeWidth}
              strokeDasharray={isFrame ? '12 8' : undefined}
              className={lifted ? 'mm-shadow-lg' : isFrame ? undefined : 'mm-shadow'}
              fillOpacity={isFrame ? 0.55 : 1}
              style={isFrame ? { pointerEvents: 'none' } : undefined}
            />
          )}
          {fold > 0 && <path d={`M ${L.w / 2 - fold} ${L.h / 2} L ${L.w / 2} ${L.h / 2 - fold} L ${L.w / 2 - fold} ${L.h / 2 - fold} Z`} fill="#000" opacity={0.13} />}
          {node.symbol && (
            <text x={0} y={L.symbolY + L.symbolSize * 0.34} fontSize={L.symbolSize} textAnchor="middle" style={{ userSelect: 'none' }}>
              {node.symbol}
            </text>
          )}
          {isFrame
            ? L.lines.map((line, i) => (
                <text key={i} x={-L.w / 2 + L.fs * 1.1} y={L.textTop + i * L.lh} fontSize={L.fs} fill={st.text} fontWeight={600} style={{ userSelect: 'none' }}>
                  {line}
                </text>
              ))
            : L.lines.map((line, i) => (
                <text key={i} x={0} y={L.textTop + i * L.lh} fontSize={L.fs} fill={st.text} textAnchor="middle" fontWeight={node.size >= 3 || node.shape === 'plain' ? 600 : 500} style={{ userSelect: 'none' }}>
                  {line}
                </text>
              ))}
          {empty && placeholder && !isFrame && (
            <text x={0} y={L.fs * 0.35} fontSize={L.fs} fill={st.text} opacity={0.45} textAnchor="middle" style={{ userSelect: 'none' }}>
              {placeholder}
            </text>
          )}
          {isFrame && empty && placeholder && (
            <text x={-L.w / 2 + L.fs * 1.1} y={L.textTop} fontSize={L.fs} fill={st.text} opacity={0.45} style={{ userSelect: 'none' }}>
              {placeholder}
            </text>
          )}
        </g>
      </g>
    </g>
  );
}

export function EdgeLabel({ text, x, y, color, bg, size = 14 }: { text: string; x: number; y: number; color: string; bg: string; size?: number }) {
  const w = approxTextWidth(text, size) + size * 1.5;
  const dark = bg === '#23282e';
  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: 'pointer' }}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.9} rx={size} fill={dark ? '#2f353c' : '#ffffff'} stroke={color} strokeWidth={2} />
      <text x={0} y={size * 0.35} fontSize={size} textAnchor="middle" fill={dark ? '#f1ede4' : '#26231f'} style={{ userSelect: 'none' }}>
        {text}
      </text>
    </g>
  );
}

export function EdgeView({ edge, geom, selected = false, onPointerDown, flowEnabled = true }: { edge: MMEdge; geom: EdgeGeometry; selected?: boolean; onPointerDown?: (e: RPE<SVGElement>) => void; flowEnabled?: boolean }) {
  const w = STROKE[edge.width];
  const dash = dashArray(edge.dash, w);
  const head = 9 + w * 2.6;
  return (
    <g data-edge-id={edge.id} data-testid={`mm-edge-${edge.id}`}>
      {selected && <path d={geom.path} stroke="#3e7c63" strokeWidth={w + 8} strokeLinecap="round" fill="none" opacity={0.22} />}
      <path
        d={geom.path}
        stroke={edge.color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeDasharray={dash}
        fill="none"
        className={edge.flow && flowEnabled && edge.dash !== 'solid' ? 'mm-flow' : edge.flow && flowEnabled ? 'mm-flow-solid' : undefined}
        style={edge.flow && flowEnabled ? ({ '--mm-dash': edge.dash === 'dotted' ? w * 2.3 : w * 5.6 } as React.CSSProperties) : undefined}
      />
      {(edge.arrow === 'end' || edge.arrow === 'both') && <path d={arrowHead(geom.p1, geom.a1, head)} fill={edge.color} stroke={edge.color} strokeWidth={1} strokeLinejoin="round" />}
      {edge.arrow === 'both' && <path d={arrowHead(geom.p0, geom.a0, head)} fill={edge.color} stroke={edge.color} strokeWidth={1} strokeLinejoin="round" />}
      {onPointerDown && <path d={geom.path} stroke="transparent" strokeWidth={22} fill="none" strokeLinecap="round" onPointerDown={onPointerDown} style={{ cursor: 'pointer' }} />}
    </g>
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
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const frames = map.nodes.filter((n) => n.shape === 'frame');
  const others = map.nodes.filter((n) => n.shape !== 'frame');
  return (
    <svg viewBox={`${b.minX - pad} ${b.minY - pad} ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', width: '100%', height: maxHeight ? '100%' : 'auto', maxHeight }} data-testid={testId}>
      <rect x={b.minX - pad} y={b.minY - pad} width={w} height={h} fill={bgc} />
      {frames.map((n) => (
        <NodeView key={n.id} node={n} bg={bgc} />
      ))}
      {map.edges.map((e) => {
        const a = byId.get(e.from);
        const c = byId.get(e.to);
        if (!a || !c) return null;
        const g = edgeGeometry(e, a, c, layoutNode(a), layoutNode(c));
        return <EdgeView key={e.id} edge={e} geom={g} flowEnabled={false} />;
      })}
      {others.map((n) => (
        <NodeView key={n.id} node={n} bg={bgc} />
      ))}
      {map.edges.map((e) => {
        if (!e.label) return null;
        const a = byId.get(e.from);
        const c = byId.get(e.to);
        if (!a || !c) return null;
        const g = edgeGeometry(e, a, c, layoutNode(a), layoutNode(c));
        return <EdgeLabel key={`l-${e.id}`} text={e.label} x={g.mid.x} y={g.mid.y} color={e.color} bg={bgc} />;
      })}
      {children}
    </svg>
  );
}

export { readableOn };
