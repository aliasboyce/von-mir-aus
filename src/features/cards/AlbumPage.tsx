import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

const PageView = memo(function PageView({ slice, start, perPage, cols, cardW, cardH, gap, padX, pageH, onOpen, blocked }: { slice: CardModel[]; start: number; perPage: number; cols: number; cardW: number; cardH: number; gap: number; padX: number; pageH: number; onOpen: (cardIndex: number) => void; blocked: () => boolean }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cardW}px)`, gap, padding: padX, justifyContent: 'center', height: pageH, alignContent: 'start' }}>
      {Array.from({ length: perPage }).map((_, i) => {
        const c = slice[i];
        return c ? (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              if (blocked()) return;
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
});

function Book({ cards, page, pageCount, perPage, wide, chapter, totalCards, onPage, onOpen, lang }: { cards: CardModel[]; page: number; pageCount: number; perPage: number; wide: boolean; chapter: Chapter; totalCards: number; onPage: (p: number) => void; onOpen: (cardIndex: number) => void; lang: 'de' | 'en' }) {
  const holder = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  // Nur Start/Ende des Umblätterns sind State – der Fortschritt läuft direkt am Element (flüssig, ohne Neuzeichnen der Karten)
  const [drag, setDrag] = useState<{ dir: 'next' | 'prev'; p0: number } | null>(null);
  const prog = useRef(0);
  const dirRef = useRef<'next' | 'prev'>('next');
  const anim = useRef<number | null>(null);
  const down = useRef<{ x: number; y: number; id: number; moved: boolean; t: number } | null>(null);
  const dragging = useRef(false);
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.min(720, el.clientWidth)));
    ro.observe(el);
    setW(Math.min(720, el.clientWidth));
    return () => ro.disconnect();
  }, []);
  useEffect(() => () => { if (anim.current) cancelAnimationFrame(anim.current); }, []);

  const cols = wide ? 3 : 2;
  const gap = 12;
  const padX = 18;
  const cardW = Math.floor((w - padX * 2 - gap * (cols - 1)) / cols);
  const cardH = Math.round((cardW * CARD_H) / CARD_W);
  const rows = perPage / cols;
  const pageH = padX + rows * cardH + (rows - 1) * gap + 40;

  function apply(p: number, dir: 'next' | 'prev') {
    prog.current = p;
    const angle = dir === 'next' ? -180 * p : -180 * (1 - p);
    if (flipRef.current) flipRef.current.style.transform = `rotateY(${angle}deg) translateZ(0)`;
    if (shadeRef.current) shadeRef.current.style.background = `linear-gradient(90deg, rgba(0,0,0,${0.18 * Math.min(1, Math.abs(angle) / 90)}), rgba(0,0,0,0) 40%)`;
  }
  // erster Stand, sobald das Blatt da ist
  useLayoutEffect(() => {
    if (drag) apply(drag.p0, drag.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  function runTo(target: 0 | 1, dir: 'next' | 'prev', from: number, done: () => void) {
    if (anim.current) cancelAnimationFrame(anim.current);
    const t0 = performance.now();
    const dur = 320 * Math.abs(target - from) + 70;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - (1 - k) ** 3;
      apply(from + (target - from) * e, dir);
      if (k < 1) anim.current = requestAnimationFrame(step);
      else {
        anim.current = null;
        done();
      }
    };
    anim.current = requestAnimationFrame(step);
  }

  function finish(nextPage: number | null) {
    dragging.current = false;
    setDrag(null);
    if (nextPage !== null) {
      onPage(nextPage);
      const start = (nextPage - 1) * perPage;
      if (start >= 0 && cards.slice(start, start + perPage).some((c) => c.rarity !== 'normal')) window.setTimeout(playSparkle, 120);
    }
  }

  function turn(dir: 'next' | 'prev') {
    if (dragging.current) return;
    const nextPage = dir === 'next' ? page + 1 : page - 1;
    if (nextPage < 0 || nextPage >= pageCount) return;
    playPageTurn();
    dragging.current = true;
    dirRef.current = dir;
    setDrag({ dir, p0: 0 });
    // zwei Frames warten, damit das Blatt gemalt ist, dann animieren
    requestAnimationFrame(() => runTo(1, dir, 0, () => finish(nextPage)));
  }

  function onDown(e: React.PointerEvent) {
    if (dragging.current && anim.current) return;
    down.current = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, t: performance.now() };
  }
  function onMove(e: React.PointerEvent) {
    const d = down.current;
    if (!d || anim.current) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.4) return; // eher senkrechtes Scrollen
      d.moved = true;
      try { (e.currentTarget as HTMLElement).setPointerCapture(d.id); } catch { /* ok */ }
    }
    const pg = pageRef.current;
    const dir: 'next' | 'prev' | null = dx < 0 && pg < pageCount - 1 ? 'next' : dx > 0 && pg > 0 ? 'prev' : null;
    if (!dir) return;
    const p = Math.min(1, Math.abs(dx) / (w * 0.75));
    if (!dragging.current || dirRef.current !== dir) {
      dragging.current = true;
      dirRef.current = dir;
      setDrag({ dir, p0: p });
    } else apply(p, dir);
  }
  function onUp() {
    const d = down.current;
    down.current = null;
    if (!d?.moved || !dragging.current) {
      if (d?.moved) dragging.current = false;
      return;
    }
    const dir = dirRef.current;
    const p = prog.current;
    const fast = performance.now() - d.t < 260 && p > 0.08; // kurzer, schneller Wisch genügt
    if (p > 0.28 || fast) {
      playPageTurn();
      const target = dir === 'next' ? pageRef.current + 1 : pageRef.current - 1;
      runTo(1, dir, p, () => finish(target));
    } else runTo(0, dir, p, () => finish(null));
  }

  const blocked = useCallback(() => !!down.current?.moved || dragging.current, []);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const stableOpen = useCallback((i: number) => onOpenRef.current(i), []);
  // gleiche Seite → gleiches Array, damit die Karten beim Wischen nicht neu gezeichnet werden
  const slices = useMemo(() => new Map<number, CardModel[]>(), [cards, perPage]);
  const sliceOf = (start: number) => {
    let v = slices.get(start);
    if (!v) { v = cards.slice(start, start + perPage); slices.set(start, v); }
    return v;
  };

  const content = (p: number): React.ReactNode => {
    if (p === 0) return <Cover chapter={chapter} count={cards.length} total={totalCards} lang={lang} height={pageH} />;
    const start = (p - 1) * perPage;
    return <PageView slice={sliceOf(start)} start={start} perPage={perPage} cols={cols} cardW={cardW} cardH={cardH} gap={gap} padX={padX} pageH={pageH} onOpen={stableOpen} blocked={blocked} />;
  };

  const flipperPage = drag ? (drag.dir === 'next' ? page : page - 1) : page;
  const underPage = drag ? (drag.dir === 'next' ? page + 1 : page) : page;

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
          <div ref={flipRef} className="absolute inset-0" style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d', willChange: 'transform', pointerEvents: 'none' }} data-testid="album-flipper">
            <div className="absolute inset-0 rounded-[14px] overflow-hidden" style={{ background: '#f4ead6', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', border: '1px solid rgba(90,60,40,0.3)' }}>
              {content(flipperPage)}
              <div ref={shadeRef} className="absolute inset-0" />
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

// feines Leder-Korn (SVG-Rauschen) für den Einband
const LEATHER_GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")}")`;
const WORN = `url("data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='w' x='0' y='0' width='100%' height='100%'><feTurbulence type='turbulence' baseFrequency='0.012 0.02' numOctaves='4' seed='3'/><feColorMatrix values='0 0 0 0 0.85  0 0 0 0 0.7  0 0 0 0 0.5  0 0 0 1.4 -0.55'/></filter><rect width='100%' height='100%' filter='url(#w)'/></svg>")}")`;

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[pos];
  const place: React.CSSProperties = { tl: { top: 14, left: 14 }, tr: { top: 14, right: 14 }, bl: { bottom: 14, left: 14 }, br: { bottom: 14, right: 14 } }[pos];
  return (
    <svg aria-hidden="true" width="46" height="46" viewBox="0 0 46 46" style={{ position: 'absolute', transform: `rotate(${rot}deg)`, ...place, filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.5))' }}>
      <defs>
        <linearGradient id={`g${pos}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6e3a1" /><stop offset="0.5" stopColor="#b98c35" /><stop offset="1" stopColor="#f0d584" /></linearGradient>
      </defs>
      <path d="M2 2 H30 M2 2 V30 M8 8 H22 Q8 10 8 22 Z M2 40 Q16 36 20 22 Q24 12 40 2" fill="none" stroke={`url(#g${pos})`} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="9" cy="9" r="2.4" fill={`url(#g${pos})`} />
    </svg>
  );
}

function Cover({ chapter, count, total, lang, height }: { chapter: Chapter; count: number; total: number; lang: 'de' | 'en'; height: number }) {
  const gold = 'linear-gradient(180deg,#f8e8ad,#c49a3f 50%,#f1d98a 80%,#b88a30)';
  const goldText: React.CSSProperties = { background: gold, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.55))' };
  return (
    <div className="relative flex flex-col items-center justify-center text-center overflow-hidden" style={{ height, background: `${LEATHER_GRAIN}, radial-gradient(ellipse at 38% 28%, #8a4a3f 0%, #5e2f2c 48%, #3a1a1b 100%)`, backgroundBlendMode: 'multiply, normal' }}>
      {/* abgegriffene, hellere Stellen */}
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: WORN, opacity: 0.35, mixBlendMode: 'screen' }} />
      {/* Kanten dunkler (Patina) */}
      <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: 'inset 0 0 48px 8px rgba(20,8,8,0.65), inset 0 0 6px 1px rgba(255,220,160,0.18)' }} />
      {/* Rücken mit Nähten */}
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[26px]" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.5), rgba(255,200,150,0.10) 55%, rgba(0,0,0,0.25))', borderRight: '1px solid rgba(0,0,0,0.45)' }}>
        <div className="absolute inset-y-4 right-[7px] border-r-2 border-dashed" style={{ borderColor: 'rgba(235,205,140,0.45)' }} />
      </div>
      {/* Goldprägung: doppelter Rahmen */}
      <div aria-hidden="true" className="absolute rounded-[6px]" style={{ inset: '12px 12px 12px 38px', border: '2px solid #c9a04a', boxShadow: '0 0 0 3px rgba(0,0,0,0.0), inset 0 0 0 4px rgba(0,0,0,0.0), 0 1px 0 rgba(0,0,0,0.5)', opacity: 0.9 }} />
      <div aria-hidden="true" className="absolute rounded-[4px]" style={{ inset: '19px 19px 19px 45px', border: '1px solid rgba(214,178,92,0.75)' }} />
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      <div className="relative" style={{ paddingLeft: 22 }}>
        <p className="text-[44px] mb-2" aria-hidden="true" style={{ filter: 'sepia(0.5) drop-shadow(0 2px 2px rgba(0,0,0,0.6))' }}>{chapter.emoji}</p>
        {/* Titelschild */}
        <div className="mx-auto px-5 py-3 rounded-[4px]" style={{ background: 'linear-gradient(180deg,#e9d7aa,#cdb27a)', border: '1px solid #8a6b30', boxShadow: '0 2px 5px rgba(0,0,0,0.55), inset 0 0 0 3px rgba(255,255,255,0.25)', maxWidth: 230 }}>
          <p className="text-[22px] font-bold leading-tight" style={{ color: '#4a2c14', fontFamily: 'var(--font-display, Georgia, serif)', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
            {chapter.id === 'all' ? (lang === 'en' ? 'My collection' : 'Meine Sammlung') : chapter.label}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: '#6b4a24' }}>
            {count} {lang === 'en' ? 'cards' : 'Karten'}
            {chapter.id !== 'all' ? ` ${lang === 'en' ? 'of' : 'von'} ${total}` : ''}
          </p>
        </div>
        <p className="text-[15px] mt-5 italic" style={{ ...goldText, fontFamily: 'var(--font-display, Georgia, serif)', letterSpacing: 1 }}>von mir aus</p>
        <p className="text-[11.5px] mt-5" style={{ color: 'rgba(240,215,160,0.75)' }}>{lang === 'en' ? 'Swipe to turn the page →' : 'Zum Blättern wischen →'}</p>
      </div>
    </div>
  );
}
