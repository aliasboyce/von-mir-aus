import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';

/**
 * After a check-in: a quiet, easily dismissible question whether something else would feel good –
 * a medication entry, a routine, a little garden work. The check-in itself is already saved.
 */
export function CheckInFollowUp() {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  const items = [
    { to: '/entdecken/medi-log', emoji: '💊', label: en ? 'Log medication' : 'Medikament eintragen', id: 'medi' },
    { to: '/entdecken/garten', emoji: '🔁', label: en ? 'Start a routine' : 'Eine Routine starten', id: 'routine' },
    { to: '/entdecken/garten', emoji: '🌱', label: en ? 'Let something grow in the garden' : 'Im Garten etwas wachsen lassen', id: 'garden' },
  ];
  return (
    <div className="w-full rounded-[var(--radius-lg)] p-4 text-left relative animate-in" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }} data-testid="checkin-followup">
      <button type="button" onClick={() => setOpen(false)} aria-label={en ? 'Close' : 'Schließen'} className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]" data-testid="checkin-followup-close">
        <X size={16} />
      </button>
      <p className="text-[14px] text-[var(--color-text)] mb-3 pr-8 leading-snug">{en ? 'Only if it feels good: is there something else you would like to do now?' : 'Nur wenn es sich gut anfühlt: Möchtest du jetzt noch etwas tun?'}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <button key={i.id} type="button" onClick={() => navigate(i.to)} className="px-3.5 py-2 rounded-full text-[13px] text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border-strong)]" data-testid={`checkin-followup-${i.id}`}>
            {i.emoji} {i.label}
          </button>
        ))}
      </div>
    </div>
  );
}
