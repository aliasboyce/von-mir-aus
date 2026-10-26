import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { tomorrowDateKey } from './slipDelivery';

/** „Morgen in mein Postfach fliegen lassen“ – Tag und Uhrzeit wählen, an dem der Zettel auf der Startseite landet. */
export function SlipScheduler({ lang, text, initial, onSave, onClose }: { lang: 'de' | 'en'; text: string; initial?: string; onSave: (deliverAt: string) => void; onClose: () => void }) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const [date, setDate] = useState(initial?.slice(0, 10) ?? tomorrowDateKey());
  const [time, setTime] = useState(initial?.slice(11, 16) ?? '09:00');
  return (
    <Modal open onClose={onClose} title={L('Zettel losfliegen lassen', 'Let the slip fly off')} subtitle={text.length > 90 ? `${text.slice(0, 89)}…` : text}>
      <div className="flex flex-col gap-3" data-testid="slip-scheduler">
        <p className="text-[13.5px] text-[var(--color-text-muted)]">{L('Dann landet er auf deiner Startseite. Du kannst ihn nicht wegklicken – er wartet, bis du entscheidest: zurück in die Box, erledigt oder löschen.', 'Then it lands on your start page. You cannot click it away – it waits until you decide: back into the box, done or delete.')}</p>
        <div className="grid grid-cols-2 gap-2">
          <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Tag', 'Day')}</span><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} data-testid="slip-date" /></label>
          <label><span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Uhrzeit', 'Time')}</span><input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} data-testid="slip-time" /></label>
        </div>
        <Button fullWidth disabled={!date || !time} onClick={() => onSave(`${date}T${time}`)} data-testid="slip-save">✉️ {L('Losfliegen lassen', 'Let it fly')}</Button>
      </div>
    </Modal>
  );
}

export function formatDeliver(deliverAt: string, lang: 'de' | 'en'): string {
  const d = new Date(`${deliverAt}:00`);
  if (Number.isNaN(d.getTime())) return deliverAt;
  return `${d.toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString(lang === 'en' ? 'en-US' : 'de-DE', { hour: '2-digit', minute: '2-digit' })}`;
}
