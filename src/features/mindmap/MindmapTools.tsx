import { useState } from 'react';
import { Check, Eraser, Highlighter, Pencil, PenLine } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { DOODLES, DOODLE_GROUPS } from './doodles';
import { DoodleThumb, Slider } from './MindmapPanels';
import type { MMPen, MindMap } from './mindmapModel';
import type { MindmapExtraTexts } from './mindmapExtraTexts';

export interface PenState {
  kind: MMPen;
  color: string;
  sw: number;
  erase: boolean;
  whole: boolean;
}
export const PEN_COLORS = ['#26231f', '#e07a5f', '#e8a83d', '#7a9e4a', '#4a8f9e', '#3e6bb0', '#9a7bc4', '#d9778a', '#ffffff'];
const chip = (active: boolean) => `px-3 py-1.5 rounded-full text-[13px] border transition-colors ${active ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`;
const activeBg = { background: 'var(--color-primary)' };

/** pen, pencil, highlighter and eraser – replaces the normal bottom bar while drawing */
export function PenBar({ pen, setPen, onDone, onUndo, canUndo, X, lang }: { pen: PenState; setPen: (p: PenState) => void; onDone: () => void; onUndo: () => void; canUndo: boolean; X: MindmapExtraTexts; lang: 'de' | 'en' }) {
  const kinds: [MMPen, string, React.ReactNode][] = [
    ['pen', X.penPen, <PenLine key="p" size={18} />],
    ['pencil', X.penPencil, <Pencil key="c" size={18} />],
    ['marker', X.penMarker, <Highlighter key="m" size={18} />],
  ];
  const btn = (active: boolean) => `flex flex-col items-center gap-0.5 min-w-[62px] py-1.5 px-2 rounded-[var(--radius-md)] text-[11.5px] ${active ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`;
  return (
    <div className="px-3 pt-2 pb-1" data-testid="mm-pen-bar">
      <div className="flex items-center gap-1 overflow-x-auto">
        {kinds.map(([id, label, icon]) => (
          <button key={id} type="button" onClick={() => setPen({ ...pen, kind: id, erase: false })} className={btn(!pen.erase && pen.kind === id)} data-testid={`mm-penbar-${id}`}>
            {icon}
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setPen({ ...pen, erase: true })} className={btn(pen.erase)} data-testid="mm-penbar-erase">
          <Eraser size={18} />
          {X.eraser}
        </button>
        <span className="flex-1" />
        <button type="button" onClick={onUndo} disabled={!canUndo} className="px-3 py-2 text-[13px] text-[var(--color-text-muted)] disabled:opacity-40" data-testid="mm-penbar-undo">↶</button>
        <button type="button" onClick={onDone} className="h-9 px-4 rounded-full text-[13.5px] text-white flex items-center gap-1" style={activeBg} data-testid="mm-pen-done">
          <Check size={15} />
          {X.penDone}
        </button>
      </div>
      {pen.erase ? (
        <div className="flex gap-2 items-center mt-1.5">
          <button type="button" onClick={() => setPen({ ...pen, whole: false })} className={chip(!pen.whole)} style={!pen.whole ? activeBg : undefined} data-testid="mm-erase-part">{X.erasePart}</button>
          <button type="button" onClick={() => setPen({ ...pen, whole: true })} className={chip(pen.whole)} style={pen.whole ? activeBg : undefined} data-testid="mm-erase-whole">{X.eraseWhole}</button>
          <div className="flex-1 min-w-[90px]">
            <Slider label={X.penSize} value={pen.sw} min={1} max={24} step={1} onChange={(sw) => setPen({ ...pen, sw })} testId="mm-pen-size" />
          </div>
        </div>
      ) : (
        <div className="mt-1.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {PEN_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setPen({ ...pen, color: c })} className="w-7 h-7 rounded-full shrink-0" style={{ background: c, border: '1.5px solid rgba(0,0,0,0.18)', outline: pen.color === c ? '3px solid var(--color-primary)' : 'none', outlineOffset: 2 }} aria-label={c} data-testid={`mm-pen-color-${c.slice(1)}`} />
            ))}
            <label className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 cursor-pointer" style={{ background: PEN_COLORS.includes(pen.color) ? 'conic-gradient(#e8a83d, #6fbf73, #4a8f9e, #9a7bc4, #d9778a, #e8a83d)' : pen.color, outline: !PEN_COLORS.includes(pen.color) ? '3px solid var(--color-primary)' : 'none', outlineOffset: 2 }}>
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(pen.color) ? pen.color : '#26231f'} onChange={(e) => setPen({ ...pen, color: e.target.value })} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={lang === 'en' ? 'Own colour' : 'Eigene Farbe'} data-testid="mm-pen-color-custom" />
            </label>
          </div>
          <Slider label={X.penSize} value={pen.sw} min={1} max={24} step={1} onChange={(sw) => setPen({ ...pen, sw })} testId="mm-pen-size" />
        </div>
      )}
    </div>
  );
}

