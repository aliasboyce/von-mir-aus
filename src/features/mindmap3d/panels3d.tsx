import { useRef, type ReactNode } from 'react';
import {
  Camera, Copy, Eye, EyeOff, FileDown, ImagePlus, Link2, Minus, Plus, Trash2, Save, RotateCcw, Share2,
} from 'lucide-react';
import {
  BGS3D, FONTS3D, LAYER_COLORS, LAYER_LOOKS, NODE_COLORS3D, SHAPES3D, bgInfo, isFlat, layerLook,
  type BgId, type Edge3D, type Layer3D, type Node3D, type Shape3D, type Space3D, type Shot3D, type Version3D,
} from './space3dModel';
import type { MindMap } from '../mindmap/mindmapModel';
import type { Locks } from './spaceView';

export type Sel = { kind: 'node' | 'edge'; id: string } | null;
export type SubTab = 'look' | 'text' | 'place' | 'more';

export const chip = (on: boolean) => `px-3 py-1.5 rounded-full text-[13px] border shrink-0 ${on ? 'bg-[var(--color-primary-soft)] border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'}`;
export const field = 'w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] text-[var(--color-text)] outline-none';
const danger = 'text-[var(--color-danger,#b4472f)]';
const r1 = (v: number) => Math.round(v * 100) / 100;

export interface PanelCtx {
  L: (de: string, en: string) => string;
  lang: 'de' | 'en';
  space: Space3D;
  node?: Node3D;
  edge?: Edge3D;
  sel: Sel;
  sub: SubTab;
  setSub(s: SubTab): void;
  selLayer: string | null;
  setSelLayer(id: string | null): void;
  onlyLayer: boolean;
  setOnlyLayer(v: boolean): void;
  connectFrom: string | null;
  setConnectFrom(id: string | null): void;
  locks: Locks;
  setLocks(l: Locks): void;
  freeOrbit: boolean;
  setFreeOrbit(v: boolean): void;
  setNode(id: string, patch: Partial<Node3D>, key?: string): void;
  setEdge(id: string, patch: Partial<Edge3D>, key?: string): void;
  setLayer(id: string, patch: Partial<Layer3D>, key?: string): void;
  mutate(fn: (s: Space3D) => Space3D, undoKey?: string | false): void;
  setSel(s: Sel): void;
  setTab(t: 'thing' | 'add' | 'layers' | 'list' | 'view' | 'saves'): void;
  addThing(shape?: Shape3D, extra?: Partial<Node3D>): void;
  addChild(): void;
  addPhoto(file: File): void;
  setNodePhoto(id: string, file: File): void;
  removeNode(id: string): void;
  duplicateNode(n: Node3D): void;
  nudge(n: Node3D, dx: number, dy: number, dz: number): void;
  addLayer(): void;
  moveLayer(l: Layer3D, y: number): void;
  removeLayer(l: Layer3D): void;
  focusNode(n: Node3D): void;
  goView(p: { theta?: number; phi?: number }): void;
  fitAll(): void;
  otherMaps: MindMap[];
  openMap(id: string): void;
  // Ansicht & Sichern
  setBg(id: BgId): void;
  pickBgImage(file: File): void;
  takeShot(): void;
  openShot(s: Shot3D): void;
  renameShot(id: string, name: string): void;
  deleteShot(id: string): void;
  downloadShot(s: Shot3D): void;
  downloadPng(): void;
  sharePdf(): void;
  pdfBusy: boolean;
  // Stände
  versions: Version3D[];
  holdState(name: string): void;
  previewVersion(v: Version3D): void;
  restoreVersion(v: Version3D): void;
  copyVersion(v: Version3D): void;
  removeVersion(v: Version3D): void;
  previewId: string | null;
  stateName: string;
  setStateName(s: string): void;
}

function Slider({ id, label, value, min, max, step, onChange, onReset, fmt }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange(v: number): void; onReset?: () => void; fmt?: (v: number) => string }) {
  return (
    <label className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
      <span className="w-[74px] shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 min-w-0 accent-[var(--color-primary)]" data-testid={id} aria-label={label} />
      <span className="w-10 text-right tabular-nums">{fmt ? fmt(value) : value}</span>
      {onReset && <button type="button" onClick={onReset} className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-text-faint)]" aria-label="↺"><RotateCcw size={12} /></button>}
    </label>
  );
}

