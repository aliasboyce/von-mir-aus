import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, ArrowDown, ArrowUp, CalendarPlus, Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import { appointmentsRepo, calendarCategoriesRepo, dayKey, parseDay, type Appointment } from '../calendar/calendarRepo';
import { AssignSheet } from './AssignSheet';
import { SlipScheduler, formatDeliver } from './SlipScheduler';
import { setSlipDelivery } from './slipDelivery';
import { slipPlace, slipToPark } from './slipAttach';
import { SLIP_COLORS, WAIT_CALENDAR_CATEGORY_ID, parkNotesRepo, waitItemsRepo, type ParkNote, type WaitItem, type WaitKind } from './parkboxRepo';

type Prio = 1 | 2 | 3;

const TXT = {
  de: {
    title: 'Parkbox & Wartezimmer',
    intro: 'Zwei verschiedene Orte – für zwei verschiedene Arten von „später“. Such dir den, der gerade passt.',
    tabPark: 'Parkbox',
    tabParkSub: 'kurze Zettel · „Nicht vergessen!“',
    tabWait: 'Wartezimmer',
    tabWaitSub: 'Vorhaben · „Irgendwann, wenn Zeit ist“',
    parkExplainTitle: 'Was ist die Parkbox?',
    parkExplain: 'Ein Einfall, eine Aufgabe, ein Gedanke – du willst ihn nicht verlieren, aber heute nicht mehr tragen. Aufschreiben, in die Box legen, fertig. Später ordnest du den Zettel zu: einem Projekt, einem Termin, einer Person, einer Mindmap oder dem Tagebuch. Nichts geht verloren.',
    waitExplainTitle: 'Was ist das Wartezimmer?',
    waitExplain: 'Hier sitzen größere Dinge, die passieren dürfen, wenn ihre Zeit kommt: Ideen, Vorhaben, Aktivitäten, Wünsche. Sie haben einen festen Platz und warten auf einen Zeitraum im Kalender – oder auf ein Projekt oder eine Mindmap.',
    differ: 'Der Unterschied: Parkbox = kurzer Zettel, den du nicht vergessen willst. Wartezimmer = ein Vorhaben, das noch auf seine Zeit wartet.',
    pinned: 'Angeheftete Zettel',
    pinnedHint: 'Diese Zettel hängen an einem Termin, einer Person oder einer Mindmap – dort stehen sie ganz oben. Hier findest du sie wieder.',
    pinnedBack: 'Zurück in die Parkbox',
    pinnedOpen: 'Öffnen',
    slipWait: 'Blauer Zettel = kam aus dem Wartezimmer',
    placeholder: 'Was soll heute nicht mehr in deinem Kopf bleiben?',
    prio: { 1: 'Wichtig', 2: 'Normal', 3: 'Später' } as Record<Prio, string>,
    put: 'In die Box legen',
    safe: (n: number) => (n === 0 ? 'Die Box ist leer – und bereit.' : n === 1 ? '1 Zettel liegt sicher hier.' : `${n} Zettel liegen sicher hier.`),
    open: 'In der Box',
    archive: 'Archiv',
    emptyBox: 'Noch kein Zettel. Schreib oben den ersten – es muss nichts Wichtiges sein.',
    emptyArchive: 'Im Archiv liegt nichts.',
    edit: 'Bearbeiten',
    save: 'Speichern',
    cancel: 'Abbrechen',
    toArchive: 'Archivieren',
    back: 'Zurück in die Box',
    del: 'Löschen',
    delSure: 'Wirklich löschen?',
    toWait: 'Ins Wartezimmer',
    assignTo: 'Zuordnen',
    flies: 'fliegt',
    assigned: 'Untergebracht – der Zettel ist aus der Box.',
    scheduledOk: 'Der Zettel fliegt zur gewählten Zeit auf deine Startseite.',
    waitTitle: 'Wartezimmer',
    waitIntro: 'Ideen, Projekte und Dinge, die du dir wünschst – sie haben hier einen festen Platz und warten, bis ihre Zeit kommt. Du musst nicht alles heute machen, und nichts davon wird vergessen.',
    waitPlaceholder: 'Was möchte irgendwann passieren?',
    waitNeed: 'Welches Bedürfnis steckt dahinter? (optional)',
    waitAdd: 'In den Warteraum setzen',
    kinds: { idee: '💡 Idee', projekt: '🧩 Vorhaben', aktivitaet: '🌿 Aktivität' } as Record<WaitKind, string>,
    place: (n: number) => `Platz ${n}`,
    up: 'Weiter nach vorn',
    down: 'Weiter nach hinten',
    assign: 'Einen Zeitraum zuordnen',
    changeSlot: 'Zeitraum ändern',
    unassign: 'Wieder warten lassen',
    date: 'Tag',
    from: 'von',
    to: 'bis',
    saveCal: 'Im Kalender speichern',
    waitingNow: 'Wartet noch',
    scheduled: 'Hat schon einen Zeitraum',
    inCalendar: 'Im Kalender',
    waitEmpty: 'Der Warteraum ist noch leer. Wünsche, Ideen und Vorhaben dürfen hier Platz nehmen.',
    calendarCat: 'Wartezimmer',
    needLabel: 'Bedürfnis',
    timeOrder: 'Bis ist früher als von – bitte prüfen.',
    openCalendar: 'Zum Kalender',
  },
  en: {
    title: 'Park box & waiting room',
    intro: 'Two different places – for two different kinds of “later”. Pick the one that fits right now.',
    tabPark: 'Park box',
    tabParkSub: 'short slips · “don’t forget!”',
    tabWait: 'Waiting room',
    tabWaitSub: 'plans · “someday, when there’s time”',
    parkExplainTitle: 'What is the Park box?',
    parkExplain: 'An idea, a task, a thought – you don’t want to lose it, but you don’t want to carry it today. Write it down, put it in the box, done. Later you assign the slip: to a project, an appointment, a person, a mind map or the diary. Nothing gets lost.',
    waitExplainTitle: 'What is the waiting room?',
    waitExplain: 'Bigger things sit here that may happen when their time comes: ideas, plans, activities, wishes. They have a fixed seat and wait for a period in the calendar – or for a project or a mind map.',
    differ: 'The difference: Park box = a short slip you don’t want to forget. Waiting room = a plan still waiting for its time.',
    pinned: 'Pinned slips',
    pinnedHint: 'These slips hang on an appointment, a person or a mind map – there they sit at the very top. Here you can find them again.',
    pinnedBack: 'Back to the Park box',
    pinnedOpen: 'Open',
    slipWait: 'Blue slip = came from the waiting room',
    placeholder: 'What should not stay in your head today?',
    prio: { 1: 'Important', 2: 'Normal', 3: 'Later' } as Record<Prio, string>,
    put: 'Put it in the box',
    safe: (n: number) => (n === 0 ? 'The box is empty – and ready.' : n === 1 ? '1 note lies safe here.' : `${n} notes lie safe here.`),
    open: 'In the box',
    archive: 'Archive',
    emptyBox: 'No notes yet. Write the first one above – it does not have to be important.',
    emptyArchive: 'Nothing in the archive.',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    toArchive: 'Archive',
    back: 'Back into the box',
    del: 'Delete',
    delSure: 'Really delete?',
    toWait: 'To the waiting room',
    assignTo: 'Assign',
    flies: 'flies',
    assigned: 'Placed – the slip has left the box.',
    scheduledOk: 'The slip will fly onto your start page at the chosen time.',
    waitTitle: 'Waiting room',
    waitIntro: 'Ideas, projects and things you wish for – they have a fixed place here and wait until their time comes. You do not have to do everything today, and none of it is forgotten.',
    waitPlaceholder: 'What would you like to happen some day?',
    waitNeed: 'Which need is behind it? (optional)',
    waitAdd: 'Seat it in the waiting room',
    kinds: { idee: '💡 Idea', projekt: '🧩 Undertaking', aktivitaet: '🌿 Activity' } as Record<WaitKind, string>,
    place: (n: number) => `Seat ${n}`,
    up: 'Move forward',
    down: 'Move back',
    assign: 'Assign a time period',
    changeSlot: 'Change period',
    unassign: 'Let it wait again',
    date: 'Day',
    from: 'from',
    to: 'to',
    saveCal: 'Save in calendar',
    waitingNow: 'Still waiting',
    scheduled: 'Already has a period',
    inCalendar: 'In calendar',
    waitEmpty: 'The waiting room is still empty. Wishes, ideas and plans may take a seat here.',
    calendarCat: 'Waiting room',
    needLabel: 'Need',
    timeOrder: '"to" is earlier than "from" – please check.',
    openCalendar: 'To the calendar',
  },
};