export function DoodlePickerModal({ open, onClose, onPick, X, lang }: { open: boolean; onClose: () => void; onPick: (id: string) => void; X: MindmapExtraTexts; lang: 'de' | 'en' }) {
  const [gi, setGi] = useState(0);
  const g = DOODLE_GROUPS[gi];
  return (
    <Modal open={open} onClose={onClose} title={X.doodleTitle}>
      <div className="flex flex-col gap-3" data-testid="mm-doodle-modal">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">{X.doodleHint}</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist">
          {DOODLE_GROUPS.map((x, i) => (
            <button key={x.id} type="button" role="tab" aria-selected={i === gi} onClick={() => setGi(i)} className={`${chip(i === gi)} shrink-0`} style={i === gi ? activeBg : undefined} data-testid={`mm-doodle-group-${x.id}`}>
              {lang === 'en' ? x.en : x.de}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {DOODLES.filter((d) => d.group === g.id).map((d) => (
            <button key={d.id} type="button" onClick={() => onPick(d.id)} className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] py-2 px-1 bg-[var(--color-surface-muted)] text-[var(--color-text)]" data-testid={`mm-doodle-${d.id}`}>
              <DoodleThumb id={d.id} size={52} />
              <span className="text-[10.5px] leading-tight text-center text-[var(--color-text-muted)]">{lang === 'en' ? d.en : d.de}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function MapPickModal({ open, onClose, maps, onPick, X, title }: { open: boolean; onClose: () => void; maps: MindMap[]; onPick: (m: MindMap) => void; X: MindmapExtraTexts; title: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-2" data-testid="mm-pickmap-modal">
        {maps.length === 0 && <p className="text-[13.5px] text-[var(--color-text-muted)]">{X.noOtherMaps}</p>}
        {maps.map((m) => (
          <button key={m.id} type="button" onClick={() => onPick(m)} className="text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] text-[var(--color-text)]" data-testid={`mm-pickmap-${m.id}`}>
            {m.title || '–'}
          </button>
        ))}
      </div>
    </Modal>
  );
}

export function NameModal({ open, onClose, title, label, initial, cta, onSubmit, testId, children }: { open: boolean; onClose: () => void; title: string; label: string; initial: string; cta: string; onSubmit: (name: string) => void; testId: string; children?: React.ReactNode }) {
  const [name, setName] = useState(initial);
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-3" data-testid={`${testId}-modal`}>
        <label className="block">
          <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{label}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-[15px] outline-none" data-testid={`${testId}-name`} />
        </label>
        {children}
        <button type="button" onClick={() => onSubmit(name.trim())} className="px-4 py-3 rounded-full text-[14px] text-white" style={activeBg} data-testid={`${testId}-create`}>
          {cta}
        </button>
      </div>
    </Modal>
  );
}
