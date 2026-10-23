import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { energyInfo, type EnergyLevel } from '../../content/energyLevels';
import { timeLabel, type FitSubject } from '../../content/fitCriteria';

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-tight" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
      {children}
    </span>
  );
}

/**
 * One quiet line of pills that says what an entry asks for — time, energy,
 * inner and outer access, effort. Shows only what is marked; nothing at all
 * when nothing is marked (no "missing" nagging).
 */
export function FitSummary({ subject }: { subject: FitSubject }) {
  const t = useT();
  const f = t.fit;
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const pills: string[] = [];
  const fit = subject.fit;

  if (fit?.minutes !== undefined) pills.push(`⏱ ${timeLabel(fit.minutes, lang)}`);
  if (subject.energy) {
    const [lo, hi] = subject.energy;
    const name = (l: number) => energyInfo(l as EnergyLevel, lang)?.label ?? String(l);
    pills.push(lo === hi ? `${f.energyTitle}: ${name(lo)}` : `${f.energyTitle}: ${name(lo)} – ${name(hi)}`);
  }
  if (subject.channels && subject.channels.length > 0) {
    pills.push(`${f.channelsPill}: ${subject.channels.map((c) => t.zugangskanaele.short[c]).join(', ')}`);
  }
  if (fit?.effort !== undefined) pills.push(`${f.effortTitle}: ${[f.effort1, f.effort2, f.effort3][fit.effort - 1]}`);

  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((p) => (
        <Pill key={p}>{p}</Pill>
      ))}
    </div>
  );
}
