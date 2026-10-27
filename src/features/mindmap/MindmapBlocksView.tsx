import { fontCss, fontW, mixHex, readableOn, shapePath, type MMNode, type NodeLayout, type NodeStyle } from './mindmapModel';
import { appCardLayout, defaultGrid, prosConsLayout, tableLayout, todoLayout } from './mindmapBlocks';

/** SVG bodies of the content cards (to-do list, table, pro & contra, card from the app) */

interface BodyProps {
  node: MMNode;
  L: NodeLayout;
  st: NodeStyle;
  dark: boolean;
  lifted: boolean;
  fop: number;
  placeholder?: string;
}

function Card({ node, L, st, lifted, fop }: Pick<BodyProps, 'node' | 'L' | 'st' | 'lifted' | 'fop'>) {
  const d = shapePath(node.shape, L.w, L.h, node.round);
  const shadow = st.fill !== 'none' && fop > 0.55;
  return (
    <>
      {st.fill === 'none' && <path d={d} fill="transparent" />}
      <path d={d} fill={st.fill} fillOpacity={fop} stroke={node.border === 'none' ? 'none' : st.stroke} strokeWidth={node.border === 'none' ? 0 : st.strokeWidth} strokeDasharray={node.border === 'dashed' ? '10 7' : node.border === 'dotted' ? '0.1 7' : undefined} strokeLinecap={node.border === 'dotted' ? 'round' : undefined} className={lifted ? 'mm-shadow-lg' : shadow ? 'mm-shadow' : undefined} />
    </>
  );
}

const CHECK = (r: number) => `M ${-r * 0.5} ${r * 0.02} L ${-r * 0.12} ${r * 0.42} L ${r * 0.55} ${-r * 0.4}`;

/** half-opacity colour for done entries */
const MUTED = 0.5;

export function TodoBody(p: BodyProps) {
  const { node, st } = p;
  const fs = p.L.fs;
  const T = todoLayout(node, fs, fontW(node));
  const ff = fontCss(node.font);
  const accent = node.color;
  const tick = node.ck ?? accent;
  const top = -T.h / 2;
  const left = -T.w / 2;
  return (
    <>
      <Card {...p} />
      {T.titleLines.map((line, i) => (
        <text key={i} x={left + T.pad} y={top + T.pad + T.tfs * 0.95 + i * T.tlh} fontSize={T.tfs} fontWeight={800} fill={node.tc ?? (p.dark ? mixHex(accent, '#ffffff', 0.35) : mixHex(accent, '#000000', 0.35))} fontFamily={ff} fontStyle={node.italic ? 'italic' : undefined} style={{ userSelect: 'none' }}>
          {line}
        </text>
      ))}
      {T.rows.map((r, ri) => {
        const cx = left + T.pad + T.cr;
        const firstY = r.cy - ((r.lines.length - 1) * T.lh) / 2 + fs * 0.35;
        return (
          <g key={r.id} data-todo-item={r.id} data-done={r.done ? '1' : '0'}>
            {ri > 0 && <line x1={left + T.pad} x2={left + T.w - T.pad} y1={r.top} y2={r.top} stroke={st.text} strokeOpacity={0.1} />}
            <circle cx={cx} cy={r.cy} r={T.cr} fill={r.done ? tick : 'none'} stroke={r.done ? tick : accent} strokeWidth={2} />
            {r.done && <path d={CHECK(T.cr)} transform={`translate(${cx},${r.cy})`} fill="none" stroke={readableOn(tick)} strokeWidth={Math.max(2, T.cr * 0.26)} strokeLinecap="round" strokeLinejoin="round" />}
            {r.lines.map((line, i) => (
              <g key={i}>
                <text x={T.textX} y={firstY + i * T.lh} fontSize={fs} fill={st.text} fillOpacity={r.done ? MUTED : 1} fontFamily={ff} fontWeight={node.bold ? 800 : 500} fontStyle={node.italic ? 'italic' : undefined} style={{ userSelect: 'none' }}>
                  {line}
                </text>
                {r.done && <line x1={T.textX} x2={T.textX + r.width[i]} y1={firstY + i * T.lh - fs * 0.3} y2={firstY + i * T.lh - fs * 0.3} stroke={st.text} strokeOpacity={0.6} strokeWidth={Math.max(1.4, fs * 0.1)} strokeLinecap="round" />}
              </g>
            ))}
          </g>
        );
      })}
      {!T.rows.length && (
        <text x={0} y={top + T.pad + T.titleH + fs * 1.4} fontSize={fs} fill={st.text} fillOpacity={0.45} textAnchor="middle" fontFamily={ff} style={{ userSelect: 'none' }}>
          {p.placeholder || '…'}
        </text>
      )}
    </>
  );
}

