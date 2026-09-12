import { NavLink } from 'react-router-dom';
import { Home, Compass, GitBranch, Shield, KeyRound, LifeBuoy } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';

/**
 * Five destinations now — Zugang added as a new, persistent core page
 * (see project brief) connecting the app's existing features into one
 * guided thread, rather than one more disconnected mini-tool.
 *
 * "Nur jetzt"-Modus overhaul — while active, this shows a genuinely
 * reduced set (Check-in, Zugang, Orientieren, Krisenmodus) instead of
 * the full five-item nav, per the explicit "der Modus soll sich klar
 * wie ein bewusst reduzierter Modus anfühlen" requirement. This is the
 * primary enforcement point: NavRoute-level redirects (see AppShell)
 * back this up, but the nav itself not even offering the other
 * destinations is what makes the mode feel real rather than cosmetic.
 */
export function BottomNav() {
  const t = useT();
  const { settings } = useSettings();

  const fullItems = [
    { to: '/', label: t.nav.home, icon: Home, end: true },
    { to: '/zugang', label: t.zugang.navLabel, icon: KeyRound, end: false },
    { to: '/entdecken', label: t.nav.explore, icon: Compass, end: false },
    { to: '/bruecken', label: t.nav.bridges, icon: GitBranch, end: false },
    { to: '/sicherheit', label: t.nav.safety, icon: Shield, end: false },
  ];

  const nurJetztItems = [
    { to: '/', label: t.nav.home, icon: Home, end: true },
    { to: '/inneres-wetter', label: t.home.checkInCta, icon: Compass, end: false },
    { to: '/zugang', label: t.zugang.navLabel, icon: KeyRound, end: false },
    { to: '/krisenmodus', label: t.crisisMode.homeCta, icon: LifeBuoy, end: false },
  ];

  const items = settings.nurJetztMode ? nurJetztItems : fullItems;

  return (
    <nav
      className="fixed bottom-0 z-40 no-print"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 'var(--app-max-width-desktop)',
      }}
      aria-label={t.nav.mainNavigation}
    >
      <div
        className="w-full flex items-stretch justify-around bg-[var(--color-surface)]/95 backdrop-blur border-t border-[var(--color-border)]"
        style={{
          height: 'var(--nav-height)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-1 text-[12px] font-medium transition-colors',
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-faint)]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
