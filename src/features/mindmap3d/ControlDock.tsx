import { useEffect, useRef } from 'react';
import { ArrowDownToLine, ArrowUpToLine, Box, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Crosshair, Lock, Minus, Move3d, Plus, RotateCw, Unlock, X, Gamepad2 } from 'lucide-react';
import type { Locks } from './spaceView';

export type DockMode = 'turn' | 'move' | 'thing';
export type Dir = 'l' | 'r' | 'u' | 'd';

/** Gedrückt halten wiederholt – nach kurzem Zögern, damit ein Tippen genau einen Schritt macht. */
function useHold(fn: () => void, disabled?: boolean, every = 170) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const t1 = useRef(0);
  const t2 = useRef(0);
  const stop = () => { window.clearTimeout(t1.current); window.clearInterval(t2.current); };
  useEffect(() => stop, []);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      fnRef.current();
      stop();
      t1.current = window.setTimeout(() => { t2.current = window.setInterval(() => fnRef.current(), every); }, 380);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

const btn = 'w-[34px] h-[34px] rounded-[11px] flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] active:scale-95 transition-transform disabled:opacity-35 touch-none select-none';

function Pad({ id, label, disabled, onGo, children, className = '' }: { id: string; label: string; disabled?: boolean; onGo: () => void; children: React.ReactNode; className?: string }) {
  const h = useHold(onGo, disabled);
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} className={`${btn} ${className}`} data-testid={id} {...h}>
      {children}
    </button>
  );
}

