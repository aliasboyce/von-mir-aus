import { useState } from 'react';
import { ChevronsDown, Plus, Trash2 } from 'lucide-react';
import { ColorField } from './MindmapColor';
import { deletePreset, presetPatch, savePreset, usePresets } from './mindmapPresets';
import { isBlock, type MMNode } from './mindmapModel';

/**
 * "Farbauswahl schneller, nicht immer erst auf Stil klicken": a small strip right above the bar —
 * colour, "everything below in this colour", saved presets and fold. Kept short on purpose so the map stays visible.
 */
export function QuickSheet({
  node,
  count,
  lang,
  onChange,
  onSubtree,
  onOpenStyle,
}: {
  node: MMNode;
  count: number;
  lang: 'de' | 'en';
  onChange: (patch: Partial<MMNode>) => void;
  onSubtree: () => void;
  onOpenStyle: () => void;
}) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const presets = usePresets();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const chip = 'px-3 py-1.5 rounded-full text-[12.5px] border border-[var(--color-border-strong)] text-[var(--color-text)] shrink-0';
  const foldable = (isBlock(node) || (!['draw', 'doodle', 'image', 'sticker', 'maplink', 'frame'].includes(node.shape)));
  const colorable = !['image', 'sticker'].includes(node.shape);
  return (
    <div className="flex flex-col gap-2.5" data-testid="mm-quick-sheet">
      {count > 1 && <p className="text-[12px] text-[var(--color-text-faint)]">{count} {L('ausgewählt', 'selected')}</p>}
      {colorable && <ColorField value={node.color} onChange={(color) => onChange({ color })} lang={lang} label={L('Farbe', 'Colour')} testId="mm-qcolor" />}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {colorable && count === 1 && (
          <button type="button" onClick={onSubtree} className={`${chip} inline-flex items-center gap-1`} data-testid="mm-subtree-color" title={L('Diese Farbe auch für alles, was von hier aus weitergeht', 'Use this colour for everything that continues from here')}>
            <ChevronsDown size={14} /> {L('Ab hier alles in dieser Farbe', 'Everything from here in this colour')}
          </button>
        )}
        {foldable && (
          <button type="button" onClick={() => onChange({ fold: node.fold ? undefined : true })} className={chip} aria-pressed={!!node.fold} data-testid="mm-quick-fold">
            {node.fold ? '▸ ' + L('Aufklappen', 'Unfold') : '▾ ' + L('Zuklappen', 'Fold')}
          </button>
        )}
        <button type="button" onClick={onOpenStyle} className={chip} data-testid="mm-quick-more">{L('Mehr im Stil …', 'More in Style …')}</button>
      </div>
      <div data-testid="mm-presets">
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">{L('Voreinstellungen', 'Presets')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 items-center">
          {presets.map((p) => (
            <span key={p.id} className="relative shrink-0 inline-flex">
              <button type="button" onClick={() => onChange(presetPatch(p, node))} className={`${chip} inline-flex items-center gap-1.5`} data-testid="mm-preset">
                <span className="w-3.5 h-3.5 rounded-full" style={{ background: p.style.fc ?? p.style.color ?? '#999', border: '1px solid rgba(0,0,0,0.2)' }} />
                {p.name}
              </button>
              <button type="button" onClick={() => deletePreset(p.id)} aria-label={L('Voreinstellung löschen', 'Delete preset') + ' ' + p.name} className="ml-0.5 text-[var(--color-text-faint)] px-1" data-testid="mm-preset-delete"><Trash2 size={12} /></button>
            </span>
          ))}
          {!naming ? (
            <button type="button" onClick={() => setNaming(true)} className={`${chip} inline-flex items-center gap-1 border-dashed`} data-testid="mm-preset-new">
              <Plus size={13} /> {L('Aktuellen Stil speichern', 'Save current style')}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 shrink-0">
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { savePreset(name, node); setName(''); setNaming(false); } }} placeholder={L('Name, z. B. „Wichtig“', 'Name, e.g. “Important”')} className="h-8 w-40 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-[12.5px]" data-testid="mm-preset-name" />
              <button type="button" disabled={!name.trim()} onClick={() => { savePreset(name, node); setName(''); setNaming(false); }} className="px-3 py-1.5 rounded-full text-[12.5px] text-white disabled:opacity-40" style={{ background: 'var(--color-primary)' }} data-testid="mm-preset-save">{L('Speichern', 'Save')}</button>
            </span>
          )}
        </div>
        {presets.length === 0 && !naming && <p className="text-[11.5px] text-[var(--color-text-faint)]">{L('Speichere Form, Farben und Text-Einstellungen unter einem Namen und wende sie mit einem Tipp auf anderes an.', 'Save shape, colours and text settings under a name and apply them to other things with one tap.')}</p>}
      </div>
    </div>
  );
}
