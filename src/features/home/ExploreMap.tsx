import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { MAIN_AREAS, ADDON_GROUPS } from './exploreMapData';

const W = 360;
const H = 372;
const CX = W / 2;
const CY = 186;
const R = 112;
const NODE_R = 27;
const ADDON_COLOR = 'var(--color-text-faint)';

function nodePos(i: number) {
  const a = ((-90 + i * 60) * Math.PI) / 180;
  return { x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R };
}

export function ExploreMap() {
  const t = useT();
  const sm = t.systemMap;
  const navigate = useNavigate();
  const { settings } = useSettings();

  function scrollTo(id: string) {
    document.getElementById(`explore-branch-${id}`)?.scrollIntoView({ behavior: settings.reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  const nodes = [
    ...MAIN_AREAS.map((a) => ({ id: a.id as string, emoji: a.emoji, color: a.color, label: sm.areas[a.id].title, dashed: false })),
    { id: 'addons', emoji: '🧰', color: ADDON_COLOR, label: t.explore.mapAddons, dashed: true },
  ];

  return (
    <div>
      <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mb-2">{t.explore.mapHint}</p>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 400 }} className="mx-auto block mb-4" role="group" aria-label={t.explore.mapTitle}>
        {nodes.map((n, i) => {
          const p = nodePos(i);
          return <line key={`l-${n.id}`} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={n.color} strokeWidth={n.dashed ? 2 : 4} strokeDasharray={n.dashed ? '3 6' : undefined} strokeLinecap="round" opacity={n.dashed ? 0.8 : 0.9} />;
        })}
        <circle cx={CX} cy={CY} r={36} fill="var(--color-primary)" />
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="var(--color-surface)">
          {t.explore.mapCentre}
        </text>
        {nodes.map((n, i) => {
          const p = nodePos(i);
          return (
            <g
              key={n.id}
              role="button"
              tabIndex={0}
              aria-label={n.label}
              onClick={() => scrollTo(n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  scrollTo(n.id);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={p.x} cy={p.y} r={NODE_R} fill="var(--color-surface)" stroke={n.color} strokeWidth={n.dashed ? 2 : 3} strokeDasharray={n.dashed ? '4 4' : undefined} />
              <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize="22">
                {n.emoji}
              </text>
              <text x={p.x} y={p.y + NODE_R + 15} textAnchor="middle" fontSize="12" fontWeight="500" fill="var(--color-text)">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-col gap-3 mb-8">
        {MAIN_AREAS.map((area, i) => (
          <section key={area.id} id={`explore-branch-${area.id}`} className="rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-surface)', border: `1.5px solid ${area.color}`, scrollMarginTop: 12 }}>
            <div className="flex items-start gap-3 mb-2.5">
              <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[18px]" style={{ background: `${area.color}22` }}>
                {area.emoji}
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-[var(--color-text)]">
                  <span style={{ color: area.color }}>{i + 1}.</span> {sm.areas[area.id].title}
                </h2>
                <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{sm.areas[area.id].meaning}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {area.links.map((l) => (
                <button key={l.key} type="button" onClick={() => navigate(l.to)} className="rounded-full px-3 py-1.5 text-[12.5px] border" style={{ borderColor: area.color, color: area.color }}>
                  {sm.areaLinks[l.key as keyof typeof sm.areaLinks]} →
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section id="explore-branch-addons" className="rounded-[var(--radius-lg)] p-4 mb-6" style={{ border: '1.5px dashed var(--color-border-strong)', scrollMarginTop: 12 }}>
        <h2 className="text-[15px] font-semibold text-[var(--color-text)] flex items-center gap-2">
          <span>🧰</span> {t.explore.mapAddons}
        </h2>
        <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.explore.mapAddonsMeaning}</p>
        {ADDON_GROUPS.map((g) => (
          <div key={g.labelKey} className="mb-3">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{sm.extraGroupsNew[g.labelKey as keyof typeof sm.extraGroupsNew]}</p>
            <div className="flex flex-wrap gap-2">
              {g.items.map((item) => (
                <button key={item.titleKey} type="button" onClick={() => navigate(item.to)} className="rounded-full px-3 py-1.5 text-[12.5px] flex items-center gap-1.5" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text)' }}>
                  <span aria-hidden="true">{item.emoji}</span>
                  {sm.extraItems[item.titleKey as keyof typeof sm.extraItems]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <button type="button" onClick={() => navigate('/system-karte')} className="w-full flex items-center gap-3 p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] text-left" style={{ background: 'var(--color-primary-soft)' }}>
        <span className="text-[24px] flex-shrink-0">🧵</span>
        <span className="flex-1">
          <span className="block text-[14px] font-medium text-[var(--color-text)]">{t.explore.systemMapLink}</span>
          <span className="block text-[12px] text-[var(--color-text-faint)]">{t.explore.systemMapHint}</span>
        </span>
        <span className="text-[16px] text-[var(--color-primary)]">→</span>
      </button>
    </div>
  );
}
