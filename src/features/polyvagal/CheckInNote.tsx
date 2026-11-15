import { useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';

/**
 * Kurze, freiwillige Notiz zu einem Wert („Kopfschmerzen, müde …“). Erst ein leiser Knopf,
 * dann ein kleines Feld. Wird mit dem Wert gespeichert und in der Kurve neben Uhrzeit und Wert gezeigt.
 */
export function CheckInNote({ value, onChange, autoOpen = false }: { value: string; onChange: (v: string) => void; autoOpen?: boolean }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const [open, setOpen] = useState(autoOpen || !!value);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center justify-center gap-1.5 mx-auto mt-3 min-h-[44px] px-3 text-[13.5px] text-[var(--color-primary)]" data-testid="checkin-note-open">
        <NotebookPen size={15} /> {en ? 'Add a note (optional)' : 'Etwas dazu festhalten (freiwillig)'}
      </button>
    );
  }
  return (
    <div className="mt-3 animate-in" data-testid="checkin-note">
      <label className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">
        {en ? 'Anything you notice – e.g. headache, tired, tense shoulders' : 'Was du sonst wahrnimmst – z. B. Kopfschmerzen, müde, verspannte Schultern'}
      </label>
      <textarea className="input" rows={2} maxLength={400} value={value} onChange={(e) => onChange(e.target.value)} placeholder={en ? 'Short note …' : 'Kurze Notiz …'} data-testid="checkin-note-input" />
    </div>
  );
}
