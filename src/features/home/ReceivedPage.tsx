import { TopBar } from '../../components/navigation/TopBar';
import { PasteSharedForm } from '../../components/shared/PasteSharedModal';
import { useSettings } from '../../state/SettingsContext';

/** Eigene Seite: „Etwas von jemandem erhalten“ – Link einfügen, ansehen, entscheiden. */
export function ReceivedPage() {
  const en = useSettings().settings.language === 'en';
  return (
    <div className="min-h-dvh pb-24">
      <TopBar />
      <div className="px-5 pt-2 animate-in">
        <p className="text-[34px] leading-none mb-2" aria-hidden="true">🎁</p>
        <h1 className="text-[24px] mb-1">{en ? 'Received something' : 'Etwas erhalten'}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5">{en ? 'Someone sent you something? Look at it here – you decide whether to keep it.' : 'Jemand hat dir etwas geschickt? Hier siehst du es an – und entscheidest, ob du es behältst.'}</p>
        <PasteSharedForm />
        <section className="mt-8 rounded-[var(--radius-lg)] px-4 py-4 border border-[var(--color-border)] bg-[var(--color-surface)]" data-testid="received-send-hint">
          <h2 className="text-[16px] mb-2">{en ? 'Want to send something yourself?' : 'Selbst etwas verschicken?'}</h2>
          <ol className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed list-decimal pl-5 space-y-1.5">
            <li>{en ? 'Open the entry you want to share (a resource, a card, a letter, a plan …).' : 'Öffne den Eintrag, den du weitergeben möchtest (Ressource, Karte, Brief, Plan …).'}</li>
            <li>{en ? 'Tap “Share” (or “Send”). The app makes a text or link for it.' : 'Tippe auf „Teilen“ bzw. „Verschicken“. Die App macht dafür einen Text oder Link.'}</li>
            <li>{en ? 'Pick where it goes – WhatsApp, Signal, mail, AirDrop … You choose; nothing is sent by the app itself.' : 'Such dir aus, wohin es geht – WhatsApp, Signal, Mail, AirDrop … Du entscheidest; die App verschickt selbst nichts.'}</li>
            <li>{en ? 'The other person opens it here under “Received something” and decides whether to keep it.' : 'Die andere Person öffnet es hier unter „Etwas erhalten“ und entscheidet, ob sie es behalten möchte.'}</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
