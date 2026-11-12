import { useEffect, useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useL } from '../projects/useL';
import { prepareCardImage } from './cardRender';
import type { CardModel, FrameStyle, Rarity } from './cardTypes';

export interface SharedCardPayload {
  v: 1;
  k: string;
  t: string;
  s?: string;
  x?: string;
  l?: string[];
  d?: string;
  e: string;
  c: string;
  r: Rarity;
  f?: FrameStyle;
  fo?: string;
  st?: string[];
  rt?: { kind: 'star' | 'bolt' | 'heart'; value: number };
  th?: string;
  from?: string;
  id: string;
}

async function thumbnail(card: CardModel): Promise<string | undefined> {
  const img = await prepareCardImage(card);
  if (!img) return undefined;
  try {
    const w = 200;
    const h = Math.round((w * img.height) / img.width);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = Math.min(h, 260);
    c.getContext('2d')?.drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.55);
  } catch {
    return undefined;
  }
}

export async function buildSharePayload(card: CardModel, withPhoto: boolean, from?: string): Promise<SharedCardPayload> {
  return {
    v: 1,
    k: card.kind,
    t: card.title,
    s: card.subtitle,
    x: card.text,
    l: card.lines?.slice(0, 6),
    d: card.dateText,
    e: card.emoji,
    c: card.color,
    r: card.rarity,
    f: card.frame,
    fo: card.font,
    st: card.stickers,
    rt: card.rating,
    th: withPhoto ? await thumbnail(card) : undefined,
    from,
    id: card.key,
  };
}

/** Eine einzelne Karte an jemanden schicken – als Link, den die andere Person in ihr Album einfügen kann. */
export function ShareCardModal({ card, onClose }: { card: CardModel; onClose: () => void }) {
  const { L } = useL();
  const [withPhoto, setWithPhoto] = useState(false);
  const [from, setFrom] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const hasPhoto = !!(card.image || card.mediaId);

  useEffect(() => {
    let alive = true;
    void buildSharePayload(card, withPhoto, from.trim() || undefined).then((p) => {
      if (alive) setLink(`${window.location.origin}/sammelalbum/importieren?data=${encodeURIComponent(JSON.stringify(p))}`);
    });
    return () => {
      alive = false;
    };
  }, [card, withPhoto, from]);

  const text = `${L('Eine Karte für dein Sammelalbum:', 'A card for your collection album:')} ${card.title}\n${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Zwischenablage nicht erlaubt – Link steht im Feld
    }
  }
  async function share() {
    try {
      await navigator.share?.({ title: card.title, text });
    } catch {
      // abgebrochen
    }
  }

  return (
    <Modal open onClose={onClose} zIndex={320} title={L("Karte verschenken", "Give this card away")}>
      <div className="flex flex-col gap-3 pb-2" data-testid="share-card-modal">
        <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">
          {L('Die andere Person fügt den Link in ihrer App unter „Etwas erhalten“ ein und entscheidet, ob sie die Karte behält.', 'The other person pastes the link under “Received something” in their app and decides whether to keep the card.')}
        </p>
        <input className="input" placeholder={L('Dein Name auf der Karte (optional)', 'Your name on the card (optional)')} value={from} onChange={(e) => setFrom(e.target.value)} />
        {hasPhoto && (
          <label className="flex items-center gap-2 text-[13.5px]">
            <input type="checkbox" checked={withPhoto} onChange={(e) => setWithPhoto(e.target.checked)} />
            {L('Kleines Foto mitschicken (Link wird länger)', 'Include a small photo (link gets longer)')}
          </label>
        )}
        <textarea className="input" rows={3} readOnly value={link} onFocus={(e) => e.currentTarget.select()} data-testid="share-card-link" />
        <div className="flex gap-2 flex-wrap">
          <Button icon={copied ? <Check size={15} /> : <Copy size={15} />} onClick={copy}>
            {copied ? L('Kopiert', 'Copied') : L('Link kopieren', 'Copy link')}
          </Button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button variant="secondary" icon={<Share2 size={15} />} onClick={share}>
              {L('Teilen …', 'Share …')}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {L('Schließen', 'Close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
