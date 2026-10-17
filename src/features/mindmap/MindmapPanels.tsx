import { ArrowLeftRight, Trash2, Waves } from 'lucide-react';
import { ColorPicker, EmojiPicker } from '../../components/shared/SymbolColorPicker';
import { SHAPES, shapePath, STROKE, dashArray, type MMDash, type MMEdge, type MMNode, type MMShape } from './mindmapModel';
import type { MindmapTexts } from './mindmapTexts';

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

export type StyleTab = 'shape' | 'color' | 'symbol' | 'size';

export function NodeStyleSheet({ node, tab, setTab, onChange, T, lang }: { node: MMNode; tab: StyleTab; setTab: (t: StyleTab) => void; onChange: (patch: Partial<MMNode>) => void; T: MindmapTexts; lang: 'de' | 'en' }) {
  const tabs: [StyleTab, string][] = [
    ['shape', T.shape],
    ['color', T.color],
    ['symbol', T.symbol],
    ['size', T.size],
  ];
  return (
    <div data-testid="mm-style-sheet">
      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={chip(tab === id)} style={tab === id ? activeBg : undefined} data-testid={`mm-tab-${id}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'shape' && (
        <div className="grid grid-cols-5 gap-2" data-testid="mm-shapes">
          {SHAPES.map((s) => (
            <button key={s.id} type="button" onClick={() => onChange({ shape: s.id, ...(s.id === 'frame' && !node.fw ? { fw: 340, fh: 240 } : {}) })} className={`flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] py-1.5 ${node.shape === s.id ? 'text-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'text-[var(--color-text-muted)]'}`} data-testid={`mm-shape-${s.id}`} aria-label={lang === 'en' ? s.en : s.de}>
              <ShapeThumb shape={s.id} active={node.shape === s.id} />
              <span className="text-[10px] leading-tight text-center">{lang === 'en' ? s.en : s.de}</span>
            </button>
          ))}
        </div>
      )}
      {tab === 'color' && (
        <div className="flex flex-col gap-3">
          <ColorPicker value={node.color} onChange={(color) => onChange({ color })} />
          <div>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{T.look}</p>
            <div className="flex gap-2">
              {([['solid', T.lookSolid], ['soft', T.lookSoft], ['outline', T.lookOutline]] as const).map(([id, label]) => (
                <button key={id} type="button" onClick={() => onChange({ look: id })} className={chip(node.look === id)} style={node.look === id ? activeBg : undefined} data-testid={`mm-look-${id}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === 'symbol' && (
        <div className="flex flex-col gap-2">
          <EmojiPicker value={node.symbol ?? ''} onChange={(symbol) => onChange({ symbol: symbol || undefined })} />
          {node.symbol && (
            <button type="button" className="self-start text-[13px] text-[var(--color-text-muted)] underline underline-offset-2" onClick={() => onChange({ symbol: undefined })} data-testid="mm-symbol-clear">
              {T.noSymbol}
            </button>
          )}
        </div>
      )}
      {tab === 'size' && (
        <div className="flex gap-2">
          {([[1, T.sizeS], [2, T.sizeM], [3, T.sizeL], [4, T.sizeXL]] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => onChange({ size: v })} className={chip(node.size === v)} style={node.size === v ? activeBg : undefined} data-testid={`mm-size-${v}`}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
              <button key={v} type="button" onClick={() => onChange({ width: v })} className={chip(edge.width === v)} style={edge.width === v ? activeBg : undefined} data-testid={`mm-width-${v}`} aria-label={label}>
                <svg viewBox="0 0 24 10" width="24" height="10" aria-hidden="true"><line x1="2" y1="5" x2="22" y2="5" stroke="currentColor" strokeWidth={STROKE[v]} strokeLinecap="round" /></svg>
              </button>
            ))}
          </div>
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
