import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, FileDown, LayoutGrid, Palette, Plus, Trash2 } from 'lucide-react';
import { MoreMenu } from '../../components/ui/MoreMenu';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useL } from '../projects/useL';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterExternalModalOpen, useRegisterModalOpen } from '../../state/ModalStackContext';
import { playSound } from '../../services/sounds';
import { triggerHaptic } from '../../services/haptics';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import { fileToSmallImage } from '../mindmap/mindmapMedia';
import { ScrapPageView } from './ScrapPageView';
import { CoverEditor } from './CoverEditor';
import { buildScrapPdf } from './scrapPdf';
import { PAGE_TEMPLATES, photoNodeFor } from './scrapTemplates';
import { PAPERS, addPage, bookById, dayKey, lastBookStore, pagesOf, removePage, scrapBooksRepo, scrapLayoutsRepo, spreadCount, spreadOfPage, spreadPages, type ScrapBook } from './scrapModel';
import type { MindMap } from '../mindmap/mindmapModel';

const DESK: CSSProperties = {
  background: 'radial-gradient(ellipse at 50% 25%, #8a7152 0%, #6a5439 55%, #4c3b28 100%)',
};

/** Das Buch: aufgeschlagen als Doppelseite (zwei A4-Seiten), umblättern, auf eine Seite tippen = hineinzoomen. */
export function ScrapbookBookPage() {
  const { bookId } = useParams();
  const [sp] = useSearchParams();
  const { L, lang } = useL();
  const { settings } = useSettings();
  const navigate = useNavigate();
  useRegisterModalOpen(true);
  useRegisterExternalModalOpen(true);

  const [book, setBook] = useState<ScrapBook | undefined>(() => bookById(bookId));
  const [tick, setTick] = useState(0);
  const pages = useMemo(() => (book ? pagesOf(book) : []), [book, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = book?.pageIds.length ?? 0;
  const total = spreadCount(n);
  const [spread, setSpread] = useState(() => {
    const q = Number(sp.get('s'));
    return Number.isFinite(q) && sp.get('s') !== null ? q : bookById(bookId)?.spread ?? 0;
  });
  const cur = Math.min(spread, total - 1);
  const [flip, setFlip] = useState<{ dir: 'next' | 'prev'; to: number; go: boolean } | null>(null);
  const [zoom, setZoom] = useState<{ ox: number; oy: number } | null>(null);
  const [addOpen, setAddOpen] = useState<{ at: number } | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useEffect(() => {
    if (book) lastBookStore.set(book.id);
  }, [book]);

  const reload = useCallback(() => {
    setBook(bookById(bookId));
    setTick((t) => t + 1);
  }, [bookId]);

  const pageW = Math.max(120, Math.floor(Math.min((vp.w - 28) / 2, ((vp.h - 210) * 794) / 1123)));
  const pageH = Math.round((pageW * 1123) / 794);

  const remember = (s: number) => {
    if (!book) return;
    const fresh = scrapBooksRepo.getById(book.id);
    if (fresh && fresh.spread !== s) scrapBooksRepo.save({ ...fresh, spread: s });
  };

  const goTo = (to: number, animate = true) => {
    const t = Math.max(0, Math.min(total - 1, to));
    if (t === cur || flip) return;
    if (!animate || Math.abs(t - cur) > 1) {
      setSpread(t);
      remember(t);
      playSound('page', settings);
      return;
    }
    playSound('page', settings);
    triggerHaptic('select', settings);
    setFlip({ dir: t > cur ? 'next' : 'prev', to: t, go: false });
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setFlip((f) => (f ? { ...f, go: true } : f))));
    window.setTimeout(() => {
      setSpread(t);
      remember(t);
      setFlip(null);
    }, 680);
  };

  // Tastatur: Pfeile
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') goTo(cur + 1);
      if (e.key === 'ArrowLeft') goTo(cur - 1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  // Wischen
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      d.moved = true;
      goTo(dx < 0 ? cur + 1 : cur - 1);
    }
  };

  const openPage = (idx: number, el: HTMLElement) => {
    const pg = book?.pageIds[idx];
    if (!book || !pg || drag.current?.moved) return;
    const r = el.getBoundingClientRect();
    const s = stageRef.current?.getBoundingClientRect();
    setZoom({ ox: r.left + r.width / 2 - (s?.left ?? 0), oy: r.top + r.height / 2 - (s?.top ?? 0) });
    playSound('select', settings);
    window.setTimeout(() => navigate(`/scrapbook/${book.id}/seite/${pg}`), 260);
  };

  if (!book) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[15px] text-[var(--color-text-muted)] mb-4">{L('Dieses Buch gibt es nicht mehr.', 'This book no longer exists.')}</p>
        <button type="button" className="text-[var(--color-primary)] underline" onClick={() => navigate('/scrapbook', { replace: true })}>{L('Zum Regal', 'To the shelf')}</button>
      </div>
    );
  }

  const { left, right } = spreadPages(cur);
  const dirPages = (s: number) => spreadPages(s);

  /** eine Seite im Buch (oder Vorsatz / leeres Blatt / „Seite hinzufügen“) */
  const slot = (idx: number, side: 'l' | 'r', interactive: boolean): ReactNode => {
    const shade: CSSProperties = {
      background: side === 'l' ? 'linear-gradient(90deg, rgba(0,0,0,0) 78%, rgba(60,40,15,.28) 100%)' : 'linear-gradient(270deg, rgba(0,0,0,0) 78%, rgba(60,40,15,.28) 100%)',
    };
    const frame: CSSProperties = { width: pageW, height: pageH, position: 'relative', background: '#f4ecda', overflow: 'hidden', boxShadow: side === 'l' ? '-2px 1px 0 #e6dcc4, -4px 2px 0 #d9cdb0' : '2px 1px 0 #e6dcc4, 4px 2px 0 #d9cdb0' };
    if (idx < 0) {
      return (
        <div style={{ ...frame, background: `linear-gradient(135deg, ${book.cover.color}55, #f4ecda 60%)` }} aria-hidden>
          <div className="absolute inset-0" style={shade} />
        </div>
      );
    }
    const page: MindMap | undefined = pages[idx];
    if (page) {
      const inner = (
        <>
          <ScrapPageView page={page} />
          <div className="absolute inset-0 pointer-events-none" style={shade} />
          <span className="absolute bottom-1 text-[10px] text-black/40" style={side === 'l' ? { left: 8 } : { right: 8 }}>{idx + 1}</span>
        </>
      );
      return interactive ? (
        <button type="button" style={frame} onClick={(e) => openPage(idx, e.currentTarget)} aria-label={L(`Seite ${idx + 1} öffnen`, `Open page ${idx + 1}`)} data-testid={`scrap-page-${idx}`}>{inner}</button>
      ) : (
        <div style={frame}>{inner}</div>
      );
    }
    if (idx === n && interactive) {
      return (
        <button type="button" style={frame} onClick={() => setAddOpen({ at: n })} className="flex flex-col items-center justify-center gap-2 text-[#8a7a5a]" data-testid="scrap-add-page-slot">
          <Plus size={26} />
          <span className="text-[12.5px]">{L('Seite hinzufügen', 'Add a page')}</span>
          <div className="absolute inset-0 pointer-events-none" style={shade} />
        </button>
      );
    }
    return (
      <div style={frame} aria-hidden>
        <div className="absolute inset-0" style={shade} />
      </div>
    );
  };

  const sp0 = flip ? dirPages(flip.to) : null;
  const shown = flip ? { l: flip.dir === 'next' ? left : sp0!.left, r: flip.dir === 'next' ? sp0!.right : right } : { l: left, r: right };

  const leafStyle = (dir: 'next' | 'prev', go: boolean): CSSProperties => ({
    position: 'absolute',
    top: 0,
    width: pageW,
    height: pageH,
    left: dir === 'next' ? pageW : 0,
    transformOrigin: dir === 'next' ? 'left center' : 'right center',
    transformStyle: 'preserve-3d',
    transition: 'transform .66s cubic-bezier(.45,.05,.3,1)',
    transform: go ? `rotateY(${dir === 'next' ? -180 : 180}deg)` : 'rotateY(0deg)',
    zIndex: 5,
  });
  const face: CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };

  const labelPages = () => {
    const a = left >= 0 ? left + 1 : null;
    const b = right < n ? right + 1 : null;
    if (n === 0) return L('Noch leer', 'Empty');
    if (a && b) return L(`Seiten ${a}–${b} von ${n}`, `Pages ${a}–${b} of ${n}`);
    return L(`Seite ${a ?? b} von ${n}`, `Page ${a ?? b} of ${n}`);
  };

  const menu = [
    { id: 'add', label: L('Seite hier einfügen', 'Insert a page here'), icon: <Plus size={16} />, onClick: () => setAddOpen({ at: Math.min(n, right + 1) }) },
    { id: 'order', label: L('Seiten ordnen', 'Arrange pages'), icon: <LayoutGrid size={16} />, onClick: () => setOrderOpen(true) },
    { id: 'cover', label: L('Einband & Titel ändern', 'Change cover & title'), icon: <Palette size={16} />, onClick: () => setCoverOpen(true) },
    { id: 'pdf', label: L('Als PDF speichern', 'Save as PDF'), icon: <FileDown size={16} />, onClick: () => setPdfOpen(true) },
    { id: 'del', label: L('Buch löschen …', 'Delete book …'), icon: <Trash2 size={16} />, danger: true, divider: true, onClick: () => setDelOpen(true) },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex flex-col select-none no-print" style={DESK} data-testid="scrap-book">
      <div className="flex items-center gap-2 px-3" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', paddingBottom: 6 }}>
        <button type="button" onClick={() => navigate('/scrapbook')} aria-label={L('Zum Regal', 'To the shelf')} className="w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10" data-testid="scrap-back">
          <ChevronLeft size={24} />
        </button>
        <p className="flex-1 min-w-0 text-center text-[15px] text-white/90 truncate" style={{ fontFamily: 'Georgia, serif' }} data-testid="scrap-title">{book.cover.emoji} {book.title}</p>
        <div className="text-white/90 [&_button]:text-white/90"><MoreMenu testId="scrap-menu" items={menu} /></div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden" onPointerDown={onDown} onPointerUp={onUp}>
        <div
          ref={stageRef}
          className="relative"
          style={{
            width: pageW * 2,
            height: pageH,
            perspective: 2200,
            transition: 'transform .28s ease-in, opacity .28s ease-in',
            transformOrigin: zoom ? `${zoom.ox}px ${zoom.oy}px` : 'center',
            transform: zoom ? 'scale(2.1)' : 'none',
            opacity: zoom ? 0.15 : 1,
            filter: 'drop-shadow(0 14px 18px rgba(20,12,4,.45))',
          }}
          data-testid="scrap-spread"
        >
          {/* Buchrücken-Schatten & Einband-Rand */}
          <div className="absolute" style={{ inset: -7, borderRadius: 8, background: `linear-gradient(135deg, ${book.cover.color}, #00000066)`, zIndex: 0 }} />
          <div className="absolute flex" style={{ inset: 0, zIndex: 1 }}>
            {slot(shown.l, 'l', !flip)}
            {slot(shown.r, 'r', !flip)}
          </div>
          <div className="absolute pointer-events-none" style={{ left: pageW - 1, top: 0, bottom: 0, width: 2, background: 'rgba(60,40,15,.45)', zIndex: 2 }} />
          {flip && (
            <div style={leafStyle(flip.dir, flip.go)} data-testid="scrap-leaf">
              <div style={face}>{flip.dir === 'next' ? slot(right, 'r', false) : slot(left, 'l', false)}</div>
              <div style={{ ...face, transform: 'rotateY(180deg)' }}>{flip.dir === 'next' ? slot(sp0!.left, 'l', false) : slot(sp0!.right, 'r', false)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 px-4" style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))', paddingTop: 10 }}>
        <button type="button" onClick={() => goTo(cur - 1)} disabled={cur === 0 || !!flip} aria-label={L('Zurückblättern', 'Previous')} className="w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center disabled:opacity-30" data-testid="scrap-prev">
          <ChevronLeft size={24} />
        </button>
        <button type="button" onClick={() => setOrderOpen(true)} className="px-4 h-11 rounded-full bg-white/15 text-white text-[13.5px] min-w-[130px]" data-testid="scrap-pagelabel">{labelPages()}</button>
        <button type="button" onClick={() => goTo(cur + 1)} disabled={cur >= total - 1 || !!flip} aria-label={L('Weiterblättern', 'Next')} className="w-12 h-12 rounded-full bg-white/15 text-white flex items-center justify-center disabled:opacity-30" data-testid="scrap-next">
          <ChevronRight size={24} />
        </button>
        <button type="button" onClick={() => setAddOpen({ at: n })} aria-label={L('Seite hinzufügen', 'Add a page')} className="w-12 h-12 rounded-full bg-white/25 text-white flex items-center justify-center" data-testid="scrap-add">
          <Plus size={24} />
        </button>
      </div>
      {n === 0 && (
        <p className="absolute left-0 right-0 text-center text-[13.5px] text-white/80 px-8" style={{ bottom: 150 }}>{L('Ein leeres Buch. Tippe auf „Seite hinzufügen“, um zu beginnen.', 'An empty book. Tap “Add a page” to begin.')}</p>
      )}

      {addOpen && (
        <AddPageModal
          book={book}
          at={addOpen.at}
          onClose={() => setAddOpen(null)}
          onCreated={(idx) => {
            setAddOpen(null);
            reload();
            window.setTimeout(() => {
              const t = spreadOfPage(idx);
              setSpread(t);
              remember(t);
              playSound('stick', settings);
            }, 30);
          }}
        />
      )}
      {orderOpen && <OrderModal book={book} pages={pages} onClose={() => { setOrderOpen(false); reload(); }} onJump={(idx) => { setOrderOpen(false); const t = spreadOfPage(idx); setSpread(t); remember(t); }} />}
      <Modal open={coverOpen} onClose={() => setCoverOpen(false)} title={L('Einband & Titel', 'Cover & title')}>
        <CoverSave book={book} onDone={() => { setCoverOpen(false); reload(); }} />
      </Modal>
      {pdfOpen && <PdfModal book={book} pages={pages} cur={cur} onClose={() => setPdfOpen(false)} />}
      <Modal open={delOpen} onClose={() => setDelOpen(false)} title={L('Buch löschen?', 'Delete book?')}>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{L(`„${book.title}“ mit allen ${n} Seiten wird dauerhaft gelöscht. Das lässt sich nicht rückgängig machen – wenn du die Seiten behalten willst, speichere sie vorher als PDF.`, `“${book.title}” with all ${n} pages will be deleted for good. This cannot be undone – save a PDF first if you want to keep them.`)}</p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setDelOpen(false)}>{L('Behalten', 'Keep it')}</Button>
          <Button fullWidth onClick={() => { import('./scrapModel').then((m) => { m.removeBook(book); navigate('/scrapbook', { replace: true }); }); }} data-testid="scrap-del-confirm">{L('Ja, löschen', 'Yes, delete')}</Button>
        </div>
      </Modal>
      <span className="sr-only">{lang}</span>
    </div>
  );
}

function CoverSave({ book, onDone }: { book: ScrapBook; onDone: () => void }) {
  const { L } = useL();
  const [v, setV] = useState({ title: book.title, cover: book.cover });
  return (
    <div className="flex flex-col gap-4">
      <CoverEditor title={v.title} cover={v.cover} onChange={setV} />
      <Button fullWidth onClick={() => { scrapBooksRepo.save({ ...book, title: v.title.trim() || book.title, cover: v.cover, updatedAt: new Date().toISOString() }); onDone(); }}>{L('Speichern', 'Save')}</Button>
    </div>
  );
}

/* ---------------------------------------------------------------- Seite hinzufügen */
function AddPageModal({ book, at, onClose, onCreated }: { book: ScrapBook; at: number; onClose: () => void; onCreated: (idx: number) => void }) {
  const { L, lang } = useL();
  const [tpl, setTpl] = useState('leer');
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [paper, setPaper] = useState(book.paper ?? 'creme');
  const [day, setDay] = useState(dayKey());
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const layouts = scrapLayoutsRepo.getAll();
  const t = PAGE_TEMPLATES.find((x) => x.id === tpl) ?? PAGE_TEMPLATES[0];
  const input = useRef<HTMLInputElement>(null);

  const create = async () => {
    setBusy(true);
    try {
      const layout = layoutId ? layouts.find((l) => l.id === layoutId) : undefined;
      const d = new Date(`${day}T12:00:00`);
      let nodes = layout ? undefined : t.decor(lang, d);
      if (!layout && files.length && t.slots.length) {
        const imgs = [];
        for (const f of files.slice(0, t.slots.length)) {
          const im = await fileToSmallImage(f, 900, 0.8);
          if (im) imgs.push(im);
        }
        nodes = [...(nodes ?? []), ...imgs.map((im, i) => photoNodeFor(t.slots[i], im))];
      }
      const page = addPage(book, { at, layout, paper, day, nodes });
      const fresh = bookById(book.id);
      onCreated(Math.max(0, fresh ? fresh.pageIds.indexOf(page.id) : at));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={L('Neue Seite', 'New page')}>
      <div className="flex flex-col gap-4" data-testid="scrap-add-modal">
        <div>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Aufbau', 'Layout')}</p>
          <div className="grid grid-cols-3 gap-2">
            {PAGE_TEMPLATES.map((x) => (
              <button key={x.id} type="button" onClick={() => { setTpl(x.id); setLayoutId(null); }} className={`rounded-[var(--radius-md)] border px-2 py-3 text-center ${!layoutId && tpl === x.id ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)]'}`} data-testid={`scrap-tpl-${x.id}`}>
                <div className="text-[22px]">{x.emoji}</div>
                <div className="text-[12px] leading-tight text-[var(--color-text)]">{lang === 'en' ? x.en : x.de}</div>
              </button>
            ))}
            {layouts.map((x) => (
              <button key={x.id} type="button" onClick={() => setLayoutId(x.id)} className={`rounded-[var(--radius-md)] border px-2 py-3 text-center ${layoutId === x.id ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)]'}`}>
                <div className="text-[22px]">⭐</div>
                <div className="text-[12px] leading-tight text-[var(--color-text)] truncate">{x.name}</div>
              </button>
            ))}
          </div>
        </div>
        {!layoutId && t.slots.length > 0 && (
          <div>
            <button type="button" onClick={() => input.current?.click()} className="px-4 py-2 rounded-full text-[13.5px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="scrap-tpl-photos">
              📷 {files.length ? L(`${files.length} Foto(s) gewählt`, `${files.length} photo(s) chosen`) : L(`Fotos gleich einsetzen (bis ${t.slots.length})`, `Put photos in now (up to ${t.slots.length})`)}
            </button>
            <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
          </div>
        )}
        {!layoutId && (
          <div>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Papier', 'Paper')}</p>
            <div className="flex flex-wrap gap-2">
              {PAPERS.map((p) => (
                <button key={p.id} type="button" onClick={() => setPaper(p.id)} className={`px-3.5 py-2 rounded-full text-[13px] border ${paper === p.id ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-transparent' : 'border-[var(--color-border-strong)] text-[var(--color-text)]'}`}>
                  {lang === 'en' ? p.en : p.de}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-[13.5px] text-[var(--color-text)]">
          {L('Datum der Seite', 'Page date')}
          <input type="date" className="input" style={{ width: 'auto' }} value={day} onChange={(e) => setDay(e.target.value || dayKey())} data-testid="scrap-add-date" />
        </label>
        <Button fullWidth onClick={create} disabled={busy} data-testid="scrap-add-create">{busy ? L('Einen Moment …', 'One moment …') : L('Seite anlegen', 'Create page')}</Button>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------- Seiten ordnen */
function OrderModal({ book, pages, onClose, onJump }: { book: ScrapBook; pages: (MindMap | undefined)[]; onClose: () => void; onJump: (idx: number) => void }) {
  const { L } = useL();
  const [ids, setIds] = useState(book.pageIds);
  const [del, setDel] = useState<string | null>(null);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    setIds(next);
    scrapBooksRepo.save({ ...scrapBooksRepo.getById(book.id)!, pageIds: next, updatedAt: new Date().toISOString() });
  };
  const byId = new Map(pages.filter(Boolean).map((p) => [(p as MindMap).id, p as MindMap]));
  return (
    <Modal open onClose={onClose} title={L('Seiten', 'Pages')} subtitle={L('Tippe auf eine Seite, um dorthin zu springen. Mit den Pfeilen änderst du die Reihenfolge.', 'Tap a page to jump to it. Use the arrows to change the order.')}>
      <div className="grid grid-cols-3 gap-3" data-testid="scrap-order">
        {ids.map((id, i) => {
          const p = byId.get(id);
          return (
            <div key={id} className="flex flex-col gap-1">
              <button type="button" onClick={() => onJump(i)} className="relative overflow-hidden rounded-[4px] border border-[var(--color-border)]" style={{ aspectRatio: '794 / 1123' }}>
                {p && <ScrapPageView page={p} />}
                <span className="absolute bottom-0.5 left-1 text-[10px] text-black/50">{i + 1}</span>
              </button>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={L('Nach vorn', 'Earlier')} className="w-9 h-9 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center disabled:opacity-30"><ArrowUp size={15} className="-rotate-90" /></button>
                <button type="button" onClick={() => setDel(id)} aria-label={L('Seite löschen', 'Delete page')} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-danger)]"><Trash2 size={15} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === ids.length - 1} aria-label={L('Nach hinten', 'Later')} className="w-9 h-9 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center disabled:opacity-30"><ArrowDown size={15} className="-rotate-90" /></button>
              </div>
            </div>
          );
        })}
      </div>
      {ids.length === 0 && <p className="text-[13.5px] text-[var(--color-text-faint)]">{L('Noch keine Seiten.', 'No pages yet.')}</p>}
      {del && (
        <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] p-3">
          <p className="text-[13.5px] mb-2">{L('Diese Seite endgültig löschen?', 'Delete this page for good?')}</p>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setDel(null)}>{L('Behalten', 'Keep')}</Button>
            <Button fullWidth onClick={() => { removePage(scrapBooksRepo.getById(book.id)!, del); setIds(ids.filter((x) => x !== del)); setDel(null); }} data-testid="scrap-page-del">{L('Löschen', 'Delete')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------- PDF */
function PdfModal({ book, pages, cur, onClose }: { book: ScrapBook; pages: (MindMap | undefined)[]; cur: number; onClose: () => void }) {
  const { L } = useL();
  const n = pages.length;
  const { left, right } = spreadPages(cur);
  const [mode, setMode] = useState<'spread' | 'all' | 'range'>('spread');
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(Math.max(1, n));
  const [busy, setBusy] = useState<{ d: number; t: number } | null>(null);
  const [msg, setMsg] = useState('');
  const pick = (): MindMap[] => {
    const list = mode === 'all' ? pages : mode === 'range' ? pages.slice(Math.max(1, from) - 1, Math.min(n, to)) : [pages[left], pages[right]];
    return list.filter(Boolean) as MindMap[];
  };
  const go = async () => {
    const list = pick();
    if (!list.length) { setMsg(L('Da ist keine Seite ausgewählt.', 'No page selected.')); return; }
    setBusy({ d: 0, t: list.length });
    setMsg('');
    const { bytes, failed } = await buildScrapPdf(list, (d, t) => setBusy({ d, t }));
    const res = await deliverPdf(bytes, safeFilename(book.title, 'scrapbook'), book.title);
    setBusy(null);
    if (res === 'failed') setMsg(L('Das PDF konnte nicht gespeichert werden.', 'The PDF could not be saved.'));
    else if (res === 'cancelled') setMsg('');
    else { setMsg(failed ? L(`Fertig – ${failed} Seite(n) konnten nicht gezeichnet werden.`, `Done – ${failed} page(s) could not be drawn.`) : L('Fertig.', 'Done.')); if (!failed) onClose(); }
  };
  const opt = (id: typeof mode, label: string) => (
    <label className="flex items-center gap-2.5 py-1.5 text-[14px] text-[var(--color-text)]">
      <input type="radio" name="pdfmode" checked={mode === id} onChange={() => setMode(id)} /> {label}
    </label>
  );
  return (
    <Modal open onClose={onClose} title={L('Als PDF speichern', 'Save as PDF')}>
      <div className="flex flex-col gap-3" data-testid="scrap-pdf-modal">
        <p className="text-[13px] text-[var(--color-text-muted)]">{L('Jede Seite wird eine A4-Seite, genau wie du sie gestaltet hast.', 'Every page becomes one A4 page, exactly as you designed it.')}</p>
        {opt('spread', L('Diese Doppelseite (die beiden sichtbaren Seiten)', 'This spread (the two visible pages)'))}
        {opt('all', L(`Das ganze Buch (${n} Seiten)`, `The whole book (${n} pages)`))}
        {opt('range', L('Von … bis …', 'From … to …'))}
        {mode === 'range' && (
          <div className="flex items-center gap-2 text-[14px]">
            <input type="number" min={1} max={n} className="input" style={{ width: 80 }} value={from} onChange={(e) => setFrom(Number(e.target.value) || 1)} /> – <input type="number" min={1} max={n} className="input" style={{ width: 80 }} value={to} onChange={(e) => setTo(Number(e.target.value) || 1)} />
          </div>
        )}
        <Button fullWidth onClick={go} disabled={!!busy} data-testid="scrap-pdf-go">{busy ? L(`Seite ${Math.min(busy.d + 1, busy.t)} von ${busy.t} …`, `Page ${Math.min(busy.d + 1, busy.t)} of ${busy.t} …`) : L('PDF erstellen', 'Create PDF')}</Button>
        {msg && <p className="text-[13px] text-[var(--color-text-muted)]" role="status">{msg}</p>}
      </div>
    </Modal>
  );
}

// kleine Platzhalter, damit ungenutzte Icon-Importe nicht verloren gehen (werden in späteren Etappen gebraucht)
