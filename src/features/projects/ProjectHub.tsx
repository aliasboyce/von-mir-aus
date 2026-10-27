import { useState } from 'react';
import { ProjectIcon } from './ui';
import { CheckCheck, FileDown, LayoutGrid, Orbit, Settings2, Zap } from 'lucide-react';
import { QuickNoteFab } from './ProjectSubShell';
import { statusLabel } from './projectModel';
import { buildTiles, centerMetrics, type Tile } from './tiles';
import { hubLayoutStore, type HubLayout } from './projectStore';
import type { ProjectApi } from './projectApi';
import { parkNotesRepo, slipColor } from '../parkbox/parkboxRepo';

function Ring({ value, color, size, stroke = 3 }: { value: number; color: string; size: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90 pointer-events-none" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity="0.18" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))} style={{ transition: 'stroke-dashoffset 700ms ease' }} />
    </svg>
  );
}

function CircleTile({ t, i, n, size, onOpen }: { t: Tile; i: number; n: number; size: number; onOpen: (t: Tile) => void }) {
  const angle = (2 * Math.PI * i) / n - Math.PI / 2;
  const R = 35;
  const left = 50 + Math.cos(angle) * R;
  const top = 50 + Math.sin(angle) * R;
  return (
    <div className="absolute" style={{ left: `${left}%`, top: `${top}%`, width: `${size}%`, transform: 'translate(-50%,-50%)' }}>
      <div className="proj-pop" style={{ animationDelay: `${60 + i * 55}ms` }}>
        <div className="proj-float" style={{ animationDelay: `${(i % 5) * 0.7}s`, animationDuration: `${5 + (i % 4) * 0.8}s` }}>
          <button
            type="button"
            onClick={() => onOpen(t)}
            aria-label={t.label}
            data-testid={`tile-${t.key}`}
            className={`proj-tile ${t.glow ? 'proj-glow' : ''} relative block w-full aspect-square rounded-full`}
            style={{ ['--tile-c' as string]: t.color, background: `color-mix(in srgb, ${t.color} ${t.create || t.more ? 8 : 20}%, var(--color-surface))`, border: `2.5px ${t.create || t.more ? 'dashed' : 'solid'} ${t.color}` }}
          >
            {t.progress !== undefined && <Ring value={t.progress} color={t.color} size={100} stroke={5} />}
            <span className="absolute inset-0 flex items-center justify-center text-[clamp(22px,7.4vw,32px)] leading-none" aria-hidden="true">{t.icon}</span>
            {t.badge && <span className="absolute -top-1 -right-1 max-w-[120%] truncate rounded-full px-1.5 py-[1px] text-[10.5px] text-white shadow" style={{ background: t.color }}>{t.badge}</span>}
          </button>
          <span className="block mt-1 text-center text-[11.5px] leading-tight text-[var(--color-text)] line-clamp-2 -mx-2">{t.label}</span>
        </div>
      </div>
    </div>
  );
}

function ListTile({ t, i, onOpen }: { t: Tile; i: number; onOpen: (t: Tile) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(t)}
      data-testid={`tile-${t.key}`}
      className={`proj-tile proj-pop ${t.glow ? 'proj-glow' : ''} relative text-left rounded-2xl p-3 flex items-center gap-3 min-h-[68px]`}
      style={{ ['--tile-c' as string]: t.color, animationDelay: `${40 + i * 40}ms`, background: `color-mix(in srgb, ${t.color} ${t.create || t.more ? 6 : 14}%, var(--color-surface))`, border: `2px ${t.create || t.more ? 'dashed' : 'solid'} color-mix(in srgb, ${t.color} 70%, transparent)` }}
    >
      <span className="relative w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-[22px]" style={{ background: `color-mix(in srgb, ${t.color} 22%, var(--color-surface))` }} aria-hidden="true">
        {t.progress !== undefined && <Ring value={t.progress} color={t.color} size={44} stroke={3.5} />}
        {t.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[14.5px] leading-tight text-[var(--color-text)] line-clamp-2 break-words">{t.label}</span>
        {t.badge && <span className="block text-[12px] mt-0.5 truncate" style={{ color: t.color }}>{t.badge}</span>}
      </span>
    </button>
  );
}

