import { useRef, useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { resizeImageFile } from '../../services/imageResize';
import { ImageCropModal } from './ImageCropModal';

interface OwnImageControlProps {
  image: string;
  onChange: (url: string) => void;
  /** what to fall back to when the person removes their own photo */
  fallback: () => string;
}

const TXT = {
  de: { upload: 'Eigenes Foto hinzufügen', replace: 'Anderes eigenes Foto', remove: 'Eigenes Foto entfernen', mine: 'Dein Foto' },
  en: { upload: 'Add your own photo', replace: 'Choose another photo', remove: 'Remove your photo', mine: 'Your photo' },
};

/**
 * The example pictures stay as they are — this adds the other half:
 * the person's own photo (a place they know, their own cup, the real
 * path). Resized, cropped by the person, stored as a data URL like the
 * other own images in the app. Shown as a small preview with a way
 * back to the examples.
 */
export function OwnImageControl({ image, onChange, fallback }: OwnImageControlProps) {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const isOwn = image.startsWith('data:');

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    resizeImageFile(file, 1200)
      .then((dataUrl) => setCropSrc(dataUrl))
      .catch(() => undefined);
  }

  return (
    <div className="flex flex-col gap-2">
      {isOwn && (
        <div className="flex items-center gap-3">
          <img src={image} alt={T.mine} className="w-20 h-20 rounded-[var(--radius-md)] object-cover border" style={{ borderColor: 'var(--color-primary)' }} />
          <button type="button" onClick={() => onChange(fallback())} className="flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]">
            <Trash2 size={14} /> {T.remove}
          </button>
        </div>
      )}
      <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] self-start">
        <Upload size={14} /> {isOwn ? T.replace : T.upload}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={(cropped) => {
            onChange(cropped);
            setCropSrc(null);
          }}
        />
      )}
    </div>
  );
}
