import { useEffect, useMemo, useRef, useState } from 'react';
import { SlipsHere } from '../parkbox/SlipsHere';
import { SLIPS_CHANGED } from '../parkbox/slipDelivery';
import { slipsAt } from '../parkbox/slipAttach';
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Lock, NotebookPen, Unlock, X } from 'lucide-react';
import { ensureZ, layoutNode, nodesByZ, type MMNode } from './mindmapModel';
import { SHAPES } from './mindmapModel';

/* ------------------------------------------------------------------ memo */

/**
 * A private side note for the selected element. It lives next to the map (a small window on the right),
 * not on the map itself – it is not part of printouts, pictures or shared maps.
 */
export function MemoWindow({ node, lang, onChange, top }: { node: MMNode; lang: 'de' | 'en'; onChange: (memo: string | undefined) => void; top: string }) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const has = !!node.memo;
  // open by itself when there is a note; otherwise a small button offers to write one
  const [open, setOpen] = useState(has);
  const [typing, setTyping] = useState(false);
  if (!open && !has) {
    return (
      <button type="button" onClick={() => { setOpen(true); setTyping(true); }} className="absolute right-3 z-10 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12.5px] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] text-[var(--color-text-muted)]" style={{ top }} data-testid="mm-memo-open">
        <NotebookPen size={15} /> {L('Merknotiz', 'Side note')}
      </button>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="absolute right-3 z-10 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12.5px] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] text-[var(--color-text)]" style={{ top }} data-testid="mm-memo-open">
        <NotebookPen size={15} style={{ color: '#e8a83d' }} /> {L('Merknotiz', 'Side note')}
      </button>
    );
  }
  return (
    <div className="absolute right-3 z-10 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] p-3 flex flex-col gap-1.5" style={{ top, width: 'min(250px, 64vw)', borderTop: '3px solid #e8a83d' }} data-testid="mm-memo">
      <div className="flex items-center gap-1.5">
        <NotebookPen size={15} style={{ color: '#e8a83d' }} />
        <span className="text-[13px] font-medium text-[var(--color-text)] flex-1">{L('Merknotiz', 'Side note')}</span>
        <button type="button" onClick={() => setOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Einklappen', 'Collapse')} data-testid="mm-memo-close"><ChevronDown size={16} /></button>
      </div>
      <textarea
        autoFocus={typing}
        rows={4}
        value={node.memo ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={L('Nur für dich – steht nicht in der Mindmap.', 'Just for you – not shown on the map.')}
        className="resize-y min-h-[84px] max-h-[40vh] rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-2.5 py-2 text-[13.5px] outline-none"
        data-testid="mm-memo-input"
      />
      <p className="text-[11px] text-[var(--color-text-faint)] leading-snug">{L('Erscheint nur hier, wenn du das Element antippst – nicht im Druck, im Bild oder beim Teilen.', 'Appears only here when you tap the element – not in print, pictures or shared maps.')}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- layers */

const rectOf = (n: MMNode) => {
  const l = layoutNode(n);
  return { x0: n.x - l.w / 2, x1: n.x + l.w / 2, y0: n.y - l.h / 2, y1: n.y + l.h / 2 };
};
/** a piece lying completely inside a frame is just "in" it, not "over" it */
function insideFrame(a: MMNode, f: MMNode) {
  if (f.shape !== 'frame' || a.id === f.id) return false;
  const r = rectOf(a);
  const g = rectOf(f);
  return r.x0 >= g.x0 - 4 && r.x1 <= g.x1 + 4 && r.y0 >= g.y0 - 4 && r.y1 <= g.y1 + 4;
}
function overlaps(a: MMNode, b: MMNode) {
  if (insideFrame(a, b) || insideFrame(b, a)) return false;
  const r = rectOf(a);
  const s = rectOf(b);
  const w = Math.min(r.x1, s.x1) - Math.max(r.x0, s.x0);
  const h = Math.min(r.y1, s.y1) - Math.max(r.y0, s.y0);
  return w > 6 && h > 6;
}

/** groups of elements that lie on top of each other, each front-to-back */
export function overlapGroups(nodes: MMNode[]): MMNode[][] {
  const list = nodesByZ(ensureZ(nodes));
  const parent = list.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) if (overlaps(list[i], list[j])) parent[find(i)] = find(j);
  const groups = new Map<number, MMNode[]>();
  list.forEach((n, i) => {
    const r = find(i);
    groups.set(r, [...(groups.get(r) ?? []), n]);
  });
  return [...groups.values()].filter((g) => g.length > 1).map((g) => [...g].reverse());
}

/** give these elements the layer numbers they already occupy, in the new front-to-back order */
export function reorderZ(nodes: MMNode[], frontFirst: string[]): MMNode[] {
  // every element gets a real layer number first (back = 0), then the chosen ones swap places among themselves
  const order = nodesByZ(nodes);
  const zOf = new Map(order.map((n, i) => [n.id, i]));
  const zs = frontFirst.map((id) => zOf.get(id) ?? 0).sort((a, b) => b - a);
  const next = new Map(frontFirst.map((id, i) => [id, zs[i]]));
  return nodes.map((n) => ({ ...n, z: next.get(n.id) ?? zOf.get(n.id) }));
}

const GLYPH: Record<string, string> = { draw: '✏️', image: '🖼️', frame: '▭', note: '🗒️', doodle: '✳️', todo: '☑️', table: '▦', proscons: '⚖️', maplink: '🗺️', appcard: '🗂️' };
const labelOf = (n: MMNode, lang: 'de' | 'en') => {
  const t = (n.shape === 'appcard' ? n.snap?.title : n.text)?.replace(/\s+/g, ' ').trim();
  if (t) return t.length > 28 ? `${t.slice(0, 27)}…` : t;
  if (n.symbol) return n.symbol;
  const s = SHAPES.find((x) => x.id === n.shape);
  if (n.shape === 'draw') return lang === 'en' ? 'Drawing' : 'Zeichnung';
  if (n.shape === 'image') return lang === 'en' ? 'Photo' : 'Foto';
  if (n.shape === 'doodle') return lang === 'en' ? 'Doodle' : 'Zeichnung';
  return s ? (lang === 'en' ? s.en : s.de) : lang === 'en' ? 'Element' : 'Element';
};
const iconOf = (n: MMNode) => (n.shape === 'sticker' ? n.symbol ?? '★' : n.shape === 'appcard' ? n.snap?.emoji ?? '🗂️' : GLYPH[n.shape] ?? '■');

const ROW = 52;

export function LayersPanel({
  nodes,
  selIds,
  lang,
  onSelect,
  onReorder,
  onToggleLock,
  onClose,
}: {
  nodes: MMNode[];
  selIds: string[];
  lang: 'de' | 'en';
  onSelect: (id: string) => void;
  onReorder: (frontFirst: string[]) => void;
  onToggleLock: (id: string) => void;
  onClose: () => void;
}) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const [mode, setMode] = useState<'sel' | 'all'>(selIds.length ? 'sel' : 'all');
  const [everything, setEverything] = useState(false);
  const groups = useMemo(() => overlapGroups(nodes), [nodes]);
  const locked = nodes.filter((n) => n.lock);
  const all = useMemo(() => [...nodesByZ(ensureZ(nodes))].reverse(), [nodes]);
  const selGroup = selIds.length ? groups.find((g) => g.some((n) => selIds.includes(n.id))) : undefined;
  const shownGroups: MMNode[][] = everything ? [all] : mode === 'sel' && selIds.length ? (selGroup ? [selGroup] : []) : groups;

  // drag to re-order inside one list
  const [drag, setDrag] = useState<{ gi: number; id: string; dy: number } | null>(null);
  const start = useRef(0);
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag((d) => (d ? { ...d, dy: e.clientY - start.current } : d));
    const up = () => {
      setDrag((d) => {
        if (d) {
          const g = shownGroups[d.gi];
          const from = g.findIndex((n) => n.id === d.id);
          const to = Math.max(0, Math.min(g.length - 1, from + Math.round(d.dy / ROW)));
          if (to !== from) {
            const ids = g.map((n) => n.id);
            ids.splice(to, 0, ids.splice(from, 1)[0]);
            onReorder(ids);
          }
        }
        return null;
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  });
  const step = (g: MMNode[], i: number, d: number) => {
    const ids = g.map((n) => n.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    onReorder(ids);
  };

  return (
    <div data-testid="mm-layers">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[14px] font-medium text-[var(--color-text)] flex-1">{L('Ebenen', 'Layers')}</p>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Schließen', 'Close')} data-testid="mm-layers-close"><X size={16} /></button>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-2 leading-snug">
        {L('Normalerweise liegt alles auf einer Ebene. Erst wenn Dinge übereinander liegen, zählt die Reihenfolge: oben in der Liste = ganz vorn. Zieh an den Punkten oder nimm die Pfeile.', 'Normally everything is on one level. Order only matters when things lie on top of each other: top of the list = in front. Drag the handles or use the arrows.')}
      </p>
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {selIds.length > 0 && (
          <button type="button" onClick={() => { setMode('sel'); setEverything(false); }} className={`px-3 py-1 rounded-full text-[12.5px] border ${mode === 'sel' && !everything ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`} style={mode === 'sel' && !everything ? { background: 'var(--color-primary)' } : undefined} data-testid="mm-layers-sel">{L('Dieses Element', 'This element')}</button>
        )}
        <button type="button" onClick={() => { setMode('all'); setEverything(false); }} className={`px-3 py-1 rounded-full text-[12.5px] border ${(mode === 'all' || !selIds.length) && !everything ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`} style={(mode === 'all' || !selIds.length) && !everything ? { background: 'var(--color-primary)' } : undefined} data-testid="mm-layers-overlaps">{L('Alles, was übereinander liegt', 'Everything overlapping')}</button>
        <button type="button" onClick={() => setEverything((v) => !v)} className={`px-3 py-1 rounded-full text-[12.5px] border ${everything ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`} style={everything ? { background: 'var(--color-primary)' } : undefined} data-testid="mm-layers-everything">{L('Alle Elemente', 'All elements')}</button>
      </div>

      {shownGroups.length === 0 && (
        <p className="text-[13px] rounded-[var(--radius-md)] px-3 py-2.5 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]" data-testid="mm-layers-none">
          {mode === 'sel' && selIds.length ? L('Auf diesem Element liegt nichts und es liegt auf nichts – es ist auf einer Ebene mit allem anderen.', 'Nothing lies on this element and it lies on nothing – it is on one level with everything else.') : L('Nichts liegt übereinander – alles ist auf einer Ebene.', 'Nothing overlaps – everything is on one level.')}
        </p>
      )}
      <div className="flex flex-col gap-3">
        {shownGroups.map((g, gi) => (
          <ol key={gi} className="flex flex-col gap-1.5 relative" data-testid="mm-layer-group">
            {g.map((n, i) => {
              const dragging = drag?.gi === gi && drag.id === n.id;
              return (
                <li
                  key={n.id}
                  className={`flex items-center gap-2 rounded-[var(--radius-md)] px-2 border ${selIds.includes(n.id) ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}
                  style={{ height: ROW - 6, transform: dragging ? `translateY(${drag!.dy}px)` : undefined, zIndex: dragging ? 5 : undefined, boxShadow: dragging ? 'var(--shadow-md)' : undefined, touchAction: 'none' }}
                  data-testid={`mm-layer-row`}
                  data-layer-id={n.id}
                >
                  <span className="touch-none cursor-grab text-[var(--color-text-faint)] w-7 h-9 flex items-center justify-center" onPointerDown={(e) => { start.current = e.clientY; setDrag({ gi, id: n.id, dy: 0 }); e.preventDefault(); }} data-testid="mm-layer-grip" aria-label={L('Ziehen', 'Drag')}><GripVertical size={16} /></span>
                  <button type="button" onClick={() => onSelect(n.id)} className="flex-1 min-w-0 flex items-center gap-2 text-left" data-testid="mm-layer-pick">
                    <span className="w-7 h-7 rounded-md flex items-center justify-center text-[15px] shrink-0" style={{ background: `${n.color}33`, border: `1.5px solid ${n.color}` }} aria-hidden="true">{iconOf(n)}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] text-[var(--color-text)] truncate">{labelOf(n, lang)}</span>
                      <span className="block text-[10.5px] text-[var(--color-text-faint)]">{i === 0 ? L('ganz vorn', 'in front') : i === g.length - 1 ? L('ganz hinten', 'at the back') : `${L('Ebene', 'Level')} ${i + 1}`}</span>
                    </span>
                  </button>
                  {n.lock && <Lock size={13} className="text-[var(--color-text-faint)]" aria-label={L('fixiert', 'fixed')} />}
                  <button type="button" onClick={() => step(g, i, -1)} disabled={i === 0} className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-30" aria-label={L('Nach vorn', 'Forward')} data-testid={`mm-layer-up`}><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => step(g, i, 1)} disabled={i === g.length - 1} className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)] disabled:opacity-30" aria-label={L('Nach hinten', 'Backward')} data-testid={`mm-layer-down`}><ArrowDown size={14} /></button>
                </li>
              );
            })}
          </ol>
        ))}
      </div>

      {locked.length > 0 && (
        <div className="mt-3" data-testid="mm-layers-locked">
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{L('Fixiert (auf der Fläche nicht zu greifen)', 'Fixed (cannot be grabbed on the map)')}</p>
          <div className="flex flex-col gap-1.5">
            {locked.map((n) => (
              <div key={n.id} className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 border border-[var(--color-border)]">
                <button type="button" onClick={() => onSelect(n.id)} className="flex-1 min-w-0 flex items-center gap-2 text-left" data-testid="mm-locked-pick">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center text-[15px]" style={{ background: `${n.color}33`, border: `1.5px solid ${n.color}` }} aria-hidden="true">{iconOf(n)}</span>
                  <span className="text-[13px] text-[var(--color-text)] truncate">{labelOf(n, lang)}</span>
                </button>
                <button type="button" onClick={() => onToggleLock(n.id)} className="px-3 py-1.5 rounded-full text-[12.5px] border border-[var(--color-border-strong)] text-[var(--color-text)] inline-flex items-center gap-1" data-testid="mm-unlock"><Unlock size={13} /> {L('Lösen', 'Release')}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- slips */

/** slips (Zettel) that were given to this mind map: always at the very top, as a small 🗒️ button that opens them */
export function SlipsOnMap({ mapId, lang, top }: { mapId: string; lang: 'de' | 'en'; top: string }) {
  const [list, setList] = useState(() => slipsAt('mindmap', mapId));
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setList(slipsAt('mindmap', mapId));
    on();
    window.addEventListener(SLIPS_CHANGED, on);
    return () => window.removeEventListener(SLIPS_CHANGED, on);
  }, [mapId]);
  if (!list.length) return null;
  const openCount = list.filter((s) => !s.done).length;
  return (
    <div className="absolute left-3 z-30" style={{ top }} data-testid="mm-slips">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12.5px] shadow-[var(--shadow-sm)] border border-[#00000014]" style={{ background: '#fff3a8', color: '#4a4636' }} data-testid="mm-slips-btn">
        🗒️ {lang === 'en' ? `${openCount} slip${openCount === 1 ? '' : 's'} here` : `${openCount} Zettel hier`}
      </button>
      {open && (
        <div className="mt-2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] p-3 overflow-y-auto" style={{ width: 'min(330px, 88vw)', maxHeight: '48vh' }}>
          <SlipsHere kind="mindmap" id={mapId} />
        </div>
      )}
    </div>
  );
}
