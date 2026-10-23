import { ArrowLeftRight, Trash2, Users, Waves } from 'lucide-react';
import { ColorPicker, EmojiPicker } from '../../components/shared/SymbolColorPicker';
import { ANIMS, BORDERS, FONTS, PENS, SHAPES, STROKE, dashArray, edgeStroke, layoutNode, shapePath, type LayerMove, type MMAnim, type MMBorder, type MMDash, type MMEdge, type MMImgStyle, type MMNode, type MMShape } from './mindmapModel';
import { DOODLES, DOODLE_GROUPS, doodleOf } from './doodles';
import type { MindmapTexts } from './mindmapTexts';
import type { MindmapExtraTexts } from './mindmapExtraTexts';

const chip = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-[13px] border transition-colors ${active ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`;
const activeBg = { background: 'var(--color-primary)' };

export function ShapeThumb({ shape, active }: { shape: MMShape; active: boolean }) {
  return (
    <svg viewBox="-24 -17 48 34" width="48" height="34" aria-hidden="true">
      {shape === 'plain' ? (
        <text x="0" y="6" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor">Aa</text>
      ) : (
        <path d={shapePath(shape, shape === 'circle' ? 28 : 38, shape === 'circle' ? 28 : shape === 'frame' ? 28 : 24)} fill={active ? 'rgba(62,124,99,0.18)' : 'none'} stroke="currentColor" strokeWidth="2" strokeDasharray={shape === 'frame' ? '4 3' : undefined} />
      )}
    </svg>
  );
}

export type StyleTab = 'shape' | 'color' | 'symbol' | 'size' | 'text' | 'border' | 'arrange' | 'motion' | 'photo';

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
}

/** which tabs make sense for what is selected */
export function tabsFor(node: MMNode): StyleTab[] {
  switch (node.shape) {
    case 'draw':
      return ['color', 'border', 'size', 'arrange', 'motion'];
    case 'doodle':
      return ['shape', 'color', ...(doodleOf(node.doodle).text ? (['text'] as StyleTab[]) : []), 'border', 'size', 'arrange', 'motion'];
    case 'sticker':
      return ['symbol', 'size', 'arrange', 'motion'];
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
  const names: Record<StyleTab, string> = { shape: T.shape, color: T.color, symbol: T.symbol, size: T.size, text: X.tabText, border: node.shape === 'draw' ? X.tabLine : X.tabBorder, arrange: X.tabArrange, motion: X.tabMotion, photo: X.tabPhoto };
  const tabs = tabsFor(node);
  if (!tabs.includes(tab)) tab = tabs[0];
  const L = layoutNode(node);
  const regular = !['draw', 'doodle', 'image', 'sticker', 'maplink'].includes(node.shape);
  const dd = node.shape === 'doodle' ? doodleOf(node.doodle) : null;
  const baseW = Math.round(L.w / L.k);
  const baseH = Math.round(L.h / L.k);
  const isFrameLike = node.shape === 'frame' || node.shape === 'maplink';
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
        <div className="grid grid-cols-5 gap-2" data-testid="mm-shapes">
          {SHAPES.map((s) => (
            <button key={s.id} type="button" onClick={() => onChange({ shape: s.id, ...(s.id === 'frame' && !node.fw ? { fw: 340, fh: 240 } : {}) })} className={`flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] py-1.5 ${node.shape === s.id ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`} data-testid={`mm-shape-${s.id}`} aria-label={lang === 'en' ? s.en : s.de}>
              <ShapeThumb shape={s.id} active={node.shape === s.id} />
              <span className="text-[10px] leading-tight text-center">{lang === 'en' ? s.en : s.de}</span>
            </button>
          ))}
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

      {tab === 'color' && (
        <div className="flex flex-col gap-3">
          <ColorPicker value={node.color} onChange={(color) => onChange({ color })} />
          {node.shape === 'draw' ? (
            <div>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{X.penKind}</p>
              <div className="flex gap-2">
                {PENS.map((p) => (
                  <button key={p.id} type="button" onClick={() => onChange({ pen: p.id })} className={chip((node.pen ?? 'pen') === p.id)} style={(node.pen ?? 'pen') === p.id ? activeBg : undefined} data-testid={`mm-pen-kind-${p.id}`}>
                    {lang === 'en' ? p.en : p.de}
                  </button>
                ))}
              </div>
            </div>
          ) : node.shape !== 'image' && node.shape !== 'sticker' && node.shape !== 'maplink' ? (
            <div>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{node.shape === 'doodle' ? X.fill : T.look}</p>
              <div className="flex gap-2">
                {([['solid', T.lookSolid], ['soft', T.lookSoft], ['outline', T.lookOutline]] as const).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => onChange({ look: id })} className={chip(node.look === id)} style={node.look === id ? activeBg : undefined} data-testid={`mm-look-${id}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {tab === 'text' && (
        <div className="flex flex-col gap-3" data-testid="mm-text-style">
          <div>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{X.font}</p>
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
        </div>
      )}

      {tab === 'border' && (
        <div className="flex flex-col gap-3" data-testid="mm-border-sheet">
          {node.shape !== 'draw' && (
            <div>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{X.borderStyle}</p>
              <div className="flex flex-wrap gap-1.5">
                {BORDERS.map((b) => {
                  const cur: MMBorder = node.border ?? dd?.dash ?? (node.shape === 'frame' ? 'dashed' : 'solid');
                  return (
                    <button key={b.id} type="button" onClick={() => onChange({ border: b.id })} className={chip(cur === b.id)} style={cur === b.id ? activeBg : undefined} data-testid={`mm-border-${b.id}`}>
                      {lang === 'en' ? b.en : b.de}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Slider label={X.borderWidth} value={node.sw ?? (node.shape === 'draw' || node.shape === 'doodle' ? 3 : node.look === 'outline' ? 3 : node.shape === 'frame' ? 2 : 2)} min={node.shape === 'draw' ? 1 : 0.5} max={node.shape === 'draw' ? 30 : 14} step={0.5} onChange={(sw) => onChange({ sw })} testId="mm-sw" />
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
        <div className="flex flex-col gap-2">
          <EmojiPicker value={node.symbol ?? ''} onChange={(symbol) => onChange({ symbol: symbol || undefined })} />
          {node.symbol && regular && (
            <button type="button" className="self-start text-[13px] text-[var(--color-text-muted)] underline underline-offset-2" onClick={() => onChange({ symbol: undefined })} data-testid="mm-symbol-clear">
              {T.noSymbol}
            </button>
          )}
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
          {!isFrameLike && (
            <>
              <Slider label={X.sizeFree} value={node.sc ?? 1} min={0.3} max={4} step={0.05} onChange={(sc) => onChange({ sc })} testId="mm-sc" format={(v) => `${Math.round(v * 100)} %`} />
              <div className="flex gap-2">
                <button type="button" onClick={() => actions.scaleBy(1 / 1.15)} className={chip(false)} data-testid="mm-smaller">− {X.sizeSmaller}</button>
                <button type="button" onClick={() => actions.scaleBy(1.15)} className={chip(false)} data-testid="mm-bigger">+ {X.sizeBigger}</button>
              </div>
            </>
          )}
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
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{X.layers}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([['front', X.toFront], ['forward', X.forward], ['backward', X.backward], ['back', X.toBack]] as [LayerMove, string][]).map(([how, label]) => (
                <button key={how} type="button" onClick={() => actions.layer(how)} className={chip(false)} data-testid={`mm-layer-${how}`}>{label}</button>
              ))}
            </div>
          </div>
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
                <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{X.animSpeed}</p>
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

export function EdgeStyleSheet({ edge, onChange, onLabel, onReverse, onRemove, T }: { edge: MMEdge; onChange: (patch: Partial<MMEdge>) => void; onLabel: () => void; onReverse: () => void; onRemove: () => void; T: MindmapTexts }) {
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
      <ColorPicker value={edge.color} onChange={(color) => onChange({ color })} />
      <div>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{T.line}</p>
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
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{T.width}</p>
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
        <div>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{T.arrow}</p>
          <div className="flex gap-2">
            {([['none', T.arrowNone, '—'], ['end', T.arrowEnd, '→'], ['both', T.arrowBoth, '↔']] as const).map(([id, label, glyph]) => (
              <button key={id} type="button" onClick={() => onChange({ arrow: id })} className={chip(edge.arrow === id)} style={edge.arrow === id ? activeBg : undefined} data-testid={`mm-arrow-${id}`} aria-label={label}>
                {glyph}
              </button>
            ))}
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
        <input type="checkbox" checked={!!edge.flow} onChange={(e) => onChange({ flow: e.target.checked || undefined })} data-testid="mm-edge-flow" />
        <Waves size={14} /> {T.flow}
      </label>
      <p className="text-[11.5px] text-[var(--color-text-faint)]" data-hint>{T.bendHint}</p>
    </div>
  );
}
