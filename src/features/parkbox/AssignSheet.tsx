import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { createId } from '../../services/storage/repository';
import { appointmentsRepo, calendarCategoriesRepo, type Appointment } from '../calendar/calendarRepo';
import { diaryRepo } from '../diary/diaryRepo';
import { DIARY_DEFAULT_CATEGORY_ID, DIARY_DEFAULT_CATEGORY_LABEL, diaryCategoriesStore } from '../diary/diaryCategories';
import { newProject, projectsRepo, type Project } from '../projects/projectModel';
import { ASSIGN_TARGETS, assignToProject, logBoxSlip, type AssignTarget } from '../projects/projectAssign';
import { PAPER_COLORS, parkNotesRepo } from './parkboxRepo';
import { tomorrowDateKey } from './slipDelivery';

export const SLIP_CALENDAR_CATEGORY_ID = 'cal_zettel';

type Step = 'choose' | 'project' | 'place' | 'calendar' | 'diary';

/**
 * Einen Zettel oder ein Wartezimmer-Ding irgendwohin geben, wo es hingehört – dann ist es aus der Box / dem Wartezimmer heraus:
 * in ein Projekt (an einen Platz oder in dessen Zettel-Box), in den Kalender (Zeitraum) oder ins Tagebuch (Kategorie).
 */
