import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { EFFORT_LEVELS, TIME_STEPS, timeLabel, type EffortLevel, type FitProfile } from '../../content/fitCriteria';

function Chip({ active, onClick, children, hint }: { active: boolean; onClick: () => void; children: React.ReactNode; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="text-left rounded-[var(--radius-md)] border px-2.5 py-2"
      style={{ borderColor: active ? 'var(--color-primary)' : 'var(--color-border)', background: active ? 'var(--color-primary-soft)' : 'var(--color-surface)' }}
    >
      <span className="block text-[12.5px] text-[var(--color-text)] leading-tight">{children}</span>
      {hint && <span className="block text-[10.5px] text-[var(--color-text-faint)] leading-tight mt-0.5">{hint}</span>}
    </button>
  );
}

/**
 * The form block that marks an entry for the "Was geht gerade?" filter: how
 * much time it needs at least, what it needs inside and outside, how much
 * effort it costs. Energy has its own picker right above it. All optional;
 * "Nichts davon nötig" is a real answer and differs from leaving it open.
 */
export function FitProfileFields({ value, onChange }: { value?: FitProfile; onChange: (v: FitProfile | undefined) => void }) {
  const t = useT();
  const f = t.fit;
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const v = value ?? {};

  function patch(p: Partial<FitProfile>) {
    const next = { ...v, ...p };
    // drop keys that went back to "not stated" so an untouched profile stays absent
    (Object.keys(next) as (keyof FitProfile)[]).forEach((k) => next[k] === undefined && delete next[k]);
    onChange(Object.keys(next).length === 0 ? undefined : next);
  }

  const effortText: Record<EffortLevel, [string, string]> = {
    1: [f.effort1, f.effort1Hint],
    2: [f.effort2, f.effort2Hint],
    3: [f.effort3, f.effort3Hint],
  };

  return (
    <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
      <p className="text-[13px] font-semibold text-[var(--color-text)] mb-0.5">{f.formTitle}</p>
      <p className="text-[11.5px] text-[var(--color-text-faint)] mb-3">{f.formHint}</p>

      <p className="text-[12.5px] font-medium text-[var(--color-text-muted)] mb-1.5">{f.formTime}</p>
      <div className="flex flex-wrap gap-1.5 mb-3.5">
        {TIME_STEPS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => patch({ minutes: v.minutes === m ? undefined : m })}
            aria-pressed={v.minutes === m}
            className="rounded-full border px-3 py-1.5 text-[12.5px]"
            style={{
              borderColor: v.minutes === m ? 'var(--color-primary)' : 'var(--color-border)',
              background: v.minutes === m ? 'var(--color-primary-soft)' : 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          >
            {timeLabel(m, lang)}
          </button>
        ))}
      </div>

      <p className="text-[12.5px] font-medium text-[var(--color-text-muted)] mb-1.5">{f.formEffort}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {EFFORT_LEVELS.map((e) => (
          <Chip key={e} active={v.effort === e} onClick={() => patch({ effort: v.effort === e ? undefined : e })} hint={effortText[e][1]}>
            {effortText[e][0]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