function sortNotes(list: ParkNote[]): ParkNote[] {
  return [...list].sort((a, b) => a.priority - b.priority || b.createdAt.localeCompare(a.createdAt));
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dayKey(d);
}

/** The drawn box: cardboard body, lid with a slot, and a few coloured corners peeking out. */
function BoxArt({ count, bump, notes }: { count: number; bump: boolean; notes: ParkNote[] }) {
  const peek = notes.slice(0, 4);
  return (
    <svg viewBox="0 16 220 134" className={`mx-auto block w-[210px] overflow-visible ${bump ? 'park-box-bump' : ''}`} role="img" aria-label="Parkbox" data-testid="park-box-art" data-count={count}>
      {peek.map((n, i) => (
        <rect key={n.id} x={50 + i * 34} y={22 - (i % 2) * 6} width="34" height="40" rx="3" fill={SLIP_COLORS[n.origin ?? 'park'].bg} stroke="rgba(0,0,0,0.12)" transform={`rotate(${(i - 1.5) * 7} ${67 + i * 34} 62)`} />
      ))}
      <path d="M22 62 L198 62 L190 138 Q189 144 183 144 L37 144 Q31 144 30 138 Z" fill="#c8995c" stroke="#a97a3f" strokeWidth="2" />
      <path d="M22 62 L198 62 L194 92 L26 92 Z" fill="#d6aa6c" stroke="#a97a3f" strokeWidth="2" />
      <rect x="64" y="70" width="92" height="9" rx="4.5" fill="#6b4a22" opacity="0.85" />
      <rect x="78" y="104" width="64" height="24" rx="5" fill="#fbf4e4" stroke="#a97a3f" />
      <text x="110" y="121" textAnchor="middle" fontSize="12" fill="#6b4a22" fontFamily="inherit">Parkbox</text>
    </svg>
  );
}

