import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { ownMediaUrl } from '../../services/mediaStore';
import { savePhotoForCard } from '../cards/cardStore';

/** Das Foto an einem Zettel (liegt nur auf diesem Gerät). */
export function SlipPhoto({ mediaId, className = '' }: { mediaId?: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (mediaId) void ownMediaUrl(mediaId).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [mediaId]);
  if (!mediaId || !url) return null;
  return <img src={url} alt="" className={`rounded-[4px] max-h-[180px] w-auto max-w-full object-cover border border-black/10 ${className}`} data-testid="slip-photo" />;
}

/** Unsichtbares Datei-Feld + Funktion zum Öffnen: Foto aufnehmen oder auswählen, verkleinern, ablegen. */
export function usePhotoPicker(onPicked: (mediaId: string) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      className="hidden"
      data-testid="slip-photo-input"
      onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        const id = await savePhotoForCard(f);
        if (id) onPicked(id);
      }}
    />
  );
  return { input, open: () => ref.current?.click() };
}

export function PhotoButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full text-[13px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]" data-testid="slip-photo-btn">
      <Camera size={15} /> {label}
    </button>
  );
}
