import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { createId } from '../../services/storage/repository';
import { defaultGrid, type TodoItem } from './mindmapBlocks';
import type { MMNode } from './mindmapModel';

const inputCls = 'w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-[14px] outline-none';
const miniBtn = 'w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] border border-[var(--color-border)] shrink-0 disabled:opacity-30';

const move = <T,>(a: T[], i: number, d: number): T[] => {
  const j = i + d;
  if (j < 0 || j >= a.length) return a;
  const b = [...a];
  [b[i], b[j]] = [b[j], b[i]];
  return b;
};

/** edit what a to-do list, a table or a pro & contra card contains */
export function MindmapBlockEditor({ node, onPatch, onClose, lang }: { node: MMNode | undefined; onPatch: (patch: Partial<MMNode>) => void; onClose: () => void; lang: 'de' | 'en' }) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const open = !!node && (node.shape === 'todo' || node.shape === 'table' || node.shape === 'proscons');
  const title = !node ? '' : node.shape === 'todo' ? L('To-do-Liste', 'To-do list') : node.shape === 'table' ? L('Tabelle', 'Table') : L('Pro & Contra', 'Pros & cons');
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {node && open && (
        <div className="flex flex-col gap-3" data-testid="mm-block-editor">
          <label className="block">
            <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Überschrift (kann leer bleiben)', 'Heading (may stay empty)')}</span>
            <input value={node.text} onChange={(e) => onPatch({ text: e.target.value })} className={inputCls} data-testid="mm-block-title" />
          </label>
          {node.shape === 'todo' && <TodoEdit node={node} onPatch={onPatch} L={L} />}
          {node.shape === 'table' && <TableEdit node={node} onPatch={onPatch} L={L} />}
          {node.shape === 'proscons' && <ProsConsEdit node={node} onPatch={onPatch} L={L} />}
          <button type="button" onClick={onClose} className="self-end px-5 py-2.5 rounded-full text-[14px] text-white" style={{ background: 'var(--color-primary)' }} data-testid="mm-block-done">{L('Fertig', 'Done')}</button>
        </div>
      )}
    </Modal>
  );
}

function TodoEdit({ node, onPatch, L }: { node: MMNode; onPatch: (p: Partial<MMNode>) => void; L: (de: string, en: string) => string }) {
  const items = node.items ?? [];
  const set = (next: TodoItem[]) => onPatch({ items: next });
  return (
    <div className="flex flex-col gap-2" data-testid="mm-todo-edit">
      {items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-2">
          <input type="checkbox" checked={!!it.done} onChange={(e) => set(items.map((x) => (x.id === it.id ? { ...x, done: e.target.checked || undefined } : x)))} aria-label={L('Erledigt', 'Done')} data-testid={`mm-todo-done-${i}`} />
          <input
            value={it.t}
            autoFocus={i === items.length - 1 && !it.t}
            onChange={(e) => set(items.map((x) => (x.id === it.id ? { ...x, t: e.target.value } : x)))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                set([...items.slice(0, i + 1), { id: createId('ti'), t: '' }, ...items.slice(i + 1)]);
              }
            }}
            placeholder={L('Aufgabe …', 'Task …')}
            className={`${inputCls} ${it.done ? 'line-through text-[var(--color-text-faint)]' : ''}`}
            data-testid={`mm-todo-item-${i}`}
          />
          <button type="button" className={miniBtn} onClick={() => set(move(items, i, -1))} disabled={i === 0} aria-label={L('Nach oben', 'Up')}><ArrowUp size={14} /></button>
          <button type="button" className={miniBtn} onClick={() => set(move(items, i, 1))} disabled={i === items.length - 1} aria-label={L('Nach unten', 'Down')}><ArrowDown size={14} /></button>
          <button type="button" className={miniBtn} onClick={() => set(items.filter((x) => x.id !== it.id))} aria-label={L('Entfernen', 'Remove')} data-testid={`mm-todo-del-${i}`}><Trash2 size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={() => set([...items, { id: createId('ti'), t: '' }])} className="self-start inline-flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)]" data-testid="mm-todo-add"><Plus size={15} /> {L('Aufgabe hinzufügen', 'Add a task')}</button>
      <p className="text-[11.5px] text-[var(--color-text-faint)]">{L('Auf der Mindmap tippst du einfach auf den Kreis, um etwas abzuhaken.', 'On the map just tap the circle to tick something off.')}</p>
    </div>
  );
}

