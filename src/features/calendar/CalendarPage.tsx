import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag, ListOrdered, Check, X } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import { networkRepo } from '../safetyNet/networkRepo';
import { PersonLine } from './PersonAvatar';
import { AppointmentFormModal } from './AppointmentFormModal';
import { CategoriesModal } from './CategoriesModal';
import { PushHintModal } from './PushHintModal';
import {
  appointmentsOnDay,
  calendarCategoriesRepo,
  carryNotesFor,
  dayKey,
  nextSevenDays,
  parseDay,
  pushHintSeenStore,
  seedCalendarCategoriesIfEmpty,
  wishesOnDay,
  wishesRepo,
  type Appointment,
} from './calendarRepo';

seedCalendarCategoriesIfEmpty();

/**
 * "Neue Seite: Kalender — nur die naechsten sieben Tage als 7 Quadrate
 * auf einen Bildschirm, sehr klar, minimal, aktueller Tag eingerahmt"-
 * Auftrag. Seven days are laid out in a 4x2 grid; the eighth cell is
 * the "+ Termin" button, so the page is exactly two even rows. The
 * main view NEVER shows more than today + six days — later
 * appointments can be entered (the form accepts any date) and are
 * found on the separate overview page.
 */
export function CalendarPage() {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const days = useMemo(() => nextSevenDays(), []);
  const todayKey = dayKey(days[0]);
  const [selected, setSelected] = useState(todayKey);
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [wishText, setWishText] = useState('');
  const [wishHintOpen, setWishHintOpen] = useState(false);
  const [pendingWish, setPendingWish] = useState<string | null>(null);

  // version is read so every refresh() re-reads the repositories below
  void version;
  const categories = calendarCategoriesRepo.getAll();
  const people = networkRepo.getAll().filter((e) => e.category === 'person');
  const colorOf = (a: Appointment) => categories.find((c) => c.id === a.categoryId)?.color ?? 'var(--color-text-faint)';
  const dayAppointments = appointmentsOnDay(selected);
  const dayWishes = wishesOnDay(selected);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(a: Appointment) {
    setEditing(a);
    setFormOpen(true);
  }

  function saveWish(text: string) {
    wishesRepo.save({ id: createId('wish'), day: selected, text, done: false, createdAt: new Date().toISOString() });
    setWishText('');
    refresh();
  }
  function addWish() {
    const text = wishText.trim();
    if (!text) return;
    // The first thing with a reminder-like promise: say once that
    // nothing pops up on the phone.
    if (!pushHintSeenStore.get()) {
      setPendingWish(text);
      setWishHintOpen(true);
      return;
    }
    saveWish(text);
  }
  function confirmWishHint() {
    pushHintSeenStore.set(true);
    setWishHintOpen(false);
    if (pendingWish) saveWish(pendingWish);
    setPendingWish(null);
  }
  function toggleWish(id: string) {
    const w = wishesRepo.getById(id);
    if (w) wishesRepo.save({ ...w, done: !w.done });
    refresh();
  }
  function removeWish(id: string) {
    wishesRepo.remove(id);
    refresh();
  }

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="home" />} />
      <div className="px-5 pb-12">
        <h1 className="text-[24px] mb-1">{t.calendar.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-7">{t.calendar.subtitle}</p>

        <div className="grid grid-cols-4 gap-2.5 mb-3">
          {days.map((d, i) => {
            const key = dayKey(d);
            const isToday = i === 0;
            const isSelected = key === selected;
            const list = appointmentsOnDay(key);
            const wishCount = wishesOnDay(key).length;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                aria-label={d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                aria-pressed={isSelected}
                className="aspect-square rounded-[var(--radius-lg)] p-1.5 flex flex-col items-center text-center transition-colors"
                style={{
                  background: isSelected ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                  border: isToday ? '2.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                }}
              >
                <span className="text-[10.5px] uppercase tracking-wide text-[var(--color-text-faint)] leading-none mt-0.5">{d.toLocaleDateString(locale, { weekday: 'short' })}</span>
                <span className="text-[22px] font-light text-[var(--color-text)] leading-none mt-1">{d.getDate()}</span>
                <span className="flex flex-col gap-[3px] w-full mt-1.5 px-1">
                  {list.slice(0, 2).map((a) => (
                    <span key={a.id} className="block h-[5px] rounded-full" style={{ background: colorOf(a) }} />
                  ))}
                  {list.length > 2 && <span className="text-[9px] text-[var(--color-text-faint)] leading-none">+{list.length - 2}</span>}
                </span>
                {wishCount > 0 && list.length === 0 && <span className="text-[9px] text-[var(--color-accent-clay)] mt-1 leading-none">♡ {wishCount}</span>}
              </button>
            );
          })}
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="aspect-square rounded-[var(--radius-lg)] flex flex-col items-center justify-center gap-1 text-[var(--color-primary)]"
            style={{ border: '1.5px dashed var(--color-primary)' }}
          >
            <Plus size={22} />
            <span className="text-[11px]">{t.calendar.addShort}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Link to="/kalender/uebersicht" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]">
            <ListOrdered size={14} /> {t.calendar.overview}
          </Link>
          <button onClick={() => setCategoriesOpen(true)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]">
            <Tag size={14} /> {t.calendar.categories}
          </button>
        </div>

        {/* the selected day */}
        <h2 className="text-[17px] mb-3">
          {selected === todayKey ? `${t.calendar.today} · ` : ''}
          {parseDay(selected).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>

        <div className="flex flex-col gap-2.5 mb-3">
          {dayAppointments.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)]">{t.calendar.nothingToday}</p>}
          {dayAppointments.map((a) => {
            const person = a.personId ? people.find((p) => p.id === a.personId) : undefined;
            const carry = carryNotesFor(a);
            return (
              <button key={a.id} onClick={() => openEdit(a)} className="text-left rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface)', border: `1px solid var(--color-border)`, borderLeft: `5px solid ${colorOf(a)}` }}>
                <p className="text-[12px] tabular-nums text-[var(--color-text-faint)]">
                  {a.time}
                  {categories.find((c) => c.id === a.categoryId) && <span style={{ color: colorOf(a) }}> · {categories.find((c) => c.id === a.categoryId)!.label}</span>}
                </p>
                <p className="text-[15px] text-[var(--color-text)] mb-1">{a.title}</p>
                {person && (
                  <div className="mb-1.5">
                    <PersonLine entry={person} size={30} />
                  </div>
                )}
                {a.note && <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{a.note}</p>}
                {carry.map((n, i) => (
                  <div key={i} className="mt-2 rounded-[var(--radius-md)] px-2.5 py-2" style={{ background: 'var(--color-surface-muted)' }}>
                    <p className="text-[11px] text-[var(--color-text-faint)]">{t.calendar.carryNoteTitle}</p>
                    <p className="text-[12.5px] text-[var(--color-text)] whitespace-pre-line">{n}</p>
                  </div>
                ))}
                {a.reflection && (
                  <div className="mt-2 rounded-[var(--radius-md)] px-2.5 py-2" style={{ background: 'var(--color-surface-muted)' }}>
                    <p className="text-[11px] text-[var(--color-text-faint)]">{t.calendar.reflectionTitle}</p>
                    <p className="text-[12.5px] text-[var(--color-text)] whitespace-pre-line">{a.reflection}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)] mb-8">
          <Plus size={15} /> {t.calendar.addAppointment}
        </button>

        {/* "Ich muss gar nichts, aber ich will:" */}
        <div className="rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[14px] font-medium text-[var(--color-text)] mb-3">{t.calendar.wishesTitle}</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {dayWishes.map((w) => (
              <div key={w.id} className="flex items-center gap-2.5">
                <button
                  onClick={() => toggleWish(w.id)}
                  aria-pressed={w.done}
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={w.done ? { background: 'var(--color-text-faint)', color: '#fff' } : { border: '1.5px solid var(--color-primary)' }}
                >
                  {w.done && <Check size={14} />}
                </button>
                <span className="flex-1 text-[14px]" style={{ color: w.done ? 'var(--color-text-faint)' : 'var(--color-text)', opacity: w.done ? 0.75 : 1, textDecoration: w.done ? 'line-through' : 'none' }}>
                  {w.text}
                </span>
                <button onClick={() => removeWish(w.id)} aria-label={t.calendar.wishDelete} className="p-1 text-[var(--color-text-faint)]">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input flex-1" value={wishText} onChange={(e) => setWishText(e.target.value)} placeholder={t.calendar.wishPlaceholder} onKeyDown={(e) => e.key === 'Enter' && addWish()} />
            <button onClick={addWish} disabled={!wishText.trim()} className="rounded-full px-4 text-[13px] text-[var(--color-surface)] disabled:opacity-40" style={{ background: 'var(--color-primary)' }}>
              {t.calendar.wishAdd}
            </button>
          </div>
        </div>
      </div>

      <AppointmentFormModal
        key={editing?.id ?? `new-${selected}`}
        open={formOpen}
        appointment={editing}
        defaults={{ date: selected }}
        onClose={() => setFormOpen(false)}
        onSaved={(a) => {
          setFormOpen(false);
          if (a.date >= todayKey && days.some((d) => dayKey(d) === a.date)) setSelected(a.date);
          refresh();
        }}
        onDeleted={() => {
          setFormOpen(false);
          refresh();
        }}
      />
      {categoriesOpen && <CategoriesModal open onClose={() => setCategoriesOpen(false)} onChanged={refresh} />}
      <PushHintModal open={wishHintOpen} onConfirm={confirmWishHint} />
    </div>
  );
}
