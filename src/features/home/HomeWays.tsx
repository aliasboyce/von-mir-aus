import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { OVERVIEW_GROUPS, type OverviewEntry } from './appOverviewData';

export type HomeWay = 'halt' | 'verstehen' | 'tun';

/** Der vierte Einstieg ist kein Weg zum Merken, sondern führt direkt zu „Zustand & Zugang“. */
const ZUGANG = { emoji: '🧭', to: '/zugang', de: { title: 'Zustand & Zugang', sub: 'Was geht gerade?' }, en: { title: 'State & access', sub: 'What works right now?' } };

const WAYS: { id: HomeWay; emoji: string; groups: string[]; de: { title: string; sub: string }; en: { title: string; sub: string } }[] = [
  { id: 'halt', emoji: '🫂', groups: ['acute'], de: { title: 'Halt', sub: 'Gerade ist es viel' }, en: { title: 'Support', sub: 'It is a lot right now' } },
  { id: 'verstehen', emoji: '🔎', groups: ['understand'], de: { title: 'Verstehen', sub: 'Einordnen, nachschlagen' }, en: { title: 'Understand', sub: 'Sort it out, look it up' } },
  { id: 'tun', emoji: '🌱', groups: ['regulate', 'act'], de: { title: 'Tun', sub: 'Etwas Kleines machen' }, en: { title: 'Do', sub: 'Do something small' } },
];

/**
 * „Was brauchst du heute?“ – statt aller Funktionen drei Wege. Die Wahl wird gemerkt und lässt sich
 * jederzeit ändern. „Zustand & Zugang“ ist der vierte Einstieg und führt direkt zum Zugang.
 */
export function HomeWays({ isEn, onOpenGrounding, onIntent }: { isEn: boolean; onOpenGrounding: () => void; onIntent?: () => void }) {
  const { settings, updateSettings } = useSettings();
  const way = settings.homeWay;

  if (!way || way === 'alle') {
    return (
      <div className="mb-6" data-testid="home-ways">
        <p className="text-[17px] text-[var(--color-text)] text-center mb-1">{isEn ? 'What do you need today?' : 'Was brauchst du heute?'}</p>
        <p className="text-[12.5px] text-[var(--color-text-faint)] text-center mb-3">{isEn ? 'Pick one – you can change it any time.' : 'Such dir einen aus – du kannst jederzeit wechseln.'}</p>
        <div className="grid grid-cols-2 gap-2">
          {WAYS.map((w) => (
            <button key={w.id} type="button" onClick={() => updateSettings({ homeWay: w.id })} data-testid={`home-way-${w.id}`} className="text-left">
              <Card interactive padding="md" className="text-center h-full flex flex-col items-center justify-center gap-1 min-h-[104px]">
                <span className="text-[22px]" aria-hidden="true">{w.emoji}</span>
                <p className="text-[14px] text-[var(--color-text)]">{isEn ? w.en.title : w.de.title}</p>
                <p className="text-[11px] text-[var(--color-text-faint)] leading-snug">{isEn ? w.en.sub : w.de.sub}</p>
              </Card>
            </button>
          ))}
          <Link to={ZUGANG.to} data-testid="home-way-zugang" className="text-left">
            <Card interactive padding="md" className="text-center h-full flex flex-col items-center justify-center gap-1 min-h-[104px]">
              <span className="text-[22px]" aria-hidden="true">{ZUGANG.emoji}</span>
              <p className="text-[14px] text-[var(--color-text)]">{isEn ? ZUGANG.en.title : ZUGANG.de.title}</p>
              <p className="text-[11px] text-[var(--color-text-faint)] leading-snug">{isEn ? ZUGANG.en.sub : ZUGANG.de.sub}</p>
            </Card>
          </Link>
        </div>
        <div className="flex justify-center gap-4 mt-2.5">
          <Link to="/entdecken" className="text-[12.5px] text-[var(--color-text-faint)] underline underline-offset-2 py-1.5" data-testid="home-way-all">
            {isEn ? 'See everything in Discover' : 'Alles in „Entdecken“ ansehen'}
          </Link>
        </div>
      </div>
    );
  }

  const def = WAYS.find((w) => w.id === way) ?? WAYS[0];
  const entries: OverviewEntry[] = def.groups.flatMap((gid) => OVERVIEW_GROUPS.find((g) => g.id === gid)?.entries ?? []).slice(0, 8);
  return (
    <div className="mb-6" data-testid="home-way-chosen">
      <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
        <span aria-hidden="true">{def.emoji} </span>{isEn ? def.en.title : def.de.title} · {isEn ? def.en.sub : def.de.sub}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {entries.map((e) => {
          const c = isEn ? e.en : e.de;
          const inner = (<><span aria-hidden="true">{e.emoji}</span><span className="leading-snug">{c.title}</span></>);
          const cls = 'flex items-center gap-2 rounded-[var(--radius-lg)] px-3 py-3 min-h-[52px] text-[13px] text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] text-left';
          return e.to ? (
            <Link key={e.id} to={e.to} className={cls} data-testid={`home-way-entry-${e.id}`}>{inner}</Link>
          ) : (
            <button key={e.id} type="button" onClick={onOpenGrounding} className={cls} data-testid={`home-way-entry-${e.id}`}>{inner}</button>
          );
        })}
      </div>
      <Link to={ZUGANG.to} className="flex items-center gap-2 rounded-[var(--radius-lg)] px-3 py-3 min-h-[52px] text-[13px] text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] mt-2" data-testid="home-way-zugang">
        <span aria-hidden="true">{ZUGANG.emoji}</span>
        <span className="leading-snug">{isEn ? ZUGANG.en.title : ZUGANG.de.title} <span className="text-[var(--color-text-faint)]">· {isEn ? ZUGANG.en.sub : ZUGANG.de.sub}</span></span>
      </Link>
      <div className="flex justify-center gap-4 mt-2 flex-wrap">
        <button type="button" onClick={() => updateSettings({ homeWay: undefined })} className="text-[12.5px] text-[var(--color-primary)] underline underline-offset-2 py-1.5" data-testid="home-way-change">
          {isEn ? 'Choose another way' : 'Anderen Weg wählen'}
        </button>
        <Link to="/entdecken" className="text-[12.5px] text-[var(--color-text-faint)] underline underline-offset-2 py-1.5">
          {isEn ? 'See everything in Discover' : 'Alles in „Entdecken“ ansehen'}
        </Link>
        {onIntent && (
          <button type="button" onClick={onIntent} className="text-[12.5px] text-[var(--color-text-faint)] underline underline-offset-2 py-1.5">
            {isEn ? 'Tell me what you need' : 'Sag mir, was du brauchst'}
          </button>
        )}
      </div>
    </div>
  );
}
