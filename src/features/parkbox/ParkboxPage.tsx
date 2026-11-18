import { useEffect, useMemo, useRef, useState } from 'react';
import { DuplicateHint } from '../../components/shared/DuplicateHint';
import { findSimilar } from '../../services/duplicates';
import { isFavorite, toggleFavorite, useFavoriteEntries } from '../../services/favorites';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, ArrowDown, ArrowUp, CalendarPlus, Camera, Check, Pencil, RotateCcw, Star, Trash2, X } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { MoreMenu } from '../../components/ui/MoreMenu';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import { appointmentsRepo, calendarCategoriesRepo, dayKey, parseDay, type Appointment } from '../calendar/calendarRepo';
import { AssignSheet } from './AssignSheet';
import { SlipScheduler, formatDeliver } from './SlipScheduler';
import { setSlipDelivery } from './slipDelivery';
import { slipPlace, slipToPark } from './slipAttach';
import { BoxArt } from './BoxArt';
import { PhotoButton, SlipPhoto, usePhotoPicker } from './SlipPhoto';
import { deleteOwnMedia } from '../../services/mediaStore';
import { SLIP_COLORS, SLIP_LEVELS, WAIT_CALENDAR_CATEGORY_ID, levelInfo, levelRank, parkNotesRepo, slipLevel, waitItemsRepo, type ParkNote, type SlipLevel, type WaitItem, type WaitKind } from './parkboxRepo';

