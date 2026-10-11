import { goBack } from '../../services/navigation';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/navigation/TopBar';
import { useT } from '../../i18n';

interface Station {
  emoji: string;
  titleKey: string;
  questionKey: string;
  to: string;
}

const STATIONS: Station[] = [
  { emoji: '🛟', titleKey: 'safetyNet', questionKey: 'safetyNetQ', to: '/sicherheit/netzwerk' },
  { emoji: '🧭', titleKey: 'zugang', questionKey: 'zugangQ', to: '/zugang' },
  { emoji: '💧', titleKey: 'beduerfnis', questionKey: 'beduerfnisQ', to: '/entdecken/beduerfnis-kompass' },
  { emoji: '🚧', titleKey: 'hindernis', questionKey: 'hindernisQ', to: '/entdecken/schutzstrategien' },
  { emoji: '🌉', titleKey: 'bruecke', questionKey: 'brueckeQ', to: '/bruecken' },
  { emoji: '🧭', titleKey: 'wertekompass', questionKey: 'wertekompassQ', to: '/entdecken/wertekompass' },
  { emoji: '👣', titleKey: 'handlung', questionKey: 'handlungQ', to: '/entdecken/garten' },
  { emoji: '📖', titleKey: 'rueckblick', questionKey: 'rueckblickQ', to: '/zugang/rueckblick' },
];

const VB_W = 320;
const ROW_H = 132;
const VB_H = STATIONS.length * ROW_H + 40;

function stationPos(i: number): { x: number; y: number } {
  const y = 44 + i * ROW_H;
  const x = i % 2 === 0 ? 96 : VB_W - 96;
  return { x, y };
}

function pathD(): string {
  let d = '';
  for (let i = 0; i < STATIONS.length; i++) {
    const p = stationPos(i);
    if (i === 0) {
      d += `M${p.x},${p.y}`;
    } else {
      const prev = stationPos(i - 1);
      const midY = (prev.y + p.y) / 2;
      d += ` C${prev.x},${midY} ${p.x},${midY} ${p.x},${p.y}`;
    }
  }
  return d;
}

/**
 * Weiterentwicklung brief, Section 3 — thorough rework of the previous
 * version: (1) every station now has its label rendered directly on
 * the map itself, not only in a separate list below, so nobody has to
 * guess what an emoji means; (2) a new grouped section below covers
 * every remaining page in the system (previously only the eight core
 * red-thread stations existed), organized by kind rather than as more
 * winding-path stops, keeping the map calm instead of adding
 * crossing lines; (3) navigation back to this page after visiting any
 * station relies on the app's already-consistent goBack(navigate) pattern
 * on every page's TopBar, so "Zurück" naturally returns here.
 */
export function SystemMapPage() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="animate-in">
      <TopBar onBack={() => goBack(navigate)} />
      <div className="px-5 pb-10">
        <h1 className="text-[24px] mb-1">{t.systemMap.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-2 leading-relaxed">{t.systemMap.subtitle}</p>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-6 leading-relaxed">{t.systemMap.hint}</p>

        {/* The two ways, in the person's own words. */}
        <div className="rounded-[var(--radius-lg)] p-4 mb-6" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2">{t.systemMap.twoWaysTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">
            <strong className="text-[var(--color-text)]">{t.systemMap.twoWaysSkillkette}:</strong> {t.resources.skillkettenConcept}
          </p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
            <strong className="text-[var(--color-text)]">{t.systemMap.twoWaysBruecke}:</strong> {t.bridges.concept}
          </p>
        </div>

        <button
          onClick={() => navigate('/entdecken')}
          className="w-full flex items-center gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] text-left mb-8"
          style={{ background: 'var(--color-primary-soft)' }}
        >
          <span className="text-[28px] flex-shrink-0">🗺️</span>
          <span className="flex-1">
            <span className="block text-[15px] font-medium text-[var(--color-text)]">{t.systemMap.openMapCta}</span>
            <span className="block text-[12px] text-[var(--color-text-faint)]">{t.systemMap.openMapHint}</span>
          </span>
          <span className="text-[18px] text-[var(--color-primary)]">→</span>
        </button>

        <>
        <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">{t.systemMap.mainThreadLabel}</p>
        <div className="flex justify-center mb-2">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" style={{ maxWidth: 360 }} role="img" aria-hidden="true">
            <path d={pathD()} fill="none" stroke="var(--color-border-strong)" strokeWidth="2.5" strokeDasharray="1,10" strokeLinecap="round" />
            {STATIONS.map((s, i) => {
              const p = stationPos(i);
              const label = t.systemMap.stations[s.titleKey as keyof typeof t.systemMap.stations];
              return (
                <g key={s.titleKey} onClick={() => navigate(s.to)} style={{ cursor: 'pointer' }}>
                  <circle cx={p.x} cy={p.y} r="30" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2" />
                  <text x={p.x} y={p.y + 8} textAnchor="middle" fontSize="24">
                    {s.emoji}
                  </text>
                  <text x={p.x} y={p.y + 48} textAnchor="middle" fontSize="12" fill="var(--color-text)" fontWeight="500">
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-col gap-2 mt-4 mb-8">
          {STATIONS.map((s) => (
            <button
              key={s.titleKey}
              onClick={() => navigate(s.to)}
              className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] text-left"
            >
              <span className="text-[20px] flex-shrink-0">{s.emoji}</span>
              <div className="min-w-0">
                <p className="text-[14px] text-[var(--color-text)]">{t.systemMap.stations[s.titleKey as keyof typeof t.systemMap.stations]}</p>
                <p className="text-[12px] text-[var(--color-text-faint)]">{t.systemMap.questions[s.questionKey as keyof typeof t.systemMap.questions]}</p>
              </div>
            </button>
          ))}
        </div>

        </>

        <div className="mt-4 pt-5 border-t border-[var(--color-border)]">
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.systemMap.sideNote1}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.systemMap.sideNote2}</p>
        </div>

        <p className="text-[12px] text-[var(--color-text-faint)] mt-6 leading-relaxed">{t.systemMap.notLinear}</p>
      </div>
    </div>
  );
}
