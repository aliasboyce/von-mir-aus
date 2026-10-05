import { useState } from 'react';
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

interface MainArea {
  id: 'where' | 'regulate' | 'connect' | 'secure' | 'look';
  emoji: string;
  color: string;
  links: { to: string; key: string }[];
}

/**
 * "Die 'Wie haengt alles zusammen'-Seite aktualisieren und nutzen, um
 * die Hauptbereiche von Zusatzfunktionen zu trennen und den Sinn
 * uebersichtlich darzustellen"-Auftrag — the five main areas are the
 * core (check-in, regulating, connecting, keeping safe, looking back);
 * every other page is listed below them as an additional function.
 */
const MAIN_AREAS: MainArea[] = [
  { id: 'where', emoji: '📍', color: '#6fbf73', links: [{ to: '/entdecken/tageskurve', key: 'checkin' }, { to: '/zugang', key: 'zugang' }, { to: '/entdecken/nervensystem', key: 'nervensystem' }] },
  { id: 'regulate', emoji: '🎚️', color: '#c9522f', links: [{ to: '/entdecken/ressourcen/skills', key: 'skills' }, { to: '/entdecken/ressourcen/skillketten', key: 'skillketten' }, { to: '/entdecken/ressourcen/hilfsmittel', key: 'hilfsmittel' }] },
  { id: 'connect', emoji: '🌉', color: '#8fae3d', links: [{ to: '/bruecken', key: 'bruecken' }, { to: '/entdecken/wertekompass', key: 'wertekompass' }, { to: '/entdecken/beduerfnis-kompass', key: 'beduerfnis' }, { to: '/entdecken/garten', key: 'garten' }] },
  { id: 'secure', emoji: '🛟', color: '#4a6fa5', links: [{ to: '/sicherheit/netzwerk', key: 'netzwerk' }, { to: '/sicherheit/plan', key: 'sicherheitsplan' }, { to: '/sicherheit/kontakte', key: 'kontakte' }, { to: '/krisenmodus', key: 'krisenmodus' }, { to: '/helfermodus', key: 'helfermodus' }] },
  { id: 'look', emoji: '📖', color: '#e8a83d', links: [{ to: '/sicherheit/tagebuch', key: 'tagesrueckblick' }, { to: '/wochenrueckblick', key: 'wochenrueckblick' }, { to: '/entdecken/tageskurve/entwicklung', key: 'entwicklung' }] },
];

const NEW_EXTRA_GROUPS: { labelKey: string; items: { emoji: string; titleKey: string; to: string }[] }[] = [
  { labelKey: 'nachschlagen', items: [{ emoji: '🫀', titleKey: 'koerper', to: '/entdecken/koerper' }, { emoji: '🌊', titleKey: 'nervensystem', to: '/entdecken/nervensystem' }, { emoji: '❤️', titleKey: 'gefuehle', to: '/entdecken/gefuehle' }, { emoji: '📚', titleKey: 'quellen', to: '/quellen' }] },
  { labelKey: 'gedanken', items: [{ emoji: '🧠', titleKey: 'denkmaschine', to: '/entdecken/denkmaschine' }, { emoji: '🍃', titleKey: 'loslassen', to: '/entdecken/loslassen' }] },
  { labelKey: 'schreiben', items: [{ emoji: '📔', titleKey: 'tagebuch', to: '/sicherheit/tagebuch' }, { emoji: '💌', titleKey: 'briefAnMich', to: '/entdecken/brief-an-mich' }, { emoji: '🔖', titleKey: 'lesezeichen', to: '/entdecken/lesezeichen' }] },
  { labelKey: 'alltag', items: [{ emoji: '📅', titleKey: 'kalender', to: '/kalender' }, { emoji: '⏱️', titleKey: 'timer', to: '/entdecken/timer' }, { emoji: '💊', titleKey: 'mediLog', to: '/entdecken/medi-log' }, { emoji: '⭐', titleKey: 'favoriten', to: '/favoriten' }] },
  { labelKey: 'begleitung', items: [{ emoji: '✨', titleKey: 'wesen', to: '/einstellungen/wesen-info' }] },
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
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} />
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

        <p className="text-[15px] font-semibold text-[var(--color-text)] mb-1">{t.systemMap.mainAreasTitle}</p>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.systemMap.mainAreasHint}</p>
        <div className="flex flex-col gap-3 mb-8">
          {MAIN_AREAS.map((area, i) => (
            <div key={area.id} className="rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-surface)', border: `1.5px solid ${area.color}` }}>
              <div className="flex items-start gap-3 mb-2">
                <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[18px]" style={{ background: `${area.color}22` }}>
                  {area.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[var(--color-text)]">
                    <span style={{ color: area.color }}>{i + 1}.</span> {t.systemMap.areas[area.id].title}
                  </p>
                  <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.systemMap.areas[area.id].meaning}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {area.links.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => navigate(l.to)}
                    className="rounded-full px-3 py-1.5 text-[12.5px] border"
                    style={{ borderColor: area.color, color: area.color }}
                  >
                    {t.systemMap.areaLinks[l.key as keyof typeof t.systemMap.areaLinks]} →
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-[var(--color-border)] mb-8">
          <p className="text-[15px] font-semibold text-[var(--color-text)] mt-5 mb-1">{t.systemMap.extrasTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.systemMap.extrasHint}</p>
          {NEW_EXTRA_GROUPS.map((group) => (
            <div key={group.labelKey} className="mb-4">
              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.systemMap.extraGroupsNew[group.labelKey as keyof typeof t.systemMap.extraGroupsNew]}</p>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map((item) => (
                  <button key={item.titleKey} onClick={() => navigate(item.to)} className="flex items-start gap-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-left">
                    <span className="text-[16px] flex-shrink-0">{item.emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] text-[var(--color-text)]">{t.systemMap.extraItems[item.titleKey as keyof typeof t.systemMap.extraItems]}</span>
                      <span className="block text-[11px] text-[var(--color-text-faint)]">{t.systemMap.extraItemHints[item.titleKey as keyof typeof t.systemMap.extraItemHints]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowMap((v) => !v)} className="text-[13px] text-[var(--color-primary)] underline underline-offset-2 mb-4">
          {showMap ? t.systemMap.mapHide : t.systemMap.mapShow}
        </button>
        {showMap && (
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
        )}

        <div className="mt-4 pt-5 border-t border-[var(--color-border)]">
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.systemMap.sideNote1}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.systemMap.sideNote2}</p>
        </div>

        <p className="text-[12px] text-[var(--color-text-faint)] mt-6 leading-relaxed">{t.systemMap.notLinear}</p>
      </div>
    </div>
  );
}
