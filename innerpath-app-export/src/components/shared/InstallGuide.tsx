import { useState } from 'react';
import { useSettings } from '../../state/SettingsContext';
import { Button } from '../ui/Button';
import { canPromptInstall, isAndroid, isIos, promptInstall } from '../../services/testSupport';

type Platform = 'ios' | 'android' | 'desktop';

const TXT = {
  de: {
    why: 'Dann öffnet sich die App wie eine normale App – ohne Browserleiste, mit eigenem Symbol auf dem Startbildschirm. Und deine Daten bleiben verlässlicher erhalten. Alles bleibt auf diesem Gerät.',
    tabs: { ios: 'iPhone / iPad', android: 'Android', desktop: 'Computer' } as Record<Platform, string>,
    steps: {
      ios: [
        'Öffne die App in Safari. Kam der Link aus einer Nachricht oder einer anderen App? Dann kopiere ihn und füge ihn in Safari ein – nur dort geht die Installation.',
        'Tippe auf das Teilen-Symbol (Quadrat mit Pfeil nach oben) – auf dem iPhone unten in der Mitte, auf dem iPad oben rechts.',
        'Scrolle im Menü nach unten und tippe auf „Zum Home-Bildschirm“ (falls nicht sichtbar: „Mehr“).',
        'Tippe oben rechts auf „Hinzufügen“.',
        'Öffne die App ab jetzt über das neue Symbol auf deinem Startbildschirm.',
      ],
      android: [
        'Öffne die App in Chrome (oder deinem Browser).',
        'Tippe oben rechts auf das Menü (drei Punkte ⋮).',
        'Tippe auf „App installieren“ oder „Zum Startbildschirm hinzufügen“ (bei Samsung Internet: Menü ≡ → „Zum Startbildschirm hinzufügen“).',
        'Bestätige mit „Installieren“ bzw. „Hinzufügen“.',
        'Öffne die App ab jetzt über das neue Symbol auf deinem Startbildschirm.',
      ],
      desktop: [
        'Chrome oder Edge: Klicke rechts in der Adressleiste auf das Installations-Symbol (Bildschirm mit Pfeil) – oder Menü ⋮ → „App installieren“ / „Seite als App installieren“.',
        'Safari am Mac (ab Version 17): Menü „Ablage“ → „Zum Dock hinzufügen“.',
        'Firefox kann Webseiten nicht als App installieren: Setz ein Lesezeichen und lass den Tab offen.',
        'Öffne die App ab jetzt über das neue Symbol (Startmenü, Dock oder Desktop).',
      ],
    } as Record<Platform, string[]>,
    now: 'Jetzt installieren',
    stepWord: 'Schritt',
  },
  en: {
    why: 'Then the app opens like a normal app – without a browser bar, with its own icon on your home screen. And your data is kept more reliably. Everything stays on this device.',
    tabs: { ios: 'iPhone / iPad', android: 'Android', desktop: 'Computer' } as Record<Platform, string>,
    steps: {
      ios: [
        'Open the app in Safari. Did the link come from a message or another app? Then copy it and paste it into Safari – installing only works there.',
        'Tap the share symbol (square with an arrow pointing up) – on iPhone at the bottom centre, on iPad at the top right.',
        'Scroll down in the menu and tap "Add to Home Screen" (if you do not see it: "More").',
        'Tap "Add" at the top right.',
        'From now on open the app via the new icon on your home screen.',
      ],
      android: [
        'Open the app in Chrome (or your browser).',
        'Tap the menu at the top right (three dots ⋮).',
        'Tap "Install app" or "Add to home screen" (Samsung Internet: menu ≡ → "Add page to" → "Home screen").',
        'Confirm with "Install" or "Add".',
        'From now on open the app via the new icon on your home screen.',
      ],
      desktop: [
        'Chrome or Edge: click the install symbol on the right of the address bar (screen with an arrow) – or menu ⋮ → "Install app" / "Install page as app".',
        'Safari on Mac (version 17 and later): menu "File" → "Add to Dock".',
        'Firefox cannot install websites as apps: set a bookmark and keep the tab open.',
        'From now on open the app via the new icon (start menu, Dock or desktop).',
      ],
    } as Record<Platform, string[]>,
    now: 'Install now',
    stepWord: 'Step',
  },
};

/** "Zum Home-Bildschirm" – step by step for iPhone, Android and computer; the right tab is preselected. */
export function InstallGuide() {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  const [platform, setPlatform] = useState<Platform>(isIos() ? 'ios' : isAndroid() ? 'android' : 'desktop');
  const [offered, setOffered] = useState(canPromptInstall());

  return (
    <div data-testid="install-guide" className="text-left">
      <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed mb-3">{T.why}</p>
      <div className="flex gap-1.5 mb-3" role="tablist">
        {(['ios', 'android', 'desktop'] as Platform[]).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={platform === p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 rounded-full text-[12.5px] border ${platform === p ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-transparent' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'}`}
            data-testid={`install-tab-${p}`}
          >
            {T.tabs[p]}
          </button>
        ))}
      </div>
      {offered && platform !== 'ios' && (
        <div className="mb-3">
          <Button fullWidth variant="secondary" onClick={async () => { await promptInstall(); setOffered(canPromptInstall()); }} data-testid="install-now">
            {T.now}
          </Button>
        </div>
      )}
      <ol className="flex flex-col gap-2 pl-5 list-decimal" data-testid={`install-steps-${platform}`}>
        {T.steps[platform].map((s, i) => (
          <li key={i} className="text-[13.5px] text-[var(--color-text)] leading-relaxed">{s}</li>
        ))}
      </ol>
    </div>
  );
}
