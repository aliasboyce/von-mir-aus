import { approxTextWidth } from '../../components/canvas/svgText';
import type { NetworkEntry, NetworkCategoryConfig } from '../../data/types';
import type { CenterNodeConfig } from './networkCategories';
import { connectionCurvesStore, pairKey } from './connectionCurves';
import { CENTER, computePositions, netBounds, validParentId } from './networkLayout';
import type { NetworkBackground } from './networkBackground';
import { DEFAULT_LINK_COLOR, linkCategoriesRepo, linkMetaStore, resolveLink } from './networkLinks';

interface NetworkPrintViewProps {
  entries: NetworkEntry[];
  categories: NetworkCategoryConfig[];
  centerNode: CenterNodeConfig;
  labels: {
    title: string;
    subtitle: string;
    legendTitle: string;
    exportedOn: string;
  };
  formatDate: (iso: string) => string;
  lang?: 'de' | 'en';
  /** the drawing as a finished picture (PNG data URL): printed instead of the live drawing – far more reliable */
  image?: string;
  /** paint the net's own background into the drawing (picture for the photo button) */
  background?: NetworkBackground;
}

const U = 1000; // one graph unit in drawing units

/**
 * The printed net: a true copy of the picture on screen – every element where you put it (also far
 * outside the first screen), sub-elements under their parents, every line with its name and colour.
 * The drawing is cropped to what is actually there and keeps its proportions, so it never looks
 * squeezed; node and text size grow with the size of the net so it stays readable. The drawing sits
 * on its own page (landscape or portrait, whichever fits its shape); legend and an element-by-element
 * list follow on the next page.
 */
