import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Pipette, Plus, Trash2, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { BUILTIN_PALETTES, colorsOfMap, deletePalette, paletteName, pushRecentColor, removeOwnColor, savePalette, setActivePalette, toggleOwnColor, useSavedColors, usePalettes, type MMPalette } from './mindmapPalettes';

/** the colours used on the current map (offered when an own palette is made) */
export const MapColorsContext = createContext<string[]>([]);

const HEX = /^#[0-9a-fA-F]{6}$/;
const chipCls = (active: boolean) => `px-3 py-1 rounded-full text-[12.5px] border shrink-0 ${active ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`;
const activeBg = { background: 'var(--color-primary)' };

/** photos on the current map (offered when a colour is picked from a photo) */
export const MapPhotosContext = createContext<string[]>([]);

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };
const eyeDropper = (): EyeDropperCtor | undefined => (typeof window !== 'undefined' ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined);

const swatch = (c: string, on: boolean, size = 28) => ({ width: size, height: size, background: c, border: '1.5px solid rgba(0,0,0,0.16)', outline: on ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }) as const;

/**
 * Colour choice, kept short so the map stays visible: first what you used last and your own saved colours
 * (the quick start), then ONE palette row (pick the palette from a small list), then own colour, pipette
 * and "from a photo". Optionally "no colour" (for fills, borders …).
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
  const { recent, own } = useSavedColors();
  const [edit, setEdit] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [manage, setManage] = useState(false);
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const cur = value && HEX.test(value) ? value.toLowerCase() : undefined;
  const inPalette = cur ? active.colors.some((c) => c.toLowerCase() === cur) : false;
  const pick = (c: string) => {
    onChange(c);
    pushRecentColor(c);
  };
  const Eye = eyeDropper();
  async function pipette() {
    if (!Eye) return;
    try {
      const r = await new Eye().open();
      if (HEX.test(r.sRGBHex)) pick(r.sRGBHex.toLowerCase());
    } catch { /* cancelled */ }
  }
  const small = 'text-[11px] uppercase tracking-wide text-[var(--color-text-faint)]';
  const row = 'flex gap-2 items-center overflow-x-auto pb-1';
  const showQuick = !compact || recent.length > 0 || own.length > 0;
  return (
    <div data-testid={testId}>
      {label && <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{label}</p>}
      {showQuick && (recent.length > 0 || own.length > 0 || cur) && (
        <div className="flex flex-col gap-1.5 mb-2" data-testid={`${testId}-quick`}>
          {recent.length > 0 && (
            <div>
              <p className={small}>{L('Zuletzt benutzt', 'Recently used')}</p>
              <div className={row}>
                {recent.slice(0, compact ? 6 : 10).map((c) => (
                  <button key={c} type="button" onClick={() => pick(c)} className="rounded-full shrink-0" style={swatch(c, !none && cur === c)} aria-label={c} data-testid={`${testId}-recent`} />
                ))}
              </div>
            </div>
          )}
          {(own.length > 0 || (cur && !own.includes(cur))) && (
            <div>
              <p className={small}>
                {L('Meine Farben', 'My colours')}
                {own.length > 0 && (
                  <button type="button" onClick={() => setManage((v) => !v)} className="ml-2 normal-case underline underline-offset-2" data-testid={`${testId}-own-manage`}>
                    {manage ? L('fertig', 'done') : L('aufräumen', 'tidy up')}
                  </button>
                )}
              </p>
              <div className={row}>
                {own.map((c) => (
                  <span key={c} className="relative shrink-0">
                    <button type="button" onClick={() => (manage ? removeOwnColor(c) : pick(c))} className="rounded-full block" style={swatch(c, !none && cur === c)} aria-label={manage ? L('Farbe entfernen', 'Remove colour') + ' ' + c : c} data-testid={`${testId}-own`} />
                    {manage && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-surface)] shadow flex items-center justify-center pointer-events-none"><X size={10} /></span>}
                  </span>
                ))}
                {cur && !own.includes(cur) && (
                  <button type="button" onClick={() => toggleOwnColor(cur)} className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]" data-testid={`${testId}-own-add`}>
                    <Plus size={12} /> <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: cur, border: '1px solid rgba(0,0,0,0.2)' }} /> {L('merken', 'save')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {!compact && (
        <div className="flex items-center gap-2 mb-1.5">
          <p className={small}>{L('Palette', 'Palette')}</p>
          <select value={active.id} onChange={(e) => (e.target.value === '__new' ? setEdit(true) : setActivePalette(e.target.value))} className="text-[12.5px] rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1 max-w-[190px]" aria-label={L('Farbpalette', 'Colour palette')} data-testid={`${testId}-pal-select`}>
            {palettes.map((p) => (
              <option key={p.id} value={p.id}>{paletteName(p, lang)}</option>
            ))}
            <option value="__new">+ {L('Eigene Palette …', 'Own palette …')}</option>
          </select>
        </div>
      )}
      <div className={row} data-testid={`${testId}-row`}>
        {onNone && (
          <button type="button" onClick={onNone} className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[13px]" style={{ background: 'var(--color-surface)', border: '1.5px dashed var(--color-text-faint)', color: 'var(--color-text-muted)', outline: none ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} aria-label={noneLabel ?? L('Ohne', 'None')} title={noneLabel ?? L('Ohne', 'None')}>
            ⌀
          </button>
        )}
        {active.colors.map((c) => (
          <button key={c} type="button" onClick={() => pick(c)} className="rounded-full shrink-0" style={swatch(c, !none && cur === c.toLowerCase())} aria-label={c} data-testid={`${testId}-sw`} />
        ))}
        <label className="relative w-7 h-7 shrink-0 rounded-full overflow-hidden cursor-pointer" style={{ background: cur && !inPalette && !none ? cur : 'conic-gradient(#e8a83d, #6fbf73, #4a8f9e, #9a7bc4, #d9778a, #e8a83d)', outline: cur && !inPalette && !none ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} title={L('Eigene Farbe', 'Own colour')}>
          <input type="color" value={cur ?? '#6aa08a'} onChange={(e) => pick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={L('Eigene Farbe', 'Own colour')} data-testid={`${testId}-custom`} />
        </label>
        {Eye && (
          <button type="button" onClick={() => void pipette()} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center border border-[var(--color-border-strong)] text-[var(--color-text-muted)]" title={L('Pipette: Farbe vom Bildschirm', 'Pipette: pick a colour from the screen')} aria-label={L('Pipette', 'Pipette')} data-testid={`${testId}-pipette`}>
            <Pipette size={14} />
          </button>
        )}
        <button type="button" onClick={() => setPhoto(true)} className="shrink-0 h-7 px-2.5 rounded-full inline-flex items-center gap-1 text-[12px] border border-[var(--color-border-strong)] text-[var(--color-text-muted)]" title={L('Farbe aus einem Foto wählen', 'Pick a colour from a photo')} data-testid={`${testId}-photo`}>
          <ImageIcon size={13} /> {L('Foto', 'Photo')}
        </button>
      </div>
      {edit && <PaletteModal lang={lang} startColor={cur} onClose={() => setEdit(false)} />}
      {photo && <PhotoColorModal lang={lang} onClose={() => setPhoto(false)} onPick={(c) => { pick(c); setPhoto(false); }} />}
    </div>
  );
}

/** pick a colour from a photo: your own (from the device) or one that is already on the map */
export function PhotoColorModal({ lang, onClose, onPick }: { lang: 'de' | 'en'; onClose: () => void; onPick: (c: string) => void }) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const mapPhotos = useContext(MapPhotosContext);
  const [src, setSrc] = useState<string | null>(mapPhotos[0] ?? null);
  const [col, setCol] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const cv = canvasRef.current;
      if (!cv) return;
      const max = 320;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      cv.width = Math.max(1, Math.round(img.width * k));
      cv.height = Math.max(1, Math.round(img.height * k));
      cv.getContext('2d', { willReadFrequently: true })?.drawImage(img, 0, 0, cv.width, cv.height);
      setErr('');
    };
    img.onerror = () => setErr(L('Dieses Bild lässt sich nicht lesen.', 'This image cannot be read.'));
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  function sample(e: React.PointerEvent<HTMLCanvasElement>) {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const x = Math.min(cv.width - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * cv.width)));
    const y = Math.min(cv.height - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * cv.height)));
    try {
      const d = cv.getContext('2d')!.getImageData(x, y, 1, 1).data;
      if (d[3] === 0) return;
      setCol('#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join(''));
    } catch {
      setErr(L('Aus diesem Bild kann keine Farbe gelesen werden.', 'No colour can be read from this image.'));
    }
  }
  function onFile(f: File | undefined) {
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => setSrc(String(fr.result));
    fr.readAsDataURL(f);
  }
  return (
    <Modal open onClose={onClose} title={L('Farbe aus einem Foto', 'Colour from a photo')}>
      <div className="flex flex-col gap-3" data-testid="mm-photo-color">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">{L('Tipp oder zieh über das Bild – unten siehst du die Farbe. Das Foto bleibt auf deinem Gerät.', 'Tap or drag over the picture – the colour shows below. The photo stays on your device.')}</p>
        <div className="flex gap-2 flex-wrap items-center">
          <label className="px-3 py-1.5 rounded-full text-[13px] border border-[var(--color-border-strong)] cursor-pointer">
            {L('Foto wählen …', 'Choose a photo …')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} data-testid="mm-photo-color-file" />
          </label>
          {mapPhotos.slice(0, 6).map((u, i) => (
            <button key={i} type="button" onClick={() => setSrc(u)} className="w-10 h-10 rounded-[var(--radius-md)] bg-cover bg-center border border-[var(--color-border)]" style={{ backgroundImage: `url(${u})`, outline: src === u ? '2px solid var(--color-primary)' : 'none' }} aria-label={L('Foto von der Mindmap', 'Photo from the map')} />
          ))}
        </div>
        {src ? (
          <canvas ref={canvasRef} onPointerDown={sample} onPointerMove={(e) => { if (e.buttons) sample(e); }} className="w-full rounded-[var(--radius-md)] touch-none" style={{ maxHeight: 280, objectFit: 'contain', cursor: 'crosshair' }} data-testid="mm-photo-color-canvas" />
        ) : (
          <p className="text-[13px] text-[var(--color-text-faint)]">{L('Wähle zuerst ein Foto.', 'Choose a photo first.')}</p>
        )}
        {err && <p className="text-[12.5px]" style={{ color: 'var(--color-danger, #c0392b)' }} role="status">{err}</p>}
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full" style={{ background: col ?? 'transparent', border: '1.5px solid rgba(0,0,0,0.2)' }} data-testid="mm-photo-color-preview" />
          <span className="text-[13px] text-[var(--color-text-muted)]">{col ?? L('noch keine Farbe', 'no colour yet')}</span>
          <button type="button" disabled={!col} onClick={() => col && onPick(col)} className="ml-auto px-4 py-2 rounded-full text-[14px] text-white disabled:opacity-40" style={activeBg} data-testid="mm-photo-color-take">{L('Diese Farbe nehmen', 'Use this colour')}</button>
        </div>
      </div>
    </Modal>
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
