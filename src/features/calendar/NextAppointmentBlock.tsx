import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { appointmentsRepo, calendarCategoriesRepo, carryNotesFor, startOf } from './calendarRepo';

/**
 * "Beim Sicherheitsnetzwerk soll bei der jeweiligen Person, wenn man
 * drauf tippt, gleich der naechste Termin / die naechste Verbindlichkeit
 * mit dieser Person angezeigt werden — richtig mit dem Kalender
 * verbunden": the next appointment with this network person (with its
 * category color, any note left for it), a tap opens that appointment
 * in the calendar, and a second button enters a new one with this person
 * already chosen. Reads the calendar directly, so nothing is stored twice.
 */
export function NextAppointmentBlock({ personId, personName }: { personId: string; personName: string }) {
  const t = useT();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const now = Date.now() - 60 * 60 * 1000;
  const mine = appointmentsRepo.getAll().filter((a) => a.personId === personId);
  const upcoming = mine.filter((a) => startOf(a).getTime() >= now).sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
  const next = upcoming[0];
  const categories = calendarCategoriesRepo.getAll();
  const cat = next ? categories.find((c) => c.id === next.categoryId) : undefined;
  const carry = next ? carryNotesFor(next) : [];

  return (
    <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
      <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2 flex items-center gap-1.5">
        <CalendarDays size={13} /> {t.calendar.nextWithPerson}
      </p>
      {next ? (
        <button
          onClick={() => navigate(`/kalender/uebersicht?open=${next.id}`)}
          className="w-full text-left rounded-[var(--radius-md)] p-3"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderLeft: `5px solid ${cat?.color ?? 'var(--color-text-faint)'}` }}
        >
          <p className="text-[12px] text-[var(--color-text-faint)] tabular-nums">
            {startOf(next).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} · {next.time}
            {cat && <span style={{ color: cat.color }}> · {cat.label}</span>}
          </p>
          <p className="text-[14.5px] text-[var(--color-text)]">{next.title}</p>
          {next.note && <p className="text-[12.5px] text-[var(--color-text-muted)] mt-1 whitespace-pre-line">{next.note}</p>}
          {carry.map((n, i) => (
            <p key={i} className="text-[12.5px] text-[var(--color-text)] mt-1.5 whitespace-pre-line">
              <span className="text-[var(--color-text-faint)]">{t.calendar.carryNoteTitle}: </span>
              {n}
            </p>
          ))}
          {upcoming.length > 1 && <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1.5">{t.calendar.moreUpcoming.replace('{n}', String(upcoming.length - 1))}</p>}
        </button>
      ) : (
        <p className="text-[13px] text-[var(--color-text-muted)]">{t.calendar.noneWithPerson.replace('{name}', personName)}</p>
      )}
      <button onClick={() => navigate(`/kalender?new=${personId}`)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-2.5">
        <Plus size={14} /> {t.calendar.newWithPerson.replace('{name}', personName)}
      </button>
    </div>
  );
}
