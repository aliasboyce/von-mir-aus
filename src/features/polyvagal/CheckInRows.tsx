import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { bandForValue, FALLBACK_TENSION_BY_ZONE } from './arousalBands';
import { SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { deleteCheckIn, setCheckInNote } from './polyvagalRepo';
import type { PolyvagalCheckIn } from '../../data/types';

/**
 * Alle Werte als klare Liste: Uhrzeit, Wert in %, Zustand, Notiz. Ein Wert lässt sich mit einer Notiz ergänzen
 * oder – falls aus Versehen eingetragen – löschen (mit einer ruhigen Rückfrage).
 */
export function CheckInRows({ checkIns, onChanged, showDate = false }: { checkIns: PolyvagalCheckIn[]; onChanged: () => void; showDate?: boolean }) {
  const t = useT();
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const locale = en ? 'en-GB' : 'de-DE';
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);

  if (checkIns.length === 0) return null;
  const rows = [...checkIns].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <ul className="flex flex-col gap-2" data-testid="checkin-rows">
      {rows.map((c) => {
        const raw = c.tensionValue ?? FALLBACK_TENSION_BY_ZONE[c.zone];
        const band = bandForValue(raw);
        const zoneT = t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones];
        const d = new Date(c.createdAt);
        const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' });
        const st = c.survivalState ? SURVIVAL_STATE_META[c.survivalState] : undefined;
        const after = c.afterSkillTitle ? (en ? `after skill: ${c.afterSkillTitle}` : `nach Skill: ${c.afterSkillTitle}`) : c.afterRoutineTitle ? (en ? `after routine: ${c.afterRoutineTitle}` : `nach Routine: ${c.afterRoutineTitle}`) : '';
        return (
          <li key={c.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3" style={{ borderLeft: `5px solid ${band.color}` }} data-testid="checkin-row">
            <div className="flex items-start gap-3">
              <div className="w-[58px] flex-shrink-0">
                <p className="text-[18px] leading-none text-[var(--color-text)]" data-testid="checkin-row-time">{time}</p>
                {showDate && <p className="text-[11px] text-[var(--color-text-faint)] mt-1">{date}</p>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] text-[var(--color-text)]">
                  <span data-testid="checkin-row-value">{Math.round(raw)} %</span>
                  <span className="text-[var(--color-text-muted)]"> · {zoneT?.label ?? ''}</span>
                </p>
                {(st || after) && (
                  <p className="text-[12.5px] text-[var(--color-text-muted)] mt-0.5">
                    {st && <span>{st.emoji} {en ? st.labelEn : st.label}</span>}
                    {st && after && ' · '}
                    {after}
                  </p>
                )}
                {c.note && editing !== c.id && <p className="text-[13.5px] text-[var(--color-text)] mt-1.5 leading-snug" data-testid="checkin-row-note">„{c.note}“</p>}
              </div>
              <div className="flex flex-col -mr-1.5 -mt-1.5">
                <button type="button" onClick={() => { setEditing(editing === c.id ? null : c.id); setDraft(c.note ?? ''); setConfirm(null); }} aria-label={en ? 'Edit note' : 'Notiz bearbeiten'} className="w-11 h-11 flex items-center justify-center text-[var(--color-text-faint)]" data-testid="checkin-row-edit">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => { setConfirm(confirm === c.id ? null : c.id); setEditing(null); }} aria-label={en ? 'Delete value' : 'Wert löschen'} className="w-11 h-11 flex items-center justify-center text-[var(--color-text-faint)]" data-testid="checkin-row-delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {editing === c.id && (
              <div className="mt-2 animate-in">
                <textarea className="input" rows={2} maxLength={400} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={en ? 'Short note …' : 'Kurze Notiz …'} data-testid="checkin-row-note-input" />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => { setCheckInNote(c.id, draft); setEditing(null); onChanged(); }} className="px-4 min-h-[44px] rounded-full bg-[var(--color-primary)] text-[var(--color-surface)] text-[13.5px]" data-testid="checkin-row-note-save">{en ? 'Save' : 'Speichern'}</button>
                  <button type="button" onClick={() => setEditing(null)} className="px-3 min-h-[44px] text-[13.5px] text-[var(--color-text-muted)]">{t.common.cancel}</button>
                </div>
              </div>
            )}
            {confirm === c.id && (
              <div className="mt-2 flex items-center gap-2 flex-wrap animate-in" data-testid="checkin-row-confirm">
                <p className="text-[13px] text-[var(--color-text-muted)] flex-1 min-w-[160px]">{en ? 'Remove this value? It disappears from the curve.' : 'Diesen Wert entfernen? Er verschwindet auch aus der Kurve.'}</p>
                <button type="button" onClick={() => { deleteCheckIn(c.id); setConfirm(null); onChanged(); }} className="px-4 min-h-[44px] rounded-full border border-[var(--color-danger)] text-[var(--color-danger)] text-[13.5px]" data-testid="checkin-row-delete-yes">{en ? 'Remove' : 'Entfernen'}</button>
                <button type="button" onClick={() => setConfirm(null)} className="px-3 min-h-[44px] text-[13.5px] text-[var(--color-text-muted)]">{t.common.cancel}</button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