function ColorRow({ colors, value, onPick, testPrefix, custom, auto }: { colors: string[]; value?: string; onPick(c: string | undefined): void; testPrefix?: string; custom?: boolean; auto?: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {auto && (
        <button type="button" onClick={() => onPick(undefined)} className={`h-8 px-2.5 rounded-full text-[12px] border-2 ${!value ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>{auto}</button>
      )}
      {colors.map((c) => (
        <button key={c} type="button" onClick={() => onPick(c)} className="w-8 h-8 rounded-full border-2" style={{ background: c, borderColor: value === c ? 'var(--color-primary)' : 'var(--color-border)' }} aria-label={c} data-testid={testPrefix ? `${testPrefix}${c.slice(1)}` : undefined} />
      ))}
      {custom && (
        <label className="w-8 h-8 rounded-full border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-[14px] cursor-pointer relative overflow-hidden" aria-label="+">
          +
          <input type="color" value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#4a8f9e'} onChange={(e) => onPick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      )}
    </div>
  );
}

function FilePick({ label, icon, onFile, testId, capture }: { label: string; icon?: ReactNode; onFile(f: File): void; testId?: string; capture?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={chip(false)} onClick={() => ref.current?.click()} data-testid={testId}>{icon}{label}</button>
      <input ref={ref} type="file" accept="image/*" {...(capture ? { capture: 'environment' as const } : {})} className="hidden" data-testid={testId ? `${testId}-input` : undefined} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); }} />
    </>
  );
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <p className="text-[12px] text-[var(--color-text-muted)] mb-1.5">{title}</p>
    {children}
  </div>
);

/* ---------------------------------------------------------------- Neu */
export function AddPanel({ c }: { c: PanelCtx }) {
  const { L } = c;
  const groups: { title: string; ids: Shape3D[] }[] = [
    { title: L('Formen', 'Shapes'), ids: SHAPES3D.filter((s) => s.group === 'solid').map((s) => s.id) },
    { title: L('Sprechblasen', 'Speech bubbles'), ids: ['bubble', 'thought', 'shout'] },
    { title: L('Text & Zettel', 'Text & notes'), ids: ['text', 'note'] },
  ];
  return (
    <div className="space-y-3" data-testid="mm3-add-panel">
      <p className="text-[13px] text-[var(--color-text-muted)]">{L('Tippe etwas an – es erscheint in der Mitte deiner Ansicht (auf der gewählten Ebene, wenn eine aktiv ist).', 'Tap something – it appears in the middle of your view (on the active layer, if there is one).')}</p>
      {groups.map((g) => (
        <Section key={g.title} title={g.title}>
          <div className="grid grid-cols-4 gap-1.5">
            {g.ids.map((id) => {
              const s = SHAPES3D.find((x) => x.id === id)!;
              return (
                <button key={id} type="button" onClick={() => c.addThing(id)} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 px-1 flex flex-col items-center gap-0.5 active:scale-95 transition-transform" data-testid={`mm3-add-${id}`}>
                  <span className="text-[22px] leading-none">{s.icon}</span>
                  <span className="text-[10.5px] leading-tight text-[var(--color-text-muted)] text-center break-words w-full">{L(s.de, s.en)}</span>
                </button>
              );
            })}
          </div>
        </Section>
      ))}
      <Section title={L('Fotos', 'Photos')}>
        <div className="flex flex-wrap gap-2">
          <FilePick label={L('Foto aus Galerie / Datei', 'Photo from gallery / file')} icon={<ImagePlus size={13} className="inline -mt-0.5 mr-1" />} onFile={c.addPhoto} testId="mm3-add-photo" />
          <FilePick label={L('Kamera', 'Camera')} icon={<Camera size={13} className="inline -mt-0.5 mr-1" />} onFile={c.addPhoto} testId="mm3-add-camera" capture />
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------- Ding */
export function ThingPanel({ c }: { c: PanelCtx }) {
  const { L, node, edge, space } = c;
  if (edge) {
    const a = space.nodes.find((n) => n.id === edge.from);
    const b = space.nodes.find((n) => n.id === edge.to);
    return (
      <div className="space-y-3" data-testid="mm3-edge-panel">
        <p className="text-[13px] text-[var(--color-text-muted)]">{L('Verbindung', 'Link')}: {a?.text} → {b?.text}</p>
        <input className={field} value={edge.label ?? ''} onChange={(e) => c.setEdge(edge.id, { label: e.target.value }, `el-${edge.id}`)} placeholder={L('Beschriftung (z. B. „führt zu“)', 'Label (e.g. “leads to”)')} data-testid="mm3-edge-label" />
        <ColorRow colors={['#c9c4b8', ...NODE_COLORS3D.slice(0, 7)]} value={edge.color} onPick={(col) => col && c.setEdge(edge.id, { color: col })} custom />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(!!edge.dashed)} onClick={() => c.setEdge(edge.id, { dashed: !edge.dashed })}>{L('gestrichelt', 'dashed')}</button>
          <button type="button" className={chip(!!edge.arrow)} onClick={() => c.setEdge(edge.id, { arrow: !edge.arrow })}>{L('mit Pfeil', 'arrow')}</button>
          <button type="button" className={chip(false)} onClick={() => c.setEdge(edge.id, { from: edge.to, to: edge.from })}>{L('Richtung drehen', 'flip direction')}</button>
          <button type="button" className={`${chip(false)} ${danger}`} onClick={() => { c.mutate((s) => ({ ...s, edges: s.edges.filter((e) => e.id !== edge.id) })); c.setSel(null); }} data-testid="mm3-edge-delete"><Trash2 size={13} className="inline -mt-0.5 mr-1" />{L('Verbindung löschen', 'Delete link')}</button>
        </div>
      </div>
    );
  }
  if (!node) {
    return (
      <div className="space-y-3 text-[14px] text-[var(--color-text-muted)]" data-testid="mm3-empty-panel">
        <ul className="space-y-1.5 text-[13.5px]">
          <li>👆 {L('Ding antippen = bearbeiten. Festhalten und ziehen = verschieben.', 'Tap a thing to edit it. Hold and drag to move it.')}</li>
          <li>🎮 {L('Unten rechts steuerst du mit Pfeilen: „Drehen“ dreht die Ansicht, „Schieben“ verschiebt den Blick, „Ding“ verschiebt das gewählte Ding.', 'Bottom right you steer with arrows: “Turn” turns the view, “Slide” moves your look, “Thing” moves the chosen thing.')}</li>
          <li>🔒 {L('Das Schloss rastet die Ansicht ein – dann verrutscht beim Ziehen nichts mehr.', 'The lock freezes the view – then nothing slips while you drag.')}</li>
        </ul>
        <button type="button" className={chip(true)} onClick={() => c.setTab('add')} data-testid="mm3-empty-add"><Plus size={13} className="inline -mt-0.5 mr-1" />{L('Etwas hinzufügen', 'Add something')}</button>
      </div>
    );
  }
  const n = node;
  const flat = isFlat(n.shape);
  const solid = !flat;
  const subs: { id: SubTab; de: string; en: string }[] = [
    { id: 'look', de: 'Form & Farbe', en: 'Shape & colour' },
    { id: 'text', de: 'Schrift', en: 'Text' },
    { id: 'place', de: 'Lage', en: 'Place' },
    { id: 'more', de: 'Mehr', en: 'More' },
  ];
  return (
    <div className="space-y-3" data-testid="mm3-node-panel">
      <input className={field} value={n.text} onChange={(e) => c.setNode(n.id, { text: e.target.value }, `nt-${n.id}`)} placeholder={n.shape === 'photo' ? L('Bildunterschrift (optional)', 'Caption (optional)') : L('Name des Dings', 'Name of the thing')} data-testid="mm3-node-text" />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(c.connectFrom === n.id)} onClick={() => c.setConnectFrom(c.connectFrom === n.id ? null : n.id)} data-testid="mm3-connect"><Link2 size={13} className="inline -mt-0.5 mr-1" />{c.connectFrom === n.id ? L('Tippe das Ziel an …', 'Tap the target …') : L('Verbinden mit …', 'Link to …')}</button>
        <button type="button" className={chip(false)} onClick={c.addChild} data-testid="mm3-child"><Plus size={13} className="inline -mt-0.5 mr-1" />{L('Unterpunkt', 'Sub-item')}</button>
        <button type="button" className={chip(false)} onClick={() => c.duplicateNode(n)} data-testid="mm3-copy"><Copy size={13} className="inline -mt-0.5 mr-1" />{L('Kopie', 'Copy')}</button>
        <button type="button" className={`${chip(false)} ${danger}`} onClick={() => c.removeNode(n.id)} data-testid="mm3-node-delete"><Trash2 size={13} className="inline -mt-0.5 mr-1" />{L('Löschen', 'Delete')}</button>
      </div>
      <div className="flex gap-1 rounded-full bg-[var(--color-surface-muted,#eee)] p-0.5" role="tablist">
        {subs.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={c.sub === s.id} onClick={() => c.setSub(s.id)} className={`flex-1 min-w-0 h-8 rounded-full text-[12px] truncate px-1 ${c.sub === s.id ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]' : 'text-[var(--color-text-muted)]'}`} data-testid={`mm3-sub-${s.id}`}>{L(s.de, s.en)}</button>
        ))}
      </div>

      {c.sub === 'look' && (
        <div className="space-y-3">
          <Section title={L('Form', 'Shape')}>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {SHAPES3D.map((s) => (
                <button key={s.id} type="button" className={chip(n.shape === s.id)} onClick={() => c.setNode(n.id, { shape: s.id })} data-testid={`mm3-shape-${s.id}`}>{s.icon} {L(s.de, s.en)}</button>
              ))}
            </div>
          </Section>
          {n.shape === 'photo' && (
            <div className="flex flex-wrap gap-2 items-center">
              <FilePick label={n.image ? L('Foto ändern', 'Change photo') : L('Foto wählen', 'Choose photo')} icon={<ImagePlus size={13} className="inline -mt-0.5 mr-1" />} onFile={(f) => c.setNodePhoto(n.id, f)} testId="mm3-node-photo" />
              <FilePick label={L('Kamera', 'Camera')} icon={<Camera size={13} className="inline -mt-0.5 mr-1" />} onFile={(f) => c.setNodePhoto(n.id, f)} testId="mm3-node-camera" capture />
            </div>
          )}
          {(n.shape === 'bubble' || n.shape === 'thought') && (
            <Section title={L('Spitze zeigt nach …', 'Tail points …')}>
              <div className="flex gap-2">
                {([['bl', '↙', 'unten links', 'down left'], ['br', '↘', 'unten rechts', 'down right'], ['tl', '↖', 'oben links', 'up left'], ['tr', '↗', 'oben rechts', 'up right']] as const).map(([id, ic, de, en]) => (
                  <button key={id} type="button" className={chip((n.tail ?? 'bl') === id)} onClick={() => c.setNode(n.id, { tail: id })} aria-label={L(de, en)}>{ic}</button>
                ))}
              </div>
            </Section>
          )}
          {n.shape !== 'photo' && (
            <Section title={n.shape === 'text' ? L('Schriftfarbe', 'Text colour') : L('Farbe', 'Colour')}>
              <ColorRow colors={NODE_COLORS3D} value={n.color} onPick={(col) => col && c.setNode(n.id, { color: col })} testPrefix="mm3-color-" custom />
            </Section>
          )}
          <Section title={L('Größe', 'Size')}>
            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 4].map((k) => (
                <button key={k} type="button" className={chip(n.size === k)} onClick={() => c.setNode(n.id, { size: k })} data-testid={`mm3-size-${k}`}>{['S', 'M', 'L', 'XL'][k - 1]}</button>
              ))}
            </div>
            <div className="mt-1.5"><Slider id="mm3-size-slider" label={L('stufenlos', 'free')} value={n.size} min={0.5} max={6} step={0.1} onChange={(v) => c.setNode(n.id, { size: r1(v) }, `sz-${n.id}`)} fmt={(v) => v.toFixed(1)} /></div>
          </Section>
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" className={chip(solid ? !!n.outline : n.outline !== false)} onClick={() => c.setNode(n.id, { outline: solid ? !n.outline : n.outline === false })} data-testid="mm3-outline">{L('Umrandung', 'Outline')}</button>
            {(solid ? n.outline : n.outline !== false) && (
              <ColorRow colors={['#2b2a28', '#f4f1ea', '#e07a5f', '#e8a83d', '#3e6bb0']} value={n.outlineColor} onPick={(col) => c.setNode(n.id, { outlineColor: col })} auto={L('auto', 'auto')} />
            )}
          </div>
          {n.shape !== 'photo' && <Slider id="mm3-opacity" label={L('Durchsichtig', 'Opacity')} value={n.opacity ?? 1} min={0.15} max={1} step={0.05} onChange={(v) => c.setNode(n.id, { opacity: v >= 1 ? undefined : r1(v) }, `op-${n.id}`)} fmt={(v) => `${Math.round(v * 100)}%`} />}
        </div>
      )}

      {c.sub === 'text' && (
        <div className="space-y-3">
          <Section title={L('Schriftart', 'Font')}>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {FONTS3D.map((f) => (
                <button key={f.id} type="button" className={chip((n.font ?? 'sans') === f.id)} style={{ fontFamily: f.css }} onClick={() => c.setNode(n.id, { font: f.id })} data-testid={`mm3-font-${f.id}`}>{L(f.de, f.en)}</button>
              ))}
            </div>
          </Section>
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" className={chip(!!n.bold)} onClick={() => c.setNode(n.id, { bold: !n.bold })} data-testid="mm3-bold"><b>B</b></button>
            <button type="button" className={chip(!!n.italic)} onClick={() => c.setNode(n.id, { italic: !n.italic })} data-testid="mm3-italic"><i>I</i></button>
            <input className={`${field} !w-16 text-center`} value={n.symbol ?? ''} maxLength={4} onChange={(e) => c.setNode(n.id, { symbol: e.target.value.trim() || undefined }, `ns-${n.id}`)} placeholder="🙂" aria-label={L('Symbol', 'Symbol')} />
          </div>
          <Slider id="mm3-fs" label={L('Schriftgröße', 'Text size')} value={n.fs ?? 1} min={0.6} max={2.4} step={0.1} onChange={(v) => c.setNode(n.id, { fs: r1(v) }, `fs-${n.id}`)} onReset={() => c.setNode(n.id, { fs: undefined })} fmt={(v) => `${Math.round(v * 100)}%`} />
          {n.shape !== 'text' && (
            <Section title={L('Schriftfarbe', 'Text colour')}>
              <ColorRow colors={['#2b2a28', '#fbf8f1', '#e07a5f', '#3e6bb0', '#4a8f9e']} value={n.textColor} onPick={(col) => c.setNode(n.id, { textColor: col })} auto={L('auto', 'auto')} custom />
            </Section>
          )}
        </div>
      )}

      {c.sub === 'place' && (
        <div className="space-y-3">
          <Slider id="mm3-rot" label={L('Drehen', 'Rotate')} value={n.rot ?? 0} min={0} max={359} step={5} onChange={(v) => c.setNode(n.id, { rot: v || undefined }, `rt-${n.id}`)} onReset={() => c.setNode(n.id, { rot: undefined })} fmt={(v) => `${v}°`} />
          {solid && <Slider id="mm3-tilt" label={L('Kippen', 'Tilt')} value={n.tilt ?? 0} min={0} max={359} step={5} onChange={(v) => c.setNode(n.id, { tilt: v || undefined }, `tl-${n.id}`)} onReset={() => c.setNode(n.id, { tilt: undefined })} fmt={(v) => `${v}°`} />}
          <label className="block text-[12px] text-[var(--color-text-muted)]">{L('Ebene', 'Layer')}
            <select className={`${field} mt-1`} value={n.layerId ?? ''} onChange={(e) => {
              const l = space.layers.find((x) => x.id === e.target.value);
              c.setNode(n.id, l ? { layerId: l.id, y: l.y } : { layerId: undefined });
            }} data-testid="mm3-node-layer">
              <option value="">{L('keine', 'none')}</option>
              {space.layers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <div>
            <p className="text-[12px] text-[var(--color-text-muted)] mb-1">{L('Fein verschieben', 'Nudge')} · x {n.x} · {L('Höhe', 'height')} {n.y} · z {n.z}</p>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={chip(false)} onClick={() => c.nudge(n, -1, 0, 0)} data-testid="mm3-nudge-left">← {L('links', 'left')}</button>
              <button type="button" className={chip(false)} onClick={() => c.nudge(n, 1, 0, 0)} data-testid="mm3-nudge-right">{L('rechts', 'right')} →</button>
              <button type="button" className={chip(false)} onClick={() => c.nudge(n, 0, 0, -1)}>↑ {L('hinten', 'back')}</button>
              <button type="button" className={chip(false)} onClick={() => c.nudge(n, 0, 0, 1)}>↓ {L('vorn', 'front')}</button>
              <button type="button" className={chip(false)} onClick={() => c.nudge(n, 0, 1, 0)} data-testid="mm3-nudge-up">⬆ {L('höher', 'higher')}</button>
              <button type="button" className={chip(false)} onClick={() => c.nudge(n, 0, -1, 0)} data-testid="mm3-nudge-down">⬇ {L('tiefer', 'lower')}</button>
            </div>
          </div>
        </div>
      )}

      {c.sub === 'more' && (
        <div className="space-y-3">
          <label className="block text-[12px] text-[var(--color-text-muted)]">{L('Mindmap dahinter', 'Mind map behind it')}
            <select className={`${field} mt-1`} value={n.link ?? ''} onChange={(e) => c.setNode(n.id, { link: e.target.value || undefined })} data-testid="mm3-node-link">
              <option value="">{L('keine', 'none')}</option>
              {c.otherMaps.map((m) => <option key={m.id} value={m.id}>{m.kind === '3d' ? '🧊 ' : ''}{m.title || L('Ohne Titel', 'Untitled')}</option>)}
            </select>
          </label>
          {n.link && c.otherMaps.some((m) => m.id === n.link) && (
            <button type="button" className={chip(false)} onClick={() => c.openMap(n.link!)} data-testid="mm3-open-link">{L('Mindmap öffnen', 'Open mind map')} ↗</button>
          )}
          <textarea className={`${field} min-h-[56px]`} value={n.note ?? ''} onChange={(e) => c.setNode(n.id, { note: e.target.value || undefined }, `nn-${n.id}`)} placeholder={L('Notiz zu diesem Ding …', 'Note on this thing …')} data-testid="mm3-node-note" />
          <button type="button" className={chip(false)} onClick={() => c.focusNode(n)}>{L('Hierhin schauen', 'Look here')}</button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Ebenen */
export function LayersPanel({ c }: { c: PanelCtx }) {
  const { L, space } = c;
  const active = c.selLayer ? space.layers.find((l) => l.id === c.selLayer) : undefined;
  return (
    <div className="space-y-3" data-testid="mm3-layers-panel">
      <p className="text-[13px] text-[var(--color-text-muted)]">{L('Ebenen sind sichtbare, beschriftete Scheiben im Raum. Verschiebst du eine Ebene, gehen ihre Dinge mit.', 'Layers are visible, labelled slices of the space. When you move a layer, its things move with it.')}</p>
      {active && (
        <button type="button" onClick={() => c.setOnlyLayer(!c.onlyLayer)} className={`w-full text-left rounded-[var(--radius-md)] border px-3 py-2 text-[13px] ${c.onlyLayer ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`} data-testid="mm3-only-layer" aria-pressed={c.onlyLayer}>
          {c.onlyLayer ? '✔ ' : ''}{L(`Nur auf „${active.name}“ bauen`, `Build only on “${active.name}”`)}
          <span className="block text-[11.5px] opacity-80">{L('Alles andere verblasst, neue Dinge landen hier, Ziehen bleibt auf der Ebene.', 'Everything else fades, new things land here, dragging stays on the layer.')}</span>
        </button>
      )}
      {[...space.layers].sort((a, b) => b.y - a.y).map((l) => {
        const on = c.selLayer === l.id;
        const look = layerLook(l);
        return (
          <div key={l.id} className={`rounded-[var(--radius-md)] border p-2.5 space-y-2 ${on ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`} data-testid={`mm3-layer-${l.id}`}>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => c.setLayer(l.id, { visible: !l.visible })} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)]" aria-label={l.visible ? L('ausblenden', 'hide') : L('einblenden', 'show')} data-testid="mm3-layer-vis">{l.visible ? <Eye size={17} /> : <EyeOff size={17} />}</button>
              <input className={field} value={l.name} onChange={(e) => c.setLayer(l.id, { name: e.target.value }, `ln-${l.id}`)} aria-label={L('Name der Ebene', 'Layer name')} data-testid="mm3-layer-name" />
              <button type="button" className={chip(on)} onClick={() => c.setSelLayer(on ? null : l.id)} data-testid="mm3-layer-pick">{on ? L('aktiv', 'active') : L('wählen', 'pick')}</button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-[var(--color-text-muted)]">{L('Höhe', 'Height')} {l.y}</span>
              <button type="button" className={chip(false)} onClick={() => c.moveLayer(l, r1(l.y - 1))} data-testid="mm3-layer-down" aria-label={L('tiefer', 'lower')}><Minus size={13} /></button>
              <button type="button" className={chip(false)} onClick={() => c.moveLayer(l, r1(l.y + 1))} data-testid="mm3-layer-up" aria-label={L('höher', 'higher')}><Plus size={13} /></button>
              <button type="button" className={`${chip(false)} ${danger}`} onClick={() => c.removeLayer(l)} aria-label={L('Ebene entfernen', 'Remove layer')} data-testid="mm3-layer-delete"><Trash2 size={13} /></button>
            </div>
            {on && (
              <div className="space-y-2.5 pt-1 border-t border-[var(--color-border)]" data-testid="mm3-layer-looks">
                <Section title={L('Aussehen', 'Look')}>
                  <div className="flex gap-1.5 flex-wrap">
                    {LAYER_LOOKS.map((k) => (
                      <button key={k.id} type="button" className={chip(look === k.id)} onClick={() => c.setLayer(l.id, { look: k.id, plane: k.id !== 'none' })} data-testid={`mm3-look-${k.id}`}>{k.icon} {L(k.de, k.en)}</button>
                    ))}
                  </div>
                </Section>
                <Section title={L('Farbe', 'Colour')}>
                  <ColorRow colors={LAYER_COLORS} value={l.color} onPick={(col) => col && c.setLayer(l.id, { color: col })} custom />
                </Section>
                {(look === 'plane' || look === 'disc' || look === 'grid') && <Slider id="mm3-layer-opacity" label={L('Durchsichtig', 'Opacity')} value={l.opacity ?? 0.13} min={0.04} max={0.6} step={0.01} onChange={(v) => c.setLayer(l.id, { opacity: v }, `lo-${l.id}`)} fmt={(v) => `${Math.round(v * 100)}%`} />}
                {look !== 'none' && <Slider id="mm3-layer-ext" label={L('Größe', 'Size')} value={l.ext ?? 8} min={4} max={40} step={1} onChange={(v) => c.setLayer(l.id, { ext: v }, `le-${l.id}`)} onReset={() => c.setLayer(l.id, { ext: undefined })} />}
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className={chip(false)} onClick={c.addLayer} data-testid="mm3-layer-add"><Plus size={13} className="inline -mt-0.5 mr-1" />{L('Neue Ebene', 'New layer')}</button>
    </div>
  );
}

/* ----------------------------------------------------------- Ansicht */
export function ViewPanel({ c }: { c: PanelCtx }) {
  const { L, space, locks } = c;
  const lockChip = (key: keyof Locks, de: string, en: string) => (
    <button type="button" className={chip(locks[key])} onClick={() => c.setLocks({ ...locks, [key]: !locks[key] })} aria-pressed={locks[key]} data-testid={`mm3-lock-${key}`}>{locks[key] ? '🔒' : '🔓'} {L(de, en)}</button>
  );
  const bi = bgInfo(space);
  return (
    <div className="space-y-4" data-testid="mm3-view-panel">
      <Section title={L('Hintergrund', 'Background')}>
        <div className="grid grid-cols-5 gap-1.5">
          {BGS3D.map((b) => (
            <button key={b.id} type="button" onClick={() => c.setBg(b.id)} className={`h-11 rounded-[10px] border-2 text-[10px] flex items-end justify-center pb-0.5 ${space.bg === b.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`} style={{ background: `linear-gradient(180deg, ${b.a}, ${b.b})`, color: b.dark ? '#f4f1ea' : '#2b2a28' }} data-testid={`mm3-bg-${b.id}`} aria-pressed={space.bg === b.id}>{L(b.de, b.en)}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <FilePick label={L('Eigenes Foto als Hintergrund', 'Own photo as background')} icon={<ImagePlus size={13} className="inline -mt-0.5 mr-1" />} onFile={c.pickBgImage} testId="mm3-bg-photo" />
          {space.bgImage && <button type="button" className={`${chip(space.bg === 'photo')}`} onClick={() => c.setBg('photo')} data-testid="mm3-bg-photo-on">{L('Foto zeigen', 'Show photo')}</button>}
          {space.bgImage && bi.id !== 'photo' && <span className="text-[11.5px] text-[var(--color-text-muted)]">{L('Dein Foto ist noch gespeichert.', 'Your photo is still saved.')}</span>}
        </div>
        <p className="text-[11.5px] text-[var(--color-text-muted)] mt-1">{L('Als Hintergrund gehen Bilddateien (Foto, Screenshot, Grafik).', 'Image files work as a background (photo, screenshot, graphic).')}</p>
      </Section>

      <Section title={L('Ansicht einrasten', 'Lock the view')}>
        <div className="flex flex-wrap gap-2">
          {lockChip('rotate', 'Winkel', 'Angle')}
          {lockChip('zoom', 'Zoom', 'Zoom')}
          {lockChip('pan', 'Lage', 'Position')}
          <button type="button" className={chip(c.freeOrbit)} onClick={() => c.setFreeOrbit(!c.freeOrbit)} aria-pressed={c.freeOrbit} data-testid="mm3-free-orbit">{L('Frei drehen (Handy)', 'Free turning (phone)')}</button>
        </div>
        <p className="text-[11.5px] text-[var(--color-text-muted)] mt-1">{L('Eingerastet bleibt die Ansicht stehen, bis du wieder aufmachst – nur Dinge lassen sich noch ziehen. Auf dem Handy dreht ein Finger immer nur waagrecht ODER senkrecht, außer bei „Frei drehen“.', 'Locked, the view stays put until you unlock it – only things can still be dragged. On a phone one finger turns either sideways OR up/down, unless “Free turning” is on.')}</p>
      </Section>

      <Section title={L('Blickwinkel', 'Angles')}>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(false)} onClick={() => c.goView({ theta: 0.7, phi: 1.15 })} data-testid="mm3-view-iso">{L('Schräg', 'Diagonal')}</button>
          <button type="button" className={chip(false)} onClick={() => c.goView({ theta: 0, phi: 1.5 })} data-testid="mm3-view-front">{L('Von vorn', 'Front')}</button>
          <button type="button" className={chip(false)} onClick={() => c.goView({ theta: Math.PI / 2, phi: 1.5 })} data-testid="mm3-view-side">{L('Von der Seite', 'Side')}</button>
          <button type="button" className={chip(false)} onClick={() => c.goView({ theta: 0, phi: 0.06 })} data-testid="mm3-view-top">{L('Von oben', 'Top')}</button>
          <button type="button" className={chip(false)} onClick={c.fitAll} data-testid="mm3-fit">{L('Alles im Blick', 'Show everything')}</button>
          <button type="button" className={chip(space.grid)} onClick={() => c.mutate((s) => ({ ...s, grid: !s.grid }))} data-testid="mm3-grid">{L('Raster am Boden', 'Floor grid')}</button>
        </div>
      </Section>

      <Section title={L('Fotos aus dieser Karte', 'Pictures of this map')}>
        <button type="button" className={chip(true)} onClick={c.takeShot} data-testid="mm3-shot"><Camera size={13} className="inline -mt-0.5 mr-1" />{L('Foto aus diesem Blickwinkel', 'Photo from this angle')}</button>
        {(space.shots?.length ?? 0) === 0 ? (
          <p className="text-[11.5px] text-[var(--color-text-muted)] mt-1.5">{L('Dreh die Ansicht, wie du sie festhalten magst, und drück den Knopf. Die Fotos bleiben in dieser Karte und kommen ins PDF.', 'Turn the view the way you want to keep it and press the button. The pictures stay in this map and go into the PDF.')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2" data-testid="mm3-shots">
            {[...(space.shots ?? [])].reverse().map((s) => (
              <div key={s.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]" data-testid="mm3-shot-item">
                <button type="button" onClick={() => c.openShot(s)} className="block w-full" aria-label={`${s.name} – ${L('diesen Blickwinkel einstellen', 'go to this angle')}`}>
                  <img src={s.img} alt="" className="w-full h-[84px] object-cover" />
                </button>
                <div className="p-1.5 flex items-center gap-1">
                  <input className="flex-1 min-w-0 bg-transparent text-[12px] text-[var(--color-text)] outline-none" value={s.name} onChange={(e) => c.renameShot(s.id, e.target.value)} aria-label={L('Name des Fotos', 'Name of the picture')} />
                  <button type="button" onClick={() => c.downloadShot(s)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Foto sichern', 'Save picture')}><Share2 size={13} /></button>
                  <button type="button" onClick={() => c.deleteShot(s.id)} className={`w-7 h-7 rounded-full flex items-center justify-center ${danger}`} aria-label={L('Foto löschen', 'Delete picture')} data-testid="mm3-shot-delete"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={L('Sichern & Teilen', 'Save & share')}>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(false)} onClick={c.sharePdf} disabled={c.pdfBusy} data-testid="mm3-pdf"><FileDown size={13} className="inline -mt-0.5 mr-1" />{c.pdfBusy ? L('Einen Moment …', 'One moment …') : L('Als PDF', 'As PDF')}</button>
          <button type="button" className={chip(false)} onClick={c.downloadPng} data-testid="mm3-photo"><Camera size={13} className="inline -mt-0.5 mr-1" />{L('Bild (PNG)', 'Picture (PNG)')}</button>
        </div>
        <p className="text-[11.5px] text-[var(--color-text-muted)] mt-1">{L('Das PDF enthält Übersichtsbild, Fotos, Ebenen mit allen Dingen, Verbindungen und festgehaltene Stände. Die ganze Karte steckt außerdem in der App-Sicherung.', 'The PDF holds the overview, pictures, layers with all things, links and saved states. The whole map is also part of the app backup.')}</p>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------ Stände */
export function SavesPanel({ c }: { c: PanelCtx }) {
  const { L, lang } = c;
  const fmt = (iso: string) => { try { return new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
  return (
    <div className="space-y-3" data-testid="mm3-saves-panel">
      <p className="text-[13px] text-[var(--color-text-muted)]">{L('Halte fest, wie die Karte jetzt aussieht, und bau danach ruhig weiter. Frühere Stände kannst du jederzeit ansehen, zurückholen oder als Kopie öffnen.', 'Keep how the map looks right now and keep building afterwards. You can view earlier states any time, bring them back or open them as a copy.')}</p>
      <div className="flex gap-2">
        <input className={field} value={c.stateName} onChange={(e) => c.setStateName(e.target.value)} placeholder={L('Name (optional), z. B. „vor dem Umbau“', 'Name (optional), e.g. “before the rebuild”')} data-testid="mm3-state-name" />
        <button type="button" className="px-3 rounded-full bg-[var(--color-primary)] text-[var(--color-surface)] text-[13px] font-medium shrink-0 flex items-center gap-1" onClick={() => c.holdState(c.stateName)} data-testid="mm3-hold"><Save size={14} />{L('Festhalten', 'Keep')}</button>
      </div>
      {c.versions.length === 0 ? (
        <p className="text-[12.5px] text-[var(--color-text-muted)]" data-testid="mm3-saves-empty">{L('Noch kein Stand festgehalten.', 'No state kept yet.')}</p>
      ) : (
        <ul className="space-y-2">
          {c.versions.map((v) => (
            <li key={v.id} className={`rounded-[var(--radius-md)] border p-2 flex gap-2 ${c.previewId === v.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'} bg-[var(--color-surface)]`} data-testid="mm3-state-item">
              {v.thumb ? <img src={v.thumb} alt="" className="w-[84px] h-[60px] object-cover rounded-[8px] shrink-0" /> : <div className="w-[84px] h-[60px] rounded-[8px] bg-[var(--color-surface-muted,#eee)] shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[var(--color-text)] truncate">{v.name || L('Stand', 'State')}</p>
                <p className="text-[11.5px] text-[var(--color-text-muted)]">{fmt(v.at)} · {v.space.nodes.length} {L('Dinge', 'things')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <button type="button" className={chip(c.previewId === v.id)} onClick={() => c.previewVersion(v)} data-testid="mm3-state-view">{L('Ansehen', 'View')}</button>
                  <button type="button" className={chip(false)} onClick={() => c.copyVersion(v)} data-testid="mm3-state-copy">{L('Als Kopie', 'As copy')}</button>
                  <button type="button" className={chip(false)} onClick={() => c.restoreVersion(v)} data-testid="mm3-state-restore">{L('Zurückholen', 'Bring back')}</button>
                  <button type="button" className={`${chip(false)} ${danger}`} onClick={() => c.removeVersion(v)} aria-label={L('Stand löschen', 'Delete state')} data-testid="mm3-state-delete"><Trash2 size={12} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Liste */
export function ListPanel({ c }: { c: PanelCtx }) {
  const { L, space } = c;
  const layerName = (id?: string) => space.layers.find((l) => l.id === id)?.name ?? '';
  return (
    <div className="space-y-1.5" data-testid="mm3-list-panel">
      {space.nodes.length === 0 && <p className="text-[13px] text-[var(--color-text-muted)]">{L('Noch nichts im Raum.', 'Nothing in the space yet.')}</p>}
      {[...space.nodes].sort((a, b) => b.y - a.y).map((n) => (
        <button key={n.id} type="button" onClick={() => { c.setSel({ kind: 'node', id: n.id }); c.setTab('thing'); c.focusNode(n); }} className={`w-full text-left rounded-[var(--radius-md)] border px-3 py-2 text-[14px] ${c.sel?.id === n.id ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'} bg-[var(--color-surface)]`} data-testid="mm3-list-item">
          <span style={{ color: n.color }}>●</span> {n.symbol} {n.text || (n.shape === 'photo' ? L('Foto', 'Photo') : L('Ohne Namen', 'Unnamed'))}
          <span className="text-[12px] text-[var(--color-text-muted)]"> · {layerName(n.layerId) || `${L('Höhe', 'height')} ${n.y}`}</span>
        </button>
      ))}
    </div>
  );
}
