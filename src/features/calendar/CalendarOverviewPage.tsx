import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../../components/navigation/TopBar';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { networkRepo } from '../safetyNet/networkRepo';
import { PersonLine } from './PersonAvatar';
import { AppointmentFormModal } from './AppointmentFormModal';
import { appointmentsRepo, calendarCategoriesRepo, startOf, type Appointment } from './calendarRepo';

/** "Spaetere Termine schon eintragen und eine Terminuebersicht
 * anschauen — die Hauptseite zeigt aber immer nur die naechsten sieben
 * Tage"-Auftrag: every appointment, upcoming first (soonest on top),
 * past ones tucked under a toggle. */
export function CalendarOverviewPage() {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [, setVersion] = useState(0);
  const [showPast, setShowPast] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const now = Date.now();
  const all = appointmentsRepo.getAll();
  const upcoming = all.filter((a) => startOf(a).getTime() >= now - 60 * 60 * 1000).sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
  const past = all.filter((a) => startOf(a).getTime() < now - 60 * 60 * 1000).sort((a, b) => startOf(b).getTime() - startOf(a).getTime());
  const categories = calendarCategoriesRepo.getAll();
  const people = networkRepo.getAll().filter((e) => e.category === 'person');

  function row(a: Appointment) {
    const cat = categories.find((c) => c.id === a.categoryId);
    const person = a.personId ? people.find((p) => p.id === a.personId) : undefined;
    return (
      <button key={a.id} onClick={() => setEditing(a)} className="text-left rounded-[var(--radius-lg)] p-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderLeft: `5px solid ${cat?.color ?? 'var(--color-text-faint)'}` }}>
        <p className="text-[12px] text-[var(--color-text-faint)] tabular-nums">
          {startOf(a).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} · {a.time}
          {cat && <span style={{ color: cat.color }}> · {cat.label}</span>}
        </p>
        <p className="text-[14.5px] text-[var(--color-text)]">{a.title}</p>
        {person && (
          <div className="mt-1">
            <PersonLine entry={person} size={26} />
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-12">
        <h1 className="text-[24px] mb-1">{t.calendar.overviewTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5">{t.calendar.overviewSubtitle}</p>
        <Link to="/kalender" className="text-[13px] text-[var(--color-primary)] block mb-5">
          ← {t.calendar.title}
        </Link>

        <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.calendar.overviewUpcoming}</p>
        <div className="flex flex-col gap-2 mb-6">
          {upcoming.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)]">{t.calendar.overviewEmpty}</p>}
          {upcoming.map(row)}
        </div>

        {past.length > 0 && (
          <>
            <button onClick={() => setShowPast((v) => !v)} className="text-[13px] text-[var(--color-text-muted)] mb-2">
              {t.calendar.overviewPast} ({past.length}) {showPast ? '▲' : '▼'}
            </button>
            {showPast && <div className="flex flex-col gap-2 opacity-80">{past.map(row)}</div>}
          </>
        )}
      </div>
      <AppointmentFormModal
        key={editing?.id ?? 'none'}
        open={!!editing}
        appointment={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setVersion((v) => v + 1);
        }}
        onDeleted={() => {
          setEditing(null);
          setVersion((v) => v + 1);
        }}
      />
    </div>
  );
}