function TableEdit({ node, onPatch, L }: { node: MMNode; onPatch: (p: Partial<MMNode>) => void; L: (de: string, en: string) => string }) {
  const grid = node.grid && node.grid.length ? node.grid : defaultGrid();
  const cols = Math.max(1, ...grid.map((r) => r.length));
  const set = (g: string[][]) => onPatch({ grid: g });
  const cell = (r: number, c: number, v: string) => set(grid.map((row, i) => (i === r ? Array.from({ length: cols }, (_, k) => (k === c ? v : row[k] ?? '')) : row)));
  return (
    <div className="flex flex-col gap-2" data-testid="mm-table-edit">
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-1.5 min-w-max">
          {grid.map((row, r) => (
            <div key={r} className="flex gap-1.5 items-center">
              {Array.from({ length: cols }, (_, c) => (
                <input key={c} value={row[c] ?? ''} onChange={(e) => cell(r, c, e.target.value)} className={`${inputCls} !w-[110px] ${r === 0 && node.hdr !== false ? 'font-semibold' : ''}`} data-testid={`mm-cell-${r}-${c}`} aria-label={`${r + 1}/${c + 1}`} />
              ))}
              <button type="button" className={miniBtn} onClick={() => set(grid.length > 1 ? grid.filter((_, i) => i !== r) : grid)} disabled={grid.length <= 1} aria-label={L('Zeile entfernen', 'Remove row')} data-testid={`mm-row-del-${r}`}><Trash2 size={14} /></button>
            </div>
          ))}
          <div className="flex gap-1.5">
            {Array.from({ length: cols }, (_, c) => (
              <button key={c} type="button" className={`${miniBtn} !w-[110px] !rounded-[var(--radius-md)] text-[12px]`} onClick={() => set(cols > 1 ? grid.map((row) => Array.from({ length: cols }, (_, k) => row[k] ?? '').filter((_, k) => k !== c)) : grid)} disabled={cols <= 1} aria-label={L('Spalte entfernen', 'Remove column')} data-testid={`mm-col-del-${c}`}>
                <Trash2 size={13} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <button type="button" onClick={() => set([...grid, Array.from({ length: cols }, () => '')])} className="inline-flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)]" data-testid="mm-row-add"><Plus size={15} /> {L('Zeile', 'Row')}</button>
        <button type="button" onClick={() => cols < 8 && set(grid.map((row) => [...Array.from({ length: cols }, (_, k) => row[k] ?? ''), '']))} className="inline-flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)]" data-testid="mm-col-add"><Plus size={15} /> {L('Spalte', 'Column')}</button>
      </div>
    </div>
  );
}

function ProsConsEdit({ node, onPatch, L }: { node: MMNode; onPatch: (p: Partial<MMNode>) => void; L: (de: string, en: string) => string }) {
  const col = (key: 'pros' | 'cons', label: string, color: string) => {
    const list = node[key] ?? [];
    const set = (next: string[]) => onPatch({ [key]: next } as Partial<MMNode>);
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-semibold" style={{ color }}>{label}</p>
        {list.map((t, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input value={t} onChange={(e) => set(list.map((x, j) => (j === i ? e.target.value : x)))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); set([...list.slice(0, i + 1), '', ...list.slice(i + 1)]); } }} className={inputCls} data-testid={`mm-${key}-${i}`} aria-label={`${label} ${i + 1}`} />
            <button type="button" className={miniBtn} onClick={() => set(list.filter((_, j) => j !== i))} aria-label={L('Entfernen', 'Remove')}><Trash2 size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={() => set([...list, ''])} className="self-start inline-flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)]" data-testid={`mm-${key}-add`}><Plus size={15} /> {L('Hinzufügen', 'Add')}</button>
      </div>
    );
  };
  return (
    <div className="flex flex-col gap-4" data-testid="mm-proscons-edit">
      {col('pros', node.pl || 'Pro', node.pc ?? '#5f9e6e')}
      {col('cons', node.cl || 'Contra', node.cc ?? '#d9778a')}
    </div>
  );
}