export function AssignSheet({ text, source, lang, onClose, onAssigned, onPostfach, onCalendarWait, onToWait }: {
  text: string;
  source: 'note' | 'wait';
  lang: 'de' | 'en';
  onClose: () => void;
  /** Quelle ist jetzt untergebracht → Aufrufer entfernt sie */
  onAssigned: (msg: string) => void;
  onPostfach?: () => void;
  /** Wartezimmer: bestehendes Zeitraum-Formular öffnen */
  onCalendarWait?: () => void;
  onToWait?: () => void;
}) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const [step, setStep] = useState<Step>('choose');
  const [project, setProject] = useState<Project | null>(null);
  const [date, setDate] = useState(tomorrowDateKey());
  const [from, setFrom] = useState('10:00');
  const [to, setTo] = useState('11:00');
  const [err, setErr] = useState(false);
  const projects = projectsRepo.getAll().filter((p) => !p.archived && p.status !== 'done').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const cats = [{ id: DIARY_DEFAULT_CATEGORY_ID, label: DIARY_DEFAULT_CATEGORY_LABEL }, ...diaryCategoriesStore.getAll()];

  const bigBtn = 'w-full text-left rounded-xl border border-[var(--color-border-strong)] px-4 py-3 flex items-start gap-3';

  const toProjectPlace = (p: Project, target: AssignTarget | 'box') => {
    if (target === 'box') {
      const now = new Date().toISOString();
      parkNotesRepo.save({ id: createId('park'), text, priority: 2, archived: false, paper: Math.floor(Math.random() * PAPER_COLORS.length), tilt: Math.round((Math.random() * 6 - 3) * 10) / 10, projectId: p.id, createdAt: now, updatedAt: now });
      logBoxSlip(p, text, lang);
    } else assignToProject(p, text, target, lang);
    onAssigned(L(`In „${p.title || 'Projekt'}“ untergebracht.`, `Placed in “${p.title || 'project'}”.`));
  };
  const newProjectFrom = () => {
    const p = newProject(text.length > 60 ? `${text.slice(0, 59)}…` : text, lang);
    projectsRepo.save(p);
    setProject(p);
    setStep('place');
  };
  const saveCalendar = () => {
    if (to <= from) { setErr(true); return; }
    if (!calendarCategoriesRepo.getById(SLIP_CALENDAR_CATEGORY_ID)) calendarCategoriesRepo.save({ id: SLIP_CALENDAR_CATEGORY_ID, label: L('Zettel', 'Slips'), color: '#c98f5a' });
    const now = new Date().toISOString();
    const a: Appointment = { id: createId('appt'), title: text.length > 120 ? `${text.slice(0, 119)}…` : text, date, time: from, endTime: to, categoryId: SLIP_CALENDAR_CATEGORY_ID, note: text.length > 120 ? text : undefined, reminderMinutes: null, createdAt: now, updatedAt: now };
    appointmentsRepo.save(a);
    onAssigned(L('Steht jetzt im Kalender.', 'Now in the calendar.'));
  };
  const saveDiary = (categoryId: string) => {
    const now = new Date().toISOString();
    diaryRepo.save({ id: createId('diary'), createdAt: now, updatedAt: now, content: text, categoryId: categoryId === DIARY_DEFAULT_CATEGORY_ID ? undefined : categoryId });
    onAssigned(L('Steht jetzt im Tagebuch.', 'Now in the diary.'));
  };

  return (
    <Modal open onClose={onClose} title={L('Wohin damit?', 'Where does it go?')} subtitle={text.length > 90 ? `${text.slice(0, 89)}…` : text}>
      {step === 'choose' && (
        <div className="flex flex-col gap-2" data-testid="assign-choose">
          <button type="button" className={bigBtn} onClick={() => setStep('project')} data-testid="assign-project"><span aria-hidden="true">🗂️</span><span><span className="block text-[15px]">{L('Einem Projekt zuordnen', 'Give it to a project')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Als Schritt, Aufgabe, Erkenntnis, Notiz …', 'As a step, task, insight, note …')}</span></span></button>
          {source === 'note' ? (
            <button type="button" className={bigBtn} onClick={() => setStep('calendar')} data-testid="assign-calendar"><span aria-hidden="true">📅</span><span><span className="block text-[15px]">{L('In den Kalender (Zeitraum)', 'Into the calendar (period)')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Tag und Uhrzeit von – bis', 'Day and time from – to')}</span></span></button>
          ) : (
            <button type="button" className={bigBtn} onClick={() => onCalendarWait?.()} data-testid="assign-calendar"><span aria-hidden="true">📅</span><span><span className="block text-[15px]">{L('Einen Zeitraum im Kalender zuordnen', 'Assign a period in the calendar')}</span></span></button>
          )}
          <button type="button" className={bigBtn} onClick={() => setStep('diary')} data-testid="assign-diary"><span aria-hidden="true">📔</span><span><span className="block text-[15px]">{L('Ins Tagebuch schreiben', 'Write it into the diary')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('In ein Buch (Kategorie) deiner Wahl', 'Into a book (category) of your choice')}</span></span></button>
          {onToWait && <button type="button" className={bigBtn} onClick={onToWait} data-testid="assign-wait"><span aria-hidden="true">🪑</span><span className="text-[15px]">{L('Ins Wartezimmer', 'To the waiting room')}</span></button>}
          {onPostfach && <button type="button" className={bigBtn} onClick={onPostfach} data-testid="assign-postfach"><span aria-hidden="true">✉️</span><span><span className="block text-[15px]">{L('Für morgen in mein Postfach fliegen lassen', 'Let it fly into my Postfach for tomorrow')}</span><span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Du bestimmst Tag und Uhrzeit – dann liegt er auf der Startseite', 'You choose day and time – then it lies on your start page')}</span></span></button>}
        </div>
      )}

      {step === 'project' && (
        <div className="flex flex-col gap-2" data-testid="assign-projects">
          {projects.length === 0 && <p className="text-[13.5px] text-[var(--color-text-muted)]">{L('Noch kein laufendes Projekt.', 'No running project yet.')}</p>}
          {projects.map((p) => (
            <button key={p.id} type="button" className={bigBtn} onClick={() => { setProject(p); setStep('place'); }} data-testid="assign-project-pick"><span aria-hidden="true">{p.emoji}</span><span className="text-[15px]">{p.title || L('Ohne Namen', 'Untitled')}</span></button>
          ))}
          <button type="button" className={`${bigBtn} border-dashed`} onClick={newProjectFrom} data-testid="assign-project-new"><span aria-hidden="true">＋</span><span className="text-[15px]">{L('Neues Projekt daraus machen', 'Make a new project from it')}</span></button>
          <Button variant="ghost" onClick={() => setStep('choose')}>{L('Zurück', 'Back')}</Button>
        </div>
      )}

      {step === 'place' && project && (
        <div data-testid="assign-places">
          <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{project.emoji} {project.title}</p>
          <div className="grid grid-cols-2 gap-2">
            {ASSIGN_TARGETS.map((a) => (
              <button key={a.id} type="button" className="rounded-xl border border-[var(--color-border-strong)] px-3 py-3 text-[14px] text-left" onClick={() => toProjectPlace(project, a.id)} data-testid={`assign-place-${a.id}`}>{a.icon} {L(a.de, a.en)}</button>
            ))}
            <button type="button" className="col-span-2 rounded-xl border border-[var(--color-border-strong)] px-3 py-3 text-[14px] text-left" onClick={() => toProjectPlace(project, 'box')} data-testid="assign-place-box">🗒️ {L('In die Zettel-Box des Projekts', 'Into the project’s slip box')}</button>
          </div>
          <Button variant="ghost" onClick={() => setStep('project')}>{L('Zurück', 'Back')}</Button>
        </div>
      )}

      {step === 'calendar' && (
        <div className="flex flex-col gap-3" data-testid="assign-calendar-form">
          <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Tag', 'Day')}</span><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} data-testid="assign-date" /></label>
          <div className="grid grid-cols-2 gap-2">
            <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('von', 'from')}</span><input type="time" className="input" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="assign-from" /></label>
            <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('bis', 'to')}</span><input type="time" className="input" value={to} onChange={(e) => setTo(e.target.value)} data-testid="assign-to" /></label>
          </div>
          {err && <p className="text-[12px] text-[var(--color-danger)]">{L('„bis“ ist früher als „von“ – bitte prüfen.', '“to” is earlier than “from” – please check.')}</p>}
          <Button fullWidth onClick={saveCalendar} data-testid="assign-calendar-save">{L('Im Kalender speichern', 'Save in the calendar')}</Button>
          <Button variant="ghost" onClick={() => setStep('choose')}>{L('Zurück', 'Back')}</Button>
        </div>
      )}

      {step === 'diary' && (
        <div className="flex flex-col gap-2" data-testid="assign-diary-list">
          {cats.map((c) => <button key={c.id} type="button" className={bigBtn} onClick={() => saveDiary(c.id)} data-testid="assign-diary-pick"><span aria-hidden="true">📔</span><span className="text-[15px]">{c.label}</span></button>)}
          <Button variant="ghost" onClick={() => setStep('choose')}>{L('Zurück', 'Back')}</Button>
        </div>
      )}
    </Modal>
  );
}
