import { useEffect, useState } from 'react';
import { ownMediaUrl } from '../../services/mediaStore';

/** Foto der Liste (aus dem Gerätespeicher) – füllt den Platz, in den es gelegt wird */
export function ListPhoto({ id, className = '', alt = '' }: { id: string; className?: string; alt?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void ownMediaUrl(id).then((u) => alive && setUrl(u));
    return () => { alive = false; };
  }, [id]);
  if (!url) return null;
  return <img src={url} alt={alt} className={`object-cover ${className}`} draggable={false} />;
}