export function ControlDock(p: {
  L: (de: string, en: string) => string;
  open: boolean;
  setOpen(v: boolean): void;
  mode: DockMode;
  setMode(m: DockMode): void;
  locks: Locks;
  onLockAll(): void;
  thingOk: boolean;
  heightOk: boolean;
  onArrow(d: Dir): void;
  onSide(d: 'up' | 'down'): void;
  onCenter(): void;
}) {
  const { L, mode, locks } = p;
  const allLocked = locks.rotate && locks.zoom && locks.pan;
  const anyLocked = locks.rotate || locks.zoom || locks.pan;
  if (!p.open) {
    return (
      <button type="button" onClick={() => p.setOpen(true)} className="w-11 h-11 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Steuerung öffnen', 'Open controls')} data-testid="mm3-dock-open">
        {anyLocked ? <Lock size={17} className="text-[var(--color-primary)]" /> : <Gamepad2 size={19} />}
      </button>
    );
  }
  // Was die Pfeile gerade tun – immer in Worten dabei
  const legend = mode === 'turn' ? L('Pfeile drehen die Ansicht', 'Arrows turn the view')
    : mode === 'move' ? L('Pfeile verschieben den Blick', 'Arrows slide the view')
      : p.thingOk ? L('Pfeile verschieben das Ding', 'Arrows move the thing') : L('Erst ein Ding antippen', 'Tap a thing first');
  const rotLocked = mode === 'turn' && locks.rotate;
  const panLocked = mode === 'move' && locks.pan;
  const arrowOff = (mode === 'thing' && !p.thingOk) || rotLocked || panLocked;
  const sideOff = mode === 'thing' ? !p.thingOk || !p.heightOk : mode === 'move' ? locks.pan : locks.zoom;
  const modes: { id: DockMode; icon: typeof Box; de: string; en: string }[] = [
    { id: 'turn', icon: RotateCw, de: 'Drehen', en: 'Turn' },
    { id: 'move', icon: Move3d, de: 'Schieben', en: 'Slide' },
    { id: 'thing', icon: Box, de: 'Ding', en: 'Thing' },
  ];
  return (
    <div className="rounded-[18px] bg-[color-mix(in_srgb,var(--color-surface)_84%,transparent)] backdrop-blur-sm shadow-[var(--shadow-md,0_6px_20px_rgba(0,0,0,0.18))] border border-[var(--color-border)] p-2 w-[168px]" data-testid="mm3-dock" role="group" aria-label={L('Steuerung', 'Controls')}>
      <div className="flex items-center gap-1 mb-1.5">
        <div className="flex flex-1 rounded-full bg-[var(--color-surface-muted,#eee)] p-0.5">
          {modes.map((m) => (
            <button key={m.id} type="button" onClick={() => p.setMode(m.id)} className={`flex-1 h-7 rounded-full text-[10.5px] px-0.5 flex items-center justify-center ${mode === m.id ? 'bg-[var(--color-primary)] text-[var(--color-surface)]' : 'text-[var(--color-text-muted)]'}`} data-testid={`mm3-mode-${m.id}`} aria-pressed={mode === m.id}>
              {L(m.de, m.en)}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => p.setOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-text-faint)]" aria-label={L('Steuerung einklappen', 'Collapse controls')} data-testid="mm3-dock-close"><X size={14} /></button>
      </div>
      <p className="text-[11px] leading-tight text-[var(--color-text-muted)] mb-1.5 min-h-[1.6em]" data-testid="mm3-dock-legend">{legend}</p>
      <div className="grid grid-cols-[repeat(4,34px)] gap-1 justify-between">
        <span />
        <Pad id="mm3-pad-up" label={L('hoch', 'up')} disabled={arrowOff} onGo={() => p.onArrow('u')}><ChevronUp size={20} /></Pad>
        <span />
        <Pad id={mode === 'turn' ? 'mm3-pad-zoomin' : 'mm3-pad-hi'} label={mode === 'turn' ? L('näher heran', 'closer') : mode === 'move' ? L('Blick höher', 'view higher') : L('Ding höher', 'thing higher')} disabled={sideOff} onGo={() => p.onSide('up')}>
          {mode === 'turn' ? <Plus size={19} /> : <ArrowUpToLine size={18} />}
        </Pad>

        <Pad id="mm3-pad-left" label={L('links', 'left')} disabled={arrowOff} onGo={() => p.onArrow('l')}><ChevronLeft size={20} /></Pad>
        <button type="button" className={btn} onClick={p.onCenter} aria-label={mode === 'thing' ? L('Hierhin schauen', 'Look here') : L('Alles im Blick', 'Show everything')} title={mode === 'thing' ? L('Hierhin schauen', 'Look here') : L('Alles im Blick', 'Show everything')} data-testid="mm3-pad-center"><Crosshair size={17} /></button>
        <Pad id="mm3-pad-right" label={L('rechts', 'right')} disabled={arrowOff} onGo={() => p.onArrow('r')}><ChevronRight size={20} /></Pad>
        <button type="button" className={`${btn} ${anyLocked ? '!bg-[var(--color-primary)] !text-[var(--color-surface)]' : ''}`} onClick={p.onLockAll} aria-pressed={allLocked} aria-label={anyLocked ? L('Ansicht wieder freigeben', 'Unlock the view') : L('Ansicht einrasten (sperren)', 'Lock the view')} title={anyLocked ? L('Ansicht wieder freigeben', 'Unlock the view') : L('Ansicht einrasten – nichts verrutscht mehr', 'Lock the view – nothing slips any more')} data-testid="mm3-lock-all">
          {anyLocked ? <Lock size={17} /> : <Unlock size={17} />}
        </button>

        <span />
        <Pad id="mm3-pad-down" label={L('runter', 'down')} disabled={arrowOff} onGo={() => p.onArrow('d')}><ChevronDown size={20} /></Pad>
        <span />
        <Pad id={mode === 'turn' ? 'mm3-pad-zoomout' : 'mm3-pad-lo'} label={mode === 'turn' ? L('weiter weg', 'farther') : mode === 'move' ? L('Blick tiefer', 'view lower') : L('Ding tiefer', 'thing lower')} disabled={sideOff} onGo={() => p.onSide('down')}>
          {mode === 'turn' ? <Minus size={19} /> : <ArrowDownToLine size={18} />}
        </Pad>
      </div>
    </div>
  );
}
