import { useState } from 'react';
import { useT } from '../../i18n';

/**
 * "Timer-Zeit selber einstellen"-Auftrag — the preset buttons (2, 5,
 * 10, 15, 20, 30, 60, 90, 120 min) don't cover every duration someone
 * might want (the user's own example: 3 minutes). A small number
 * input + "Start" button lets anyone type any whole-minute duration,
 * shown alongside the presets rather than replacing them. Shared
 * across every timer entry point (bridges, resources, the standalone
 * timer) so a fix here reaches all of them at once.
 */
export function CustomDurationInput({ onStart }: { onStart: (minutes: number) => void }) {
  const t = useT();
  const [value, setValue] = useState('');

  function submit() {
    const n = Math.round(Number(value));
    if (Number.isFinite(n) && n > 0 && n <= 999) onStart(n);
  }

  return (
    <div className="flex items-center gap-2 justify-center mt-3">
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={999}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder={t.bridges.timerCustomPlaceholder}
        className="w-20 px-3 py-2.5 rounded-full text-[14px] text-center bg-[var(--color-surface-muted)] text-[var(--color-text)] border border-[var(--color-border)]"
        aria-label={t.bridges.timerCustomLabel}
      />
      <span className="text-[13px] text-[var(--color-text-faint)]">{t.bridges.timerCustomUnit}</span>
      <button
        type="button"
        onClick={submit}
        disabled={!value}
        className="px-4 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)] disabled:opacity-40"
      >
        {t.bridges.timerCustomStartCta}
      </button>
    </div>
  );
}
