import { useState } from 'react';
import { X } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { polyvagalRepo } from './polyvagalRepo';
import { bandForValue } from './arousalBands';
import type { PolyvagalCheckIn } from '../../data/types';

/**
 * "Wertfreie Nachbesprechung/Reflexions-Tagebuch"-Auftrag — two simple,
 * non-judgmental questions attached to one specific check-in point, so
 * patterns (e.g. chronic shutdown at a certain time of day) become
 * visible over time without turning this into a graded, "did you do
 * it right" journal.
 */
interface ReflectionModalProps {
  checkIn: PolyvagalCheckIn;
  onClose: () => void;
  onSaved: () => void;
}

export function ReflectionModal({ checkIn, onClose, onSaved }: ReflectionModalProps) {
  const t = useT();
  const { settings } = useSettings();
  const [trigger, setTrigger] = useState(checkIn.reflectionTrigger ?? '');
  const [whatHelped, setWhatHelped] = useState(checkIn.reflectionWhatHelped ?? '');
  const raw = checkIn.tensionValue ?? { ventral: 83, sympathetic: 50, dorsal: 17 }[checkIn.zone];
  const band = bandForValue(raw);
  const zoneT = t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones];
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const timeLabel = new Date(checkIn.createdAt).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  function save() {
    polyvagalRepo.save({ ...checkIn, reflectionTrigger: trigger.trim() || undefined, reflectionWhatHelped: whatHelped.trim() || undefined });
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[410] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div
        className="w-full max-w-[440px] max-h-[85vh] overflow-y-auto rounded-[var(--radius-xl)] p-5 animate-in"
        style={{ background: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2 mb-1">
          <p className="text-[15px] font-medium text-[var(--color-text)] flex-1">{t.polyvagal.reflectionTitle}</p>
          <button onClick={onClose} className="text-[var(--color-text-faint)]">
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[13px] font-medium px-2 py-1 rounded-full" style={{ background: `${band.color}1f`, color: band.color }}>
            {raw}% · {zoneT.label}
          </span>
          <span className="text-[12px] text-[var(--color-text-faint)]">{timeLabel}</span>
        </div>

        <label className="block mb-4">
          <span className="text-[13px] font-medium text-[var(--color-text)] block mb-1.5">{t.polyvagal.reflectionQ1}</span>
          <textarea
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] text-[13px]"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', resize: 'vertical' }}
          />
        </label>
        <label className="block mb-5">
          <span className="text-[13px] font-medium text-[var(--color-text)] block mb-1.5">{t.polyvagal.reflectionQ2}</span>
          <textarea
            value={whatHelped}
            onChange={(e) => setWhatHelped(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] text-[13px]"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', resize: 'vertical' }}
          />
        </label>
        <p className="text-[11.5px] text-[var(--color-text-faint)] leading-relaxed mb-4">{t.polyvagal.reflectionHint}</p>
        <button onClick={save} className="w-full py-3 rounded-full text-[14px]" style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}>
          {t.common.save}
        </button>
      </div>
    </div>
  );
}
