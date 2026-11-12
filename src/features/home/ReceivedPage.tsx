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
      </div>
    </div>
  );
}
