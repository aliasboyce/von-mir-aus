import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { BottomNav } from '../components/navigation/BottomNav';
import { CompanionDock } from '../components/companion/CompanionDock';
import { FirstNameStep } from '../components/companion/FirstNameStep';
import { IntroFlow } from '../components/companion/IntroFlow';
import { AppTourOverlay } from '../components/companion/AppTourOverlay';
import { useSettings } from '../state/SettingsContext';
import { useResolvedTheme } from '../state/ThemeEffect';
import { useModalStack } from '../state/ModalStackContext';
import { useHeroCompanion } from '../state/HeroCompanionContext';
import { customPalettesRepo, derivePaletteVars } from '../services/customPalettes';
import { BUILT_IN_PALETTE_IDS } from '../data/types';
import { StorageErrorBanner } from './StorageErrorBanner';
import { IOSPrintFallbackModal } from '../components/shared/IOSPrintFallbackModal';
import { registerIOSPrintFallbackListener } from '../services/iosPrintFallbackBus';

/** Top-level section key used for per-page palette overrides — everything
 * under e.g. /sicherheit/* shares one override, not each sub-route separately. */
function sectionKeyFor(pathname: string): string {
  const segment = pathname.split('/')[1] ?? '';
  return segment ? `/${segment}` : '/';
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { anyModalOpen } = useModalStack();
  const { heroMounted } = useHeroCompanion();
  const resolvedTheme = useResolvedTheme();
  const [showPrintFallback, setShowPrintFallback] = useState(false);
  useEffect(() => registerIOSPrintFallbackListener(() => setShowPrintFallback(true)), []);

  // "Nur jetzt"-Modus overhaul — the nav itself only offering a reduced
  // set of destinations (see BottomNav) is the primary UX signal, but a
  // typed URL, an old bookmark, or a stale Link component elsewhere in
  // the app could still land someone outside the allowed set. This is
  // the backstop: while active, anything outside the explicit allowlist
  // redirects home rather than silently letting the "reduced" promise
  // be broken.
  const NUR_JETZT_ALLOWED_PREFIXES = ['/', '/inneres-wetter', '/zugang', '/krisenmodus'];
  useEffect(() => {
    if (!settings.nurJetztMode) return;
    const path = location.pathname;
    const isZugangReview = path.startsWith('/zugang/rueckblick');
    const allowed = !isZugangReview && NUR_JETZT_ALLOWED_PREFIXES.some((p) => (p === '/' ? path === '/' : path.startsWith(p)));
    if (!allowed) navigate('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, settings.nurJetztMode]);

  // Full-bleed flows (like the Inner Weather check-in) hide the bottom nav
  // so the moment feels contained rather than like "one more app screen".
  // A modal being open also hides it — this, not z-index tuning, is what
  // guarantees a modal's Save button can never end up visually covered by
  // the nav bar. During the guided tour, the tour's own bottom card is a
  // taller fixed element than BottomNav and already provides its own
  // "Weiter"/"Zurück" navigation — showing BottomNav underneath it at the
  // same time was redundant AND meant page content didn't get enough
  // bottom padding to clear the taller combined stack, which could leave
  // the bottom portion of a shorter page hidden behind the tour card
  // entirely (reported as "nothing shows after clicking Weiter").
  // Zugang's guided pass gets the same "contained moment" treatment as
  // Inner Weather — its own review list (/zugang/rueckblick) is a normal
  // browsable page and keeps the regular nav.
  const hideNav =
    location.pathname.startsWith('/inneres-wetter') ||
    (location.pathname === '/zugang') ||
    (location.pathname === '/krisenmodus') ||
    anyModalOpen ||
    settings.tourActive;
  // A hero (large, embedded) companion registers its own presence — see
  // HeroCompanionContext — so the floating one hides itself structurally
  // instead of via a hardcoded "is this the home route" check, which would
  // need to be remembered and updated for every future page that adds a
  // hero companion.
  // Hidden during the tour too — the tour overlay already shows its own
  // companion note, so leaving the floating dock visible at the same
  // time risked exactly the "doppeltes Wesen" (duplicate companion)
  // problem this app has been specifically fixed for elsewhere, and the
  // two bottom-fixed elements competed for the same screen space.
  const hideCompanionDock = heroMounted || settings.tourActive;

  // First launch, step 1: no choice yet — always "Verlässlich", just ask the
  // person's name. Changing to a different companion is still possible any
  // time afterward via Settings (CompanionPicker there, unchanged).
  if (!settings.companionChosen) {
    return (
      <div className="app-frame">
        <FirstNameStep onDone={() => {}} />
      </div>
    );
  }

  // First launch, step 2: the companion briefly explains the app, then
  // leads straight into the first Inner Weather check-in. Shown once ever.
  if (!settings.introSeen) {
    return (
      <div className="app-frame">
        <IntroFlow />
      </div>
    );
  }

  const pageOverride = settings.pagePalettes?.[sectionKeyFor(location.pathname)];
  const overrideIsBuiltIn = pageOverride && BUILT_IN_PALETTE_IDS.includes(pageOverride);
  const overrideCustomPalette = pageOverride && !overrideIsBuiltIn ? customPalettesRepo.getById(pageOverride) : undefined;

  // A per-page palette override needs both data-palette AND data-theme on
  // the same element for the dark-mode palette CSS rules (which target
  // both attributes together) to match — the outer <html> already carries
  // the app-wide versions of both. A custom (user-picked-colors) override
  // instead applies its derived variables directly as inline style, the
  // same mechanism ThemeEffect uses app-wide (see state/ThemeEffect.tsx).
  const overrideProps: Record<string, string> = {};
  if (overrideIsBuiltIn) {
    overrideProps['data-palette'] = pageOverride!;
    overrideProps['data-theme'] = resolvedTheme;
  }
  const overrideStyle = overrideCustomPalette ? derivePaletteVars(overrideCustomPalette) : undefined;

  return (
    <div className="app-frame">
      <main
        key={settings.reduceMotion ? undefined : location.pathname}
        className={settings.reduceMotion ? undefined : 'page-transition'}
        style={{
          paddingBottom: settings.tourActive
            ? 'calc(220px + env(safe-area-inset-bottom))'
            : hideNav
              ? 0
              : 'calc(var(--nav-height) + env(safe-area-inset-bottom))',
          ...overrideStyle,
        }}
        {...overrideProps}
      >
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      {!anyModalOpen && !hideCompanionDock && (
        <div className="no-print">
          <CompanionDock bottomOffset={hideNav ? 16 : 92} />
        </div>
      )}
      {!hideNav && <BottomNav />}
      {settings.tourActive && (
        <AppTourOverlay
          onClose={() => updateSettings({ tourActive: false })}
          onFinish={() => {
            updateSettings({ tourActive: false });
            navigate('/inneres-wetter');
          }}
        />
      )}
      <StorageErrorBanner />
      {showPrintFallback && <IOSPrintFallbackModal onClose={() => setShowPrintFallback(false)} />}
    </div>
  );
}
