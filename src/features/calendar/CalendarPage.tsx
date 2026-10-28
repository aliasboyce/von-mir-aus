import { useMemo, useState } from 'react';
import { buildAppointmentsIcs } from '../../services/icsExport';
import { deliverTextFile } from '../../services/fileShare';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Tag, ListOrdered, Check, X, CalendarPlus, CalendarDays, Sprout, FolderKanban, Info, Play, ArrowRight } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { MoreMenu } from '../../components/ui/MoreMenu';
import { Modal } from '../../components/ui/Modal';
import { PlanSheet, planInfo } from './PlanSheet';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import { networkRepo } from '../safetyNet/networkRepo';
import { PersonLine } from './PersonAvatar';
import { AppointmentFormModal } from './AppointmentFormModal';
import { CategoriesModal } from './CategoriesModal';
import { useL } from '../projects/useL';
import { SlipsHere } from '../parkbox/SlipsHere';
import { PushHintModal } from './PushHintModal';
import {
  appointmentsOnDay,
  appointmentsRepo,
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
  const { L, lang } = useL();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const days = useMemo(() => nextSevenDays(), []);
  const todayKey = dayKey(days[0]);
  const [selected, setSelected] = useState(todayKey);
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  const [searchParams, setSearchParams] = useSearchParams();
  // /kalender?new=<personId> — opened from a network person ("Termin mit ... eintragen")
  const newWithPerson = searchParams.get('new');
  const [formOpen, setFormOpen] = useState(!!newWithPerson);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [chooser, setChooser] = useState(false);
  const planParam = searchParams.get('plan');
  const [plan, setPlan] = useState<{ kind: 'routine' | 'project'; existing?: Appointment } | null>(planParam === 'routine' || planParam === 'project' ? { kind: planParam } : null);
  const [info, setInfo] = useState<'ics' | 'intent' | null>(null);
  const [wishText, setWishText] = useState('');
  const [wishIntent, setWishIntent] = useState<'will' | 'soll' | undefined>(undefined);
  const [wishHintOpen, setWishHintOpen] = useState(false);
  const [pendingWish, setPendingWish] = useState<string | null>(null);

  // version is read so every refresh() re-reads the repositories below
  void version;
  const categories = calendarCategoriesRepo.getAll();
  const people = networkRepo.getAll().filter((e) => e.category === 'person');
  const colorOf = (a: Appointment) => categories.find((c) => c.id === a.categoryId)?.color ?? 'var(--color-text-faint)';
  const dayAppointments = appointmentsOnDay(selected);
  const dayWishes = wishesOnDay(selected);

  async function exportIcs() {
    const all = appointmentsRepo.getAll();
    const ics = buildAppointmentsIcs(all, categories, (pid) => people.find((p) => p.id === pid)?.name, t.calendar.title);
    if (!ics.includes('BEGIN:VEVENT')) {
      alert(t.calendar.icsNothing);
      return;
    }
    await deliverTextFile(ics, 'von-mir-aus-termine.ics', 'text/calendar', t.calendar.title);
  }

  function openNew() {
    setChooser(true);
  }
  function openEdit(a: Appointment) {
    if (a.plan) {
      setPlan({ kind: a.plan.kind, existing: a });
      return;
    }
    setEditing(a);
    setFormOpen(true);
  }

  function saveWish(text: string) {
    wishesRepo.save({ id: createId('wish'), day: selected, text, done: false, intent: wishIntent, createdAt: new Date().toISOString() });
    setWishText('');
    setWishIntent(undefined);
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
  function cycleIntent(id: string) {
    const w = wishesRepo.getById(id);
    if (w) wishesRepo.save({ ...w, intent: w.intent === undefined ? 'will' : w.intent === 'will' ? 'soll' : undefined });
    refresh();
  }
  function removeWish(id: string) {
    wishesRepo.remove(id);
    refresh();
  }

  return (
    <div className="animate-in">
      <TopBar action={
        <div className="flex items-center gap-1">
          <HelpButton helpKey="kalender" />
          <MoreMenu testId="cal-menu" items={[
            { id: 'overview', label: t.calendar.overview, hint: L('Alle Termine, auch spätere und vergangene', 'All appointments, also later and past ones'), icon: <ListOrdered size={17} />, onClick: () => navigate('/kalender/uebersicht') },
            { id: 'categories', label: t.calendar.categories, hint: L('Eigene Kategorien und Farben', 'Own categories and colours'), icon: <Tag size={17} />, onClick: () => setCategoriesOpen(true) },
            { id: 'ics', label: t.calendar.icsButton, hint: L('Termine in den Kalender des Handys', 'Appointments into the phone’s calendar'), icon: <CalendarPlus size={17} />, divider: true, onClick: () => setInfo('ics') },
            { id: 'intent', label: L('Was heißt „will ich / soll ich“?', 'What does “I want to / I should” mean?'), icon: <Info size={17} />, onClick: () => setInfo('intent') },
          ]} />
        </div>
      } />
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
                {list[0] && (
                  <span className="flex flex-col items-center w-full mt-1 leading-tight min-w-0" data-testid="day-preview">
                    <span className="flex items-center gap-1 text-[10px] tabular-nums font-medium" style={{ color: colorOf(list[0]) }}>
                      <span className="inline-block w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: colorOf(list[0]) }} />
                      {list[0].time}
                    </span>
                    <span className="block w-full truncate text-[9.5px] text-[var(--color-text-muted)]">{planInfo(list[0])?.emoji ?? ''} {list[0].title}</span>
                    {list.length > 1 && <span className="text-[9px] text-[var(--color-text-faint)] leading-none mt-0.5">+{list.length - 1}</span>}
                  </span>
                )}
                {wishCount > 0 && list.length === 0 && <span className="text-[9px] text-[var(--color-accent-clay)] mt-1 leading-none">♡ {wishCount}</span>}
              </button>
            );
          })}
          <button
            onClick={openNew}
            data-testid="cal-plus"
            className="aspect-square rounded-[var(--radius-lg)] flex flex-col items-center justify-center gap-1 text-[var(--color-primary)]"
            style={{ border: '1.5px dashed var(--color-primary)' }}
          >
            <Plus size={22} />
            <span className="text-[11px]">{t.calendar.addShort}</span>
          </button>
        </div>

        <div className="mb-6" />

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
            const pi = planInfo(a);
            if (pi) {
              return (
                <div key={a.id} className="flex items-stretch rounded-[22px] overflow-hidden" style={{ background: `${pi.color}1f`, border: `2px dashed ${pi.color}` }} data-testid="plan-card" data-plan={a.plan?.kind}>
                  <button onClick={() => openEdit(a)} className="flex-1 min-w-0 text-left flex items-center gap-3 p-3.5" data-testid="plan-card-edit">
                    <span className="w-11 h-11 rounded-full flex items-center justify-center text-[22px] shrink-0" style={{ background: `${pi.color}40` }} aria-hidden>{pi.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11.5px] tabular-nums" style={{ color: pi.color, filter: 'brightness(0.8)' }}>{pi.label === 'Routine' ? L('Routine', 'Routine') : L('Projekt', 'Project')} · {a.time}</span>
                      <span className="block text-[15.5px] text-[var(--color-text)] leading-snug">{a.title}</span>
                    </span>
                  </button>
                  {pi.exists && (
                    <button onClick={() => navigate(pi.open)} className="shrink-0 w-[76px] flex flex-col items-center justify-center gap-0.5 text-[12px]" style={{ background: `${pi.color}33`, color: 'var(--color-text)' }} data-testid="plan-card-go" aria-label={lang === 'en' ? pi.openLabelEn : pi.openLabelDe}>
                      {a.plan?.kind === 'routine' ? <Play size={18} /> : <ArrowRight size={18} />}
                      {lang === 'en' ? pi.openLabelEn : pi.openLabelDe}
                    </button>
                  )}
                </div>
              );
            }
            return (
              <div key={a.id}>
              <SlipsHere kind="appointment" id={a.id} compact />
              <button onClick={() => openEdit(a)} className="w-full text-left rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface)', border: `1px solid var(--color-border)`, borderLeft: `5px solid ${colorOf(a)}` }}>
                <p className="text-[12px] tabular-nums text-[var(--color-text-faint)]">
                  {a.time}{a.endTime ? `–${a.endTime}` : ''}
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
              </div>
            );
          })}
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)] mb-8" data-testid="cal-add-link">
          <Plus size={15} /> {t.calendar.addAppointment}
        </button>

        {/* "Ich muss gar nichts, aber ich will:" */}
        <div className="rounded-[var(--radius-lg)] p-4" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{t.calendar.wishesTitle}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-3">{t.calendar.wishBodyCheck}</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {dayWishes.map((w) => (
              <div key={w.id} className="flex items-center gap-2.5 flex-wrap">
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
                {/* one single tag per entry: tap to cycle  –  will ich  →  soll ich  →  – */}
                <button
                  onClick={() => cycleIntent(w.id)}
                  aria-label={t.calendar.intentCycleLabel}
                  className="rounded-full px-2.5 py-0.5 text-[11px] border flex-shrink-0"
                  style={
                    w.intent === 'will'
                      ? { background: 'var(--color-primary-soft)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }
                      : w.intent === 'soll'
                        ? { background: 'var(--color-surface)', borderColor: 'var(--color-accent-clay)', color: 'var(--color-accent-clay)' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-faint)', borderStyle: 'dashed' }
                  }
                >
                  {w.intent === 'will' ? t.calendar.intentWill : w.intent === 'soll' ? t.calendar.intentSoll : t.calendar.intentUnset}
                </button>
                <button onClick={() => removeWish(w.id)} aria-label={t.calendar.wishDelete} className="p-1 text-[var(--color-text-faint)]">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-[11.5px] text-[var(--color-text-faint)]">{t.calendar.intentFormLabel}</span>
            {(['will', 'soll'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setWishIntent(wishIntent === k ? undefined : k)}
                aria-pressed={wishIntent === k}
                className="rounded-full px-2.5 py-0.5 text-[11px] border"
                style={wishIntent === k ? { background: 'var(--color-primary-soft)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-faint)' }}
              >
                {k === 'will' ? t.calendar.intentWill : t.calendar.intentSoll}
              </button>
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
        key={editing?.id ?? `new-${selected}-${newWithPerson ?? ''}`}
        open={formOpen}
        appointment={editing}
        defaults={{ date: selected, personId: newWithPerson ?? undefined }}
        onClose={() => {
          setFormOpen(false);
          if (newWithPerson) setSearchParams({}, { replace: true });
        }}
        onSaved={(a) => {
          setFormOpen(false);
          if (newWithPerson) setSearchParams({}, { replace: true });
          if (a.date >= todayKey && days.some((d) => dayKey(d) === a.date)) setSelected(a.date);
          refresh();
        }}
        onDeleted={() => {
          setFormOpen(false);
          refresh();
        }}
      />
      {chooser && (
        <Modal open onClose={() => setChooser(false)} title={L('Was möchtest du eintragen?', 'What would you like to add?')}>
          <div className="flex flex-col gap-2.5" data-testid="cal-chooser">
            <button type="button" onClick={() => { setChooser(false); setEditing(null); setFormOpen(true); }} className="flex items-center gap-3 text-left rounded-2xl px-4 py-3.5 min-h-[60px] border border-[var(--color-border-strong)] bg-[var(--color-surface)]" data-testid="cal-choose-appointment">
              <CalendarDays size={22} className="text-[var(--color-primary)] shrink-0" />
              <span><span className="block text-[15.5px] text-[var(--color-text)]">{L('Termin', 'Appointment')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Ein fester Termin mit Uhrzeit', 'A fixed appointment with a time')}</span></span>
            </button>
            <button type="button" onClick={() => { setChooser(false); setPlan({ kind: 'routine' }); }} className="flex items-center gap-3 text-left rounded-2xl px-4 py-3.5 min-h-[60px] border-2 border-dashed" style={{ borderColor: '#6fbf73', background: '#6fbf731f' }} data-testid="cal-choose-routine">
              <Sprout size={22} className="shrink-0" style={{ color: '#3d8b52' }} />
              <span><span className="block text-[15.5px] text-[var(--color-text)]">{L('Routine einplanen', 'Plan a routine')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Eine deiner Routinen zu einer Zeit – mit „Starten“-Knopf', 'One of your routines at a time – with a “Start” button')}</span></span>
            </button>
            <button type="button" onClick={() => { setChooser(false); setPlan({ kind: 'project' }); }} className="flex items-center gap-3 text-left rounded-2xl px-4 py-3.5 min-h-[60px] border-2 border-dashed" style={{ borderColor: '#4a8f9e', background: '#4a8f9e1f' }} data-testid="cal-choose-project">
              <FolderKanban size={22} className="shrink-0" style={{ color: '#2f6f7e' }} />
              <span><span className="block text-[15.5px] text-[var(--color-text)]">{L('Projekt einplanen', 'Plan a project')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Zeit für ein Projekt – mit „Öffnen“-Knopf', 'Time for a project – with an “Open” button')}</span></span>
            </button>
          </div>
        </Modal>
      )}
      {plan && <PlanSheet key={plan.existing?.id ?? plan.kind} kind={plan.kind} day={selected} existing={plan.existing} onClose={() => { setPlan(null); if (planParam) setSearchParams({}, { replace: true }); }} onSaved={(a) => { setPlan(null); if (planParam) setSearchParams({}, { replace: true }); if (days.some((d) => dayKey(d) === a.date)) setSelected(a.date); refresh(); }} />}
      {info && (
        <Modal open onClose={() => setInfo(null)} title={info === 'ics' ? t.calendar.icsButton : L('„will ich“ und „soll ich“', '“I want to” and “I should”')}>
          <div className="flex flex-col gap-3" data-testid="cal-info">
            <p className="text-[14px] leading-relaxed text-[var(--color-text-muted)]">{info === 'ics' ? t.calendar.icsNotice : t.calendar.intentExplain}</p>
            {info === 'ics' && <button type="button" onClick={() => { setInfo(null); void exportIcs(); }} className="h-11 px-5 rounded-full text-white text-[14.5px] self-start" style={{ background: 'var(--color-primary)' }} data-testid="cal-ics-go">{t.calendar.icsButton}</button>}
          </div>
        </Modal>
      )}
      {categoriesOpen && <CategoriesModal open onClose={() => setCategoriesOpen(false)} onChanged={refresh} />}
      <PushHintModal open={wishHintOpen} onConfirm={confirmWishHint} />
    </div>
  );
}
