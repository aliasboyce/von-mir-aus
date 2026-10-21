import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { isIosBrowserTab } from '../../services/sharedLinks';

const TXT = {
  de: {
    title: 'Du bist gerade im Browser, nicht in deiner App',
    body: 'Auf dem iPhone ist Safari eine andere gespeicherte Version als deine App vom Startbildschirm. Was du hier übernimmst, landet nicht dort, wo du sonst arbeitest.',
    steps: ['Link kopieren (Knopf unten).', 'Deine App vom Startbildschirm öffnen.', 'Dort auf „Etwas von jemandem erhalten“ tippen (bei Ressourcen und Brücken) bzw. bei Briefen auf „Brief erhalten“ – und den Link einfügen.'],
    copy: 'Link kopieren',
    copied: 'Kopiert',
  },
  en: {
    title: 'You are in the browser right now, not in your app',
    body: 'On an iPhone, Safari is a different stored version than your app from the home screen. What you take over here does not land where you usually work.',
    steps: ['Copy the link (button below).', 'Open your app from the home screen.', 'There tap “Received something from someone” (in resources and bridges) or “Receive a letter” for letters – and paste the link.'],
    copy: 'Copy link',
    copied: 'Copied',
  },
};

/** Shown on the import pages only when they were opened in an iPhone browser tab instead of the home-screen app. */
export function BrowserTabNotice() {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  const [copied, setCopied] = useState(false);
  if (!isIosBrowserTab()) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.prompt(T.copy, window.location.href);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] p-4 mb-5 border" style={{ background: 'var(--color-primary-soft)', borderColor: 'var(--color-primary)' }} data-testid="browser-tab-notice">
      <p className="text-[14.5px] font-medium text-[var(--color-text)] mb-1">{T.title}</p>
      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{T.body}</p>
      <ol className="flex flex-col gap-1 pl-5 list-decimal mb-3">
        {T.steps.map((s) => (
          <li key={s} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{s}</li>
        ))}
      </ol>
      <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] text-[var(--color-surface)]" style={{ background: 'var(--color-primary)' }}>
        {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? T.copied : T.copy}
      </button>
    </div>
  );
}
