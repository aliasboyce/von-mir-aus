import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { emojiOf } from './projectModel';
import { ProjectIcon } from './ui';
import { lookOf, shapeStyle } from './pageLook';
import { buildTiles } from './tiles';
import type { ProjectApi } from './projectApi';

/** Schwebender Knopf – bleibt in der App-Spalte (auch am großen Bildschirm) */
export function QuickNoteFab({ onClick, label, wide }: { onClick: () => void; label: string; wide?: boolean }) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full z-30 pointer-events-none flex justify-start px-4" style={{ maxWidth: 'var(--app-max-width-desktop, 560px)' }}>
      <button type="button" onClick={onClick} className={`pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full text-white shadow-lg ${wide ? 'px-4 py-3 text-[14.5px]' : 'w-12 h-12'}`} style={{ background: 'var(--color-primary)' }} aria-label={label} data-testid="quicknote-open">
        <Zap size={wide ? 17 : 20} />{wide ? label : null}
      </button>
    </div>
  );
}

/** Rahmen jeder Unterseite: „Du bist hier“-Leiste (ziehen, wischen, Pfeile), große Überschrift im Look der Seite, Schnellnotiz-Knopf. */
export function ProjectSubShell({ api, current, icon, title, color, children, right, kind }: { api: ProjectApi; current: string; icon: string; title: string; color: string; children: ReactNode; right?: ReactNode; kind?: string }) {
  const { p, L, lang, go, quickNote, today } = api;
  const tiles = buildTiles(p, L, lang, today).filter((t) => !t.more && !t.create);
  const curRef = useRef<HTMLButtonElement | null>(null);
  const stripRef = useRef<HTMLElement | null>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const look = lookOf(kind ?? current);
  const idx = tiles.findIndex((t) => t.to === current);
  useEffect(() => { curRef.current?.scrollIntoView?.({ inline: 'center', block: 'nearest' }); }, [current]);
  const step = (d: -1 | 1) => {
    if (idx < 0) return;
    const next = tiles[idx + d];
    if (next) go(next.to);
    else if (d === -1) go('');
  };

  // Mit der Maus ziehen (am Handy wischt der Finger ohnehin)
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !stripRef.current) return;
    drag.current = { x: e.clientX, left: stripRef.current.scrollLeft, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !stripRef.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    stripRef.current.scrollLeft = d.left - dx;
  };
  const onUp = () => { window.setTimeout(() => { drag.current = null; }, 0); };

  // Seitlich wischen auf der Seite wechselt zur nächsten / vorigen Seite
  const touchStart = (e: React.TouchEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest('input,textarea,select,[contenteditable="true"],[data-no-swipe]')) { swipe.current = null; return; }
    swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const touchEnd = (e: React.TouchEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 90 && Math.abs(dy) < 40) step(dx < 0 ? 1 : -1);
  };

  const shape = shapeStyle(look.shape);
  const head = look.head;
  const headWrap: React.CSSProperties =
    head === 'band' ? { background: `color-mix(in srgb, ${color} 18%, var(--color-surface))`, borderRadius: 18, padding: '10px 12px' }
    : head === 'tab' ? { borderBottom: `3px solid ${color}`, paddingBottom: 6 }
    : head === 'stamp' ? { border: `2px dashed ${color}`, borderRadius: 10, padding: '8px 10px' }
    : head === 'bar' ? { borderLeft: `7px solid ${color}`, paddingLeft: 10 }
    : {};
  return (
    <div data-testid={`subpage-${current}`} data-look={kind ?? current} onTouchStart={touchStart} onTouchEnd={touchEnd}>
      <div className="flex items-center gap-1 px-2 pb-2 -mt-1">
        <button type="button" onClick={() => step(-1)} disabled={idx < 0} aria-label={L('Vorige Seite', 'Previous page')} className="shrink-0 w-8 h-10 flex items-center justify-center text-[var(--color-text-muted)] disabled:opacity-30" data-testid="nav-prev"><ChevronLeft size={18} /></button>
        <nav
          ref={stripRef}
          className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing touch-pan-x"
          aria-label={L('Seiten im Projekt – ziehen oder wischen', 'Pages in the project – drag or swipe')}
          data-testid="project-navstrip"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onClickCapture={(e) => { if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); } }}
        >
          <button type="button" onClick={() => go('')} className="shrink-0 h-10 px-3 rounded-full text-[18px] border border-[var(--color-border-strong)] flex items-center overflow-hidden" aria-label={L('Projekt-Startseite', 'Project home')} data-testid="nav-home"><ProjectIcon p={p} size={18} /></button>
          {tiles.map((t) => {
            const on = t.to === current;
            const dist = idx < 0 ? 0 : Math.abs(tiles.indexOf(t) - idx);
            return (
              <button key={t.key} ref={on ? curRef : undefined} type="button" onClick={() => go(t.to)} aria-current={on ? 'page' : undefined} className="shrink-0 h-10 px-3 rounded-full text-[13px] inline-flex items-center gap-1.5 border transition-all" style={on ? { background: `color-mix(in srgb, ${t.color} 24%, var(--color-surface))`, borderColor: t.color, color: 'var(--color-text)', boxShadow: `0 0 12px color-mix(in srgb, ${t.color} 45%, transparent)`, transform: 'scale(1.06)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', opacity: dist > 3 ? 0.7 : 1 }} data-testid={`nav-${t.key}`}>
                <span aria-hidden="true">{t.icon}</span>
                <span className={on ? '' : 'hidden sm:inline'}>{t.label.length > 18 ? `${t.label.slice(0, 17)}…` : t.label}</span>
              </button>
            );
          })}
        </nav>
        <button type="button" onClick={() => step(1)} disabled={idx < 0 || idx >= tiles.length - 1} aria-label={L('Nächste Seite', 'Next page')} className="shrink-0 w-8 h-10 flex items-center justify-center text-[var(--color-text-muted)] disabled:opacity-30" data-testid="nav-next"><ChevronRight size={18} /></button>
      </div>
      <div className="px-5 pb-28 pt-2" style={{ ...look.bg(color), fontFamily: look.font }}>
        <p className="text-[12.5px] text-[var(--color-text-faint)] mb-1" style={{ fontFamily: 'inherit' }}>
          <button type="button" onClick={() => go('')} className="underline underline-offset-2" data-testid="crumb-project">{emojiOf(p)} {p.title || L('Projekt', 'Project')}</button> ›
        </p>
        <div className="flex items-center gap-3 mb-4" style={headWrap}>
          <span className="w-12 h-12 shrink-0 flex items-center justify-center text-[26px]" style={{ background: `color-mix(in srgb, ${color} 26%, var(--color-surface))`, border: look.shape === 'circle' || look.shape === 'squircle' || look.shape === 'drop' || look.shape === 'shield' || look.shape === 'tab' ? `2px solid ${color}` : undefined, ...shape, outline: look.shape === 'hex' || look.shape === 'diamond' || look.shape === 'ticket' ? undefined : undefined }} aria-hidden="true">{icon}</span>
          <h1 className="flex-1 min-w-0 text-[26px] leading-tight font-medium text-[var(--color-text)]" style={{ fontFamily: look.font }}>{title}</h1>
          {right}
        </div>
        {head === 'wave' && <svg viewBox="0 0 200 10" className="w-full h-2.5 -mt-2 mb-3" preserveAspectRatio="none" aria-hidden="true"><path d="M0 5 Q 12.5 0 25 5 T 50 5 T 75 5 T 100 5 T 125 5 T 150 5 T 175 5 T 200 5" fill="none" stroke={color} strokeWidth="2" /></svg>}
        {head === 'dots' && <div className="flex gap-1.5 -mt-2 mb-3" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className="w-2 h-2 rounded-full" style={{ background: color, opacity: 0.25 + i * 0.1 }} />)}</div>}
        {children}
      </div>
      <QuickNoteFab onClick={quickNote} label={L('Schnellnotiz', 'Quick note')} />
    </div>
  );
}