/** Zettel dieses Projekts liegen immer ganz oben: die neuesten offenen, grün, mit Link in die Zettel-Box. */
function ProjectSlipStrip({ api }: { api: ProjectApi }) {
  const { p, L, go } = api;
  const list = parkNotesRepo.getAll().filter((n) => n.projectId === p.id && !n.archived && !n.attach).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!list.length) return null;
  return (
    <div className="mb-4 flex flex-col gap-1.5" data-testid="hub-slips">
      {list.slice(0, 3).map((n) => {
        const c = slipColor(n);
        return <button key={n.id} type="button" onClick={() => go('zettel')} className="text-left rounded-[6px] px-3 py-2 text-[13.5px] shadow-sm line-clamp-2" style={{ background: c.bg, color: c.ink }} data-testid="hub-slip">🗒️ {n.text}</button>;
      })}
      {list.length > 3 && <button type="button" onClick={() => go('zettel')} className="text-[12.5px] text-[var(--color-primary)] text-left underline underline-offset-2">{L(`+ ${list.length - 3} weitere Zettel in der Zettel-Box`, `+ ${list.length - 3} more slips in the slip box`)}</button>}
    </div>
  );
}

export function ProjectHub({ api, onLooks, onInfos, onShare, onFinish, onAddBlock, onCreate }: {
  api: ProjectApi;
  onLooks: () => void;
  onInfos: () => void;
  onShare: () => void;
  onFinish: () => void;
  onAddBlock: () => void;
  onCreate: (kind: NonNullable<Tile['create']>) => void;
}) {
  const { p, L, lang, update, go, quickNote, today } = api;
  const [layout, setLayout] = useState<HubLayout>(() => hubLayoutStore.get());
  const tiles = buildTiles(p, L, lang, today);
  // Im Kreis nur das Wichtigste (ruhig, nicht überfordernd) – weitere Seiten stehen als kleine Chips darunter
  const ring = tiles.filter((t) => t.core);
  const extras = tiles.filter((t) => !t.core);
  const n = ring.length;
  const effective: HubLayout = layout;
  const size = 22;
  const metrics = centerMetrics(p, L, today);
  const [mi, setMi] = useState(0);
  const metric = metrics.length ? metrics[mi % metrics.length] : undefined;
  const pick = (l: HubLayout) => { setLayout(l); hubLayoutStore.set(l); };
  const open = (t: Tile) => {
    if (t.more) onAddBlock();
    else if (t.create) onCreate(t.create);
    else go(t.to);
  };

  return (
    <div className="px-5 pb-28" data-testid="project-hub">
      <div className="flex items-center gap-3 mb-1">
        <button type="button" onClick={onLooks} className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden text-[28px] flex items-center justify-center" style={{ background: `${p.color}26`, border: `2px solid ${p.color}` }} aria-label={L('Symbol und Farbe ändern', 'Change symbol and colour')} data-testid="project-looks"><ProjectIcon p={p} size={28} /></button>
        <input className="flex-1 min-w-0 bg-transparent outline-none text-[28px] leading-tight font-medium" value={p.title} placeholder={L('Name des Projekts', 'Project name')} onChange={(e) => update((c) => ({ ...c, title: e.target.value }))} data-testid="project-title" aria-label={L('Name des Projekts', 'Project name')} />
      </div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button type="button" onClick={onInfos} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] border border-[var(--color-border-strong)] text-[var(--color-text-muted)]" data-testid="project-infos">
          <Settings2 size={13} />{statusLabel(p.status, L)}{p.end ? ` · ${L('bis', 'until')} ${new Date(`${p.end}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit' })}` : ''}
        </button>
        {p.summary.trim() && <span className="text-[12.5px] text-[var(--color-text-faint)] truncate max-w-[55%]">{p.summary.trim().split('\n')[0]}</span>}
        <span className="flex-1" />
        <div className="inline-flex rounded-full border border-[var(--color-border-strong)] overflow-hidden" role="group" aria-label={L('Ansicht', 'View')}>
          <button type="button" onClick={() => pick('circle')} aria-pressed={effective === 'circle'} aria-label={L('Kreis', 'Circle')} className="w-9 h-8 flex items-center justify-center" style={effective === 'circle' ? { background: 'var(--color-primary)', color: '#fff' } : { color: 'var(--color-text-muted)' }} data-testid="layout-circle"><Orbit size={16} /></button>
          <button type="button" onClick={() => pick('tiles')} aria-pressed={effective === 'tiles'} aria-label={L('Kacheln', 'Tiles')} className="w-9 h-8 flex items-center justify-center" style={effective === 'tiles' ? { background: 'var(--color-primary)', color: '#fff' } : { color: 'var(--color-text-muted)' }} data-testid="layout-tiles"><LayoutGrid size={16} /></button>
        </div>
      </div>

      <ProjectSlipStrip api={api} />

      {effective === 'circle' ? (
        <>
        <div className="relative w-full max-w-[440px] aspect-square mx-auto mb-9" data-testid="hub-circle">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] aspect-square">
            <span className="proj-center-ring absolute inset-0 rounded-full" style={{ border: `2px solid ${p.color}` }} aria-hidden="true" />
            <span className="proj-center-ring absolute inset-0 rounded-full" style={{ border: `2px solid ${p.color}`, animationDelay: '1.6s' }} aria-hidden="true" />
            <button type="button" onClick={() => (metric ? setMi((i) => i + 1) : onInfos())} className="relative w-full h-full rounded-full flex flex-col items-center justify-center" style={{ background: `${p.color}2e`, border: `3px solid ${p.color}` }} aria-label={metric ? `${metric.value} ${metric.unit}. ${L('Tippen: nächste Zahl', 'Tap: next figure')}` : L('Projekt-Infos', 'Project info')} data-testid="hub-center">
              {metric?.ring !== undefined && <Ring value={metric.ring} color={p.color} size={100} stroke={4} />}
              <span className={`${metric ? "w-[26%]" : "w-[48%]"} aspect-square flex items-center justify-center rounded-lg overflow-hidden text-[clamp(18px,6vw,26px)]`}><ProjectIcon p={p} size={22} /></span>
              {metric && <span className="text-[clamp(17px,5.6vw,24px)] leading-none mt-1 font-medium" style={{ color: p.color }} data-testid="hub-center-value">{metric.value}</span>}
              {metric && <span className="text-[10.5px] leading-tight mt-0.5 text-[var(--color-text-muted)]">{metric.unit}</span>}
            </button>
          </div>
          {ring.map((t, i) => <CircleTile key={t.key} t={t} i={i} n={n} size={size} onOpen={open} />)}
        </div>
        {metric && <p className="-mt-6 mb-7 text-center text-[12.5px] leading-relaxed text-[var(--color-text-muted)] px-2" data-testid="hub-center-explain"><strong>{L('Die Zahl in der Mitte:', 'The figure in the middle:')}</strong> {metric.explain} <span className="text-[var(--color-text-faint)]">{L('Tippe in die Mitte, um zwischen Fortschritt, Offenem, Schritten und Zeit zu wechseln.', 'Tap the middle to switch between progress, open items, steps and time.')}</span></p>}
        </>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2.5 mb-6" data-testid="hub-tiles">
          {tiles.map((t, i) => <ListTile key={t.key} t={t} i={i} onOpen={open} />)}
        </div>
      )}

      {effective === 'circle' && extras.length > 0 && (
        <div className="mb-5" data-testid="hub-extras">
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{L('Weitere Seiten', 'More pages')}</p>
          <div className="flex flex-wrap gap-2">
            {extras.map((t) => (
              <button key={t.key} type="button" onClick={() => open(t)} data-testid={`tile-${t.key}`} className={`proj-tile proj-pop ${t.glow ? 'proj-glow' : ''} inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1.5 text-[13px]`} style={{ ['--tile-c' as string]: t.color, background: `color-mix(in srgb, ${t.color} 14%, var(--color-surface))`, border: `1.5px ${t.more ? 'dashed' : 'solid'} ${t.color}` }}>
                <span aria-hidden="true">{t.icon}</span>{t.label}{t.badge && <span className="text-[11px]" style={{ color: t.color }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={quickNote} className="w-full mb-2 inline-flex items-center justify-center gap-2 py-3 rounded-full text-[15px] text-white" style={{ background: 'var(--color-primary)' }} data-testid="quicknote-button"><Zap size={17} />{L('Schnellnotiz – gleich festhalten', 'Quick note – catch it right away')}</button>
      <div className="flex gap-2">
        <button type="button" onClick={onShare} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-[var(--color-border-strong)] text-[14px]" data-testid="project-share"><FileDown size={16} />{L('Teilen / PDF', 'Share / PDF')}</button>
        {p.status !== 'done' ? (
          <button type="button" onClick={onFinish} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-[var(--color-border-strong)] text-[14px]" data-testid="project-finish"><CheckCheck size={16} />{L('Abschließen', 'Complete')}</button>
        ) : (
          <button type="button" onClick={() => update((c) => ({ ...c, status: 'running', closedAt: undefined }))} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-[var(--color-border-strong)] text-[14px]" data-testid="project-reopen">{L('Wieder öffnen', 'Reopen')}</button>
        )}
      </div>
      {p.status === 'done' && <p className="text-center text-[13px] mt-3" style={{ color: p.color }} data-testid="project-done-banner">🎉 {L('Geschafft! Das Projekt bleibt gespeichert.', 'Done! The project stays saved.')}</p>}

      <QuickNoteFab onClick={quickNote} label={L('Schnellnotiz', 'Quick note')} />
    </div>
  );
}
