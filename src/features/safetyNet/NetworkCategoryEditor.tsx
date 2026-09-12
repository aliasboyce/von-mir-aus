import { useEffect, useState } from 'react';
import { Check, Palette as PaletteIcon, Save } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { categoryLabel } from './networkMeta';
import { networkPaletteStore, customPalettesRepo } from './networkCategories';
import { createId } from '../../services/storage/repository';
import type { ColorPalette, NetworkCategoryConfig } from '../../data/types';

interface NetworkCategoryEditorProps {
  open: boolean;
  onClose: () => void;
  categories: NetworkCategoryConfig[];
  onChangeCategories: (next: NetworkCategoryConfig[]) => void;
}

export function NetworkCategoryEditor({
  open,
  onClose,
  categories,
  onChangeCategories,
}: NetworkCategoryEditorProps) {
  const t = useT();
  const [palettes, setPalettes] = useState<ColorPalette[]>(() => networkPaletteStore.getAllPalettes());
  const [activeId, setActiveId] = useState(() => networkPaletteStore.getActivePaletteId());
  const [creatingPalette, setCreatingPalette] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [draftColors, setDraftColors] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, c.color])),
  );

  // The component is mounted once by the parent page and only toggles
  // visibility via the `open` prop (see Modal.tsx), so without this effect
  // the palette list and draft colors would go stale after the first open —
  // e.g. a palette created in an earlier session, or a category added via
  // the "+ Neue Kategorie" flow elsewhere, wouldn't show up until reload.
  useEffect(() => {
    if (!open) return;
    setPalettes(networkPaletteStore.getAllPalettes());
    setActiveId(networkPaletteStore.getActivePaletteId());
    setDraftColors(Object.fromEntries(categories.map((c) => [c.id, c.color])));
    setCreatingPalette(false);
    setNewPaletteName('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function applyPalette(palette: ColorPalette) {
    setActiveId(palette.id);
    networkPaletteStore.setActivePaletteId(palette.id);
    const next = networkPaletteStore.applyPalette(palette, categories);
    onChangeCategories(next);
    setDraftColors(Object.fromEntries(next.map((c) => [c.id, c.color])));
  }

  function setCategoryColor(id: string, color: string) {
    setDraftColors((d) => ({ ...d, [id]: color }));
    onChangeCategories(categories.map((c) => (c.id === id ? { ...c, color } : c)));
  }

  function saveAsNewPalette() {
    const name = newPaletteName.trim();
    if (!name) return;
    const palette: ColorPalette = {
      id: createId('palette'),
      name,
      isCustom: true,
      colors: draftColors,
    };
    customPalettesRepo.save(palette);
    const all = networkPaletteStore.getAllPalettes();
    setPalettes(all);
    setActiveId(palette.id);
    networkPaletteStore.setActivePaletteId(palette.id);
    setNewPaletteName('');
    setCreatingPalette(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={t.network.manageCategories} subtitle={t.network.manageCategoriesHint}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">{t.network.palette}</p>
          <div className="flex flex-col gap-2">
            {palettes.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPalette(p)}
                className={`flex items-center gap-3 rounded-[var(--radius-md)] border p-2.5 text-left ${
                  activeId === p.id ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)]'
                }`}
              >
                <div className="flex -space-x-1.5">
                  {Object.values(p.colors)
                    .slice(0, 4)
                    .map((c, i) => (
                      <span
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-[var(--color-surface)]"
                        style={{ background: c }}
                      />
                    ))}
                </div>
                <span className="text-[14px] flex-1">{p.name}</span>
                {activeId === p.id && <Check size={16} className="text-[var(--color-primary)]" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">
            {t.network.manageCategories}
          </p>
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <label className="relative w-9 h-9 rounded-full flex-shrink-0 overflow-hidden cursor-pointer border border-[var(--color-border)]">
                  <span className="absolute inset-0" style={{ background: draftColors[c.id] ?? c.color }} />
                  <input
                    type="color"
                    value={draftColors[c.id] ?? c.color}
                    onChange={(e) => setCategoryColor(c.id, e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    aria-label={`Farbe für ${categoryLabel(t, c)}`}
                  />
                </label>
                <span className="text-[14px] text-[var(--color-text)]">{categoryLabel(t, c)}</span>
              </div>
            ))}
          </div>
        </div>

        {!creatingPalette ? (
          <Button variant="secondary" fullWidth icon={<PaletteIcon size={16} />} onClick={() => setCreatingPalette(true)}>
            {t.network.newPalette}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              className="input"
              placeholder={t.network.newPaletteName}
              value={newPaletteName}
              onChange={(e) => setNewPaletteName(e.target.value)}
            />
            <button
              type="button"
              onClick={saveAsNewPalette}
              aria-label={t.network.savePalette}
              className="p-2.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex-shrink-0"
            >
              <Save size={16} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
