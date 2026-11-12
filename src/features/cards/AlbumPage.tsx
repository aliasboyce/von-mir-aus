import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Settings2, Printer, Moon, Star, Sparkles } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useL } from '../projects/useL';
import { buildAllCards } from './autoCards';
import { cardCategoriesRepo, getPrefs } from './cardStore';
import { CardFace } from './CardFace';
import { CardViewer } from './CardViewer';
import { CardSettingsModal } from './CardSettingsModal';
import { ShareCardModal } from './ShareCardModal';
import { downloadCardsPdf } from './cardPdf';
import { playPageTurn, playSparkle, setAppSounds } from './cardSounds';
import { CARD_H, CARD_W } from './cardRender';
import { KIND_META, KIND_ORDER, type CardModel } from './cardTypes';

type Chapter = { id: string; label: string; color: string; emoji: string; count: number; test: (c: CardModel) => boolean };

/**
 * „Mein Sammelalbum“: alles, was es in deiner App gibt, als Sammelkarten – zum Blättern, Umdrehen,
 * Ausdrucken und Verschenken. Eigene Ansicht; sie liest nur und verändert nichts im Rest der App.
 */
export function AlbumPage() {
  const t = useT();
  const { L, lang } = useL();
  const { settings } = useSettings();
  const [version, setVersion] = useState(0);
  const [chapterId, setChapterId] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareCard, setShareCard] = useState<CardModel | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => setAppSounds(settings.soundsEnabled !== false), [settings.soundsEnabled]);

  const cards = useMemo(() => buildAllCards({ t, lang, settings }), [t, lang, settings, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const cats = useMemo(() => cardCategoriesRepo.getAll(), [version]); // eslint-disable-line react-hooks/exhaustive-deps
  const favs = getPrefs().favorites;

  const chapters: Chapter[] = useMemo(() => {
    const list: Chapter[] = [{ id: 'all', label: L('Alle', 'All'), color: '#9a948a', emoji: '📚', count: cards.length, test: () => true }];
    list.push({ id: 'special', label: L('Specialcards', 'Special cards'), color: '#d4a94f', emoji: '✨', count: cards.filter((c) => c.rarity !== 'normal' || favs.includes(c.key)).length, test: (c) => c.rarity !== 'normal' || favs.includes(c.key) });
    KIND_ORDER.filter((k) => k !== 'eigen').forEach((k) => {
      const n = cards.filter((c) => c.kind === k).length;
      if (n === 0) return;
      const color = cards.find((c) => c.kind === k)?.color ?? KIND_META[k].defaultColor;
      list.push({ id: k, label: lang === 'en' ? KIND_META[k].en : KIND_META[k].de, color, emoji: KIND_META[k].emoji, count: n, test: (c) => c.kind === k });
    });
    cats.forEach((cat) => {
      const n = cards.filter((c) => c.kind === 'eigen' && c.categoryId === cat.id).length;
      list.push({ id: `cat:${cat.id}`, label: cat.label, color: cat.color, emoji: cat.emoji, count: n, test: (c) => c.kind === 'eigen' && c.categoryId === cat.id });
    });
    const plain = cards.filter((c) => c.kind === 'eigen' && !c.categoryId).length;
    if (plain) list.push({ id: 'eigen', label: L('Eigene', 'Own'), color: KIND_META.eigen.defaultColor, emoji: '🃏', count: plain, test: (c) => c.kind === 'eigen' && !c.categoryId });
    return list;
  }, [cards, cats, favs, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const chapter = chapters.find((c) => c.id === chapterId) ?? chapters[0];
  const shown = useMemo(() => cards.filter(chapter.test), [cards, chapter]);

  // Seiten: Titelseite + Kartenseiten
  const [wide, setWide] = useState(typeof window !== 'undefined' && window.innerWidth >= 640);
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= 640);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const perPage = wide ? 6 : 4;
  const pageCount = 1 + Math.max(1, Math.ceil(shown.length / perPage));
  useEffect(() => setPage(0), [chapterId, perPage]);

  async function printCards(list: CardModel[]) {
    if (busy || list.length === 0) return;
    setBusy(true);
    try {
      await downloadCardsPdf(list, lang);
    } finally {
      setBusy(false);
    }
  }

  const special = shown.filter((c) => c.rarity !== 'normal').length;

  return (
    <div className="min-h-dvh pb-24">
      <TopBar />
      <div className="px-5 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px]">{L('Mein Sammelalbum', 'My collection album')}</h1>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
              {cards.length} {L('Karten', 'cards')}
              {special ? ` · ${special} ${L('limitiert', 'limited')}` : ''}
            </p>
          </div>
          <button type="button" onClick={() => setSettingsOpen(true)} aria-label={L('Farben & Ton', 'Colours & sound')} className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-surface-muted)] flex-shrink-0" data-testid="album-settings">
            <Settings2 size={18} />
          </button>
        </div>

        <div className="flex gap-2 mt-3 mb-3 flex-wrap">
          <Link to="/sammelalbum/neu" className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] bg-[var(--color-primary)] text-[var(--color-surface)]" data-testid="album-new">
            <Plus size={15} /> {L('Neue Karte', 'New card')}
          </Link>
          <Link to="/sammelalbum/tageskarte" className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] bg-[var(--color-surface-muted)] text-[var(--color-text)]" data-testid="album-day">
            <Moon size={15} /> {L('Tageskarte', 'Day card')}
          </Link>
          <button type="button" onClick={() => printCards(shown)} disabled={busy || shown.length === 0} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13.5px] bg-[var(--color-surface-muted)] text-[var(--color-text)] disabled:opacity-50" data-testid="album-print">
            <Printer size={15} /> {busy ? L('Moment …', 'One moment …') : L('Drucken (PDF)', 'Print (PDF)')}
          </button>
        </div>

        <div className="chip-row no-scrollbar -mx-5 px-5 mb-4" role="tablist" aria-label={L('Kapitel', 'Chapters')}>
          {chapters.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === chapterId}
              onClick={() => { setChapterId(c.id); }}
              data-testid={`album-chapter-${c.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap flex-shrink-0"
              style={{
                background: c.id === chapterId ? c.color : `color-mix(in srgb, var(--color-surface) 80%, ${c.color} 20%)`,
                color: c.id === chapterId ? (c.id === 'all' ? '#fff' : '#1f1d1a') : 'var(--color-text)',
                border: `1px solid ${c.color}`,
              }}
            >
              <span aria-hidden="true">{c.emoji}</span>
              {c.label}
              <span className="opacity-70 text-[11.5px]">{c.count}</span>
            </button>
          ))}
        </div>

        <Book
          cards={shown}
          page={page}
          pageCount={pageCount}
          perPage={perPage}
          wide={wide}
          chapter={chapter}
          totalCards={cards.length}
          onPage={setPage}
          onOpen={(i) => setViewer(i)}
          lang={lang}
        />

        {cards.length === 0 && <p className="text-center text-[14px] text-[var(--color-text-muted)] mt-6">{L('Noch keine Karten – lege etwas in der App an oder gestalte eine eigene Karte mit „Neue Karte“.', 'No cards yet – add something in the app or design your own with “New card”.')}</p>}
        <p className="text-center text-[12px] text-[var(--color-text-faint)] mt-4 flex items-center justify-center gap-1.5">
          <Star size={12} /> {L('Mit dem Finger zur Seite wischen blättert um. Tippe eine Karte an, dann dreht sie sich.', 'Swipe sideways to turn the page. Tap a card to flip it.')}
          <Sparkles size={12} />
        </p>
      </div>

      {viewer !== null && (
        <CardViewer
          cards={shown}
          index={Math.min(viewer, shown.length - 1)}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
          onChanged={refresh}
          onShare={(c) => setShareCard(c)}
          onPrint={(c) => void printCards([c])}
        />
      )}
      {settingsOpen && <CardSettingsModal onClose={() => { setSettingsOpen(false); refresh(); }} />}
      {shareCard && <ShareCardModal card={shareCard} onClose={() => setShareCard(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Das Buch: Titelseite + Seiten mit Taschen für Karten, Umblättern per Wischen

function Book({ cards, page, pageCount, perPage, wide, chapter, totalCards, onPage, onOpen, lang }: { cards: CardModel[]; page: number; pageCount: number; perPage: number; wide: boolean; chapter: Chapter; totalCards: number; onPage: (p: number) => void; onOpen: (cardIndex: number) => void; lang: 'de' | 'en' }) {
  const holder = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  const [drag, setDrag] = useState<{ dir: 'next' | 'prev'; p: number } | null>(null);
  const anim = useRef<number | null>(null);
  const down = useRef<{ x: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.min(720, el.clientWidth)));
    ro.observe(el);
    setW(Math.min(720, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const cols = wide ? 3 : 2;
  const gap = 12;
  const padX = 18;
  const cardW = Math.floor((w - padX * 2 - gap * (cols - 1)) / cols);
  const cardH = Math.round((cardW * CARD_H) / CARD_W);
  const rows = perPage / cols;
  const pageH = padX + rows * cardH + (rows - 1) * gap + 40;

  function runTo(target: 0 | 1, dir: 'next' | 'prev', from: number, done: () => void) {
    if (anim.current) cancelAnimationFrame(anim.current);
    const t0 = performance.now();
    const dur = 340 * Math.abs(target - from) + 80;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - k) ** 3;
      setDrag({ dir, p: from + (target - from) * e });
      if (k < 1) anim.current = requestAnimationFrame(step);
      else {
        anim.current = null;
        done();
      }
    };
    anim.current = requestAnimationFrame(step);
  }

  function turn(dir: 'next' | 'prev', from = 0) {
    const nextPage = dir === 'next' ? page + 1 : page - 1;
    if (nextPage < 0 || nextPage >= pageCount) return;
    playPageTurn();
    runTo(1, dir, from, () => {
      setDrag(null);
      onPage(nextPage);
      // limitierte Karten funkeln kurz, wenn ihre Seite aufgeht
      const start = (nextPage - 1) * perPage;
      if (cards.slice(start, start + perPage).some((c) => c.rarity !== 'normal')) window.setTimeout(playSparkle, 120);
    });
  }

  function onDown(e: React.PointerEvent) {
    if (anim.current) return;
    down.current = { x: e.clientX, moved: false };
  }
  function onMove(e: React.PointerEvent) {
    const d = down.current;
    if (!d || anim.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 8) d.moved = true;
    if (!d.moved) return;
    if (dx < 0 && page < pageCount - 1) setDrag({ dir: 'next', p: Math.min(1, -dx / (w * 0.8)) });
    else if (dx > 0 && page > 0) setDrag({ dir: 'prev', p: Math.min(1, dx / (w * 0.8)) });
  }
  function onUp() {
    const d = down.current;
    down.current = null;
    if (!d?.moved || !drag) {
      return;
    }
    if (drag.p > 0.28) {
      playPageTurn();
      const dir = drag.dir;
      const target = dir === 'next' ? page + 1 : page - 1;
      runTo(1, dir, drag.p, () => {
        setDrag(null);
        onPage(target);
      });
    } else runTo(0, drag.dir, drag.p, () => setDrag(null));
  }

  const content = (p: number): React.ReactNode => {
    if (p === 0) return <Cover chapter={chapter} count={cards.length} total={totalCards} lang={lang} height={pageH} />;
    const start = (p - 1) * perPage;
    const slice = cards.slice(start, start + perPage);
    return (
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cardW}px)`, gap, padding: padX, justifyContent: 'center', height: pageH, alignContent: 'start' }}>
        {Array.from({ length: perPage }).map((_, i) => {
          const c = slice[i];
          return c ? (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                if (down.current?.moved || drag) return;
                onOpen(start + i);
              }}
              className="relative p-0 border-0 bg-transparent"
              style={{ width: cardW, height: cardH, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}
              data-testid="album-card"
              aria-label={c.title}
            >
              <CardFace card={c} width={cardW} />
              {c.rarity !== 'normal' && <span className="absolute -top-1 -right-1 text-[15px]" aria-hidden="true">✨</span>}
            </button>
          ) : (
            <div key={`e${i}`} style={{ width: cardW, height: cardH, border: '2px dashed rgba(120,90,60,0.28)', borderRadius: cardW * 0.07, background: 'rgba(120,90,60,0.06)' }} aria-hidden="true" />
          );
        })}
      </div>
    );
  };

  const flipperPage = drag ? (drag.dir === 'next' ? page : page - 1) : page;
  const underPage = drag ? (drag.dir === 'next' ? page + 1 : page) : page;
  const angle = drag ? (drag.dir === 'next' ? -180 * drag.p : -180 * (1 - drag.p)) : 0;

  return (
    <div ref={holder} data-testid="album-book">
      <div
        className="relative mx-auto select-none"
        style={{ width: w, maxWidth: '100%', height: pageH + 22, padding: '0 0 0 0', perspective: 1900, touchAction: 'pan-y' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* Einband */}
        <div aria-hidden="true" className="absolute inset-x-[-6px] top-1 bottom-[-4px] rounded-[18px]" style={{ background: 'linear-gradient(135deg,#6b3a3f,#4a2429)', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }} />
        {/* Ringe */}
        <div aria-hidden="true" className="absolute left-[-4px] top-6 bottom-6 w-3 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="block h-3 w-5 rounded-full" style={{ background: 'linear-gradient(90deg,#d8cba0,#a89560)', boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />
          ))}
        </div>
        <div className="absolute inset-0 rounded-[14px] overflow-hidden" style={{ background: '#f4ead6', border: '1px solid rgba(90,60,40,0.3)' }}>
          {content(underPage)}
        </div>
        {drag && (
          <div className="absolute inset-0" style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d', transform: `rotateY(${angle}deg)`, pointerEvents: 'none' }} data-testid="album-flipper">
            <div className="absolute inset-0 rounded-[14px] overflow-hidden" style={{ background: '#f4ead6', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', border: '1px solid rgba(90,60,40,0.3)' }}>
              {content(flipperPage)}
              <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(0,0,0,${0.18 * Math.min(1, Math.abs(angle) / 90)}), rgba(0,0,0,0) 40%)` }} />
            </div>
            <div className="absolute inset-0 rounded-[14px]" style={{ background: 'repeating-linear-gradient(0deg,#efe3c8,#efe3c8 22px,#e8dabb 23px)', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', border: '1px solid rgba(90,60,40,0.3)' }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <button type="button" onClick={() => turn('prev')} disabled={page === 0 || !!drag} className="px-4 py-2 rounded-full text-[13px] bg-[var(--color-surface-muted)] disabled:opacity-40" aria-label="Zurück" data-testid="album-prev">
          ‹
        </button>
        <span className="text-[12.5px] text-[var(--color-text-muted)] tabular-nums" data-testid="album-pageno">
          {page === 0 ? (lang === 'en' ? 'Cover' : 'Titelseite') : `${page} / ${pageCount - 1}`}
        </span>
        <button type="button" onClick={() => turn('next')} disabled={page >= pageCount - 1 || !!drag} className="px-4 py-2 rounded-full text-[13px] bg-[var(--color-surface-muted)] disabled:opacity-40" aria-label="Weiter" data-testid="album-next">
          ›
        </button>
      </div>
    </div>
  );
}

function Cover({ chapter, count, total, lang, height }: { chapter: Chapter; count: number; total: number; lang: 'de' | 'en'; height: number }) {
  const gold = 'linear-gradient(180deg,#f6e3a1,#c9a04a 55%,#f3dc8e)';
  return (
    <div className="relative flex flex-col items-center justify-center text-center" style={{ height, background: `radial-gradient(ellipse at 50% 30%, ${chapter.color}55, transparent 70%), linear-gradient(160deg,#fff7e6,#efe0bd)` }}>
      <div aria-hidden="true" className="absolute inset-3 rounded-[10px]" style={{ border: '2px solid rgba(180,140,60,0.55)' }} />
      <p className="text-[46px] mb-1" aria-hidden="true">{chapter.emoji}</p>
      <p className="text-[24px] font-bold" style={{ background: gold, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontFamily: 'var(--font-display, inherit)' }}>
        {chapter.id === 'all' ? (lang === 'en' ? 'My collection' : 'Meine Sammlung') : chapter.label}
      </p>
      <p className="text-[13px] text-[#6b5a3a] mt-1">
        {count} {lang === 'en' ? 'cards' : 'Karten'}
        {chapter.id !== 'all' ? ` ${lang === 'en' ? 'of' : 'von'} ${total}` : ''}
      </p>
      <p className="text-[12px] text-[#8a7a58] mt-6 italic">von mir aus</p>
      <p className="text-[11.5px] text-[#8a7a58] mt-4">{lang === 'en' ? 'Swipe to turn the page →' : 'Zum Blättern wischen →'}</p>
    </div>
  );
}
