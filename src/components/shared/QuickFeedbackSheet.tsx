import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { TEST_FEEDBACK_URL, QUICK_FEEDBACK_MAIL, quickFeedbackText, type QuickFeedbackKind } from '../../services/testSupport';

const TXT = {
  de: {
    title: 'Kurz was an Boycie melden',
    goesTo: 'Das geht an Boycie:',
    sub: 'Ein Tipp reicht. Alles andere ist freiwillig.',
    options: { helps: 'Das hilft', weighs: 'Das drückt / stört', missing: 'Das fehlt mir', broken: 'Das geht nicht' } as Record<QuickFeedbackKind, string>,
    notePh: 'Wenn du magst: ein Satz dazu …',
    context: 'Mitgeschickt werden nur: diese Seite, Version, Gerätetyp. Nichts Persönliches, nichts aus deinen Einträgen.',
    send: 'Senden',
    sendHint: 'Öffnet das Teilen-Menü (z. B. WhatsApp, Signal, Mail) – du suchst selbst aus, wohin es geht. Ohne Teilen-Menü wird es kopiert.',
    thanks: 'Danke dir. Das hilft.',
    copied: 'Kopiert – du kannst es jetzt einfügen, wo du es hinschicken möchtest.',
    long: 'Lieber ausführlicher? Zum Formular',
    close: 'Schließen',
  },
  en: {
    title: 'Quick note to Boycie',
    goesTo: 'This goes to Boycie:',
    sub: 'One tap is enough. Everything else is optional.',
    options: { helps: 'This helps', weighs: 'This weighs on me / bothers me', missing: 'I miss something', broken: 'This does not work' } as Record<QuickFeedbackKind, string>,
    notePh: 'If you like: one sentence …',
    context: 'Only sent along: this screen, version, device type. Nothing personal, nothing from your entries.',
    send: 'Send',
    sendHint: 'Opens the share menu (e.g. WhatsApp, Signal, mail) – you choose where it goes. Without a share menu it is copied.',
    thanks: 'Thank you. That helps.',
    copied: 'Copied – you can paste it wherever you want to send it.',
    long: 'Prefer more detail? To the form',
    close: 'Close',
  },
};
const EMOJI: Record<QuickFeedbackKind, string> = { helps: '💛', weighs: '😕', missing: '💭', broken: '🔧' };

/** A very short feedback: pick one of four, optionally one line, send via the share sheet. No account, no server. */
export function QuickFeedbackSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const T = TXT[en ? 'en' : 'de'];
  const { pathname } = useLocation();
  const [kind, setKind] = useState<QuickFeedbackKind | null>(null);
  const [note, setNote] = useState('');
  const [state, setState] = useState<'idle' | 'sent' | 'copied'>('idle');

  function close() {
    setKind(null);
    setNote('');
    setState('idle');
    onClose();
  }

  async function send() {
    const text = quickFeedbackText(kind, note, pathname, en);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: T.title, text });
        setState('sent');
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('idle');
    }
  }

  return (
    <Modal open={open} onClose={close} title={T.title} subtitle={T.sub}>
      <div data-testid="quick-feedback">
        {state === 'idle' ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.keys(T.options) as QuickFeedbackKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(kind === k ? null : k)}
                  className="rounded-[var(--radius-lg)] px-3 py-3 text-left text-[14px] border"
                  style={{ background: kind === k ? 'var(--color-primary-soft)' : 'var(--color-surface)', borderColor: kind === k ? 'var(--color-primary)' : 'var(--color-border)' }}
                  aria-pressed={kind === k}
                  data-testid={`quick-feedback-${k}`}
                >
                  <span className="block text-[20px] mb-0.5">{EMOJI[k]}</span>
                  {T.options[k]}
                </button>
              ))}
            </div>
            <input className="input mb-2" maxLength={240} placeholder={T.notePh} value={note} onChange={(e) => setNote(e.target.value)} data-testid="quick-feedback-note" />
            <p className="text-[11.5px] text-[var(--color-text-faint)] leading-snug mb-3">{T.context}</p>
            <Button fullWidth onClick={send} disabled={!kind && !note.trim()} data-testid="quick-feedback-send">{T.send}</Button>
            <p className="text-[11.5px] text-[var(--color-text-faint)] leading-snug mt-2">{T.sendHint}</p>
            {QUICK_FEEDBACK_MAIL && (
              <p className="text-[12.5px] text-[var(--color-text-muted)] mt-2" data-testid="quick-feedback-mail">{T.goesTo} <a href={`mailto:${QUICK_FEEDBACK_MAIL}`} className="underline text-[var(--color-primary)]">{QUICK_FEEDBACK_MAIL}</a></p>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-[17px] text-[var(--color-text)] mb-1">🌱 {T.thanks}</p>
            {state === 'copied' && <p className="text-[13px] text-[var(--color-text-muted)] mb-3" data-testid="quick-feedback-copied">{T.copied}</p>}
            <Button fullWidth variant="secondary" onClick={close}>{T.close}</Button>
          </div>
        )}
        <a href={TEST_FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-primary)]">
          <ExternalLink size={13} /> {T.long}
        </a>
      </div>
    </Modal>
  );
}
