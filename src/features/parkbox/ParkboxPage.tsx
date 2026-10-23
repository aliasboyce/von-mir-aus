import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArrowDown, ArrowUp, CalendarPlus, Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import { appointmentsRepo, calendarCategoriesRepo, dayKey, parseDay, type Appointment } from '../calendar/calendarRepo';
import { PAPER_COLORS, WAIT_CALENDAR_CATEGORY_ID, parkNotesRepo, waitItemsRepo, type ParkNote, type WaitItem, type WaitKind } from './parkboxRepo';

type Prio = 1 | 2 | 3;

const TXT = {
  de: {
    title: 'Verbindliche Parkbox & Wartezimmer',
    intro: 'Alles, was heute nicht mehr muss, darf hier hinein. Es bleibt sicher in der Box – nichts geht verloren. Du bist für heute entlastet. Morgen ist auch noch ein Tag.',
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
    waitTitle: 'Wartezimmer',
    waitIntro: 'Ideen, Projekte und Dinge, die du dir wünschst – sie haben hier einen festen Platz und warten, bis ihre Zeit kommt. Du musst nicht alles heute machen, und nichts davon wird vergessen.',
    waitPlaceholder: 'Was möchte irgendwann passieren?',
    waitNeed: 'Welches Bedürfnis steckt dahinter? (optional)',
    waitAdd: 'In den Warteraum setzen',
    kinds: { idee: '💡 Idee', projekt: '🧩 Projekt', aktivitaet: '🌿 Aktivität' } as Record<WaitKind, string>,
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
    title: 'Binding Parking Box & Waiting Room',
    intro: 'Everything that does not have to happen today may go in here. It stays safe in the box – nothing gets lost. You are relieved for today. Tomorrow is another day.',
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
    waitTitle: 'Waiting room',
    waitIntro: 'Ideas, projects and things you wish for – they have a fixed place here and wait until their time comes. You do not have to do everything today, and none of it is forgotten.',
    waitPlaceholder: 'What would you like to happen some day?',
    waitNeed: 'Which need is behind it? (optional)',
    waitAdd: 'Seat it in the waiting room',
    kinds: { idee: '💡 Idea', projekt: '🧩 Project', aktivitaet: '🌿 Activity' } as Record<WaitKind, string>,
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
        <rect key={n.id} x={50 + i * 34} y={22 - (i % 2) * 6} width="34" height="40" rx="3" fill={PAPER_COLORS[n.paper % PAPER_COLORS.length]} stroke="rgba(0,0,0,0.12)" transform={`rotate(${(i - 1.5) * 7} ${67 + i * 34} 62)`} />
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
  const [text, setText] = useState('');
  const [prio, setPrio] = useState<Prio>(2);
  const [tab, setTab] = useState<'open' | 'archive'>('open');
  const [flying, setFlying] = useState<{ text: string; paper: number; dy: number; h: number } | null>(null);
  const [bump, setBump] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [delId, setDelId] = useState<string | null>(null);

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

  const openNotes = useMemo(() => sortNotes(notes.filter((n) => !n.archived)), [notes]);
  const archived = useMemo(() => sortNotes(notes.filter((n) => n.archived)), [notes]);
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

  function finishPut(p: { text: string; paper: number }) {
    const now = new Date().toISOString();
    const note: ParkNote = { id: createId('park'), text: p.text, priority: prio, archived: false, paper: p.paper, tilt: Math.round((Math.random() * 6 - 3) * 10) / 10, createdAt: now, updatedAt: now };
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
    const paper = Math.floor(Math.random() * PAPER_COLORS.length);
    if (settings.reduceMotion) {
      finishPut({ text: clean, paper });
      return;
    }
    const a = paperRef.current?.getBoundingClientRect();
    const b = boxRef.current?.getBoundingClientRect();
    const dy = a && b ? Math.max(60, b.top + 40 - a.top) : 220;
    setFlying({ text: clean, paper, dy, h: a?.height ?? 130 });
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
        <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-5">{T.intro}</p>

        {/* writing + box */}
        <div className="relative">
          <div ref={paperRef} className="relative z-10">
            {flying ? (
              <div
                className="park-paper park-fly"
                style={{ background: PAPER_COLORS[flying.paper], minHeight: flying.h, ['--fly-dy' as string]: `${flying.dy}px` }}
                onAnimationEnd={() => finishPut(flying)}
                data-testid="park-flying"
              >
                <p className="text-[15px] leading-[28px] whitespace-pre-line text-[#3d3a2e]">{flying.text}</p>
              </div>
            ) : (
              <div className="park-paper" style={{ background: '#fff6bf', transform: 'rotate(-1.2deg)' }}>
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
            <li key={n.id} className="park-paper park-land" style={{ background: PAPER_COLORS[n.paper % PAPER_COLORS.length], transform: `rotate(${n.tilt}deg)`, animationDelay: `${Math.min(i, 6) * 40}ms` }} data-testid="park-note" data-prio={n.priority}>
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
                  <div className="flex flex-wrap gap-1.5 mt-2">
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

        {/* Wartezimmer */}
        <section className="mt-10" data-testid="waiting-room">
          <div className="rounded-[var(--radius-xl)] p-4 mb-4" style={{ background: 'linear-gradient(180deg, #e3eef6 0%, #f3ede1 100%)', border: '1px solid #5f8fb033' }}>
            <div className="flex items-center justify-center gap-3 text-[26px] mb-1" aria-hidden="true">🪑 🪴 🕰️ 🪴 🪑</div>
            <div className="h-1.5 rounded-full mb-3" style={{ background: '#c9b48f66' }} aria-hidden="true" />
            <h2 className="text-[20px] mb-1">{T.waitTitle}</h2>
            <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">{T.waitIntro}</p>
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
      </div>
    </div>
  );
}
