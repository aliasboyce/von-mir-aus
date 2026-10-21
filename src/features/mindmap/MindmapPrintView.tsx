import { MindmapDrawing } from './MindmapScene';
import { layoutNode, mapBounds, type Bounds, type MindMap } from './mindmapModel';
import { mindmapTexts } from './mindmapTexts';

// printable area of an A4 page with 10 mm margins, in CSS px (96 dpi), minus the title block
const AREA = { land: { w: 1040, h: 610 }, port: { w: 710, h: 930 } };

/** How the printout is laid out: whole map on page 1, plus detail sections when it would be too small to read. */
export function planMindmapPrint(map: MindMap) {
  const b = mapBounds(map);
  const pad = 36;
  const W = b.maxX - b.minX + pad * 2;
  const H = b.maxY - b.minY + pad * 2;
  const landscape = W >= H * 1.05;
  const area = landscape ? AREA.land : AREA.port;
  const fitScale = Math.min(area.w / W, area.h / H);

  // detail sections when the overview is too small to read
  const tiles: Bounds[] = [];
  if (fitScale < 0.5 && map.nodes.length > 0) {
    for (const target of [0.8, 0.68, 0.58, 0.5]) {
      const tw = area.w / target;
      const th = area.h / target;
      const nx = Math.max(1, Math.ceil((W - tw * 0.08) / (tw * 0.92)));
      const ny = Math.max(1, Math.ceil((H - th * 0.08) / (th * 0.92)));
      const all: Bounds[] = [];
      for (let iy = 0; iy < ny; iy++) {
        for (let ix = 0; ix < nx; ix++) {
          const minX = b.minX - pad + ix * tw * 0.92;
          const minY = b.minY - pad + iy * th * 0.92;
          const t = { minX, minY, maxX: minX + tw, maxY: minY + th };
          const used = map.nodes.some((n) => {
            const l = layoutNode(n);
            return n.x + l.w / 2 > t.minX && n.x - l.w / 2 < t.maxX && n.y + l.h / 2 > t.minY && n.y - l.h / 2 < t.maxY;
          });
          if (used) all.push(t);
        }
      }
      tiles.length = 0;
      tiles.push(...all);
      if (all.length <= 12) break;
    }
  }

  return { b, pad, W, H, landscape, area, tiles, fitScale };
}

/**
 * The printed mind map. Page 1 shows the WHOLE map in its true proportions. If it would become too small
 * to read on one sheet, detail pages follow, each showing one section at a readable size. The last page
 * lists every element and connection as text, so nothing is lost even if a drawing is hard to read.
 */
export function MindmapPrintView({ map, lang, images }: { map: MindMap; lang: 'de' | 'en'; /** the drawings as finished pictures (PNG data URLs) – printed instead of the live drawing */ images?: { overview?: string; tiles?: (string | undefined)[] } }) {
  const T = mindmapTexts(lang);
  const { b, pad, landscape, area, tiles } = planMindmapPrint(map);

  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const nodeName = (id: string) => {
    const n = byId.get(id);
    return n ? `${n.symbol ? `${n.symbol} ` : ''}${n.text.trim() || (lang === 'en' ? '(no text)' : '(ohne Text)')}` : '?';
  };
  const date = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const pageStyle: React.CSSProperties = { breakAfter: 'page', pageBreakAfter: 'always' };
  const head = (extra?: string) => (
    <div style={{ marginBottom: 6 }}>
      <h1 style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>{map.title || T.pageTitle}</h1>
      <p style={{ fontSize: 10.5, color: '#777', margin: '2px 0 0' }}>
        {T.printDate} {date}
        {extra ? ` · ${extra}` : ''}
      </p>
    </div>
  );
  const boxStyle = (a: { w: number; h: number }): React.CSSProperties => ({ width: a.w, height: a.h, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' });

  return (
    <div className="print-only" data-print-id="mindmap" data-testid="mindmap-print" style={{ padding: '4px 6px', color: '#1a1a1a', background: '#fff', fontFamily: 'system-ui, sans-serif', page: landscape ? 'mm-land' : 'mm-port' } as React.CSSProperties}>
      <style>{'@page mm-land { size: A4 landscape; margin: 10mm; } @page mm-port { size: A4 portrait; margin: 10mm; }'}</style>
      <section style={pageStyle} data-testid="mindmap-print-overview">
        {head(tiles.length ? T.printOverview : undefined)}
        <div style={boxStyle(area)}>
          {images?.overview ? (
            <img src={images.overview} alt={map.title || T.pageTitle} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} data-testid="mindmap-print-img" />
          ) : (
            <MindmapDrawing map={map} bounds={b} paper pad={pad} maxHeight={`${area.h}px`} testId="mindmap-print-svg" />
          )}
        </div>
      </section>

      {tiles.map((t, i) => (
        <section key={i} style={pageStyle} data-testid="mindmap-print-tile">
          {head(T.printPart.replace('{i}', String(i + 1)).replace('{n}', String(tiles.length)))}
          <div style={boxStyle(area)}>
            {images?.tiles?.[i] ? (
              <img src={images.tiles[i]} alt="" style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <MindmapDrawing map={map} bounds={t} paper pad={0} maxHeight={`${area.h}px`} />
            )}
          </div>
        </section>
      ))}

      <section>
        {head()}
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: '8px 0 4px' }}>{T.printElements}</h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6 }}>
          {map.nodes.map((n) => (
            <li key={n.id} style={{ breakInside: 'avoid' }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 999, background: n.color, marginRight: 7 }} />
              {nodeName(n.id)}
            </li>
          ))}
        </ul>
        {map.edges.length > 0 && (
          <>
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: '14px 0 4px' }}>{T.printLinks}</h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.6 }}>
              {map.edges.map((e) => (
                <li key={e.id} style={{ breakInside: 'avoid' }}>
                  <span style={{ display: 'inline-block', width: 18, height: 4, borderRadius: 2, background: e.color, marginRight: 7, verticalAlign: 'middle' }} />
                  {nodeName(e.from)} {e.arrow === 'both' ? '↔' : e.arrow === 'end' ? '→' : '—'}
                  {e.label ? ` ${e.label} ${e.arrow === 'both' ? '↔' : e.arrow === 'end' ? '→' : '—'}` : ''} {nodeName(e.to)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
