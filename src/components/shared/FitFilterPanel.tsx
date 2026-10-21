import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useFitFilter } from '../../state/fitFilterStore';
import { EnergyLevelFilter } from './EnergyLevelFilter';
import { Link } from 'react-router-dom';
import { ACCESS_CHANNEL_META, ACCESS_CHANNEL_ORDER } from '../../features/zugangskanaele/accessChannels';
import type { AccessChannel } from '../../data/types';
import {
  EFFORT_LEVELS,
  TIME_STEPS,
  activeCriteriaCount,
  availableChannels,
  isFitFilterActive,
  timeLabel,
  type ChannelLevels,
  type EffortLevel,
} from '../../content/fitCriteria';

function Chip({ active, onClick, children, hint }: { active: boolean; onClick: () => void; children: React.ReactNode; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="text-left rounded-[var(--radius-md)] border px-2.5 py-2 transition-colors"
      style={{ borderColor: active ? 'var(--color-primary)' : 'var(--color-border)', background: active ? 'var(--color-primary-soft)' : 'var(--color-surface)' }}
    >
      <span className="block text-[12.5px] text-[var(--color-text)] leading-tight">{children}</span>
      {hint && <span className="block text-[10.5px] text-[var(--color-text-faint)] leading-tight mt-0.5">{hint}</span>}
    </button>
  );
}

function Group({ title, question, children }: { title: string; question: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <p className="text-[12.5px] font-semibold text-[var(--color-text)]">{title}</p>
      <p className="text-[11.5px] text-[var(--color-text-faint)] mb-1.5">{question}</p>
      {children}
    </div>
  );
}

/**
 * "Was geht gerade?" — the shared multi-criteria filter (Energie, Zeit,
 * Zugriff nach innen, Zugriff nach außen, Aufwand). Collapsed to one line by
 * default so it never crowds a page; the line always says what is active.
 * Everything is optional and one tap resets it. `hiddenUnmarked` is how many
 * entries are currently hidden only because they have no details yet.
 */
export function FitFilterPanel({ hiddenUnmarked = 0, defaultOpen = false }: { hiddenUnmarked?: number; defaultOpen?: boolean }) {
  const t = useT();
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const { filter, setFilter, reset } = useFitFilter();
  const [open, setOpen] = useState(defaultOpen);
  const active = isFitFilterActive(filter);
  const f = t.fit;

  const effortLabel: Record<EffortLevel, [string, string]> = {
    1: [f.effort1, f.effort1Hint],
    2: [f.effort2, f.effort2Hint],
    3: [f.effort3, f.effort3Hint],
  };

  function toggleChannel(c: AccessChannel) {
    const cur: ChannelLevels = { ...(filter.levels ?? {}) };
    if ((cur[c] ?? 0) >= 1) delete cur[c];
    else cur[c] = 2;
    setFilter({ levels: Object.keys(cur).length === 0 ? null : cur });
  }

  const summary: string[] = [];
  if (filter.energy !== null) summary.push(`${f.energyTitle} ${filter.energy}`);
  if (filter.minutes !== null) summary.push(timeLabel(filter.minutes, lang));
  if (filter.levels !== null) summary.push(`${f.channelsTitle}: ${f.channelsSummary.replace('{n}', String(availableChannels(filter.levels).length))}`);
  if (filter.effort !== null) summary.push(effortLabel[filter.effort][0]);

  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border" style={{ borderColor: active ? 'var(--color-primary)' : 'var(--color-border)', background: 'var(--color-surface)' }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full flex items-center gap-2 px-3.5 py-3 text-left">
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-medium text-[var(--color-text)]">{f.title}</span>
          <span className="block text-[11.5px] text-[var(--color-text-muted)] leading-snug">{active ? summary.join(' · ') : f.summaryNone}</span>
        </span>
        {active && (
          <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
            {activeCriteriaCount(filter)}
          </span>
        )}
        {open ? <ChevronUp size={18} className="text-[var(--color-text-faint)]" /> : <ChevronDown size={18} className="text-[var(--color-text-faint)]" />}
      </button>

      {open && (
        <div className="px-3.5 pb-3.5 animate-in">
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{f.subtitle}</p>

          <Group title={f.energyTitle} question={t.energy.filterQuestion}>
            <div className="-mb-3">
              <EnergyLevelFilter value={filter.energy} onChange={(v) => setFilter({ energy: v })} hideQuestion />
            </div>
          </Group>

          <Group title={f.timeTitle} question={f.timeQuestion}>
            <div className="flex flex-wrap gap-1.5">
              {TIME_STEPS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilter({ minutes: filter.minutes === m ? null : m })}
                  aria-pressed={filter.minutes === m}
                  className="rounded-full border px-3 py-1.5 text-[12.5px]"
                  style={{
                    borderColor: filter.minutes === m ? 'var(--color-primary)' : 'var(--color-border)',
                    background: filter.minutes === m ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                >
                  {timeLabel(m, lang)}
                </button>
              ))}
            </div>
          </Group>

          <Group title={f.channelsTitle} question={f.channelsQuestion}>
            <p className="text-[11.5px] text-[var(--color-text-faint)] mb-1.5 -mt-1">{f.channelsHint}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ACCESS_CHANNEL_ORDER.map((c) => {
                const meta = ACCESS_CHANNEL_META[c];
                return (
                  <Chip key={c} active={(filter.levels?.[c] ?? 0) >= 1} onClick={() => toggleChannel(c)} hint={meta.hint(t)}>
                    <span className="inline-flex items-center gap-1.5">
                      <meta.icon size={13} className="flex-shrink-0" />
                      {meta.label(t)}
                    </span>
                  </Chip>
                );
              })}
            </div>
            <Link to="/entdecken/zugangskanaele" className="inline-block mt-2 text-[12.5px] text-[var(--color-primary)] underline underline-offset-2">
              {f.channelsPage}
            </Link>
          </Group>

          <Group title={f.effortTitle} question={f.effortQuestion}>
            <div className="grid grid-cols-3 gap-1.5">
              {EFFORT_LEVELS.map((e) => (
                <Chip key={e} active={filter.effort === e} onClick={() => setFilter({ effort: filter.effort === e ? null : e })} hint={effortLabel[e][1]}>
                  {effortLabel[e][0]}
                </Chip>
              ))}
            </div>
          </Group>

          {active && (
            <button type="button" onClick={reset} className="text-[12.5px] text-[var(--color-primary)]">
              {f.reset}
            </button>
          )}
        </div>
      )}

      {active && (hiddenUnmarked > 0 || filter.includeUnmarked) && (
        <p className="px-3.5 pb-3 text-[11.5px] text-[var(--color-text-muted)]">
          {filter.includeUnmarked ? f.unmarkedShown : f.hiddenUnmarked.replace('{n}', String(hiddenUnmarked))} ·{' '}
          <button type="button" onClick={() => setFilter({ includeUnmarked: !filter.includeUnmarked })} className="text-[var(--color-primary)] underline">
            {filter.includeUnmarked ? f.hideUnmarked : f.showUnmarked}
          </button>
        </p>
      )}
    </div>
  );
}
