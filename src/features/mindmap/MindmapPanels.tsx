import { ArrowLeftRight, Lock, Trash2, Unlock, Users, Waves } from 'lucide-react';
import { EmojiPicker } from '../../components/shared/SymbolColorPicker';
import { ColorField } from './MindmapColor';
import { ANIMS, BORDERS, FONTS, FRAME_VARIANTS, NOTE_VARIANTS, PENS, SHAPES, STROKE, dashArray, edgeStroke, isBlock, layoutNode, shapePath, type LayerMove, type MMAnim, type MMBorder, type MMDash, type MMEdge, type MMImgStyle, type MMNode, type MMShape } from './mindmapModel';
import { HEADS, ROUTES, headShape, headsOf, type MMHead } from './mindmapRoutes';
import { ROUNDABLE, isRoundShape } from './mindmapShapes';
import { DOODLES, DOODLE_GROUPS, doodleOf } from './doodles';
import type { MindmapTexts } from './mindmapTexts';
import type { MindmapExtraTexts } from './mindmapExtraTexts';

const chip = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-[13px] border transition-colors ${active ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`;
const activeBg = { background: 'var(--color-primary)' };

const SQUARISH = new Set(['circle', 'square', 'star', 'heart', 'cross', 'pentagon', 'octagon', 'triangle']);
export function ShapeThumb({ shape, active, round }: { shape: MMShape; active: boolean; round?: boolean }) {
  return (
    <svg viewBox="-24 -17 48 34" width="48" height="34" aria-hidden="true">
      {shape === 'plain' ? (
        <text x="0" y="6" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor">Aa</text>
      ) : (
        <path d={shapePath(shape, SQUARISH.has(shape) ? 28 : 38, SQUARISH.has(shape) ? 28 : shape === 'frame' ? 28 : 24, round)} fill={active ? 'rgba(62,124,99,0.18)' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeDasharray={shape === 'frame' ? '4 3' : undefined} />
      )}
    </svg>
  );
}

export type StyleTab = 'shape' | 'color' | 'symbol' | 'size' | 'text' | 'border' | 'arrange' | 'motion' | 'photo' | 'content';

export function Slider({ label, value, min, max, step = 1, onChange, testId, format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; testId: string; format?: (v: number) => string }) {
  return (
    <label className="block">
      <span className="flex justify-between text-[12px] text-[var(--color-text-faint)] mb-1">
        <span>{label}</span>
        <span>{format ? format(value) : Math.round(value * 100) / 100}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={Math.min(max, Math.max(min, value))} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" data-testid={testId} />
    </label>
  );
}

export interface StyleActions {
  layer: (how: LayerMove) => void;
  rotateBy: (deg: number) => void;
  setRotation: (deg: number) => void;
  scaleBy: (factor: number) => void;
  /** group / ungroup the selection */
  toggleGroup: () => void;
  grouped: boolean;
  /** blocks: open the content editor (to-do items, table cells …) */
  editContent?: () => void;
  /** app cards: open the original */
  openRef?: () => void;
}

/** which tabs make sense for what is selected */
export function tabsFor(node: MMNode): StyleTab[] {
  if (isBlock(node)) return ['content', 'color', 'text', 'border', 'size', 'arrange'];
  switch (node.shape) {
    case 'draw':
      return ['color', 'border', 'size', 'arrange', 'motion'];
    case 'doodle':
      return ['shape', 'color', ...(doodleOf(node.doodle).text ? (['text'] as StyleTab[]) : []), 'border', 'size', 'arrange', 'motion'];
    case 'sticker':
      return ['symbol', 'shape', 'size', 'arrange', 'motion'];
    case 'image':
      return ['photo', 'size', 'arrange', 'motion'];
    case 'maplink':
      return ['color', 'border', 'size', 'arrange', 'motion'];
    case 'frame':
      return ['shape', 'color', 'text', 'border', 'size', 'arrange'];
    default:
      return ['shape', 'color', 'text', 'border', 'symbol', 'size', 'arrange', 'motion'];
  }
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.split('');
const DIGITS = '0123456789'.split('');
const SIGNS = ['&', '?', '!', '+', '#', '%', '@', '€', '$', '*', '='];
const GLYPH_FONTS = ['display', 'script', 'serif', 'marker', 'mono', 'round', 'sans', 'hand'] as const;

const Hint = ({ children }: { children: React.ReactNode }) => <p className="text-[11.5px] text-[var(--color-text-faint)]" data-hint>{children}</p>;
const Cap = ({ children }: { children: React.ReactNode }) => <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{children}</p>;

export function NodeStyleSheet({
  node,
  count = 1,
  tab,
  setTab,
  onChange,
  actions,
  T,
  X,
  lang,
  reduceMotion = false,
}: {
  node: MMNode;
  count?: number;
  tab: StyleTab;
  setTab: (t: StyleTab) => void;
  onChange: (patch: Partial<MMNode>) => void;
  actions: StyleActions;
  T: MindmapTexts;
  X: MindmapExtraTexts;
  lang: 'de' | 'en';
  reduceMotion?: boolean;
}) {
  const L2 = (de: string, en: string) => (lang === 'en' ? en : de);
  const names: Record<StyleTab, string> = { shape: T.shape, color: T.color, symbol: T.symbol, size: T.size, text: X.tabText, border: node.shape === 'draw' ? X.tabLine : X.tabBorder, arrange: X.tabArrange, motion: X.tabMotion, photo: X.tabPhoto, content: L2('Inhalt', 'Content') };
  const tabs = tabsFor(node);
  if (!tabs.includes(tab)) tab = tabs[0];
  const L = layoutNode(node);
  const block = isBlock(node);
  const regular = !['draw', 'doodle', 'image', 'sticker', 'maplink'].includes(node.shape) && !block;
  const dd = node.shape === 'doodle' ? doodleOf(node.doodle) : null;
  const baseW = Math.round(L.w / L.k);
  const baseH = Math.round(L.h / L.k);
  const isFrameLike = node.shape === 'frame' || node.shape === 'maplink';
  const shapeNow: MMShape = node.shape === 'rounded' ? 'rect' : node.shape;
  const roundNow = isRoundShape(node.shape, node.round);
  const hasFill = node.shape !== 'plain' && node.shape !== 'draw' && node.shape !== 'image' && node.shape !== 'sticker';
  const glyph = !!node.symbol && /^[A-Za-zÄÖÜäöüß0-9&?!+#%@€$*=]$/.test(node.symbol);

  return (
    <div data-testid="mm-style-sheet">
      {count > 1 && <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5" data-testid="mm-style-count">{lang === 'en' ? `${count} selected` : `${count} ausgewählt`}</p>}
      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {tabs.map((id) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`${chip(tab === id)} shrink-0`} style={tab === id ? activeBg : undefined} data-testid={`mm-tab-${id}`}>
            {names[id]}
          </button>
        ))}
      </div>

      {tab === 'shape' && node.shape !== 'doodle' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-5 gap-2" data-testid="mm-shapes">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  onChange({
                    shape: s.id,
                    ...(ROUNDABLE.has(s.id) && node.shape !== s.id ? { round: roundNow } : {}),
                    ...(s.id === 'frame' && !node.fw ? { fw: 340, fh: 240 } : {}),
                    ...(s.id !== 'frame' && s.id !== 'note' ? { variant: undefined } : {}),
                  })
                }
                className={`flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] py-1.5 ${shapeNow === s.id ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`}
                data-testid={`mm-shape-${s.id}`}
                aria-label={lang === 'en' ? s.en : s.de}
                aria-pressed={shapeNow === s.id}
              >
                <ShapeThumb shape={s.id} active={shapeNow === s.id} round={ROUNDABLE.has(s.id) ? roundNow : undefined} />
                <span className="text-[10px] leading-tight text-center">{lang === 'en' ? s.en : s.de}</span>
              </button>
            ))}
          </div>
          {ROUNDABLE.has(shapeNow) && (
            <div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onChange({ round: false })} className={chip(!roundNow)} style={!roundNow ? activeBg : undefined} data-testid="mm-round-off">{L2('Eckig', 'Angular')}</button>
                <button type="button" onClick={() => onChange({ round: true })} className={chip(roundNow)} style={roundNow ? activeBg : undefined} data-testid="mm-round-on">{L2('Abgerundet', 'Rounded')}</button>
              </div>
            </div>
          )}
          {node.shape === 'frame' && (
            <div data-testid="mm-frame-variants">
              <Cap>{L2('Art des Rahmens', 'Kind of frame')}</Cap>
              <div className="flex flex-wrap gap-1.5">
                {FRAME_VARIANTS.map((v) => {
                  const on = (node.variant ?? 'classic') === v.id;
                  return (
                    <button key={v.id} type="button" onClick={() => onChange({ variant: v.id === 'classic' ? undefined : v.id })} className={chip(on)} style={on ? activeBg : undefined} data-testid={`mm-variant-${v.id}`}>
                      {lang === 'en' ? v.en : v.de}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {node.shape === 'note' && (
            <div data-testid="mm-note-variants">
              <Cap>{L2('Art der Notiz', 'Kind of note')}</Cap>
              <div className="flex flex-wrap gap-1.5">
                {NOTE_VARIANTS.map((v) => {
                  const on = (node.variant ?? 'sticky') === v.id;
                  return (
                    <button key={v.id} type="button" onClick={() => onChange({ variant: v.id === 'sticky' ? undefined : v.id })} className={chip(on)} style={on ? activeBg : undefined} data-testid={`mm-variant-${v.id}`}>
                      {lang === 'en' ? v.en : v.de}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {node.shape === 'plain' && <Hint>{L2('„Ohne Form“ = nur Text, ohne Kasten. Wähle eine Form, wenn der Text einen Hintergrund bekommen soll – Farbe und Durchsichtigkeit stellst du dann bei „Farbe“ ein.', '“No shape” = text only, no box. Pick a shape to give the text a background – set its colour and transparency under “Colour”.')}</Hint>}
        </div>
      )}
      {tab === 'shape' && node.shape === 'doodle' && (
        <div className="flex flex-col gap-2" data-testid="mm-doodle-swap">
          <p className="text-[12px] text-[var(--color-text-faint)]">{X.doodleSwap}</p>
          <div className="grid grid-cols-6 gap-1.5 max-h-[22vh] overflow-y-auto">
            {DOODLES.map((d) => (
              <button key={d.id} type="button" onClick={() => onChange({ doodle: d.id, fw: undefined, fh: undefined })} className={`rounded-[var(--radius-md)] p-1 ${node.doodle === d.id ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`} aria-label={lang === 'en' ? d.en : d.de} data-testid={`mm-doodle-swap-${d.id}`}>
                <DoodleThumb id={d.id} />
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div className="flex flex-col gap-3" data-testid="mm-content-sheet">
          {actions.editContent && node.shape !== 'appcard' && (
            <button type="button" onClick={actions.editContent} className="self-start px-4 py-2 rounded-full text-[14px] text-white" style={activeBg} data-testid="mm-content-edit">
              {node.shape === 'todo' ? L2('Aufgaben bearbeiten', 'Edit tasks') : node.shape === 'table' ? L2('Tabelle bearbeiten', 'Edit table') : L2('Einträge bearbeiten', 'Edit entries')}
            </button>
          )}
          {node.shape === 'todo' && <Hint>{L2('Tippe in der Mindmap auf einen Kreis, um etwas abzuhaken. Erledigtes wird durchgestrichen und bekommt einen Haken.', 'Tap a circle on the map to tick something off. Done items are struck through and get a tick.')}</Hint>}
          {node.shape === 'table' && (
            <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
              <input type="checkbox" checked={node.hdr !== false} onChange={(e) => onChange({ hdr: e.target.checked ? undefined : false })} data-testid="mm-table-hdr" />
              {L2('Erste Zeile ist eine Überschrift', 'First row is a heading')}
            </label>
          )}
          {node.shape === 'proscons' && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="block text-[12px] text-[var(--color-text-faint)] mb-1">{L2('Linke Spalte', 'Left column')}</span>
                <input value={node.pl ?? ''} placeholder="Pro" onChange={(e) => onChange({ pl: e.target.value || undefined })} className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-[14px]" data-testid="mm-pl" />
              </label>
              <label className="block">
                <span className="block text-[12px] text-[var(--color-text-faint)] mb-1">{L2('Rechte Spalte', 'Right column')}</span>
                <input value={node.cl ?? ''} placeholder="Contra" onChange={(e) => onChange({ cl: e.target.value || undefined })} className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-[14px]" data-testid="mm-cl" />
              </label>
            </div>
          )}
          {node.shape === 'appcard' && (
            <>
              <p className="text-[13px] text-[var(--color-text-muted)]">{node.snap ? `${node.snap.emoji} ${node.snap.label}: ${node.snap.title}` : ''}</p>
              {actions.openRef && node.ref && (
                <button type="button" onClick={actions.openRef} className="self-start px-4 py-2 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="mm-ref-open">{L2('Original öffnen', 'Open the original')}</button>
              )}
              <Hint>{L2('Die Karte zeigt, was beim Einfügen drinstand. Ist das Original geändert, wird sie beim Öffnen der Mindmap aktualisiert; wurde es gelöscht, bleibt die Karte so stehen.', 'The card shows what it said when inserted. If the original changes it is refreshed when the map opens; if it was deleted the card stays as it was.')}</Hint>
            </>
          )}
        </div>
      )}

      {tab === 'color' && (
        <div className="flex flex-col gap-3" data-testid="mm-color-sheet">
          <ColorField value={node.color} onChange={(color) => onChange({ color })} lang={lang} label={node.shape === 'draw' ? L2('Farbe', 'Colour') : L2('Hauptfarbe', 'Main colour')} testId="mm-color" />
          {node.shape === 'draw' && (
            <div>
              <Cap>{X.penKind}</Cap>
              <div className="flex gap-2 flex-wrap">
                {PENS.map((p) => (
                  <button key={p.id} type="button" onClick={() => onChange({ pen: p.id })} className={chip((node.pen ?? 'pen') === p.id)} style={(node.pen ?? 'pen') === p.id ? activeBg : undefined} data-testid={`mm-pen-kind-${p.id}`}>
                    {lang === 'en' ? p.en : p.de}
                  </button>
                ))}
              </div>
            </div>
          )}
          {(regular || node.shape === 'doodle') && (
            <div>
              <Cap>{node.shape === 'doodle' ? X.fill : T.look}</Cap>
              <div className="flex gap-2 flex-wrap">
                {([['solid', T.lookSolid], ['soft', T.lookSoft], ['outline', T.lookOutline]] as const).map(([id, label]) => {
                  const on = node.look === id && !node.nofill && !node.fc;
                  return (
                    <button key={id} type="button" onClick={() => onChange({ look: id, nofill: undefined, fc: undefined })} className={chip(on)} style={on ? activeBg : undefined} data-testid={`mm-look-${id}`}>
                      {label}
                    </button>
                  );
                })}
                {node.shape !== 'plain' && (
                  <button type="button" onClick={() => onChange({ nofill: true, fc: undefined })} className={chip(!!node.nofill)} style={node.nofill ? activeBg : undefined} data-testid="mm-look-nofill">
                    {L2('Ohne Füllung', 'No fill')}
                  </button>
                )}
              </div>
            </div>
          )}
          {hasFill && (
            <>
              <ColorField value={node.fc} onChange={(fc) => onChange({ fc, nofill: undefined })} lang={lang} compact label={L2('Füllfarbe (⌀ = automatisch / ohne)', 'Fill colour (⌀ = automatic / none)')} none={!node.fc} onNone={() => onChange({ fc: undefined, nofill: undefined })} noneLabel={L2('Automatisch', 'Automatic')} testId="mm-fill" />
              {!node.nofill && <Slider label={L2('Deckkraft der Füllung', 'Fill opacity')} value={node.fop ?? 1} min={0.05} max={1} step={0.05} onChange={(fop) => onChange({ fop: fop >= 1 ? undefined : fop })} testId="mm-fop" format={(v) => `${Math.round(v * 100)} %`} />}
            </>
          )}
          {block && node.shape === 'todo' && <ColorField value={node.ck ?? node.color} onChange={(ck) => onChange({ ck })} lang={lang} compact label={L2('Farbe von Kreis & Haken', 'Colour of circle & tick')} testId="mm-ck" />}
          {block && node.shape === 'proscons' && (
            <>
              <ColorField value={node.pc ?? '#5f9e6e'} onChange={(pc) => onChange({ pc })} lang={lang} compact label={L2('Farbe links', 'Left colour')} testId="mm-pc" />
              <ColorField value={node.cc ?? '#d9778a'} onChange={(cc) => onChange({ cc })} lang={lang} compact label={L2('Farbe rechts', 'Right colour')} testId="mm-cc" />
            </>
          )}
        </div>
      )}

      {tab === 'text' && (
        <div className="flex flex-col gap-3" data-testid="mm-text-style">
          <div>
            <Cap>{X.font}</Cap>
            <div className="grid grid-cols-3 gap-1.5">
              {FONTS.map((f) => (
                <button key={f.id} type="button" onClick={() => onChange({ font: f.id })} className={`px-2 py-2 rounded-[var(--radius-md)] text-[14px] border ${(node.font ?? 'sans') === f.id ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border-strong)] text-[var(--color-text)]'}`} style={{ fontFamily: f.css }} data-testid={`mm-font-${f.id}`}>
                  {lang === 'en' ? f.en : f.de}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onChange({ bold: node.bold ? undefined : true })} className={`${chip(!!node.bold)} font-bold`} style={node.bold ? activeBg : undefined} data-testid="mm-bold">{X.bold}</button>
            <button type="button" onClick={() => onChange({ italic: node.italic ? undefined : true })} className={`${chip(!!node.italic)} italic`} style={node.italic ? activeBg : undefined} data-testid="mm-italic">{X.italic}</button>
          </div>
          <ColorField value={node.tc} onChange={(tc) => onChange({ tc })} lang={lang} compact label={L2('Textfarbe (⌀ = automatisch)', 'Text colour (⌀ = automatic)')} none={!node.tc} onNone={() => onChange({ tc: undefined })} noneLabel={L2('Automatisch', 'Automatic')} testId="mm-tc" />
        </div>
      )}

      {tab === 'border' && (
        <div className="flex flex-col gap-3" data-testid="mm-border-sheet">
          {node.shape !== 'draw' && (
            <div>
              <Cap>{X.borderStyle}</Cap>
              <div className="flex flex-wrap gap-1.5">
                {BORDERS.map((b) => {
                  const cur: MMBorder = node.border ?? dd?.dash ?? (node.shape === 'frame' && (node.variant ?? 'classic') === 'classic' ? 'dashed' : 'solid');
                  return (
                    <button key={b.id} type="button" onClick={() => onChange({ border: b.id })} className={chip(cur === b.id)} style={cur === b.id ? activeBg : undefined} data-testid={`mm-border-${b.id}`}>
                      {lang === 'en' ? b.en : b.de}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Slider label={X.borderWidth} value={node.sw ?? (node.shape === 'draw' || node.shape === 'doodle' ? 3 : node.look === 'outline' ? 3 : 2)} min={node.shape === 'draw' ? 1 : 0.5} max={node.shape === 'draw' ? 30 : 14} step={0.5} onChange={(sw) => onChange({ sw })} testId="mm-sw" />
          {node.shape !== 'draw' && node.shape !== 'image' && node.shape !== 'sticker' && node.shape !== 'plain' && (
            <ColorField value={node.bc} onChange={(bc) => onChange({ bc })} lang={lang} compact label={L2('Randfarbe (⌀ = automatisch)', 'Border colour (⌀ = automatic)')} none={!node.bc} onNone={() => onChange({ bc: undefined })} noneLabel={L2('Automatisch', 'Automatic')} testId="mm-bc" />
          )}
        </div>
      )}

      {tab === 'photo' && (
        <div className="flex gap-2 flex-wrap" data-testid="mm-photo-style">
          {([['polaroid', X.photoPolaroid], ['plain', X.photoPlain], ['round', X.photoRound], ['rounded', X.photoRounded]] as [MMImgStyle, string][]).map(([id, label]) => (
            <button key={id} type="button" onClick={() => onChange({ imgStyle: id })} className={chip((node.imgStyle ?? 'polaroid') === id)} style={(node.imgStyle ?? 'polaroid') === id ? activeBg : undefined} data-testid={`mm-imgstyle-${id}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'symbol' && (
        <div className="flex flex-col gap-3">
          <EmojiPicker value={node.symbol && !glyph ? node.symbol : ''} onChange={(symbol) => onChange({ symbol: symbol || undefined })} />
          <div data-testid="mm-glyphs">
            <Cap>{L2('Buchstaben, Zahlen & Zeichen – groß und fett', 'Letters, numbers & signs – big and bold')}</Cap>
            <div className="flex flex-wrap gap-1">
              {[...LETTERS, ...DIGITS, ...SIGNS].map((g) => (
                <button key={g} type="button" onClick={() => onChange({ symbol: g, font: node.font ?? 'display' })} className={`w-8 h-8 rounded-[var(--radius-md)] text-[16px] font-bold border ${node.symbol === g ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`} style={{ fontFamily: 'Georgia, serif' }} data-testid={`mm-glyph-${g}`} aria-label={g}>
                  {g}
                </button>
              ))}
            </div>
            {glyph && (
              <div className="mt-2">
                <Cap>{L2('Schrift', 'Font')}</Cap>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {GLYPH_FONTS.map((id) => {
                    const f = FONTS.find((x) => x.id === id);
                    if (!f) return null;
                    const on = (node.font ?? 'display') === id;
                    return (
                      <button key={id} type="button" onClick={() => onChange({ font: id })} className={`${chip(on)} shrink-0`} style={on ? { ...activeBg, fontFamily: f.css } : { fontFamily: f.css }} data-testid={`mm-glyph-font-${id}`}>
                        {lang === 'en' ? f.en : f.de}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {node.symbol && (regular || node.shape === 'sticker') && (
            <button type="button" className="self-start text-[13px] text-[var(--color-text-muted)] underline underline-offset-2" onClick={() => onChange({ symbol: undefined })} data-testid="mm-symbol-clear">
              {T.noSymbol}
            </button>
          )}
          {node.shape === 'sticker' && <Hint>{L2('Nur das Symbol, ohne Kasten. Im Reiter „Form“ kannst du einen Rahmen darum legen.', 'Just the symbol, no box. Under “Shape” you can put a frame around it.')}</Hint>}
        </div>
      )}

      {tab === 'size' && (
        <div className="flex flex-col gap-3" data-testid="mm-size-sheet">
          {!isFrameLike && node.shape !== 'draw' && (
            <div className="flex gap-2">
              {([[1, T.sizeS], [2, T.sizeM], [3, T.sizeL], [4, T.sizeXL]] as const).map(([v, label]) => (
                <button key={v} type="button" onClick={() => onChange({ size: v, sc: undefined })} className={chip(node.size === v)} style={node.size === v ? activeBg : undefined} data-testid={`mm-size-${v}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {!isFrameLike && !block && (
            <>
              <Slider label={X.sizeFree} value={node.sc ?? 1} min={0.3} max={4} step={0.05} onChange={(sc) => onChange({ sc })} testId="mm-sc" format={(v) => `${Math.round(v * 100)} %`} />
              <div className="flex gap-2">
                <button type="button" onClick={() => actions.scaleBy(1 / 1.15)} className={chip(false)} data-testid="mm-smaller">− {X.sizeSmaller}</button>
                <button type="button" onClick={() => actions.scaleBy(1.15)} className={chip(false)} data-testid="mm-bigger">+ {X.sizeBigger}</button>
              </div>
            </>
          )}
          {block && <Slider label={X.stretchW} value={Math.round(L.w)} min={block && node.shape === 'proscons' ? 220 : 160} max={900} step={5} onChange={(fw) => onChange({ fw })} testId="mm-fw" />}
          {(isFrameLike || (dd && count === 1)) && (
            <>
              <Slider label={X.stretchW} value={isFrameLike ? Math.round(L.w) : baseW} min={isFrameLike ? 100 : 20} max={isFrameLike ? 1600 : 700} step={5} onChange={(fw) => onChange({ fw })} testId="mm-fw" />
              <Slider label={X.stretchH} value={isFrameLike ? Math.round(L.h) : baseH} min={isFrameLike ? 70 : 10} max={isFrameLike ? 1200 : 700} step={5} onChange={(fh) => onChange({ fh })} testId="mm-fh" />
            </>
          )}
        </div>
      )}

      {tab === 'arrange' && (
        <div className="flex flex-col gap-3" data-testid="mm-arrange-sheet">
          <div>
            <Cap>{X.layers}</Cap>
            <div className="grid grid-cols-2 gap-1.5">
              {([['front', X.toFront], ['forward', X.forward], ['backward', X.backward], ['back', X.toBack]] as [LayerMove, string][]).map(([how, label]) => (
                <button key={how} type="button" onClick={() => actions.layer(how)} className={chip(false)} data-testid={`mm-layer-${how}`}>{label}</button>
              ))}
            </div>
            <Hint>{L2('Solange nichts übereinander liegt, ist alles auf einer Ebene. Mit dem Ebenen-Knopf unten siehst du, was über was liegt.', 'As long as nothing overlaps everything is on one level. The layers button at the bottom shows what lies over what.')}</Hint>
          </div>
          <Slider label={L2('Durchsichtigkeit (gesamt)', 'Transparency (overall)')} value={node.op ?? 1} min={0.05} max={1} step={0.05} onChange={(op) => onChange({ op: op >= 1 ? undefined : op })} testId="mm-op" format={(v) => `${Math.round(v * 100)} % ${L2('sichtbar', 'visible')}`} />
          {node.shape !== 'frame' && (
            <div>
              <Slider label={X.rotation} value={Math.round(((node.rot ?? 0) + 540) % 360) - 180} min={-180} max={180} step={1} onChange={actions.setRotation} testId="mm-rot" format={(v) => `${Math.round(v)}°`} />
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <button type="button" onClick={() => actions.rotateBy(-15)} className={chip(false)} data-testid="mm-rot-left">↺ {X.rotateLeft}</button>
                <button type="button" onClick={() => actions.rotateBy(15)} className={chip(false)} data-testid="mm-rot-right">↻ {X.rotateRight}</button>
                <button type="button" onClick={() => actions.setRotation(0)} className={chip(false)} data-testid="mm-rot-reset">{X.rotateReset}</button>
              </div>
            </div>
          )}
          <div>
            <button type="button" onClick={() => onChange({ lock: node.lock ? undefined : true })} className={`${chip(!!node.lock)} inline-flex items-center gap-1.5`} style={node.lock ? activeBg : undefined} data-testid="mm-lock-toggle">
              {node.lock ? <Lock size={14} /> : <Unlock size={14} />} {node.lock ? L2('Fixiert – zum Lösen tippen', 'Fixed – tap to release') : L2('Fixieren', 'Fix in place')}
            </button>
            <Hint>{L2('Fixierte Elemente lassen sich auf der Fläche nicht aus Versehen verschieben – praktisch für einen gemalten Hintergrund. In der Ebenen-Liste kommst du immer ran.', 'Fixed elements cannot be moved by accident – handy for a painted background. You can always reach them in the layers list.')}</Hint>
          </div>
          {(count > 1 || actions.grouped) && (
            <div>
              <button type="button" onClick={actions.toggleGroup} className={`${chip(actions.grouped)} inline-flex items-center gap-1.5`} style={actions.grouped ? activeBg : undefined} data-testid="mm-group-toggle">
                <Users size={14} /> {actions.grouped ? X.ungroup : X.group}
              </button>
              <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1" data-hint>{X.groupHint}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'motion' && (
        <div className="flex flex-col gap-3" data-testid="mm-motion-sheet">
          {reduceMotion && <p className="text-[12.5px] rounded-[var(--radius-md)] px-3 py-2 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]" data-testid="mm-motion-reduced">{X.animReduced}</p>}
          <div className="grid grid-cols-3 gap-1.5">
            {ANIMS.map((a) => {
              const on = (node.anim ?? 'none') === a.id;
              return (
                <button key={a.id} type="button" onClick={() => onChange({ anim: a.id === 'none' ? undefined : (a.id as MMAnim) })} className={`flex items-center gap-1.5 px-2 py-2 rounded-[var(--radius-md)] text-[13px] border text-left ${on ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border-strong)] text-[var(--color-text)]'}`} data-testid={`mm-anim-${a.id}`}>
                  <span aria-hidden="true">{a.icon}</span>
                  {lang === 'en' ? a.en : a.de}
                </button>
              );
            })}
          </div>
          {node.anim && node.anim !== 'none' && (
            <>
              <div>
                <Cap>{X.animSpeed}</Cap>
                <div className="flex gap-2">
                  {([[1, X.slow], [2, X.normal], [3, X.fast]] as const).map(([v, label]) => (
                    <button key={v} type="button" onClick={() => onChange({ animSpeed: v })} className={chip((node.animSpeed ?? 2) === v)} style={(node.animSpeed ?? 2) === v ? activeBg : undefined} data-testid={`mm-speed-${v}`}>{label}</button>
                  ))}
                </div>
              </div>
              {(count > 1 || actions.grouped) && (
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => onChange({ ganim: undefined })} className={chip(!node.ganim)} style={!node.ganim ? activeBg : undefined} data-testid="mm-anim-each">{X.animEach}</button>
                  <button type="button" onClick={() => onChange({ ganim: true })} className={chip(!!node.ganim)} style={node.ganim ? activeBg : undefined} data-testid="mm-anim-group">{X.animAsGroup}</button>
                </div>
              )}
            </>
          )}
          <p className="text-[11.5px] text-[var(--color-text-faint)]" data-hint>{X.animHint}</p>
        </div>
      )}
    </div>
  );
}

/** a tiny picture of a doodle for pickers */
export function DoodleThumb({ id, size = 40 }: { id: string; size?: number }) {
  const d = doodleOf(id);
  const k = Math.max(d.w, d.h) / 100;
  return (
    <svg viewBox={`${-d.w / 2 - 6} ${-d.h / 2 - 6} ${d.w + 12} ${d.h + 12}`} width={size} height={size} aria-hidden="true">
      <path d={d.d} fill="none" stroke="currentColor" strokeWidth={3.4 * k} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={d.dash === 'dashed' ? '9 7' : d.dash === 'dotted' ? '0.1 8' : undefined} />
    </svg>
  );
}

export { DOODLE_GROUPS };

function DashThumb({ dash, width }: { dash: MMDash; width: number }) {
  return (
    <svg viewBox="0 0 40 10" width="40" height="10" aria-hidden="true">
      <line x1="3" y1="5" x2="37" y2="5" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeDasharray={dashArray(dash, width)} />
    </svg>
  );
}


/** a little picture of a line shape (for the picker) */
const ROUTE_THUMB: Record<string, string> = {
  auto: 'M3 17 L37 3',
  angle: 'M3 17 L16 17 L26 3 L37 3',
  elbow: 'M3 17 L20 17 L20 3 L37 3',
  elbowR: 'M3 17 L14 17 Q20 17 20 11 L20 9 Q20 3 26 3 L37 3',
  scurve: 'M3 17 C20 17 20 3 37 3',
  wave: 'M3 10 C8 0 13 0 18 10 S28 20 37 10',
  zigzag: 'M3 14 L10 5 L17 15 L24 5 L31 15 L37 8',
};
function RouteThumb({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 40 20" width="40" height="20" aria-hidden="true">
      <path d={ROUTE_THUMB[id] ?? ROUTE_THUMB.auto} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/** a head at the end (or start) of a short line */
function HeadThumb({ head, start }: { head: MMHead; start?: boolean }) {
  const hs = headShape(head, 9);
  return (
    <svg viewBox="0 0 40 20" width="40" height="20" aria-hidden="true">
      <g transform={start ? 'translate(40 0) scale(-1 1)' : undefined}>
        <line x1="3" y1="10" x2={hs ? 30 - (head === 'none' ? 0 : 6) : 37} y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {hs && head !== 'none' && (
          <g transform="translate(35 10)">
            <path d={hs.d} fill={hs.kind === 'solid' ? 'currentColor' : hs.kind === 'hollow' ? 'var(--color-surface)' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function EdgeStyleSheet({ edge, onChange, onLabel, onReverse, onRemove, T, lang = 'de' }: { edge: MMEdge; onChange: (patch: Partial<MMEdge>) => void; onLabel: () => void; onReverse: () => void; onRemove: () => void; T: MindmapTexts; lang?: 'de' | 'en' }) {
  const L2 = (de: string, en: string) => (lang === 'en' ? en : de);
  const route = edge.route ?? 'auto';
  const { h0, h1 } = headsOf(edge);
  const preset = (arrow: MMEdge['arrow']) => onChange({ arrow, h0: undefined, h1: undefined });
  const presetOn = (arrow: MMEdge['arrow']) => edge.arrow === arrow && edge.h0 === undefined && edge.h1 === undefined;
  return (
    <div className="flex flex-col gap-3" data-testid="mm-edge-sheet">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onLabel} className={chip(false)} data-testid="mm-edge-label-btn">{T.labelBtn}</button>
        <button type="button" onClick={onReverse} className={`${chip(false)} inline-flex items-center gap-1`} data-testid="mm-edge-reverse"><ArrowLeftRight size={13} /> {T.reverse}</button>
        {edge.bend !== 0 && (
          <button type="button" onClick={() => onChange({ bend: 0 })} className={chip(false)} data-testid="mm-edge-straight">{T.straight}</button>
        )}
        <button type="button" onClick={onRemove} className={`${chip(false)} inline-flex items-center gap-1 !text-[var(--color-danger)]`} data-testid="mm-edge-remove"><Trash2 size={13} /> {T.remove}</button>
      </div>
      <ColorField value={edge.color} onChange={(color) => onChange({ color })} lang={lang} compact testId="mm-edge-color" />
      <Slider label={L2('Deckkraft der Linie', 'Line opacity')} value={edge.op ?? 1} min={0.1} max={1} step={0.05} onChange={(op) => onChange({ op: op >= 1 ? undefined : op })} testId="mm-edge-op" format={(v) => `${Math.round(v * 100)} %`} />

      <div data-testid="mm-routes">
        <Cap>{L2('Verlauf der Linie', 'Course of the line')}</Cap>
        <div className="grid grid-cols-4 gap-1.5">
          {ROUTES.map((r) => (
            <button key={r.id} type="button" onClick={() => onChange({ route: r.id === 'auto' ? undefined : r.id, ...(r.id === 'angle' && !edge.bend ? { bend: 70 } : {}) })} className={`flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] py-1.5 ${route === r.id ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`} data-testid={`mm-route-${r.id}`} aria-pressed={route === r.id} aria-label={lang === 'en' ? r.en : r.de}>
              <RouteThumb id={r.id} />
              <span className="text-[10px] leading-tight text-center">{lang === 'en' ? r.en : r.de}</span>
            </button>
          ))}
        </div>
        {(route === 'wave' || route === 'zigzag') && (
          <div className="mt-2">
            <Slider label={route === 'wave' ? L2('Wellenhöhe', 'Wave height') : L2('Zackenhöhe', 'Zigzag height')} value={edge.amp ?? 14} min={3} max={50} step={1} onChange={(amp) => onChange({ amp })} testId="mm-amp" />
          </div>
        )}
        <Hint>{L2('Den runden Griff auf der Linie kannst du ziehen, um sie zu biegen oder zu knicken.', 'Drag the round handle on the line to bend or kink it.')}</Hint>
      </div>

      <div>
        <Cap>{T.line}</Cap>
        <div className="flex gap-2 flex-wrap">
          {([['solid', T.lineSolid], ['dashed', T.lineDashed], ['dotted', T.lineDotted]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => onChange({ dash: id })} className={`${chip(edge.dash === id)} inline-flex items-center gap-2`} style={edge.dash === id ? activeBg : undefined} data-testid={`mm-dash-${id}`} aria-label={label}>
              <DashThumb dash={id} width={3} />
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-6 flex-wrap">
        <div>
          <Cap>{T.width}</Cap>
          <div className="flex gap-2">
            {([[1, T.thin], [2, T.normal], [3, T.thick]] as const).map(([v, label]) => (
              <button key={v} type="button" onClick={() => onChange({ width: v, wpx: undefined })} className={chip(edge.width === v && edge.wpx === undefined)} style={edge.width === v && edge.wpx === undefined ? activeBg : undefined} data-testid={`mm-width-${v}`} aria-label={label}>
                <svg viewBox="0 0 24 10" width="24" height="10" aria-hidden="true"><line x1="2" y1="5" x2="22" y2="5" stroke="currentColor" strokeWidth={STROKE[v]} strokeLinecap="round" /></svg>
              </button>
            ))}
          </div>
        </div>
        <div className="basis-full">
          <Slider label={T.width} value={edgeStroke(edge)} min={1} max={20} step={0.5} onChange={(wpx) => onChange({ wpx })} testId="mm-edge-wpx" />
        </div>
      </div>

      <div data-testid="mm-heads">
        <Cap>{T.arrow}</Cap>
        <div className="flex gap-2 mb-2">
          {([['none', T.arrowNone, '—'], ['end', T.arrowEnd, '→'], ['both', T.arrowBoth, '↔']] as const).map(([id, label, glyph]) => (
            <button key={id} type="button" onClick={() => preset(id)} className={chip(presetOn(id))} style={presetOn(id) ? activeBg : undefined} data-testid={`mm-arrow-${id}`} aria-label={label}>
              {glyph}
            </button>
          ))}
        </div>
        {([['h0', L2('Spitze am Anfang', 'Head at the start'), h0, true], ['h1', L2('Spitze am Ende', 'Head at the end'), h1, false]] as const).map(([key, label, cur, start]) => (
          <div key={key} className="mb-2">
            <Cap>{label}</Cap>
            <div className="grid grid-cols-5 gap-1">
              {HEADS.map((h) => (
                <button key={h.id} type="button" onClick={() => onChange({ h0: key === 'h0' ? h.id : h0, h1: key === 'h1' ? h.id : h1 })} className={`flex flex-col items-center rounded-[var(--radius-md)] py-1 ${cur === h.id ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`} data-testid={`mm-${key === 'h0' ? 'head0' : 'head1'}-${h.id}`} aria-pressed={cur === h.id} aria-label={lang === 'en' ? h.en : h.de} title={lang === 'en' ? h.en : h.de}>
                  <HeadThumb head={h.id} start={start} />
                </button>
              ))}
            </div>
          </div>
        ))}
        {(h0 !== 'none' || h1 !== 'none') && <Slider label={L2('Größe der Spitzen', 'Size of the heads')} value={edge.hs ?? 1} min={0.6} max={2.5} step={0.1} onChange={(hs) => onChange({ hs: hs === 1 ? undefined : hs })} testId="mm-head-size" format={(v) => `${Math.round(v * 100)} %`} />}
      </div>

      <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
        <input type="checkbox" checked={!!edge.flow} onChange={(e) => onChange({ flow: e.target.checked || undefined })} data-testid="mm-edge-flow" />
        <Waves size={14} /> {T.flow}
      </label>
      <p className="text-[11.5px] text-[var(--color-text-faint)]" data-hint>{T.bendHint}</p>
    </div>
  );
}
