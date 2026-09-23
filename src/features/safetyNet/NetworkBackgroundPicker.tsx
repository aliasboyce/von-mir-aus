import { useRef, useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import { useT } from '../../i18n';
import { resizeImageFile } from '../../services/imageResize';
import {
  networkBackgroundStore,
  NETWORK_BACKGROUND_DEFAULT,
  NETWORK_COLOR_PRESETS,
  NETWORK_GRADIENT_PRESETS,
  type NetworkBackground,
} from './networkBackground';

interface NetworkBackgroundPickerProps {
  open: boolean;
  onClose: () => void;
  onChange: (bg: NetworkBackground) => void;
}

/**
 * "Sicherheitsnetz-Hintergrund einstellbar — Farbe, Verlauf oder
 * eigenes Bild, genau dort wo man sein Netzwerk hat"-Auftrag. Kept as
 * a small overlay right on SafetyNetPage rather than a separate
 * settings screen, since it only ever applies to this one canvas.
 */
export function NetworkBackgroundPicker({ open, onClose, onChange }: NetworkBackgroundPickerProps) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState<NetworkBackground>(() => networkBackgroundStore.get());

  if (!open) return null;

  function apply(bg: NetworkBackground) {
    networkBackgroundStore.set(bg);
    setCurrent(bg);
    onChange(bg);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImageFile(file, 1000)
      .then((dataUrl) => apply({ type: 'image', value: dataUrl }))
      .catch(() => {
        // rare (corrupt file, no canvas support) — leave background unchanged
      });
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full sm:max-w-[380px] sm:rounded-[var(--radius-xl)] rounded-t-[var(--radius-xl)] bg-[var(--color-surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[15px] font-medium text-[var(--color-text)]">{t.network.backgroundPickerTitle}</p>
          <button onClick={onClose} aria-label={t.common.close} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)]">
            <X size={16} />
          </button>
        </div>

        <button
          onClick={() => apply(NETWORK_BACKGROUND_DEFAULT)}
          className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-[var(--radius-lg)] text-[14px] mb-4"
          style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text)' }}
        >
          {t.network.backgroundDefault}
          {current.type === 'default' && <Check size={16} />}
        </button>

        <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.network.backgroundColorLabel}</p>
        <div className="flex flex-wrap gap-2.5 mb-4">
          {NETWORK_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => apply({ type: 'color', value: c })}
              aria-label={c}
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: c, border: current.type === 'color' && current.value === c ? '2.5px solid var(--color-primary)' : '1px solid var(--color-border)' }}
            >
              {current.type === 'color' && current.value === c && <Check size={16} />}
            </button>
          ))}
        </div>

        <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.network.backgroundGradientLabel}</p>
        <div className="flex flex-wrap gap-2.5 mb-4">
          {NETWORK_GRADIENT_PRESETS.map((g) => (
            <button
              key={g}
              onClick={() => apply({ type: 'gradient', value: g })}
              aria-label={t.network.backgroundGradientLabel}
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: g, border: current.type === 'gradient' && current.value === g ? '2.5px solid var(--color-primary)' : '1px solid var(--color-border)' }}
            >
              {current.type === 'gradient' && current.value === g && <Check size={16} color="#fff" />}
            </button>
          ))}
        </div>

        <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.network.backgroundImageLabel}</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-[13px]"
          style={{ border: '1.5px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <Upload size={14} />
          {t.resources.uploadOwnImage}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        {current.type === 'image' && (
          <div className="mt-3 w-full h-20 rounded-[var(--radius-lg)] bg-cover bg-center" style={{ backgroundImage: `url(${current.value})` }} />
        )}
      </div>
    </div>
  );
}
