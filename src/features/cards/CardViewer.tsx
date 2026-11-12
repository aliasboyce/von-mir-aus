import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Star, Sparkles, Pencil, Share2, ArrowUpRight, FileDown, EyeOff, ListTree } from 'lucide-react';
import { CardFlip } from './CardFlip';
import { CARD_H, CARD_W, bodyFit } from './cardRender';
import { patchPrefs, getPrefs, setRarity, toggleFavorite } from './cardStore';
import { playPageTurn, playSparkle } from './cardSounds';
import { useL } from '../projects/useL';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import type { CardModel, Rarity } from './cardTypes';

const RARITIES: { id: Rarity; de: string; en: string; emoji: string }[] = [
  { id: 'normal', de: 'Normal', en: 'Normal', emoji: '▫️' },
  { id: 'foil', de: 'Folie', en: 'Foil', emoji: '🥇' },
  { id: 'holo', de: 'Holo', en: 'Holo', emoji: '🌈' },
  { id: 'glitter', de: 'Glitzer', en: 'Glitter', emoji: '✨' },
];

/**
 * Karte groß ansehen: Tippen dreht um, nach links/rechts wischen blättert durch die Karten.
 * Unten: Favorit, „Limitiert“ (Folie/Holo/Glitzer), Bearbeiten, Teilen, Drucken.
 */
