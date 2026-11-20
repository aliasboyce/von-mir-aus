import { useState } from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { DeleteButton, ghostBtn, primaryBtn } from '../budget/budgetUi';
import { useL } from '../projects/useL';
import { routinesRepo } from './routinesRepo';
import { markHandled, routineSchedulesRepo, type RoutineSchedule, type SchedulePattern } from './routineSchedule';
import { SchedulePicker, TimeQuick } from './SchedulePicker';

/** Eine wiederkehrende Routine im Kalender ändern, pausieren, löschen – oder gleich starten. */
export function ScheduleEditSheet({ schedule, day, onClose, onChanged }: { schedule: RoutineSchedule; day: string; onClose: () => void; onChanged: () => void }) {
  const { L } = useL();
  const navigate = useNavigate();
  const r = routinesRepo.getById(schedule.routineId);
  const [time, setTime] = useState(schedule.time);
  const [pattern, setPattern] = useState<SchedulePattern>(schedule.pattern);
  const [remindHome, setRemindHome] = useState(schedule.remindHome);
  const [paused, setPaused] = useState(!!schedule.paused);
  const save = () => { routineSchedulesRepo.save({ ...schedule, time, pattern, remindHome, paused: paused || undefined }); onChanged(); onClose(); };
  const lbl = 'block text-[12.5px] text-[var(--color-text-muted)] mb-1';
  return (
    <Modal open onClose={onClose} title={`${r?.emoji ?? '🌱'} ${r?.title ?? L('Routine', 'Routine')}`}>
      <div className="flex flex-col gap-3.5" data-testid="schedule-edit">
        <label className="block"><span className={lbl}>{L('Uhrzeit', 'Time')}</span><input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} data-testid="sched-time" /><TimeQuick time={time} onChange={setTime} /></label>
        <div><span className={lbl}>{L('Wie oft?', 'How often?')}</span><SchedulePicker pattern={pattern} onChange={setPattern} /></div>
        <label className="flex items-start gap-2 text-[13.5px] min-h-[44px]"><input type="checkbox" className="mt-1" checked={remindHome} onChange={(e) => setRemindHome(e.target.checked)} /><span>{L('Auf der Startseite erinnern', 'Remind me on the start page')}</span></label>
        <label className="flex items-start gap-2 text-[13.5px] min-h-[44px]"><input type="checkbox" className="mt-1" checked={paused} onChange={(e) => setPaused(e.target.checked)} data-testid="sched-pause" /><span>{L('Pausieren (verschwindet aus dem Kalender, bleibt gespeichert)', 'Pause (disappears from the calendar, stays saved)')}</span></label>
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={save} className={primaryBtn} style={{ background: 'var(--color-primary)' }} data-testid="sched-save">{L('Speichern', 'Save')}</button>
          {r && <button type="button" onClick={() => { markHandled(schedule.id, day); navigate(`/entdecken/routinen/${r.id}/start`); }} className={ghostBtn} data-testid="sched-start"><Play size={15} /> {L('Starten', 'Start')}</button>}
          <DeleteButton onDelete={() => { routineSchedulesRepo.remove(schedule.id); onChanged(); onClose(); }} L={L} label={L('Wiederholung löschen', 'Delete repeat')} testId="sched-delete" />
        </div>
      </div>
    </Modal>
  );
}