const TXT = {
  de: {
    title: 'Notizen: Parkbox, Wartezimmer & Tagebuch',
    intro: 'Zwei verschiedene Orte – für zwei verschiedene Arten von „später“. Such dir den, der gerade passt.',
    tabPark: 'Parkbox',
    tabParkSub: 'kurze Zettel · „Nicht vergessen!“',
    tabWait: 'Wartezimmer',
    tabWaitSub: 'Vorhaben · „Irgendwann, wenn Zeit ist“',
    parkExplainTitle: 'Was ist die Parkbox?',
    parkExplain: 'Ein Einfall, eine Aufgabe, ein Gedanke – du willst ihn nicht verlieren, aber heute nicht mehr tragen. Aufschreiben, in die Box legen, fertig. Später ordnest du den Zettel zu: einem Projekt, einem Termin, einer Person, einer Mindmap oder dem Tagebuch. Nichts geht verloren.',
    waitExplainTitle: 'Was ist das Wartezimmer?',
    waitExplain: 'Hier sitzen größere Dinge, die passieren dürfen, wenn ihre Zeit kommt: Ideen, Vorhaben, Aktivitäten, Wünsche. Sie haben einen festen Platz und warten auf einen Zeitraum im Kalender – oder auf ein Projekt oder eine Mindmap.',
    differ: 'Der Unterschied: Parkbox = kurzer Zettel, den du nicht vergessen willst. Wartezimmer = ein Vorhaben, das noch auf seine Zeit wartet. Tagebuch = etwas, das du ausführlicher festhalten möchtest.',
    pinned: 'Angeheftete Zettel',
    pinnedHint: 'Diese Zettel hängen an einem Termin, einer Person oder einer Mindmap – dort stehen sie ganz oben. Hier findest du sie wieder.',
    pinnedBack: 'Zurück in die Parkbox',
    pinnedOpen: 'Öffnen',
    slipWait: 'Blauer Zettel = kam aus dem Wartezimmer',
    placeholder: 'Was soll heute nicht mehr in deinem Kopf bleiben?',
    levelsHint: 'Die Farbe des Zettels zeigt, wie eilig er ist.',
    info: 'Was ist was?',
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
    title: 'Notes: park box, waiting room & diary',
    intro: 'Two different places – for two different kinds of “later”. Pick the one that fits right now.',
    tabPark: 'Park box',
    tabParkSub: 'short slips · “don’t forget!”',
    tabWait: 'Waiting room',
    tabWaitSub: 'plans · “someday, when there’s time”',
    parkExplainTitle: 'What is the Park box?',
    parkExplain: 'An idea, a task, a thought – you don’t want to lose it, but you don’t want to carry it today. Write it down, put it in the box, done. Later you assign the slip: to a project, an appointment, a person, a mind map or the diary. Nothing gets lost.',
    waitExplainTitle: 'What is the waiting room?',
    waitExplain: 'Bigger things sit here that may happen when their time comes: ideas, plans, activities, wishes. They have a fixed seat and wait for a period in the calendar – or for a project or a mind map.',
    differ: 'The difference: Park box = a short slip you don’t want to forget. Waiting room = a plan still waiting for its time. Diary = something you want to write down in more detail.',
    pinned: 'Pinned slips',
    pinnedHint: 'These slips hang on an appointment, a person or a mind map – there they sit at the very top. Here you can find them again.',
    pinnedBack: 'Back to the Park box',
    pinnedOpen: 'Open',
    slipWait: 'Blue slip = came from the waiting room',
    placeholder: 'What should not stay in your head today?',
    levelsHint: 'The colour of the slip shows how urgent it is.',
    info: 'What is what?',
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
  return [...list].sort((a, b) => levelRank(a) - levelRank(b) || b.createdAt.localeCompare(a.createdAt));
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dayKey(d);
}

export function ParkboxPage() {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  const lang = settings.language === 'en' ? 'en' : 'de';
  useFavoriteEntries(); // Menü-Beschriftung "Favorit" aktuell halten
  const locale = settings.language === 'en' ? 'en-GB' : 'de-DE';

  const [notes, setNotes] = useState<ParkNote[]>(() => parkNotesRepo.getAll());
  const [wait, setWait] = useState<WaitItem[]>(() => waitItemsRepo.getAll());
  const [params, setParams] = useSearchParams();
  const section: 'park' | 'wait' = params.get('ort') === 'wartezimmer' ? 'wait' : 'park';
  const setSection = (s: 'park' | 'wait') => setParams(s === 'wait' ? { ort: 'wartezimmer' } : {}, { replace: true });
  const [text, setText] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | undefined>();
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const picker = usePhotoPicker((id) => {
    if (photoFor) {
      const old = parkNotesRepo.getById(photoFor)?.mediaId;
      if (old) void deleteOwnMedia(old);
      updateNote(photoFor, { mediaId: id });
      setPhotoFor(null);
    } else setNewPhoto(id);
  });
  const [level, setLevel] = useState<SlipLevel>('offen');
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
    const note: ParkNote = { id: createId('park'), text: p.text, priority: levelInfo(level).priority, level, archived: false, paper: 0, origin: 'park', mediaId: newPhoto, tilt: Math.round((Math.random() * 6 - 3) * 10) / 10, createdAt: now, updatedAt: now };
    persistNotes([...parkNotesRepo.getAll(), note]);
    setFlying(null);
    setText('');
    setNewPhoto(undefined);
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
    const mid = parkNotesRepo.getById(id)?.mediaId;
    if (mid) void deleteOwnMedia(mid);
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
      <li key={w.id} className="relative pl-12" data-testid="wait-item">
        <span className="absolute left-0 top-3 w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-medium text-white" style={{ background: '#4a7794', boxShadow: '0 0 0 4px color-mix(in srgb, #5f8fb0 11%, var(--color-bg))' }} aria-label={T.place(index + 1)}>{index + 1}</span>
        <div className="rounded-[6px] p-3.5" style={{ background: 'var(--color-surface)', border: '1px solid #5f8fb055' }}>
        <div className="flex items-start gap-1">
          <div className="flex-1 min-w-0">
            <span className="text-[11.5px] text-[#4a7794] uppercase tracking-wide">{T.kinds[w.kind]}</span>
            <p className="text-[15px] text-[var(--color-text)] leading-snug mt-0.5">{w.title}</p>
          </div>
          <MoreMenu testId="wait-menu" items={[
            { id: 'slot', label: a ? T.changeSlot : T.assign, icon: <CalendarPlus size={16} />, onClick: () => openSlot(w) },
            ...(a ? [{ id: 'unassign', label: T.unassign, icon: <RotateCcw size={16} />, onClick: () => unassign(w) }] : []),
            ...(!a ? [{ id: 'up', label: T.up, icon: <ArrowUp size={16} />, divider: true, onClick: () => move(w.id, -1) }, { id: 'down', label: T.down, icon: <ArrowDown size={16} />, onClick: () => move(w.id, 1) }] : []),
            { id: 'del', label: T.del, icon: <Trash2 size={16} />, danger: true, divider: true, onClick: () => removeWait(w.id) },
          ]} />
        </div>
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
          <div className="mt-2.5">
            {!a && <button type="button" className={`${smallBtn} !bg-[#4a7794] !text-white !border-transparent`} onClick={() => setAssignWait(w)} data-testid="wait-assign-sheet">{T.assignTo} →</button>}
          </div>
        )}
      </div>
      </li>
    );
  }

  const list = tab === 'open' ? openNotes : archived;

  return (
    <div className="animate-in" data-testid="parkbox-page">
      <TopBar />
      <div className="px-5 pb-12">
        <h1 className="text-[24px] mb-3 leading-tight">{T.title}</h1>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-full mb-3" style={{ background: 'var(--color-surface-muted)' }} role="tablist" aria-label={T.title}>
          <button type="button" role="tab" aria-selected={section === 'park'} onClick={() => setSection('park')} className="rounded-full px-3 py-2.5 text-[15px] transition hit44" style={section === 'park' ? { background: '#f3e3a8', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', color: '#3d3a2e' } : { color: 'var(--color-text-muted)' }} data-testid="section-park">
            <span aria-hidden="true">📦 </span>{T.tabPark}
          </button>
          <button type="button" role="tab" aria-selected={section === 'wait'} onClick={() => setSection('wait')} className="rounded-full px-3 py-2.5 text-[15px] transition hit44" style={section === 'wait' ? { background: '#5f8fb0', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', color: '#fff' } : { color: 'var(--color-text-muted)' }} data-testid="section-wait">
            <span aria-hidden="true">🪑 </span>{T.tabWait}
          </button>
          <Link to="/sicherheit/tagebuch" className="rounded-full px-3 py-2.5 text-[15px] transition hit44 text-center" style={{ color: 'var(--color-text-muted)' }} data-testid="section-diary">
            <span aria-hidden="true">📔 </span>{lang === 'en' ? 'Diary' : 'Tagebuch'}
          </Link>
        </div>
        <p className="text-[12.5px] text-[var(--color-text-faint)] mb-4" data-testid="park-sub">{section === 'park' ? T.tabParkSub : T.tabWaitSub}</p>
        <details className="mb-4 text-[13px] text-[var(--color-text-muted)]" data-testid="park-differ">
          <summary className="cursor-pointer select-none text-[12.5px] text-[var(--color-text-faint)] min-h-[32px]">{T.info}</summary>
          <p className="mt-2 leading-relaxed">{section === 'park' ? T.parkExplain : T.waitExplain}</p>
          <p className="mt-2 leading-relaxed">{T.differ}</p>
        </details>

        {section === 'park' && (
        <div data-testid="park-section">
        
        {/* writing + box */}
        <div className="relative">
          <div ref={paperRef} className="relative z-10">
            {flying ? (
              <div
                className="park-paper park-fly"
                style={{ background: levelInfo(level).bg, color: levelInfo(level).ink, minHeight: flying.h, ['--fly-dy' as string]: `${flying.dy}px` }}
                onAnimationEnd={() => finishPut(flying)}
                data-testid="park-flying"
              >
                <p className="text-[15px] leading-[28px] whitespace-pre-line">{flying.text}</p>
              </div>
            ) : (
              <div className="park-paper" style={{ background: levelInfo(level).bg, color: levelInfo(level).ink, transform: 'rotate(-1.2deg)' }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={T.placeholder}
                  rows={4}
                  className="w-full bg-transparent outline-none resize-none text-[15px] leading-[28px] placeholder:opacity-60"
                  style={{ color: 'inherit' }}
                  data-testid="park-input"
                />
                <DuplicateHint found={findSimilar(text, notes.filter((n) => !n.archived).map((n) => ({ text: n.text })))?.text} where={lang === 'en' ? 'in the box' : 'in der Box'} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 mt-3" role="group" aria-label={T.levelsHint} data-testid="park-levels">
            {SLIP_LEVELS.map((l) => (
              <button key={l.id} type="button" aria-pressed={level === l.id} aria-label={lang === 'en' ? l.en : l.de} title={lang === 'en' ? l.en : l.de} onClick={() => setLevel(l.id)} className="w-11 h-11 rounded-full flex items-center justify-center">
                <span className="block w-6 h-6 rounded-full" style={{ background: l.bg, border: level === l.id ? '3px solid var(--color-text)' : '1.5px solid rgba(0,0,0,0.3)' }} />
              </button>
            ))}
            <span className="text-[12.5px] text-[var(--color-text-muted)] ml-1">{lang === 'en' ? levelInfo(level).en : levelInfo(level).de}</span>
          </div>
          {newPhoto && <div className="mt-2 flex items-center gap-2"><SlipPhoto mediaId={newPhoto} className="!max-h-[90px]" /><button type="button" className="text-[12.5px] underline text-[var(--color-text-muted)] min-h-[44px]" onClick={() => { void deleteOwnMedia(newPhoto); setNewPhoto(undefined); }} data-testid="park-photo-remove">{lang === 'en' ? 'Remove photo' : 'Foto entfernen'}</button></div>}
          <div className="flex items-center justify-between gap-2 mt-3 mb-2">
            <PhotoButton label={newPhoto ? (lang === 'en' ? 'Change photo' : 'Foto ändern') : (lang === 'en' ? 'Add photo' : 'Foto anhängen')} onClick={() => { setPhotoFor(null); picker.open(); }} />
            <Button size="sm" onClick={putInBox} disabled={!text.trim() || !!flying} data-testid="park-put">{T.put}</Button>
          </div>
          <div ref={boxRef} className="mt-2">
            <BoxArt count={openNotes.length} bump={bump} colors={openNotes.map((n) => levelInfo(slipLevel(n)).bg)} />
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
          {list.map((n, i) => {
            const lv = levelInfo(slipLevel(n));
            return (
            <li key={n.id} className="park-paper park-land" style={{ background: lv.bg, color: lv.ink, transform: `rotate(${n.tilt}deg)`, animationDelay: `${Math.min(i, 6) * 40}ms` }} data-testid="park-note" data-prio={n.priority} data-level={lv.id}>
              {editId === n.id ? (
                <>
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="w-full bg-transparent outline-none resize-none text-[15px] leading-[28px] border-b border-current/30" style={{ color: 'inherit' }} data-testid="park-edit-input" />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => { if (editText.trim()) updateNote(n.id, { text: editText.trim() }); setEditId(null); }} data-testid="park-edit-save"><Check size={14} /> {T.save}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>{T.cancel}</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-1">
                    <p className="flex-1 text-[15px] leading-[28px] whitespace-pre-line">{n.text}</p>
                    <MoreMenu testId="park-note-menu" items={[
                      { id: 'photo', label: n.mediaId ? (lang === 'en' ? 'Change photo' : 'Foto ändern') : (lang === 'en' ? 'Attach a photo' : 'Foto anhängen'), icon: <Camera size={16} />, onClick: () => { setPhotoFor(n.id); picker.open(); } },
                      ...(n.mediaId ? [{ id: 'photo-del', label: lang === 'en' ? 'Remove photo' : 'Foto entfernen', icon: <X size={16} />, onClick: () => { void deleteOwnMedia(n.mediaId as string); updateNote(n.id, { mediaId: undefined }); } }] : []),
                      { id: 'edit', label: T.edit, icon: <Pencil size={16} />, onClick: () => { setEditId(n.id); setEditText(n.text); } },
                      { id: 'fav', label: isFavorite('park', n.id) ? (lang === 'en' ? 'Remove favourite' : 'Favorit entfernen') : (lang === 'en' ? 'Mark as favourite' : 'Als Favorit markieren'), icon: <Star size={16} />, onClick: () => toggleFavorite('park', n.id) },
                      ...(tab === 'open' ? SLIP_LEVELS.map((l, k) => ({ id: `lv-${l.id}`, label: lang === 'en' ? l.en : l.de, hint: k === 0 ? (lang === 'en' ? 'Colour = how urgent' : 'Farbe = wie eilig') : undefined, checked: lv.id === l.id, divider: k === 0, icon: <span className="block w-4 h-4 rounded-full border border-black/30" style={{ background: l.bg }} />, onClick: () => updateNote(n.id, { level: l.id, priority: l.priority }) })) : []),
                      tab === 'open'
                        ? { id: 'archive', label: T.toArchive, icon: <Archive size={16} />, divider: true, onClick: () => updateNote(n.id, { archived: true }) }
                        : { id: 'unarchive', label: T.back, icon: <RotateCcw size={16} />, divider: true, onClick: () => updateNote(n.id, { archived: false }) },
                      { id: 'towait', label: T.toWait, icon: <span aria-hidden="true">🪑</span>, onClick: () => noteToWaiting(n) },
                      { id: 'del', label: T.del, icon: <Trash2 size={16} />, danger: true, divider: true, onClick: () => setDelId(n.id) },
                    ]} />
                  </div>
                  {n.mediaId && <SlipPhoto mediaId={n.mediaId} className="mb-1.5" />}
                  <div className="flex flex-wrap items-center gap-2 -mt-1">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] opacity-80"><span className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ background: lv.bg }} aria-hidden="true" />{lang === 'en' ? lv.en : lv.de}</span>
                    {n.deliverAt && !n.archived && <span className="text-[12px] opacity-90" data-testid="park-flies">✉️ {T.flies} {formatDeliver(n.deliverAt, settings.language === 'en' ? 'en' : 'de')}</span>}
                  </div>
                  {tab === 'open' && (
                    <div className="mt-2">
                      <button type="button" className={`${smallBtn} !bg-[#3d3a2e] !text-white !border-transparent`} onClick={() => setAssignNote(n)} data-testid="park-assign">{T.assignTo} →</button>
                      <button type="button" className={`${smallBtn} ml-2`} onClick={() => setDelId(n.id)} aria-label={T.del} data-testid="park-del"><Trash2 size={13} /> {T.del}</button>
                    </div>
                  )}
                  {delId === n.id && (
                    <div className="flex gap-2 mt-2">
                      <button type="button" className={`${smallBtn} !text-[var(--color-danger)]`} onClick={() => removeNote(n.id)} data-testid="park-del-sure"><Trash2 size={13} /> {T.delSure}</button>
                      <button type="button" className={smallBtn} onClick={() => setDelId(null)} aria-label={T.cancel}><X size={13} /> {T.cancel}</button>
                    </div>
                  )}
                </>
              )}
            </li>
            );
          })}
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
                    {n.mediaId && <SlipPhoto mediaId={n.mediaId} className="mt-1.5" />}
                    {n.support && <p className="text-[12px] mt-1 font-medium" data-testid="park-pinned-support">🤝 {lang === 'en' ? 'I need support with this' : 'Dabei brauche ich Unterstützung'}</p>}
                    {pl && <p className="text-[12px] mt-1 opacity-80">{pl.icon} {pl.label}</p>}
                    <div className="flex gap-1.5 mt-2">
                      {pl && <Link to={pl.to} className={smallBtn}>{T.pinnedOpen} →</Link>}
                      <button type="button" className={smallBtn} onClick={() => { slipToPark(n.id); setNotes(parkNotesRepo.getAll()); }} data-testid="park-pinned-back"><RotateCcw size={13} /> {n.support ? (lang === 'en' ? 'Release' : 'Loslösen') : T.pinnedBack}</button>
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
        <section data-testid="waiting-room" className="rounded-[10px] p-3.5 -mx-1" style={{ background: 'color-mix(in srgb, #5f8fb0 11%, var(--color-bg))', border: '1px solid #5f8fb044' }}>
          <div className="rounded-[6px] px-4 py-3 mb-4 flex items-center justify-between gap-3" style={{ background: '#35566e', color: '#fff' }} data-testid="waiting-board">
            <div>
              <h2 className="text-[19px] leading-tight text-white">{T.waitTitle}</h2>
              <p className="text-[12.5px] opacity-80">{lang === 'en' ? `${waiting.length} waiting · ${scheduled.length} with a time` : `${waiting.length} warten · ${scheduled.length} mit Termin`}</p>
            </div>
            <span className="text-[26px]" aria-hidden="true">🪑</span>
          </div>

          <div className="rounded-[6px] p-3.5 mb-4 flex flex-col gap-2.5" style={{ background: 'var(--color-surface)', border: '1px solid #5f8fb055' }}>
            <input value={wTitle} onChange={(e) => setWTitle(e.target.value)} placeholder={T.waitPlaceholder} className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[15px]" data-testid="wait-input" />
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(T.kinds) as WaitKind[]).map((k) => (
                <button key={k} type="button" aria-pressed={wKind === k} onClick={() => setWKind(k)} className={`px-3 py-1.5 rounded-full text-[12.5px] border ${wKind === k ? 'bg-[#4a7794] text-white border-transparent' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'}`} data-testid={`wait-kind-${k}`}>
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
              <ul className="flex flex-col gap-3 mb-5 relative" style={{ ['--rail' as string]: '#5f8fb066' }}>{waiting.map((w, i) => renderWait(w, i))}</ul>
            </>
          )}
          {scheduled.length > 0 && (
            <>
              <h3 className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{T.scheduled} · {scheduled.length}</h3>
              <ul className="flex flex-col gap-3 mb-3">{scheduled.map((w, i) => renderWait(w, i))}</ul>
              <Link to="/kalender" className="text-[13.5px] text-[var(--color-primary)] underline underline-offset-2">{T.openCalendar} →</Link>
            </>
          )}
        </section>
        )}
      </div>
      {picker.input}
      {msg && <div className="fixed left-1/2 -translate-x-1/2 bottom-28 z-40 rounded-full px-4 py-2 text-[13.5px] shadow-lg pointer-events-none" style={{ background: 'var(--color-text)', color: 'var(--color-surface)' }} role="status" data-testid="park-toast">{msg}</div>}
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
