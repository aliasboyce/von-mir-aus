import { createContext, useContext, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { BUILTIN_PALETTES, colorsOfMap, deletePalette, paletteName, savePalette, setActivePalette, usePalettes, type MMPalette } from './mindmapPalettes';

/** the colours used on the current map (offered when an own palette is made) */
export const MapColorsContext = createContext<string[]>([]);

const HEX = /^#[0-9a-fA-F]{6}$/;
const chipCls = (active: boolean) => `px-3 py-1 rounded-full text-[12.5px] border shrink-0 ${active ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`;
const activeBg = { background: 'var(--color-primary)' };

/**
 * Colour choice with palettes: pick a palette (ready-made or your own), then a colour from it.
 * Optionally "no colour" (for fills, borders …) and any own colour.
 */
export function ColorField({
  value,
  onChange,
  label,
  lang,
  none,
  onNone,
  noneLabel,
  testId = 'mm-color',
  compact = false,
}: {
  value: string | undefined;
  onChange: (c: string) => void;
  label?: string;
  lang: 'de' | 'en';
  /** show an "without" swatch; `none` says whether it is the current state */
  none?: boolean;
  onNone?: () => void;
  noneLabel?: string;
  testId?: string;
  compact?: boolean;
}) {
  const { palettes, active } = usePalettes();
  const [edit, setEdit] = useState(false);
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const cur = value && HEX.test(value) ? value.toLowerCase() : undefined;
  const inPalette = cur ? active.colors.some((c) => c.toLowerCase() === cur) : false;
  return (
    <div data-testid={testId}>
      {label && <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{label}</p>}
      {!compact && (
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-1" role="tablist" aria-label={L('Farbpaletten', 'Colour palettes')}>
          {palettes.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={p.id === active.id} onClick={() => setActivePalette(p.id)} className={chipCls(p.id === active.id)} style={p.id === active.id ? activeBg : undefined} data-testid={`${testId}-pal-${p.id}`}>
              {paletteName(p, lang)}
            </button>
          ))}
          <button type="button" onClick={() => setEdit(true)} className={`${chipCls(false)} inline-flex items-center gap-1`} data-testid={`${testId}-pal-edit`}>
            <Plus size={13} /> {L('Eigene Palette', 'Own palette')}
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        {onNone && (
          <button type="button" onClick={onNone} className="w-7 h-7 rounded-full flex items-center justify-center text-[13px]" style={{ background: 'var(--color-surface)', border: '1.5px dashed var(--color-text-faint)', color: 'var(--color-text-muted)', outline: none ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} aria-label={noneLabel ?? L('Ohne', 'None')} title={noneLabel ?? L('Ohne', 'None')} aria-pressed={!!none} data-testid={`${testId}-none`}>
            ⌀
          </button>
        )}
        {active.colors.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} className="w-7 h-7 rounded-full" style={{ background: c, border: '1.5px solid rgba(0,0,0,0.16)', outline: !none && cur === c.toLowerCase() ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} aria-label={c} data-testid={`${testId}-sw`} />
        ))}
        <label className="relative w-7 h-7 rounded-full overflow-hidden cursor-pointer" style={{ background: cur && !inPalette && !none ? cur : 'conic-gradient(#e8a83d, #6fbf73, #4a8f9e, #9a7bc4, #d9778a, #e8a83d)', outline: cur && !inPalette && !none ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} title={L('Eigene Farbe', 'Own colour')}>
          <input type="color" value={cur ?? '#6aa08a'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={L('Eigene Farbe', 'Own colour')} data-testid={`${testId}-custom`} />
        </label>
      </div>
      {edit && <PaletteModal lang={lang} startColor={cur} onClose={() => setEdit(false)} />}
    </div>
  );
}

/** make, change and delete your own palettes */
export function PaletteModal({ lang, onClose, startColor }: { lang: 'de' | 'en'; onClose: () => void; startColor?: string }) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const { palettes, active } = usePalettes();
  const mapColors = useContext(MapColorsContext);
  const own = palettes.filter((p) => !p.builtin);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [colors, setColors] = useState<string[]>(startColor && HEX.test(startColor) ? [startColor] : []);
  const [msg, setMsg] = useState('');
  const startNew = (from?: MMPalette) => {
    setEditId(null);
    setName(from ? `${paletteName(from, lang)} (2)` : '');
    setColors(from ? [...from.colors] : startColor && HEX.test(startColor) ? [startColor] : []);
    setMsg('');
  };
  const load = (p: MMPalette) => {
    setEditId(p.id);
    setName(p.name);
    setColors([...p.colors]);
    setMsg('');
  };
  const save = () => {
    if (!name.trim()) {
      setMsg(L('Gib der Palette einen Namen.', 'Give the palette a name.'));
      return;
    }
    if (!colors.length) {
      setMsg(L('Wähle mindestens eine Farbe.', 'Choose at least one colour.'));
      return;
    }
    const p = savePalette({ id: editId ?? undefined, name, colors });
    setEditId(p.id);
    setActivePalette(p.id);
    setMsg(L('Gespeichert – sie steht jetzt in allen Farbfeldern.', 'Saved – it now appears in all colour pickers.'));
  };
  return (
    <Modal open onClose={onClose} title={L('Eigene Farbpaletten', 'Your colour palettes')}>
      <div className="flex flex-col gap-3" data-testid="mm-palette-modal">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">{L('Speichere Farben unter einem Namen – zum Beispiel „Mein Blau“. Die fertigen Beispiele bleiben unverändert; du kannst sie als Vorlage kopieren.', 'Save colours under a name – for example “My blue”. The ready-made ones stay as they are; you can copy them as a starting point.')}</p>
        {own.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {own.map((p) => (
              <button key={p.id} type="button" onClick={() => load(p)} className={chipCls(editId === p.id)} style={editId === p.id ? activeBg : undefined} data-testid="mm-palette-own">
                {p.name}
              </button>
            ))}
          </div>
        )}
        <label className="block">
          <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Name der Palette', 'Palette name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L('z. B. Mein Blau', 'e.g. My blue')} className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-[15px] outline-none" data-testid="mm-palette-name" />
        </label>
        <div>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Farben', 'Colours')} ({colors.length}/24)</p>
          <div className="flex flex-wrap gap-2 items-center" data-testid="mm-palette-colors">
            {colors.map((c, i) => (
              <span key={`${c}-${i}`} className="relative">
                <label className="block w-9 h-9 rounded-full overflow-hidden cursor-pointer" style={{ background: c, border: '1.5px solid rgba(0,0,0,0.18)' }}>
                  <input type="color" value={c} onChange={(e) => setColors((cs) => cs.map((x, j) => (j === i ? e.target.value : x)))} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={c} />
                </label>
                <button type="button" onClick={() => setColors((cs) => cs.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--color-surface)] shadow flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Farbe entfernen', 'Remove colour')}>
                  <X size={11} />
                </button>
              </span>
            ))}
            {colors.length < 24 && (
              <label className="relative w-9 h-9 rounded-full border-2 border-dashed border-[var(--color-text-faint)] flex items-center justify-center cursor-pointer text-[var(--color-text-muted)]" title={L('Farbe hinzufügen', 'Add a colour')}>
                <Plus size={16} />
                <input type="color" value="#8fc1e3" onChange={(e) => setColors((cs) => (cs.length < 24 ? [...cs, e.target.value] : cs))} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={L('Farbe hinzufügen', 'Add a colour')} data-testid="mm-palette-add" />
              </label>
            )}
          </div>
        </div>
        {mapColors.length > 0 && (
          <button type="button" onClick={() => setColors((cs) => [...new Set([...cs, ...mapColors])].slice(0, 24))} className="self-start text-[13px] underline underline-offset-2 text-[var(--color-primary)]" data-testid="mm-palette-from-map">
            {L('Farben dieser Mindmap übernehmen', 'Take the colours of this mind map')}
          </button>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={save} className="px-5 py-2.5 rounded-full text-[14px] text-white" style={activeBg} data-testid="mm-palette-save">{editId ? L('Änderungen speichern', 'Save changes') : L('Palette speichern', 'Save palette')}</button>
          <button type="button" onClick={() => startNew()} className="px-4 py-2.5 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="mm-palette-new">{L('Neu', 'New')}</button>
          <button type="button" onClick={() => startNew(active)} className="px-4 py-2.5 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="mm-palette-copy">{L('Aktuelle kopieren', 'Copy current')}</button>
          {editId && (
            <button type="button" onClick={() => { deletePalette(editId); startNew(); setMsg(L('Palette gelöscht.', 'Palette deleted.')); }} className="px-4 py-2.5 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-danger)] inline-flex items-center gap-1" data-testid="mm-palette-delete"><Trash2 size={14} /> {L('Löschen', 'Delete')}</button>
          )}
        </div>
        {msg && <p className="text-[13px]" style={{ color: 'var(--color-primary)' }} role="status" data-testid="mm-palette-msg">{msg}</p>}
        <p className="text-[11.5px] text-[var(--color-text-faint)]">{L(`Es gibt ${BUILTIN_PALETTES.length} fertige Beispiele, darunter mehrere Pastellblau-Töne.`, `${BUILTIN_PALETTES.length} ready-made examples are included, among them several pastel blues.`)}</p>
      </div>
    </Modal>
  );
}

export { colorsOfMap };
