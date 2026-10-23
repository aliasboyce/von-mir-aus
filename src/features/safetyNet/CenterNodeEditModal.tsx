import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { resizeImageFile } from '../../services/imageResize';
import { PhotoPositioner } from './PhotoPositioner';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { getIcon, ICON_PICKER_ORDER } from '../../components/icons/networkIcons';
import type { CenterNodeConfig } from './networkCategories';

interface CenterNodeEditModalProps {
  open: boolean;
  config: CenterNodeConfig;
  onClose: () => void;
  onSave: (config: CenterNodeConfig) => void;
}

export function CenterNodeEditModal({ open, config, onClose, onSave }: CenterNodeEditModalProps) {
  const t = useT();
  const [draft, setDraft] = useState<CenterNodeConfig>(config);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImageFile(file)
      .then((dataUrl) => setDraft({ ...draft, photoDataUrl: dataUrl, iconKey: undefined }))
      .catch(() => {
        // rare (corrupt file, no canvas support) — leave the photo unchanged
      });
  }

  function save() {
    onSave(draft);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.network.centerNodeTitle} subtitle={t.network.centerNodeSubtitle}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: draft.color }}
          >
            {draft.photoDataUrl ? (
              <img
                src={draft.photoDataUrl}
                alt=""
                className="w-full h-full object-cover"
                style={{
                  transform: `translate(${draft.photoOffsetX ?? 0}%, ${draft.photoOffsetY ?? 0}%) scale(${draft.photoScale ?? 1})`,
                }}
              />
            ) : draft.iconKey ? (
              (() => {
                const Icon = getIcon(draft.iconKey, 'sparkles');
                return <Icon size={26} color="#fff" />;
              })()
            ) : (
              <span className="text-[13px] font-semibold text-white">{draft.label || 'ICH'}</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
            >
              <Upload size={14} /> {t.network.uploadPhoto}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {draft.photoDataUrl && (
              <button
                type="button"
                onClick={() => setDraft({ ...draft, photoDataUrl: undefined, photoScale: undefined, photoOffsetX: undefined, photoOffsetY: undefined })}
                className="flex items-center gap-1.5 text-[13px] text-[var(--color-danger)]"
              >
                <X size={14} /> {t.network.removePhoto}
              </button>
            )}
          </div>
        </div>

        {draft.photoDataUrl && (
          <PhotoPositioner
            photoDataUrl={draft.photoDataUrl}
            scale={draft.photoScale ?? 1}
            offsetX={draft.photoOffsetX ?? 0}
            offsetY={draft.photoOffsetY ?? 0}
            onChange={(patch) =>
              setDraft((d) => ({
                ...d,
                ...(patch.scale !== undefined && { photoScale: patch.scale }),
                ...(patch.offsetX !== undefined && { photoOffsetX: patch.offsetX }),
                ...(patch.offsetY !== undefined && { photoOffsetY: patch.offsetY }),
              }))
            }
          />
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.network.centerNodeLabel}</span>
          <input
            className="input"
            maxLength={12}
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.network.centerNodeColor}</span>
          <div className="flex items-center gap-3">
            <label className="relative w-10 h-10 rounded-full flex-shrink-0 overflow-hidden cursor-pointer border border-[var(--color-border)]">
              <span className="absolute inset-0" style={{ background: draft.color }} />
              <input
                type="color"
                value={draft.color}
                onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>
        </label>

        {!draft.photoDataUrl && (
          <div>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2 block">{t.network.icon}</span>
            <div className="flex flex-wrap gap-2">
              {ICON_PICKER_ORDER.map((key) => {
                const Icon = getIcon(key, key);
                const active = draft.iconKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraft({ ...draft, iconKey: active ? undefined : key })}
                    aria-pressed={active}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Button onClick={save} fullWidth>
          {t.common.save}
        </Button>
      </div>
    </Modal>
  );
}
