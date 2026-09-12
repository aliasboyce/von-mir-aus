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

interface ExtraGroup {
  labelKey: string;
  items: { emoji: string; titleKey: string; to: string }[];
}

/**
 * "Wirklich jede Seite/Funktion, jeweils mit kurzer Beschreibung"-
 * Auftrag — a full audit against every route in App.tsx found this
 * was genuinely out of date: the check-in/Tageskurve page (this
 * session's biggest single area of work) was completely missing, as
 * were the timer, favorites, sources, safety plan, contacts, weekly
 * review, letter-to-self, bookmarks, and medication log. All added
 * below, organized by kind rather than crammed onto the main thread
 * (which stays a clean eight-step conceptual path, not a literal
 * list of every screen).
 */
const EXTRA_GROUPS: ExtraGroup[] = [
  {
    labelKey: 'groupCheckin',
    items: [
      { emoji: '🌤️', titleKey: 'tageskurve', to: '/entdecken/tageskurve' },
      { emoji: '⏱️', titleKey: 'timer', to: '/entdecken/timer' },
    ],
  },
  {
    labelKey: 'groupZugangDetails',
    items: [
      { emoji: '🫀', titleKey: 'koerper', to: '/entdecken/koerper' },
      { emoji: '🌊', titleKey: 'nervensystem', to: '/entdecken/nervensystem' },
      { emoji: '❤️', titleKey: 'gefuehle', to: '/entdecken/gefuehle' },
    ],
  },
  {
    labelKey: 'groupGedanken',
    items: [
      { emoji: '🧠', titleKey: 'denkmaschine', to: '/entdecken/denkmaschine' },
      { emoji: '🍃', titleKey: 'loslassen', to: '/entdecken/loslassen' },
    ],
  },
  {
    labelKey: 'groupWerkzeuge',
    items: [
      { emoji: '🎁', titleKey: 'ressourcen', to: '/entdecken/ressourcen' },
      { emoji: '📔', titleKey: 'tagebuch', to: '/sicherheit/tagebuch' },
      { emoji: '🌱', titleKey: 'garten', to: '/entdecken/garten' },
      { emoji: '⭐', titleKey: 'favoriten', to: '/favoriten' },
    ],
  },
  {
    labelKey: 'groupSicherheit',
    items: [
      { emoji: '📋', titleKey: 'sicherheitsplan', to: '/sicherheit/plan' },
      { emoji: '📇', titleKey: 'kontakte', to: '/sicherheit/kontakte' },
    ],
  },
  {
    labelKey: 'groupRueckblick',
    items: [
      { emoji: '📊', titleKey: 'wochenrueckblick', to: '/wochenrueckblick' },
      { emoji: '📈', titleKey: 'entwicklung', to: '/entdecken/tageskurve/entwicklung' },
    ],
  },
  {
    labelKey: 'groupBegleitung',
    items: [
      { emoji: '✨', titleKey: 'wesen', to: '/einstellungen/wesen-info' },
      { emoji: '🚨', titleKey: 'krisenmodus', to: '/krisenmodus' },
      { emoji: '🤝', titleKey: 'helfermodus', to: '/helfermodus' },
    ],
  },
  {
    labelKey: 'groupSonstiges',
    items: [
      { emoji: '💌', titleKey: 'briefAnMich', to: '/entdecken/brief-an-mich' },
      { emoji: '🔖', titleKey: 'lesezeichen', to: '/entdecken/lesezeichen' },
      { emoji: '💊', titleKey: 'mediLog', to: '/entdecken/medi-log' },
      { emoji: '📚', titleKey: 'quellen', to: '/quellen' },
    ],
  },
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
 * station relies on the app's already-consistent navigate(-1) pattern
 * on every page's TopBar, so "Zurück" naturally returns here.
 */
export function SystemMapPage() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} />
      <div className="px-5 pb-10">
        <h1 className="text-[24px] mb-1">{t.systemMap.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-2 leading-relaxed">{t.systemMap.subtitle}</p>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-6 leading-relaxed">{t.systemMap.hint}</p>

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

        <div className="pt-2 border-t border-[var(--color-border)]">
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mt-5 mb-3">{t.systemMap.extrasIntro}</p>
          {EXTRA_GROUPS.map((group) => (
            <div key={group.labelKey} className="mb-5">
              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                {t.systemMap.extraGroups[group.labelKey as keyof typeof t.systemMap.extraGroups]}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item) => (
                  <button
                    key={item.titleKey}
                    onClick={() => navigate(item.to)}
                    className="flex items-start gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-left"
                  >
                    <span className="text-[16px] flex-shrink-0">{item.emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] text-[var(--color-text)] truncate">
                        {t.systemMap.extraItems[item.titleKey as keyof typeof t.systemMap.extraItems]}
                      </span>
                      <span className="block text-[11px] text-[var(--color-text-faint)] truncate">
                        {t.systemMap.extraItemHints[item.titleKey as keyof typeof t.systemMap.extraItemHints]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-5 border-t border-[var(--color-border)]">
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.systemMap.sideNote1}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.systemMap.sideNote2}</p>
        </div>

        <p className="text-[12px] text-[var(--color-text-faint)] mt-6 leading-relaxed">{t.systemMap.notLinear}</p>
      </div>
    </div>
  );
}
