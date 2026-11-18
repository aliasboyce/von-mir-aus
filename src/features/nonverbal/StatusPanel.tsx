import { useState } from 'react';
import { MessageCircle, Send, Pencil, Trash2, Plus, Smartphone } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { shareOrCopy } from '../../services/shareOrCopy';
import { useL } from '../projects/useL';
import { networkRepo } from '../safetyNet/networkRepo';
import { inkFor, COMM_COLORS } from './commCardsRepo';
import { COMM_EMOJIS } from './CommCardEditor';
import { ensureStatusCards, newStatusCard, phoneDigits, statusRecipientsStore, statusRepo, type StatusCard } from './statusRepo';

/**
 * Status-Weitergabe: vorformulierte Status-Karten. Ein Tipp auf „Senden“ bereitet die Nachricht vor (WhatsApp, SMS oder Teilen-Menü).
 * Die App sendet nie von selbst – der letzte Tipp liegt immer bei der Person. `crisis` = reduzierte Schwarz-Weiß-Darstellung im Krisenmodus.
 */
export function StatusPanel({ crisis = false }: { crisis?: boolean }) {
  const { L, lang } = useL();
  const [cards, setCards] = useState<StatusCard[]>(() => ensureStatusCards(lang));
  const [recips, setRecips] = useState<string[]>(() => statusRecipientsStore.get());
  const [sending, setSending] = useState<StatusCard | null>(null);
  const [editing, setEditing] = useState<StatusCard | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const persons = networkRepo.getAll().filter((e) => e.category === 'person' && !e.isExample);
  const refresh = () => setCards(statusRepo.getAll());

  const toggleRecip = (id: string) => {
    const next = recips.includes(id) ? recips.filter((x) => x !== id) : [...recips, id];
    setRecips(next);
    statusRecipientsStore.set(next);
  };
  const chosen = persons.filter((p) => recips.includes(p.id));

  const btn = crisis ? 'border-2 border-black bg-white text-black' : 'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)]';

  return (
    <div data-testid="status-panel">
      <div className="mb-5">
        <p className={`text-[14px] mb-2 ${crisis ? 'text-black/80' : 'text-[var(--color-text-muted)]'}`}>
          {L('An wen? (frei lassen = du wählst beim Senden)', 'To whom? (leave empty = you choose when sending)')}
        </p>
        {persons.length === 0 ? (
          <p className={`text-[13.5px] ${crisis ? 'text-black/70' : 'text-[var(--color-text-faint)]'}`}>{L('Im Sicheren Netz sind noch keine Personen eingetragen – du kannst trotzdem über das Teilen-Menü senden.', 'No people in your safe network yet – you can still send via the share menu.')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {persons.map((p) => (
              <button key={p.id} onClick={() => toggleRecip(p.id)} aria-pressed={recips.includes(p.id)} className={`px-4 py-2.5 rounded-full text-[15px] min-h-[44px] ${recips.includes(p.id) ? (crisis ? 'bg-black text-white border-2 border-black' : 'bg-[var(--color-primary)] text-[var(--color-surface)]') : btn}`} data-testid="status-recipient">
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {cards.map((c) => (
          <li key={c.id} className="rounded-2xl p-4" style={{ background: crisis ? '#fff' : c.color, color: crisis ? '#000' : inkFor(c.color), border: crisis ? '2px solid #000' : '1px solid rgba(0,0,0,0.12)' }} data-testid="status-card">
            <div className="flex items-start gap-3">
              <span className="text-[28px] leading-none flex-shrink-0" aria-hidden="true">{c.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[16.5px] font-medium leading-snug">{c.title}</p>
                <p className="text-[14.5px] leading-relaxed mt-1 opacity-90">{c.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => setSending(c)} className={`flex-1 h-12 rounded-full flex items-center justify-center gap-2 text-[15.5px] font-medium ${crisis ? 'bg-black text-white' : 'bg-[var(--color-primary)] text-[var(--color-surface)]'}`} data-testid="status-send">
                <Send size={17} /> {L('Senden', 'Send')}
              </button>
              {!crisis && (confirmDel === c.id ? (
                <>
                  <button onClick={() => { statusRepo.remove(c.id); setConfirmDel(null); refresh(); }} className="px-3 h-11 rounded-full border text-[13px] font-medium" style={{ borderColor: 'currentColor' }} data-testid="status-delete-yes">{L('Ja, löschen', 'Yes, delete')}</button>
                  <button onClick={() => setConfirmDel(null)} className="px-2 h-11 text-[13px]">{L('Nein', 'No')}</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(c)} aria-label={L('Bearbeiten', 'Edit')} className="w-11 h-11 rounded-full flex items-center justify-center" data-testid="status-edit"><Pencil size={17} /></button>
                  <button onClick={() => setConfirmDel(c.id)} aria-label={L('Löschen', 'Delete')} className="w-11 h-11 rounded-full flex items-center justify-center" data-testid="status-delete"><Trash2 size={17} /></button>
                </>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!crisis && (
        <Button fullWidth variant="secondary" icon={<Plus size={17} />} onClick={() => setEditing(newStatusCard())} className="mt-4" data-testid="status-new">{L('Neue Status-Nachricht', 'New status message')}</Button>
      )}

      {sending && (
        <Modal open onClose={() => setSending(null)} title={sending.title} subtitle={L('Nichts wird automatisch gesendet – du tippst selbst auf Senden.', 'Nothing is sent automatically – you tap send yourself.')} zIndex={420}>
          <SendBody card={sending} people={chosen} crisis={crisis} onDone={() => setSending(null)} />
        </Modal>
      )}
      {editing && <StatusEditor card={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function SendBody({ card, people, crisis, onDone }: { card: StatusCard; people: ReturnType<typeof networkRepo.getAll>; crisis: boolean; onDone: () => void }) {
  const { L } = useL();
  const [text, setText] = useState(card.message);
  const withHelp = (base: string, whatHelps?: string) => (whatHelps ? `${base}\n${whatHelps}` : base);
  const enc = encodeURIComponent;
  const row = crisis ? 'border-2 border-black' : 'border border-[var(--color-border)]';
  return (
    <div className="flex flex-col gap-3" data-testid="status-send-body">
      <label className="block">
        <span className="block text-[13px] text-[var(--color-text-muted)] mb-1">{L('Nachricht (du kannst sie ändern)', 'Message (you can change it)')}</span>
        <textarea className="input" rows={5} value={text} onChange={(e) => setText(e.target.value)} data-testid="status-text" />
      </label>
      {people.map((p) => (
        <div key={p.id} className={`rounded-xl p-3 ${row}`}>
          <p className="text-[15px] font-medium mb-2">{p.name}</p>
          {p.phone ? (
            <div className="flex flex-wrap gap-2">
              <a href={`https://wa.me/${phoneDigits(p.phone)}?text=${enc(withHelp(text, p.whatHelps))}`} target="_blank" rel="noreferrer" onClick={onDone} className="flex-1 min-w-[130px] h-12 rounded-full flex items-center justify-center gap-2 text-[15px] font-medium bg-[var(--color-primary)] text-[var(--color-surface)]" data-testid="status-whatsapp"><MessageCircle size={17} /> WhatsApp</a>
              <a href={`sms:${p.phone}?&body=${enc(withHelp(text, p.whatHelps))}`} onClick={onDone} className="flex-1 min-w-[130px] h-12 rounded-full flex items-center justify-center gap-2 text-[15px] font-medium border border-[var(--color-border-strong)]" data-testid="status-sms"><Smartphone size={17} /> SMS</a>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--color-text-muted)]">{L('Keine Telefonnummer gespeichert – nutze „Anderweitig senden“.', 'No phone number saved – use “Send another way”.')}</p>
          )}
        </div>
      ))}
      <Button fullWidth variant="secondary" icon={<Send size={17} />} onClick={async () => { await shareOrCopy({ text }, L('Kopiert – füge sie in eine Nachricht ein.', 'Copied – paste it into a message.')); onDone(); }} data-testid="status-share">
        {people.length ? L('Anderweitig senden …', 'Send another way …') : L('Teilen / kopieren …', 'Share / copy …')}
      </Button>
    </div>
  );
}

function StatusEditor({ card, onClose, onSaved }: { card: StatusCard; onClose: () => void; onSaved: () => void }) {
  const { L } = useL();
  const [c, setC] = useState(card);
  return (
    <Modal open onClose={onClose} title={card.message ? L('Status bearbeiten', 'Edit status') : L('Neue Status-Nachricht', 'New status message')} zIndex={420}>
      <div className="flex flex-col gap-4" data-testid="status-editor">
        <label className="block">
          <span className="block text-[13px] text-[var(--color-text-muted)] mb-1.5">{L('Kurzer Name', 'Short name')}</span>
          <input className="input" value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} placeholder={L('z. B. Erschöpft, kann nicht sprechen', 'e.g. Exhausted, cannot speak')} data-testid="status-title" />
        </label>
        <label className="block">
          <span className="block text-[13px] text-[var(--color-text-muted)] mb-1.5">{L('Nachricht', 'Message')}</span>
          <textarea className="input" rows={5} value={c.message} onChange={(e) => setC({ ...c, message: e.target.value })} placeholder={L('z. B. Aktuell besteht starke Erschöpfung und Sprachblockade. Bitte ohne Fragen, ohne Erwartungen.', 'e.g. I am very exhausted and cannot speak. Please no questions, no expectations.')} data-testid="status-message" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {COMM_EMOJIS.slice(0, 12).map((e) => (
            <button key={e} type="button" onClick={() => setC({ ...c, emoji: e })} aria-pressed={c.emoji === e} className="w-11 h-11 rounded-xl text-[22px]" style={{ border: c.emoji === e ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }}>{e}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {COMM_COLORS.slice(0, 6).map((col) => (
            <button key={col} type="button" onClick={() => setC({ ...c, color: col })} aria-label={col} aria-pressed={c.color === col} className="w-11 h-11 rounded-full" style={{ background: col, border: c.color === col ? '3px solid var(--color-primary)' : '1px solid rgba(0,0,0,0.25)' }} />
          ))}
        </div>
        <Button fullWidth disabled={!c.title.trim() || !c.message.trim()} onClick={() => { statusRepo.save({ ...c, title: c.title.trim(), message: c.message.trim(), isExample: undefined }); onSaved(); }} data-testid="status-save">{L('Speichern', 'Save')}</Button>
      </div>
    </Modal>
  );
}
