import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/ui/Button';
import { saveOwnMedia } from '../../services/mediaStore';
import { useL } from '../projects/useL';
import { CardFace } from './CardFace';
import { newOwnCardId, ownCardsRepo, peekNextNumber, setRarity } from './cardStore';
import { KIND_META, type CardKind, type CardModel, type OwnCard } from './cardTypes';
import type { SharedCardPayload } from './ShareCardModal';

/** Eine geschenkte Karte ansehen und – wenn du magst – in dein Album legen. */
export function CardImportPage() {
  const { L } = useL();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const payload = useMemo<SharedCardPayload | null>(() => {
    const raw = params.get('data');
    if (!raw) return null;
    try {
      const p = JSON.parse(decodeURIComponent(raw)) as SharedCardPayload;
      return p && p.v === 1 && typeof p.t === 'string' ? p : null;
    } catch {
      return null;
    }
  }, [params]);

  if (!payload) {
    return (
      <div className="min-h-dvh pb-24">
        <TopBar />
        <p className="px-5 text-[14px] text-[var(--color-text-muted)]">{L('In diesem Link habe ich keine Karte gefunden. Prüfe, ob der ganze Link kopiert wurde.', 'I found no card in this link. Check that the whole link was copied.')}</p>
      </div>
    );
  }

  const kind: CardKind = (payload.k in KIND_META ? payload.k : 'eigen') as CardKind;
  const alreadyHave = ownCardsRepo.getAll().some((c) => c.externalId === payload.id && c.fromName === (payload.from ?? c.fromName));
  const card: CardModel = {
    key: 'preview',
    kind,
    title: payload.t,
    subtitle: payload.from ? `${L('von', 'from')} ${payload.from}` : payload.s,
    text: payload.x,
    lines: payload.l,
    dateText: payload.d,
    image: payload.th,
    emoji: payload.e || KIND_META[kind].emoji,
    color: payload.c || KIND_META[kind].defaultColor,
    number: peekNextNumber(),
    rarity: payload.r ?? 'normal',
    frame: payload.f,
    font: payload.fo,
    stickers: payload.st,
    rating: payload.rt,
    createdAt: new Date().toISOString(),
  };

  async function accept() {
    if (!payload) return;
    let mediaId: string | undefined;
    if (payload.th) {
      try {
        const blob = await (await fetch(payload.th)).blob();
        mediaId = (await saveOwnMedia(blob, 'Geschenkte Karte'))?.id;
      } catch {
        // ohne Foto weiter
      }
    }
    const id = newOwnCardId();
    const own: OwnCard = {
      id,
      createdAt: new Date().toISOString(),
      kind,
      title: payload.t,
      text: [payload.x, ...(payload.l ?? [])].filter(Boolean).join('\n') || undefined,
      emoji: payload.e,
      color: payload.c,
      frame: payload.f ?? 'standard',
      font: payload.fo,
      stickers: payload.st,
      rating: payload.rt,
      rarity: payload.r ?? 'normal',
      mediaId,
      fromName: payload.from,
      externalId: payload.id,
    };
    ownCardsRepo.save(own);
    setRarity(`own:${id}`, own.rarity);
    setSaved(true);
  }

  return (
    <div className="min-h-dvh pb-24">
      <TopBar />
      <div className="px-5 flex flex-col items-center animate-in">
        <h1 className="text-[22px] mb-1 self-start">{payload.from ? `${payload.from} ${L('schenkt dir eine Karte', 'gives you a card')}` : L('Jemand schenkt dir eine Karte', 'Someone gives you a card')}</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4 self-start">{L('Du entscheidest, ob sie in dein Sammelalbum kommt.', 'You decide whether it goes into your album.')}</p>
        <div style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.28))' }} className="mb-5">
          <CardFace card={card} width={240} />
        </div>
        {saved ? (
          <div className="flex flex-col items-center gap-3">
            <p className="flex items-center gap-1.5 text-[14px] text-[var(--color-primary)]"><Check size={15} /> {L('In deinem Album.', 'In your album.')}</p>
            <Button onClick={() => navigate('/sammelalbum')} data-testid="card-import-open">{L('Album öffnen', 'Open album')}</Button>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap justify-center">
            <Button onClick={() => void accept()} data-testid="card-import-accept">{alreadyHave ? L('Nochmal ins Album', 'Into the album again') : L('In mein Album', 'Into my album')}</Button>
            <Link to="/sammelalbum" className="px-4 py-2 rounded-full text-[14px] bg-[var(--color-surface-muted)]">{L('Nicht jetzt', 'Not now')}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