export function CardViewer({ cards, index, onIndex, onClose, onChanged, onShare, onPrint }: { cards: CardModel[]; index: number; onIndex: (i: number) => void; onClose: () => void; onChanged: () => void; onShare: (c: CardModel) => void; onPrint: (c: CardModel) => void }) {
  const { L, lang } = useL();
  const navigate = useNavigate();
  useRegisterModalOpen(true);
  const card = cards[index];
  const [flipped, setFlipped] = useState(false);
  const [dx, setDx] = useState(0);
  const [slide, setSlide] = useState<'none' | 'out-left' | 'out-right'>('none');
  const [rarityOpen, setRarityOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const start = useRef<{ x: number; moved: boolean } | null>(null);

  useEffect(() => {
    setFlipped(false);
    setRarityOpen(false);
    setInfoOpen(false);
  }, [index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cards.length]);

  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const width = Math.floor(Math.min(vw * 0.8, (vh * 0.6 * CARD_W) / CARD_H, 380));

  function go(dir: 1 | -1) {
    const next = index + dir;
    if (next < 0 || next >= cards.length) {
      setDx(0);
      return;
    }
    playPageTurn();
    setSlide(dir === 1 ? 'out-left' : 'out-right');
    window.setTimeout(() => {
      onIndex(next);
      setSlide('none');
      setDx(0);
      if (cards[next].rarity !== 'normal') window.setTimeout(playSparkle, 250);
    }, 170);
  }

  if (!card) return null;
  const fav = getPrefs().favorites.includes(card.key);
  const isOwn = !!card.own;
  const fit = bodyFit(card);
  const detailList = card.details?.length ? card.details : card.sections?.length ? card.sections : card.lines?.length ? [{ label: '', text: card.lines.join('\n') }] : card.text ? [{ label: '', text: card.text }] : [];
  const hasMore = fit.truncated || detailList.length > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center no-print"
      style={{ background: 'radial-gradient(ellipse at 50% 35%, rgba(40,34,52,0.94), rgba(14,12,20,0.98))' }}
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      data-testid="card-viewer"
    >
      <button onClick={onClose} aria-label={L('Schließen', 'Close')} className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white" style={{ top: 'max(16px, env(safe-area-inset-top))' }} data-testid="card-viewer-close">
        <X size={20} />
      </button>
      <p className="absolute text-[12px] text-white/60" style={{ top: 'max(24px, env(safe-area-inset-top))', left: 20 }}>
        {index + 1} / {cards.length}
      </p>

      <div
        className="touch-pan-y select-none"
        style={{ transform: `translateX(${slide === 'out-left' ? -120 : slide === 'out-right' ? 120 : dx}px) rotate(${(slide === 'none' ? dx : slide === 'out-left' ? -120 : 120) / 40}deg)`, opacity: slide === 'none' ? 1 : 0, transition: slide === 'none' && dx === 0 ? 'transform 0.25s ease' : slide !== 'none' ? 'transform 0.17s ease-in, opacity 0.17s' : 'none' }}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const d = e.clientX - start.current.x;
          if (Math.abs(d) > 10) start.current.moved = true;
          if (start.current.moved) setDx(d);
        }}
        onPointerUp={() => {
          const s = start.current;
          start.current = null;
          if (s?.moved && Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
          else setDx(0);
        }}
        onClickCapture={(e) => {
          // nach einem Wisch kein versehentliches Umdrehen
          if (start.current?.moved || Math.abs(dx) > 10) e.stopPropagation();
        }}
      >
        <CardFlip card={card} width={width} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      </div>

      <p className="text-[12px] text-white/55 mt-4 mb-3">{L('Tippen = umdrehen · wischen = weiterblättern', 'Tap = flip · swipe = next card')}</p>

      <div className="flex items-center gap-2 flex-wrap justify-center px-4">
        <ActionBtn label={fav ? L('Favorit', 'Favourite') : L('Favorit', 'Favourite')} active={fav} onClick={() => { toggleFavorite(card.key); onChanged(); }}>
          <Star size={16} fill={fav ? 'currentColor' : 'none'} />
        </ActionBtn>
        {detailList.length > 0 && (
          <ActionBtn label={L('Alle Infos', 'All info')} active={infoOpen} onClick={() => { setInfoOpen((o) => !o); setRarityOpen(false); }} testid="card-info-open">
            <ListTree size={16} />
          </ActionBtn>
        )}
        <ActionBtn label={L('Limitiert', 'Limited')} active={card.rarity !== 'normal'} onClick={() => setRarityOpen((o) => !o)} testid="card-rarity-open">
          <Sparkles size={16} />
        </ActionBtn>
        {isOwn && (
          <ActionBtn label={L('Bearbeiten', 'Edit')} onClick={() => navigate(card.kind === 'reflexion' ? `/sammelalbum/tageskarte?bearbeiten=${card.key.slice('reflexion:'.length)}` : `/sammelalbum/neu?bearbeiten=${card.key.slice('own:'.length)}`)}>
            <Pencil size={16} />
          </ActionBtn>
        )}
        {card.route && (
          <ActionBtn label={L('Zur Quelle', 'Open source')} onClick={() => { onClose(); navigate(card.route!); }}>
            <ArrowUpRight size={16} />
          </ActionBtn>
        )}
        <ActionBtn label={L('Teilen', 'Share')} onClick={() => onShare(card)}>
          <Share2 size={16} />
        </ActionBtn>
        <ActionBtn label={L('Drucken', 'Print')} onClick={() => onPrint(card)}>
          <FileDown size={16} />
        </ActionBtn>
        {!isOwn && (
          <ActionBtn label={L('Ausblenden', 'Hide')} onClick={() => { patchPrefs({ hidden: [...getPrefs().hidden, card.key] }); onChanged(); if (cards.length <= 1) onClose(); else onIndex(Math.max(0, index - (index === cards.length - 1 ? 1 : 0))); }}>
            <EyeOff size={16} />
          </ActionBtn>
        )}
      </div>

      {infoOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[310] px-4 pb-4 pt-3 rounded-t-[22px] animate-in overflow-y-auto" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', maxHeight: '58vh', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', boxShadow: '0 -10px 30px rgba(0,0,0,0.4)' }} data-testid="card-info-panel">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[16px] font-medium">{card.title}</h2>
            <button type="button" onClick={() => setInfoOpen(false)} className="text-[13px] text-[var(--color-primary)] px-2 py-1">{L('Schließen', 'Close')}</button>
          </div>
          {hasMore && fit.truncated && (
            <p className="text-[12.5px] leading-snug mb-3 p-2.5 rounded-[var(--radius-md)]" style={{ background: 'var(--color-primary-soft)' }} data-testid="card-print-hint">
              {L(
                `Auf der Karte ist nicht für alles Platz: Im Kartenbild und im Druck stehen etwa die ersten ${fit.shownChars} von ${fit.totalChars} Zeichen. Hier in der App ist alles lesbar.`,
                `The card has no room for everything: the card picture and print show about the first ${fit.shownChars} of ${fit.totalChars} characters. Here in the app you can read it all.`,
              )}
            </p>
          )}
          {detailList.map((d, i) => (
            <div key={i} className="mb-3">
              {d.label && <p className="text-[11.5px] uppercase tracking-wide text-[var(--color-text-muted)] mb-0.5">{d.label}</p>}
              <p className="text-[14.5px] leading-snug whitespace-pre-wrap break-words">{d.text}</p>
            </div>
          ))}
        </div>
      )}

      {rarityOpen && (
        <div className="flex gap-2 mt-3 animate-in" data-testid="card-rarity-menu">
          {RARITIES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRarity(card.key, r.id);
                onChanged();
                setRarityOpen(false);
                if (r.id !== 'normal') window.setTimeout(playSparkle, 120);
              }}
              aria-pressed={card.rarity === r.id}
              className="px-3 py-2 rounded-full text-[13px]"
              style={{ background: card.rarity === r.id ? '#fff' : 'rgba(255,255,255,0.12)', color: card.rarity === r.id ? '#222' : '#fff' }}
            >
              {r.emoji} {lang === 'en' ? r.en : r.de}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

function ActionBtn({ children, label, onClick, active, testid }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean; testid?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      aria-pressed={active}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px]"
      style={{ background: active ? '#fff' : 'rgba(255,255,255,0.12)', color: active ? '#222' : '#fff' }}
    >
      {children}
      {label}
    </button>
  );
}