export function TableBody(p: BodyProps) {
  const { node, st } = p;
  const fs = p.L.fs;
  const T = tableLayout(node, fs, fontW(node));
  const ff = fontCss(node.font);
  const grid = node.grid && node.grid.length ? node.grid : defaultGrid();
  const hdr = node.hdr !== false;
  const left = -T.w / 2;
  const top = -T.h / 2;
  const line = node.bc ?? node.color;
  const headFill = node.fc ? mixHex(node.fc, '#000000', 0.08) : node.color;
  const clip = `tbl-${node.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  void grid;
  return (
    <>
      <clipPath id={clip}>
        <path d={shapePath(node.shape, T.w, T.h, node.round)} />
      </clipPath>
      <Card {...p} />
      <g clipPath={`url(#${clip})`}>
        {hdr && T.rows[0] && <rect x={left} y={T.rows[0].top} width={T.w} height={T.rows[0].h} fill={headFill} fillOpacity={p.fop} />}
        {T.rows.map((r, ri) => (
          <g key={ri}>
            {ri > 0 && <line x1={left} x2={left + T.w} y1={r.top} y2={r.top} stroke={line} strokeOpacity={0.55} strokeWidth={1.3} />}
            {r.cells.map((cell, ci) => {
              const head = hdr && ri === 0;
              return cell.map((ln, li) => (
                <text key={`${ci}-${li}`} x={left + ci * T.colW + fs * 0.55} y={r.top + fs * 1.5 + li * T.lh} fontSize={fs} fill={head ? node.tc ?? readableOn(headFill) : st.text} fontWeight={head || node.bold ? 800 : 500} fontFamily={ff} fontStyle={node.italic ? 'italic' : undefined} style={{ userSelect: 'none' }}>
                  {ln}
                </text>
              ));
            })}
          </g>
        ))}
        {Array.from({ length: T.cols - 1 }, (_, i) => (
          <line key={i} x1={left + (i + 1) * T.colW} x2={left + (i + 1) * T.colW} y1={top + T.titleH} y2={top + T.h} stroke={line} strokeOpacity={0.55} strokeWidth={1.3} />
        ))}
      </g>
      {T.titleLines.map((ln, i) => (
        <text key={`t${i}`} x={left + fs * 0.6} y={top + fs * 1.4 + i * fs * 1.4} fontSize={fs * 1.1} fontWeight={800} fill={st.text} fontFamily={ff} style={{ userSelect: 'none' }}>
          {ln}
        </text>
      ))}
      {/* the outline once more on top of the cells */}
      <path d={shapePath(node.shape, T.w, T.h, node.round)} fill="none" stroke={node.border === 'none' ? 'none' : st.stroke} strokeWidth={node.border === 'none' ? 0 : st.strokeWidth} pointerEvents="none" />
    </>
  );
}

