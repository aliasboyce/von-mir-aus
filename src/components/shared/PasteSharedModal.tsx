import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPaste } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { extractSharedRoute } from '../../services/sharedLinks';

const TXT = {
  de: {
    cta: 'Etwas von jemandem erhalten',
    title: 'Geteiltes einfügen',
    intro: 'Hat dir jemand eine Ressource, ein Hilfsmittel, einen Ort, eine Aktivität, eine Brücke, eine Quelle, einen Kontakt oder einen Brief geschickt?',
    steps: [
      'Kopiere den Link aus der Nachricht. Tippe ihn nicht an – sonst öffnet sich auf dem iPhone Safari, und das ist nicht deine App vom Startbildschirm.',
      'Füge ihn hier ein.',
      'Du siehst dann, was dir geschickt wurde – und entscheidest, ob du es in deiner App speichern und ausprobieren möchtest.',
    ],
    placeholder: 'Link hier einfügen …',
    paste: 'Aus der Zwischenablage einfügen',
    go: 'Ansehen',
    invalid: 'Darin habe ich nichts zum Übernehmen gefunden. Prüfe, ob der ganze Link kopiert wurde.',
    close: 'Schließen',
  },
  en: {
    cta: 'Received something from someone',
    title: 'Paste something shared with you',
    intro: 'Did someone send you a resource, a tool, a place, an activity, a bridge, a source, a contact or a letter?',
    steps: [
      'Copy the link from the message. Do not tap it – on an iPhone that opens Safari, which is not your app from the home screen.',
      'Paste it here.',
      'You then see what was sent to you – and decide whether you want to save it in your app and try it.',
    ],
    placeholder: 'Paste the link here …',
    paste: 'Paste from clipboard',
    go: 'Look at it',
    invalid: 'I found nothing to take over in this. Check that the whole link was copied.',
    close: 'Close',
  },
};

/** "Etwas erhalten" — a button that opens the paste dialog; used wherever shared things can land. */
export function PasteSharedButton({ className = '' }: { className?: string }) {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`flex items-center gap-2 text-[13px] text-[var(--color-primary)] ${className}`} data-testid="paste-shared-open">
        <ClipboardPaste size={15} />
        {T.cta}
      </button>
      {open && <PasteSharedModal onClose={() => setOpen(false)} />}
    </>
  );
}

export function PasteSharedModal({ onClose }: { onClose: () => void }) {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [bad, setBad] = useState(false);

  function go(text = value) {
    const route = extractSharedRoute(text);
    if (!route) {
      setBad(true);
      return;
    }
    onClose();
    navigate(route);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setValue(text);
      if (extractSharedRoute(text)) go(text);
    } catch {
      // clipboard reading is not allowed everywhere – the field still works by long-press paste
    }
  }

  return (
    <Modal open onClose={onClose} title={T.title}>
      <div className="flex flex-col gap-3 pb-2" data-testid="paste-shared-modal">
        <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">{T.intro}</p>
        <ol className="flex flex-col gap-1.5 pl-5 list-decimal">
          {T.steps.map((s) => (
            <li key={s} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{s}</li>
          ))}
        </ol>
        <textarea
          className="input"
          rows={3}
          autoCapitalize="none"
          autoCorrect="off"
          placeholder={T.placeholder}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setBad(false);
          }}
          data-testid="paste-shared-input"
        />
        {bad && <p className="text-[12.5px] text-[var(--color-accent-clay)]">{T.invalid}</p>}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => go()} disabled={!value.trim()} data-testid="paste-shared-go">
            {T.go}
          </Button>
          <Button variant="secondary" icon={<ClipboardPaste size={15} />} onClick={pasteFromClipboard}>
            {T.paste}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {T.close}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
