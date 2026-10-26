import { useEffect, useRef, type ReactNode } from 'react';
import { Zap } from 'lucide-react';
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

/** Rahmen jeder Unterseite: „Du bist hier“-Leiste mit allen Seiten, große Überschrift, Schnellnotiz-Knopf. */
export function ProjectSubShell({ api, current, icon, title, color, children, right }: { api: ProjectApi; current: string; icon: string; title: string; color: string; children: ReactNode; right?: ReactNode }) {
  const { p, L, lang, go, quickNote, today } = api;
  const tiles = buildTiles(p, L, lang, today).filter((t) => !t.more && !t.create);
  const curRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { curRef.current?.scrollIntoView?.({ inline: 'center', block: 'nearest' }); }, [current]);
  return (
    <div data-testid={`subpage-${current}`}>
      <nav className="flex gap-1.5 overflow-x-auto px-4 pb-2 -mt-1 no-scrollbar" aria-label={L('Seiten im Projekt', 'Pages in the project')} data-testid="project-navstrip">
        <button type="button" onClick={() => go('')} className="shrink-0 h-10 px-3 rounded-full text-[18px] border border-[var(--color-border-strong)]" aria-label={L('Projekt-Startseite', 'Project home')} data-testid="nav-home">{p.emoji}</button>
        {tiles.map((t) => {
          const on = t.to === current;
          return (
            <button key={t.key} ref={on ? curRef : undefined} type="button" onClick={() => go(t.to)} aria-current={on ? 'page' : undefined} className="shrink-0 h-10 px-3 rounded-full text-[13px] inline-flex items-center gap-1.5 border transition-colors" style={on ? { background: `color-mix(in srgb, ${t.color} 24%, var(--color-surface))`, borderColor: t.color, color: 'var(--color-text)', boxShadow: `0 0 12px color-mix(in srgb, ${t.color} 45%, transparent)` } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }} data-testid={`nav-${t.key}`}>
              <span aria-hidden="true">{t.icon}</span>
              <span className={on ? '' : 'hidden sm:inline'}>{t.label.length > 18 ? `${t.label.slice(0, 17)}…` : t.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-5 pb-28">
        <p className="text-[12.5px] text-[var(--color-text-faint)] mb-1">
          <button type="button" onClick={() => go('')} className="underline underline-offset-2" data-testid="crumb-project">{p.emoji} {p.title || L('Projekt', 'Project')}</button> ›
        </p>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-[26px]" style={{ background: `color-mix(in srgb, ${color} 22%, var(--color-surface))`, border: `2px solid ${color}` }} aria-hidden="true">{icon}</span>
          <h1 className="flex-1 min-w-0 text-[26px] leading-tight font-medium text-[var(--color-text)]">{title}</h1>
          {right}
        </div>
        {children}
      </div>
      <QuickNoteFab onClick={quickNote} label={L('Schnellnotiz', 'Quick note')} />
    </div>
  );
}