export function ProsConsBody(p: BodyProps) {
  const { node, st } = p;
  const fs = p.L.fs;
  const T = prosConsLayout(node, fs, fontW(node));
  const ff = fontCss(node.font);
  const pc = node.pc ?? '#5f9e6e';
  const cc = node.cc ?? '#d9778a';
  const left = -T.w / 2;
  const top = -T.h / 2;
  const colX = [left + T.pad, left + T.pad * 2 + T.colW];
  const head = (i: 0 | 1, color: string, label: string, sign: string) => (
    <g>
      <rect x={colX[i]} y={T.headTop} width={T.colW} height={T.headH} rx={T.headH / 2.4} fill={color} />
      <text x={colX[i] + T.headH * 0.5} y={T.headTop + T.headH / 2 + fs * 0.4} fontSize={fs * 1.25} fontWeight={800} fill={readableOn(color)} fontFamily={ff} style={{ userSelect: 'none' }}>{sign}</text>
      <text x={colX[i] + T.headH * 1.05} y={T.headTop + T.headH / 2 + fs * 0.36} fontSize={fs} fontWeight={800} fill={readableOn(color)} fontFamily={ff} style={{ userSelect: 'none' }}>{label}</text>
    </g>
  );
  const col = (i: 0 | 1, color: string, rows: { lines: string[]; top: number; h: number }[]) =>
    rows.map((r, ri) => (
      <g key={`${i}-${ri}`}>
        <circle cx={colX[i] + fs * 0.45} cy={r.top + fs * 0.95} r={fs * 0.22} fill={color} />
        {r.lines.map((ln, li) => (
          <text key={li} x={colX[i] + fs * 1.1} y={r.top + fs * 1.3 + li * T.lh} fontSize={fs} fill={st.text} fontFamily={ff} fontWeight={node.bold ? 800 : 500} fontStyle={node.italic ? 'italic' : undefined} style={{ userSelect: 'none' }}>
            {ln}
          </text>
        ))}
      </g>
    ));
  return (
    <>
      <Card {...p} />
      {T.titleLines.map((ln, i) => (
        <text key={i} x={left + T.pad} y={top + T.pad + fs * 1.1 + i * fs * 1.4} fontSize={fs * 1.1} fontWeight={800} fill={st.text} fontFamily={ff} style={{ userSelect: 'none' }}>
          {ln}
        </text>
      ))}
      {head(0, pc, node.pl ?? 'Pro', '＋')}
      {head(1, cc, node.cl ?? 'Contra', '−')}
      {col(0, pc, T.pros)}
      {col(1, cc, T.cons)}
      <line x1={left + T.w / 2} x2={left + T.w / 2} y1={T.headTop + T.headH + 4} y2={top + T.h - T.pad * 0.7} stroke={st.text} strokeOpacity={0.12} />
    </>
  );
}

export function AppCardBody(p: BodyProps) {
  const { node, dark, lifted, fop } = p;
  const fs = p.L.fs;
  const snap = node.snap;
  const T = appCardLayout(node, snap, fs, fontW(node));
  const color = snap?.color ?? node.color;
  const ff = fontCss(node.font);
  const cardFill = node.nofill ? 'none' : node.fc ?? mixHex(color, dark ? '#23282e' : '#ffffff', dark ? 0.86 : 0.9);
  const d = shapePath('appcard', T.w, T.h, node.round ?? true);
  const left = -T.w / 2;
  const top = -T.h / 2;
  const tint = mixHex(color, dark ? '#23282e' : '#ffffff', 0.78);
  return (
    <>
      {cardFill === 'none' && <path d={d} fill="transparent" />}
      <path d={d} fill={cardFill} fillOpacity={fop} stroke={node.border === 'none' ? 'none' : node.bc ?? `${color}88`} strokeWidth={node.border === 'none' ? 0 : node.sw ?? 1.6} className={lifted ? 'mm-shadow-lg' : cardFill !== 'none' && fop > 0.55 ? 'mm-shadow' : undefined} />
      <rect x={left + T.pad} y={top + (T.h - T.icon) / 2} width={T.icon} height={T.icon} rx={T.icon * 0.26} fill={tint} stroke={`${color}55`} />
      <text x={left + T.pad + T.icon / 2} y={top + T.h / 2 + T.icon * 0.14} fontSize={T.icon * 0.5} textAnchor="middle" style={{ userSelect: 'none' }}>
        {snap?.emoji ?? '✨'}
      </text>
      <text x={T.textX} y={T.labelY} fontSize={fs * 0.78} fontWeight={700} fill={color} letterSpacing={0.6} fontFamily={ff} style={{ userSelect: 'none' }}>
        {(snap?.label ?? '').toUpperCase()}
      </text>
      {T.titleLines.map((ln, i) => (
        <text key={i} x={T.textX} y={T.titleY + i * T.lh} fontSize={fs * 1.05} fontWeight={node.bold ? 800 : 600} fill={node.tc ?? (dark ? '#f1ede4' : '#26231f')} fontFamily={ff} fontStyle={node.italic ? 'italic' : undefined} style={{ userSelect: 'none' }}>
          {ln}
        </text>
      ))}
      {T.subLines.map((ln, i) => (
        <text key={i} x={T.textX} y={T.subY + i * fs * 1.15} fontSize={fs * 0.85} fill={node.tc ?? (dark ? '#c9c5bc' : '#6b665c')} fontFamily={ff} style={{ userSelect: 'none' }}>
          {ln}
        </text>
      ))}
    </>
  );
}