export function NetworkPrintView({ entries, categories, centerNode, labels, formatDate, lang = 'de', image, background }: NetworkPrintViewProps) {
  const positions = computePositions(entries);
  const byId = new Map(entries.map((e) => [e.id, e]));
  const parentOf = new Map(entries.map((e) => [e.id, validParentId(e, byId)]));
  const cats = linkCategoriesRepo.getAll();
  const meta = linkMetaStore.all();
  const metaFor = (a: string, b: string) => resolveLink(meta[pairKey(a, b)] ?? {}, cats);

  const b = netBounds(positions);
  const spanW = (b.maxX - b.minX) * U;
  const spanH = (b.maxY - b.minY) * U;
  // sizes follow the size of the net: bigger net → relatively bigger dots and text (stays legible on A4)
  const k = Math.max(1, Math.max(spanW, spanH) / 900);
  const R = 24 * k;
  const font = 14 * k;
  const margin = 70 * k;
  const minX = b.minX * U - margin;
  const minY = b.minY * U - margin;
  const w = spanW + margin * 2;
  const h = spanH + margin * 2 + 20 * k;
  const landscape = w >= h * 1.05;
  const P = (id: string) => {
    const p = positions.get(id) ?? CENTER;
    return { x: p.x * U, y: p.y * U };
  };
  const cx = CENTER.x * U;
  const cy = CENTER.y * U;

  const catColor = (id: string) => categories.find((c) => c.id === id)?.color ?? '#8A8A8A';
  const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id;
  const usedCats = Array.from(new Set(entries.map((e) => e.category)));

  const short = (s: string, n = 22) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const pill = (x: number, y: number, text: string, color: string, key: string) => {
    const fs = font * 0.8;
    const tw = approxTextWidth(text, fs) + fs * 1.6;
    return (
      <g key={key}>
        <rect x={x - tw / 2} y={y - fs * 0.95} width={tw} height={fs * 1.9} rx={fs} fill="#fff" stroke={color} strokeWidth={1.6 * k} />
        <circle cx={x - tw / 2 + fs * 0.7} cy={y} r={fs * 0.25} fill={color} />
        <text x={x + fs * 0.35} y={y + fs * 0.34} fontSize={fs} fill="#2a2520" textAnchor="middle">
          {text}
        </text>
      </g>
    );
  };

  // lines
  const freePairs: [string, string][] = [];
  const seen = new Set<string>();
  entries.forEach((e) =>
    (e.linkedTo ?? []).forEach((o) => {
      if (!byId.has(o)) return;
      const key = pairKey(e.id, o);
      if (seen.has(key)) return;
      seen.add(key);
      freePairs.push([e.id, o]);
    }),
  );
  const commPairs: [string, string][] = [];
  const seenC = new Set<string>();
  entries.forEach((e) =>
    (e.connections ?? []).forEach((o) => {
      if (!byId.has(o)) return;
      const key = pairKey(e.id, o);
      if (seenC.has(key)) return;
      seenC.add(key);
      commPairs.push([e.id, o]);
    }),
  );

  // element-by-element list: top level, sub-elements indented
  const tops = entries.filter((e) => !parentOf.get(e.id));
  const kidsOf = (id: string) => entries.filter((e) => parentOf.get(e.id) === id);
  const rows: { e: NetworkEntry; depth: number }[] = [];
  const walk = (e: NetworkEntry, depth: number, guard: Set<string>) => {
    if (guard.has(e.id)) return;
    guard.add(e.id);
    rows.push({ e, depth });
    kidsOf(e.id).forEach((c) => walk(c, depth + 1, guard));
  };
  const guard = new Set<string>();
  tops.forEach((e) => walk(e, 0, guard));
  const lineRows = [
    ...freePairs.map(([a, c]) => ({ a, b: c, kind: 'free' as const })),
    ...entries.filter((e) => parentOf.get(e.id) && (meta[pairKey(e.id, parentOf.get(e.id)!)]?.label || meta[pairKey(e.id, parentOf.get(e.id)!)]?.categoryId)).map((e) => ({ a: parentOf.get(e.id)!, b: e.id, kind: 'parent' as const })),
  ].filter((r) => metaFor(r.a, r.b).label);
  const usedKinds = Array.from(new Map(lineRows.map((r) => [metaFor(r.a, r.b).label, metaFor(r.a, r.b).color ?? DEFAULT_LINK_COLOR])).entries());

  const T = lang === 'en'
    ? { elements: 'All elements', under: 'under', connections: 'Connections', kinds: 'Kinds of connection', talk: 'in exchange', yourself: centerNode.label }
    : { elements: 'Alle Elemente', under: 'unter', connections: 'Verbindungen', kinds: 'Arten von Verbindung', talk: 'im Austausch', yourself: centerNode.label };

  return (
    <div className="print-only" data-testid="network-print" style={{ padding: '14px 18px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif', page: landscape ? 'net-land' : 'net-port' } as React.CSSProperties}>
      <style>{`@page net-land { size: A4 landscape; margin: 10mm; } @page net-port { size: A4 portrait; margin: 10mm; }`}</style>
      <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 2px' }}>{labels.title}</h1>
        <p style={{ fontSize: 11, color: '#777', margin: '0 0 8px' }}>
          {labels.subtitle} · {labels.exportedOn} {formatDate(new Date().toISOString())}
        </p>
        <div style={{ height: landscape ? '158mm' : '228mm', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {image ? (
          <img src={image} alt={labels.title} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} data-testid="network-print-img" />
        ) : (
        <svg
          viewBox={`${minX} ${minY} ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-testid="network-print-svg"
        >
          {background && <NetBackdrop bg={background} x={minX} y={minY} w={w} h={h} />}
          {entries.map((e) => {
            if (parentOf.get(e.id)) return null;
            const p = P(e.id);
            return <line key={`c-${e.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#cfc8bb" strokeWidth={1.4 * k} strokeDasharray={`${2 * k} ${7 * k}`} strokeLinecap="round" />;
          })}
          {entries.map((e) => {
            const pid = parentOf.get(e.id);
            if (!pid) return null;
            const a = P(pid);
            const c = P(e.id);
            const col = metaFor(pid, e.id).color ?? catColor(e.category);
            return <line key={`p-${e.id}`} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={col} strokeWidth={2.4 * k} strokeLinecap="round" opacity={0.8} />;
          })}
          {freePairs.map(([a, c]) => {
            const pa = P(a);
            const pc = P(c);
            const col = metaFor(a, c).color ?? '#6b9080';
            return <line key={`f-${a}-${c}`} x1={pa.x} y1={pa.y} x2={pc.x} y2={pc.y} stroke={col} strokeWidth={2.6 * k} strokeLinecap="round" opacity={0.85} />;
          })}
          {commPairs.map(([a, c]) => {
            const pa = P(a);
            const pc = P(c);
            const amount = connectionCurvesStore.get(a, c).amount * U;
            const mx = (pa.x + pc.x) / 2;
            const my = (pa.y + pc.y) / 2;
            const len = Math.hypot(pc.x - pa.x, pc.y - pa.y) || 1;
            const qx = mx + (-(pc.y - pa.y) / len) * amount;
            const qy = my + ((pc.x - pa.x) / len) * amount;
            return <path key={`m-${a}-${c}`} d={`M ${pa.x} ${pa.y} Q ${qx} ${qy} ${pc.x} ${pc.y}`} stroke="#8a847a" strokeWidth={1.8 * k} strokeDasharray={`${3 * k} ${6 * k}`} fill="none" strokeLinecap="round" />;
          })}

          {/* names of lines */}
          {freePairs.map(([a, c]) => {
            const { label, color } = metaFor(a, c);
            if (!label) return null;
            const pa = P(a);
            const pc = P(c);
            return pill((pa.x + pc.x) / 2, (pa.y + pc.y) / 2, short(label, 26), color ?? '#6b9080', `fl-${a}-${c}`);
          })}
          {entries.map((e) => {
            const pid = parentOf.get(e.id);
            if (!pid) return null;
            const { label, color } = metaFor(pid, e.id);
            if (!label) return null;
            const pa = P(pid);
            const pc = P(e.id);
            return pill((pa.x + pc.x) / 2, (pa.y + pc.y) / 2, short(label, 26), color ?? catColor(e.category), `pl-${e.id}`);
          })}

          {/* "you" */}
          <circle cx={cx} cy={cy} r={R * 1.5} fill={centerNode.color} />
          <text x={cx} y={cy + font * 0.35} fontSize={font * 0.9} fill="#fff" textAnchor="middle" fontWeight={600}>
            {short(centerNode.label, 10)}
          </text>

          {entries.map((e) => {
            const p = P(e.id);
            const child = !!parentOf.get(e.id);
            const r = child ? R * 0.82 : R;
            return (
              <g key={e.id}>
                <circle cx={p.x} cy={p.y} r={r} fill={catColor(e.category)} stroke="#fff" strokeWidth={2 * k} />
                <text x={p.x} y={p.y + r + font * 1.15} fontSize={child ? font * 0.92 : font} fill="#2a2520" textAnchor="middle">
                  {short(e.name)}
                </text>
              </g>
            );
          })}
        </svg>
        )}
        </div>
      </div>

      <div style={{ breakBefore: 'page', pageBreakBefore: 'always', paddingTop: 6 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>{labels.legendTitle}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 20px', marginBottom: 14 }}>
          {usedCats.map((id) => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: 999, background: catColor(id), display: 'inline-block' }} />
              <span style={{ fontSize: 12 }}>{catLabel(id)}</span>
            </div>
          ))}
        </div>
        {usedKinds.length > 0 && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>{T.kinds}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 20px', marginBottom: 14 }}>
              {usedKinds.map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 22, height: 4, borderRadius: 2, background: color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12 }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>{T.elements}</h2>
        <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, fontSize: 12.5, lineHeight: 1.55 }}>
          {rows.map(({ e, depth }) => (
            <li key={e.id} style={{ paddingLeft: depth * 18, breakInside: 'avoid' }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 999, background: catColor(e.category), marginRight: 7 }} />
              <strong style={{ fontWeight: 600 }}>{e.name}</strong>
              {e.role ? <span style={{ color: '#666' }}> · {e.role}</span> : null}
              {depth > 0 && parentOf.get(e.id) ? <span style={{ color: '#888' }}> ({T.under} {byId.get(parentOf.get(e.id)!)?.name})</span> : null}
            </li>
          ))}
        </ul>
        {(lineRows.length > 0 || commPairs.length > 0) && (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>{T.connections}</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12.5, lineHeight: 1.55 }}>
              {lineRows.map((r) => {
                const { label, color } = metaFor(r.a, r.b);
                return (
                  <li key={`${r.a}-${r.b}`} style={{ breakInside: 'avoid' }}>
                    <span style={{ display: 'inline-block', width: 18, height: 4, borderRadius: 2, background: color ?? DEFAULT_LINK_COLOR, marginRight: 7, verticalAlign: 'middle' }} />
                    {byId.get(r.a)?.name} – {label} – {byId.get(r.b)?.name}
                  </li>
                );
              })}
              {commPairs.map(([a, c]) => (
                <li key={`m-${a}-${c}`} style={{ breakInside: 'avoid', color: '#555' }}>
                  ☎ {byId.get(a)?.name} – {T.talk} – {byId.get(c)?.name}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/** the net's own background, drawn into the picture */
function NetBackdrop({ bg, x, y, w, h }: { bg: NetworkBackground; x: number; y: number; w: number; h: number }) {
  if (bg.type === 'image') return <image href={bg.value} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" />;
  if (bg.type === 'gradient') {
    const cols = bg.value.match(/#[0-9a-fA-F]{3,8}/g) ?? ['#f6f2ea', '#f6f2ea'];
    return (
      <>
        <defs>
          <linearGradient id="net-bg-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={cols[0]} />
            <stop offset="1" stopColor={cols[cols.length - 1]} />
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={w} height={h} fill="url(#net-bg-g)" />
      </>
    );
  }
  return <rect x={x} y={y} width={w} height={h} fill={bg.type === 'color' ? bg.value : '#f6f2ea'} />;
}
