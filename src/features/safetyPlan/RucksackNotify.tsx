import { Link } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';
import { useL } from '../projects/useL';
import { networkRepo } from '../safetyNet/networkRepo';

/**
 * „Wem sage ich Bescheid?“ – die wichtigen Kontakte aus dem Netzwerk, direkt im Rucksack:
 * anrufen oder eine kurze Nachricht vorbereiten (du schickst sie selbst ab). Es wird nichts doppelt gespeichert.
 */
export function RucksackNotify({ compact }: { compact?: boolean }) {
  const { L, lang } = useL();
  const all = networkRepo.getAll().filter((e) => !e.isExample);
  const important = all.filter((e) => e.isImportantContact);
  const list = (important.length > 0 ? important : all.filter((e) => e.phone)).slice(0, 5);
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const msg = (name: string) => (lang === 'en'
    ? `Hi ${name}, I am packing my emergency backpack. Could you get in touch with me?`
    : `Hallo ${name}, ich packe gerade meinen Notfallrucksack. Magst du dich bei mir melden?`);

  return (
    <section className={compact ? 'w-full max-w-[360px] text-left' : 'w-full max-w-[360px] text-left mt-1'} data-testid="rucksack-notify" aria-label={L('Wem sage ich Bescheid?', 'Who do I let know?')}>
      <p className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{L('Wem sage ich Bescheid?', 'Who do I let know?')}</p>
      {list.length === 0 ? (
        <Link to="/sicherheit/kontakte" className="text-[14px] text-[var(--color-primary)] underline underline-offset-2" data-testid="rucksack-notify-setup">
          {L('Wichtige Kontakte festlegen →', 'Set important contacts →')}
        </Link>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <span className="flex-1 min-w-0 truncate text-[15px] text-[var(--color-text)]">{c.name}</span>
              {c.phone ? (
                <>
                  <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="w-11 h-11 rounded-full flex items-center justify-center border" style={{ borderColor: 'var(--color-border)' }} aria-label={L(`${c.name} anrufen`, `Call ${c.name}`)} data-testid={`rucksack-call-${c.id}`}><Phone size={17} /></a>
                  <a href={`sms:${c.phone.replace(/\s+/g, '')}${ios ? '&' : '?'}body=${encodeURIComponent(msg(c.name))}`} className="w-11 h-11 rounded-full flex items-center justify-center border" style={{ borderColor: 'var(--color-border)' }} aria-label={L(`${c.name} eine Nachricht schreiben`, `Message ${c.name}`)} data-testid={`rucksack-msg-${c.id}`}><MessageCircle size={17} /></a>
                </>
              ) : (
                <Link to="/sicherheit/netzwerk" className="text-[13px] text-[var(--color-primary)] underline underline-offset-2">{L('Öffnen', 'Open')}</Link>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[12px] text-[var(--color-text-faint)] mt-2 leading-relaxed">{L('Nur wenn du magst. Die Nachricht öffnet sich zum Prüfen – du schickst sie selbst ab.', 'Only if you like. The message opens for you to check – you send it yourself.')}</p>
    </section>
  );
}