export function ParkboxPage() {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  const locale = settings.language === 'en' ? 'en-GB' : 'de-DE';

  const [notes, setNotes] = useState<ParkNote[]>(() => parkNotesRepo.getAll());
  const [wait, setWait] = useState<WaitItem[]>(() => waitItemsRepo.getAll());
  const [params, setParams] = useSearchParams();
  const section: 'park' | 'wait' = params.get('ort') === 'wartezimmer' ? 'wait' : 'park';
  const setSection = (s: 'park' | 'wait') => setParams(s === 'wait' ? { ort: 'wartezimmer' } : {}, { replace: true });
  const [text, setText] = useState('');
  const [prio, setPrio] = useState<Prio>(2);
  const [tab, setTab] = useState<'open' | 'archive'>('open');
  const [flying, setFlying] = useState<{ text: string; dy: number; h: number } | null>(null);
  const [bump, setBump] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [assignNote, setAssignNote] = useState<ParkNote | null>(null);
  const [assignWait, setAssignWait] = useState<WaitItem | null>(null);
  const [schedNote, setSchedNote] = useState<ParkNote | null>(null);
  const [msg, setMsg] = useState('');
  const say = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(''), 3200); };

  const [wTitle, setWTitle] = useState('');
  const [wKind, setWKind] = useState<WaitKind>('idee');
  const [wNeed, setWNeed] = useState('');
  const [slotFor, setSlotFor] = useState<string | null>(null);
  const [slotDate, setSlotDate] = useState(tomorrowKey());
  const [slotFrom, setSlotFrom] = useState('10:00');
  const [slotTo, setSlotTo] = useState('11:00');
  const [slotErr, setSlotErr] = useState(false);

  const paperRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const bumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (bumpTimer.current) clearTimeout(bumpTimer.current); }, []);

  const openNotes = useMemo(() => sortNotes(notes.filter((n) => !n.archived && !n.projectId && !n.attach)), [notes]);
  const archived = useMemo(() => sortNotes(notes.filter((n) => n.archived && !n.projectId && !n.attach)), [notes]);
  const pinned = useMemo(() => notes.filter((n) => n.attach).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [notes]);
  const appointments = appointmentsRepo.getAll();
  const apptOf = (w: WaitItem): Appointment | undefined => (w.appointmentId ? appointments.find((a) => a.id === w.appointmentId) : undefined);
  const waiting = wait.filter((w) => !apptOf(w));
  const scheduled = wait.filter((w) => apptOf(w));

  function persistNotes(next: ParkNote[]) {
    parkNotesRepo.replaceAll(next);
    setNotes(next);
  }
  function persistWait(next: WaitItem[]) {
    waitItemsRepo.replaceAll(next);
    setWait(next);
  }

  function finishPut(p: { text: string }) {
    const now = new Date().toISOString();
    const note: ParkNote = { id: createId('park'), text: p.text, priority: prio, archived: false, paper: 0, origin: 'park', tilt: Math.round((Math.random() * 6 - 3) * 10) / 10, createdAt: now, updatedAt: now };
    persistNotes([...parkNotesRepo.getAll(), note]);
    setFlying(null);
    setText('');
    setBump(true);
    if (bumpTimer.current) clearTimeout(bumpTimer.current);
    bumpTimer.current = setTimeout(() => setBump(false), 900);
  }

  function putInBox() {
    const clean = text.trim();
    if (!clean || flying) return;
    if (settings.reduceMotion) {
      finishPut({ text: clean });
      return;
    }
    const a = paperRef.current?.getBoundingClientRect();
    const b = boxRef.current?.getBoundingClientRect();
    const dy = a && b ? Math.max(60, b.top + 40 - a.top) : 220;
    setFlying({ text: clean, dy, h: a?.height ?? 130 });
  }

  function updateNote(id: string, patch: Partial<ParkNote>) {
    persistNotes(parkNotesRepo.getAll().map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)));
  }
  function removeNote(id: string) {
    persistNotes(parkNotesRepo.getAll().filter((n) => n.id !== id));
    setDelId(null);
  }
  function noteToWaiting(n: ParkNote) {
    const now = new Date().toISOString();
    persistWait([...waitItemsRepo.getAll(), { id: createId('wait'), title: n.text, kind: 'idee', createdAt: now, updatedAt: now }]);
    removeNote(n.id);
  }

  function addWait() {
    const title = wTitle.trim();
    if (!title) return;
    const now = new Date().toISOString();
    persistWait([...waitItemsRepo.getAll(), { id: createId('wait'), title, kind: wKind, need: wNeed.trim() || undefined, createdAt: now, updatedAt: now }]);
    setWTitle('');
    setWNeed('');
  }
  function removeWait(id: string) {
    const item = waitItemsRepo.getById(id);
    if (item?.appointmentId) appointmentsRepo.remove(item.appointmentId);
    persistWait(waitItemsRepo.getAll().filter((w) => w.id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    const list = [...waitItemsRepo.getAll()];
    const visible = list.filter((w) => !(w.appointmentId && appointmentsRepo.getById(w.appointmentId)));
    const vi = visible.findIndex((w) => w.id === id);
    const target = visible[vi + dir];
    if (!target) return;
    const i = list.findIndex((w) => w.id === id);
    const j = list.findIndex((w) => w.id === target.id);
    [list[i], list[j]] = [list[j], list[i]];
    persistWait(list);
  }
  function openSlot(w: WaitItem) {
    const a = apptOf(w);
    setSlotFor(w.id);
    setSlotDate(a?.date ?? tomorrowKey());
    setSlotFrom(a?.time ?? '10:00');
    setSlotTo(a?.endTime ?? '11:00');
    setSlotErr(false);
  }
  function saveSlot(w: WaitItem) {
    if (slotTo <= slotFrom) {
      setSlotErr(true);
      return;
    }
    if (!calendarCategoriesRepo.getById(WAIT_CALENDAR_CATEGORY_ID)) {
      calendarCategoriesRepo.save({ id: WAIT_CALENDAR_CATEGORY_ID, label: T.calendarCat, color: '#5f8fb0' });
    }
    const now = new Date().toISOString();
    const existing = apptOf(w);
    const appt: Appointment = {
      ...(existing ?? { createdAt: now }),
      id: existing?.id ?? createId('appt'),
      title: w.title,
      date: slotDate,
      time: slotFrom,
      endTime: slotTo,
      categoryId: WAIT_CALENDAR_CATEGORY_ID,
      note: [w.need ? `${T.needLabel}: ${w.need}` : '', w.note ?? ''].filter(Boolean).join('\n') || undefined,
      reminderMinutes: existing?.reminderMinutes ?? null,
      updatedAt: now,
    } as Appointment;
    appointmentsRepo.save(appt);
    persistWait(waitItemsRepo.getAll().map((x) => (x.id === w.id ? { ...x, appointmentId: appt.id, updatedAt: now } : x)));
    setSlotFor(null);
  }
  function unassign(w: WaitItem) {
    if (w.appointmentId) appointmentsRepo.remove(w.appointmentId);
    persistWait(waitItemsRepo.getAll().map((x) => (x.id === w.id ? { ...x, appointmentId: undefined, updatedAt: new Date().toISOString() } : x)));
  }

  const smallBtn = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius-full)] text-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]';

  function renderWait(w: WaitItem, index: number) {
    const a = apptOf(w);
    return (
      <li key={w.id} className="rounded-[var(--radius-lg)] p-3.5 relative" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderLeft: '5px solid #5f8fb0' }} data-testid="wait-item">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#5f8fb01f] text-[#3f6f90]" aria-hidden="true">🪑 {T.place(index + 1)}</span>
          <span className="text-[11.5px] text-[var(--color-text-faint)]">{T.kinds[w.kind]}</span>
        </div>
        <p className="text-[15px] text-[var(--color-text)] leading-snug">{w.title}</p>
        {w.need && <p className="text-[12.5px] text-[var(--color-text-muted)] mt-0.5">💛 {w.need}</p>}
        {a && (
          <p className="text-[12.5px] mt-1.5" style={{ color: '#3f6f90' }} data-testid="wait-slot">
            📅 {parseDay(a.date).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}, {a.time}{a.endTime ? `–${a.endTime}` : ''} · {T.inCalendar}
          </p>
        )}
        {slotFor === w.id ? (
          <div className="mt-3 rounded-[var(--radius-md)] p-3 flex flex-col gap-2.5" style={{ background: 'var(--color-surface-muted)' }} data-testid="slot-form">
            <label className="text-[12.5px] text-[var(--color-text-muted)] flex items-center gap-2">
              {T.date}
              <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-[14px]" data-testid="slot-date" />
            </label>
            <div className="flex items-center gap-2 text-[12.5px] text-[var(--color-text-muted)]">
              {T.from}
              <input type="time" value={slotFrom} onChange={(e) => setSlotFrom(e.target.value)} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-[14px]" data-testid="slot-from" />
              {T.to}
              <input type="time" value={slotTo} onChange={(e) => setSlotTo(e.target.value)} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-[14px]" data-testid="slot-to" />
            </div>
            {slotErr && <p className="text-[12px] text-[var(--color-danger)]">{T.timeOrder}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveSlot(w)} data-testid="slot-save">{T.saveCal}</Button>
              <Button size="sm" variant="ghost" onClick={() => setSlotFor(null)}>{T.cancel}</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {!a && <button type="button" className={`${smallBtn} !bg-[#5f8fb0] !text-white !border-transparent`} onClick={() => setAssignWait(w)} data-testid="wait-assign-sheet">{T.assignTo} →</button>}
            <button type="button" className={smallBtn} onClick={() => openSlot(w)} data-testid="wait-assign"><CalendarPlus size={13} /> {a ? T.changeSlot : T.assign}</button>
            {a && <button type="button" className={smallBtn} onClick={() => unassign(w)}><RotateCcw size={13} /> {T.unassign}</button>}
            {!a && <button type="button" className={smallBtn} onClick={() => move(w.id, -1)} aria-label={T.up}><ArrowUp size={13} /></button>}
            {!a && <button type="button" className={smallBtn} onClick={() => move(w.id, 1)} aria-label={T.down}><ArrowDown size={13} /></button>}
            <button type="button" className={smallBtn} onClick={() => removeWait(w.id)} aria-label={T.del}><Trash2 size={13} /></button>
          </div>
        )}
      </li>
    );
  }

  const list = tab === 'open' ? openNotes : archived;

  return (
    <div className="animate-in" data-testid="parkbox-page">
      <TopBar />
      <div className="px-5 pb-12">
        <h1 className="text-[24px] mb-2 leading-tight">{T.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-4">{T.intro}</p>

        <div className="grid grid-cols-2 gap-2.5 mb-5" role="tablist" aria-label={T.title}>
          <button type="button" role="tab" aria-selected={section === 'park'} onClick={() => setSection('park')} className="rounded-2xl px-3 py-3 text-left border-2 transition" style={{ background: section === 'park' ? SLIP_COLORS.park.bg : 'var(--color-surface)', borderColor: section === 'park' ? '#c8995c' : 'var(--color-border)' }} data-testid="section-park">
            <span className="block text-[22px]" aria-hidden="true">📦</span>
            <span className="block text-[16px] text-[#3d3a2e]">{T.tabPark}</span>
            <span className="block text-[11.5px] text-[#6b6650] leading-snug">{T.tabParkSub}</span>
          </button>
          <button type="button" role="tab" aria-selected={section === 'wait'} onClick={() => setSection('wait')} className="rounded-2xl px-3 py-3 text-left border-2 transition" style={{ background: section === 'wait' ? SLIP_COLORS.wait.bg : 'var(--color-surface)', borderColor: section === 'wait' ? '#5f8fb0' : 'var(--color-border)' }} data-testid="section-wait">
            <span className="block text-[22px]" aria-hidden="true">🪑</span>
            <span className="block text-[16px] text-[#2b3a4d]">{T.tabWait}</span>
            <span className="block text-[11.5px] text-[#4d6076] leading-snug">{T.tabWaitSub}</span>
          </button>
        </div>
        <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mb-4" data-testid="park-differ">{T.differ}</p>

        {section === 'park' && (
        <div className="rounded-3xl p-4 -mx-1" style={{ background: 'linear-gradient(180deg, #fbf3dc 0%, transparent 70%)', border: '1px solid #c8995c40' }} data-testid="park-section">
        <div className="rounded-xl p-3 mb-4 text-[13.5px] leading-relaxed text-[#4a4636]" style={{ background: '#fff8d6' }}>
          <p className="mb-1"><strong>📦 {T.parkExplainTitle}</strong></p>
          <p>{T.parkExplain}</p>
        </div>
        {/* writing + box */}
        <div className="relative">
          <div ref={paperRef} className="relative z-10">
            {flying ? (
              <div
                className="park-paper park-fly"
                style={{ background: SLIP_COLORS.park.bg, minHeight: flying.h, ['--fly-dy' as string]: `${flying.dy}px` }}
                onAnimationEnd={() => finishPut(flying)}
                data-testid="park-flying"
              >
                <p className="text-[15px] leading-[28px] whitespace-pre-line text-[#3d3a2e]">{flying.text}</p>
              </div>
            ) : (
              <div className="park-paper" style={{ background: SLIP_COLORS.park.bg, transform: 'rotate(-1.2deg)' }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={T.placeholder}
                  rows={4}
                  className="w-full bg-transparent outline-none resize-none text-[15px] leading-[28px] text-[#3d3a2e] placeholder:text-[#8a8466]"
                  data-testid="park-input"
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-3 mb-2">
            <div className="flex gap-1.5" role="group" aria-label="Priorität">
              {([1, 2, 3] as Prio[]).map((p) => (
                <button key={p} type="button" aria-pressed={prio === p} onClick={() => setPrio(p)} className={`px-3 py-1.5 rounded-full text-[12.5px] border ${prio === p ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-transparent' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'}`} data-testid={`park-prio-${p}`}>
                  {T.prio[p]}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={putInBox} disabled={!text.trim() || !!flying} data-testid="park-put">{T.put}</Button>
          </div>
          <div ref={boxRef} className="mt-2">
            <BoxArt count={openNotes.length} bump={bump} notes={openNotes} />
            <p className="text-center text-[13px] text-[var(--color-text-muted)] mt-1" data-testid="park-count">{T.safe(openNotes.length)}</p>
          </div>
        </div>

        {/* notes in the box */}
        <div className="mt-6 flex gap-2">
          {(['open', 'archive'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={tab === k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-full text-[13.5px] border ${tab === k ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-transparent' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'}`} data-testid={`park-tab-${k}`}>
              {k === 'open' ? `${T.open} (${openNotes.length})` : `${T.archive} (${archived.length})`}
            </button>
          ))}
        </div>
        <ul className="flex flex-col gap-3 mt-4" data-testid="park-list">
          {list.length === 0 && <li className="text-[13px] text-[var(--color-text-faint)]">{tab === 'open' ? T.emptyBox : T.emptyArchive}</li>}
          {list.map((n, i) => (
            <li key={n.id} className="park-paper park-land" style={{ background: SLIP_COLORS.park.bg, transform: `rotate(${n.tilt}deg)`, animationDelay: `${Math.min(i, 6) * 40}ms` }} data-testid="park-note" data-prio={n.priority}>
              {editId === n.id ? (
                <>
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="w-full bg-transparent outline-none resize-none text-[15px] leading-[28px] text-[#3d3a2e] border-b border-[#00000022]" data-testid="park-edit-input" />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => { if (editText.trim()) updateNote(n.id, { text: editText.trim() }); setEditId(null); }} data-testid="park-edit-save"><Check size={14} /> {T.save}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>{T.cancel}</Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[15px] leading-[28px] whitespace-pre-line text-[#3d3a2e]">{n.text}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {tab === 'open' && ([1, 2, 3] as Prio[]).map((p) => (
                      <button key={p} type="button" aria-pressed={n.priority === p} onClick={() => updateNote(n.id, { priority: p })} className={`px-2.5 py-1 rounded-full text-[11.5px] border ${n.priority === p ? 'bg-[#3d3a2e] text-white border-transparent' : 'bg-[#ffffff99] text-[#5c5842] border-[#00000018]'}`}>
                        {T.prio[p]}
                      </button>
                    ))}
                    {tab === 'archive' && <span className="text-[11.5px] text-[#5c5842]">{T.prio[n.priority]}</span>}
                  </div>
                  {n.deliverAt && !n.archived && <p className="text-[12px] mt-1 text-[#6b4a22]" data-testid="park-flies">✉️ {T.flies} {formatDeliver(n.deliverAt, settings.language === 'en' ? 'en' : 'de')}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tab === 'open' && <button type="button" className={`${smallBtn} !bg-[#3d3a2e] !text-white`} onClick={() => setAssignNote(n)} data-testid="park-assign">{T.assignTo} →</button>}
                    <button type="button" className={smallBtn} onClick={() => { setEditId(n.id); setEditText(n.text); }} data-testid="park-edit"><Pencil size={13} /> {T.edit}</button>
                    {tab === 'open' ? (
                      <button type="button" className={smallBtn} onClick={() => updateNote(n.id, { archived: true })} data-testid="park-archive"><Archive size={13} /> {T.toArchive}</button>
                    ) : (
                      <button type="button" className={smallBtn} onClick={() => updateNote(n.id, { archived: false })} data-testid="park-unarchive"><RotateCcw size={13} /> {T.back}</button>
                    )}
                    <button type="button" className={smallBtn} onClick={() => noteToWaiting(n)} data-testid="park-to-wait">🪑 {T.toWait}</button>
                    {delId === n.id ? (
                      <>
                        <button type="button" className={`${smallBtn} !text-[var(--color-danger)]`} onClick={() => removeNote(n.id)} data-testid="park-del-sure"><Trash2 size={13} /> {T.delSure}</button>
                        <button type="button" className={smallBtn} onClick={() => setDelId(null)} aria-label={T.cancel}><X size={13} /></button>
                      </>
                    ) : (
                      <button type="button" className={smallBtn} onClick={() => setDelId(n.id)} data-testid="park-del"><Trash2 size={13} /> {T.del}</button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        {pinned.length > 0 && (
          <section className="mt-8" data-testid="park-pinned">
            <h2 className="text-[16px] mb-1">📌 {T.pinned} · {pinned.length}</h2>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-3">{T.pinnedHint}</p>
            <ul className="flex flex-col gap-2">
              {pinned.map((n) => {
                const pl = slipPlace(n, settings.language === 'en' ? 'en' : 'de');
                return (
                  <li key={n.id} className="rounded-md px-3 py-2.5 text-[14px]" style={{ background: SLIP_COLORS[n.origin ?? 'park'].bg, color: SLIP_COLORS[n.origin ?? 'park'].ink }} data-testid="park-pinned-item">
                    <p className={n.done ? 'line-through opacity-70' : ''}>🗒️ {n.text}</p>
                    {pl && <p className="text-[12px] mt-1 opacity-80">{pl.icon} {pl.label}</p>}
                    <div className="flex gap-1.5 mt-2">
                      {pl && <Link to={pl.to} className={smallBtn}>{T.pinnedOpen} →</Link>}
                      <button type="button" className={smallBtn} onClick={() => { slipToPark(n.id); setNotes(parkNotesRepo.getAll()); }} data-testid="park-pinned-back"><RotateCcw size={13} /> {T.pinnedBack}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        </div>
        )}

        {/* Wartezimmer */}
        {section === 'wait' && (
        <section className="rounded-3xl p-4 -mx-1" style={{ background: 'linear-gradient(180deg, #e8f1fa 0%, transparent 70%)', border: '1px solid #5f8fb040' }} data-testid="waiting-room">
          <div className="rounded-[var(--radius-xl)] p-4 mb-4" style={{ background: 'linear-gradient(180deg, #e3eef6 0%, #f3ede1 100%)', border: '1px solid #5f8fb033' }}>
            <div className="flex items-center justify-center gap-3 text-[26px] mb-1" aria-hidden="true">🪑 🪴 🕰️ 🪴 🪑</div>
            <div className="h-1.5 rounded-full mb-3" style={{ background: '#c9b48f66' }} aria-hidden="true" />
            <h2 className="text-[20px] mb-1">{T.waitTitle}</h2>
            <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed"><strong>{T.waitExplainTitle}</strong> {T.waitExplain}</p>
          </div>

          <div className="rounded-[var(--radius-lg)] p-3.5 mb-4 flex flex-col gap-2.5" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <input value={wTitle} onChange={(e) => setWTitle(e.target.value)} placeholder={T.waitPlaceholder} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[15px]" data-testid="wait-input" />
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(T.kinds) as WaitKind[]).map((k) => (
                <button key={k} type="button" aria-pressed={wKind === k} onClick={() => setWKind(k)} className={`px-3 py-1.5 rounded-full text-[12.5px] border ${wKind === k ? 'bg-[#5f8fb0] text-white border-transparent' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'}`} data-testid={`wait-kind-${k}`}>
                  {T.kinds[k]}
                </button>
              ))}
            </div>
            <input value={wNeed} onChange={(e) => setWNeed(e.target.value)} placeholder={T.waitNeed} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[14px]" data-testid="wait-need" />
            <Button size="sm" onClick={addWait} disabled={!wTitle.trim()} data-testid="wait-add">{T.waitAdd}</Button>
          </div>

          {wait.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)]">{T.waitEmpty}</p>}
          {waiting.length > 0 && (
            <>
              <h3 className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{T.waitingNow} · {waiting.length}</h3>
              <ul className="flex flex-col gap-2.5 mb-5">{waiting.map((w, i) => renderWait(w, i))}</ul>
            </>
          )}
          {scheduled.length > 0 && (
            <>
              <h3 className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{T.scheduled} · {scheduled.length}</h3>
              <ul className="flex flex-col gap-2.5 mb-3">{scheduled.map((w, i) => renderWait(w, i))}</ul>
              <Link to="/kalender" className="text-[13.5px] text-[var(--color-primary)] underline underline-offset-2">{T.openCalendar} →</Link>
            </>
          )}
        </section>
        )}
      </div>
      {msg && <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-40 rounded-full px-4 py-2 text-[13.5px] text-white shadow-lg pointer-events-none" style={{ background: 'var(--color-text)' }} role="status" data-testid="park-toast">{msg}</div>}
      {assignNote && (
        <AssignSheet
          text={assignNote.text}
          note={assignNote}
          source="note"
          lang={settings.language === 'en' ? 'en' : 'de'}
          onClose={() => setAssignNote(null)}
          onAssigned={(m, o) => { if (o?.kept) setNotes(parkNotesRepo.getAll()); else removeNote(assignNote.id); setAssignNote(null); say(m); }}
          onToWait={() => { noteToWaiting(assignNote); setAssignNote(null); }}
          onPostfach={() => { setSchedNote(assignNote); setAssignNote(null); }}
        />
      )}
      {schedNote && (
        <SlipScheduler
          lang={settings.language === 'en' ? 'en' : 'de'}
          text={schedNote.text}
          initial={schedNote.deliverAt}
          onClose={() => setSchedNote(null)}
          onSave={(at) => { setSlipDelivery(schedNote.id, at); setNotes(parkNotesRepo.getAll()); setSchedNote(null); say(T.scheduledOk); }}
        />
      )}
      {assignWait && (
        <AssignSheet
          text={assignWait.title}
          waitItem={assignWait}
          source="wait"
          lang={settings.language === 'en' ? 'en' : 'de'}
          onClose={() => setAssignWait(null)}
          onAssigned={(m, o) => { if (o?.kept) setWait(waitItemsRepo.getAll()); else removeWait(assignWait.id); setAssignWait(null); if (o?.kept) setNotes(parkNotesRepo.getAll()); say(m); }}
          onCalendarWait={() => { const w = assignWait; setAssignWait(null); openSlot(w); }}
        />
      )}
    </div>
  );
}
