import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useT } from '../../i18n';
import { createCustomPalette, type CustomPalette } from '../../services/customPalettes';

interface CreatePaletteModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (palette: CustomPalette) => void;
}

export function CreatePaletteModal({ open, onClose, onCreated }: CreatePaletteModalProps) {
  const t = useT();
  const [name, setName] = useState('');
  const [bg, setBg] = useState('#F5F1E8');
  const [primary, setPrimary] = useState('#3D5C46');

  function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const palette = createCustomPalette(trimmed, bg, primary);
    onCreated(palette);
    setName('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.settings.createPaletteTitle} subtitle={t.settings.createPaletteHint}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.settings.paletteNameLabel}</span>
          <input
            autoFocus
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.settings.paletteNamePlaceholder}
            maxLength={24}
          />
        </label>

        <div className="flex gap-4">
          <label className="flex flex-col items-center gap-1.5">
            <span className="relative w-14 h-14 rounded-full overflow-hidden cursor-pointer border border-[var(--color-border)]">
              <span className="absolute inset-0" style={{ background: bg }} />
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </span>
            <span className="text-[12px] text-[var(--color-text-muted)]">{t.settings.paletteBgLabel}</span>
          </label>
          <label className="flex flex-col items-center gap-1.5">
            <span className="relative w-14 h-14 rounded-full overflow-hidden cursor-pointer border border-[var(--color-border)]">
              <span className="absolute inset-0" style={{ background: primary }} />
              <input
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </span>
            <span className="text-[12px] text-[var(--color-text-muted)]">{t.settings.palettePrimaryLabel}</span>
          </label>
        </div>

        <div className="rounded-[var(--radius-lg)] p-4 border border-[var(--color-border)]" style={{ background: bg }}>
          <div
            className="inline-block rounded-full px-4 py-2 text-[13px] text-white"
            style={{ background: primary }}
          >
            {t.settings.palettePreview}
          </div>
        </div>

        <Button onClick={create} fullWidth disabled={!name.trim()}>
          {t.settings.savePalette}
        </Button>
      </div>
    </Modal>
  );
}
