import { Bell } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';

interface ReminderControlProps {
  compact?: boolean;
}

/** Shared reminder toggle+time picker. Reads/writes the same settings
 * fields everywhere it's used (Settings page, Tageskurve) — one reminder
 * system, just reachable from more than one place. */
export function ReminderControl({ compact = false }: ReminderControlProps) {
  const { settings, updateSettings } = useSettings();
  const t = useT();

  return (
    <div className={compact ? 'flex items-center gap-3 flex-wrap' : ''}>
      <label className="flex items-center gap-2 text-[14px] text-[var(--color-text)]">
        <input
          type="checkbox"
          checked={settings.remindersEnabled}
          onChange={(e) =>
            updateSettings({
              remindersEnabled: e.target.checked,
              weatherReminderTime: e.target.checked ? (settings.weatherReminderTime ?? '09:00') : undefined,
            })
          }
          className="w-4 h-4 accent-[var(--color-primary)]"
        />
        <Bell size={15} className="text-[var(--color-text-muted)]" />
        {t.settings.reminderTimeLabel}
      </label>
      {settings.remindersEnabled && (
        <input
          type="time"
          className="input"
          style={{ width: 120 }}
          value={settings.weatherReminderTime ?? '09:00'}
          onChange={(e) => updateSettings({ weatherReminderTime: e.target.value })}
        />
      )}
    </div>
  );
}
