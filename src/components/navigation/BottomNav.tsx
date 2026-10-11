import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Shield, KeyRound, LifeBuoy } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';

/**
 * Three destinations: Jetzt (Check-in, Zugang and Brücken start from
 * there), Sicherheit and Entdecken (the map of everything). Zugang and
 * Brücken stay reachable from Jetzt and from the Entdecken map — fewer
 * doors at the bottom, nothing removed.
 *
 * "Nur jetzt"-Modus overhaul — while active, this shows a genuinely
 * reduced set (Check-in, Zugang, Orientieren, Krisenmodus) instead of
 * the full five-item nav, per the explicit "der Modus soll sich klar
 * wie ein bewusst reduzierter Modus anfühlen" requirement. This is the
 * primary enforcement point: NavRoute-level redirects (see AppShell)
 * back this up, but the nav itself not even offering the other
 * destinations is what makes the mode feel real rather than cosmetic.
 */
interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  end: boolean;
  also?: string[];
}

export function BottomNav() {
  const t = useT();
  const { settings } = useSettings();
  const { pathname } = useLocation();

  const fullItems: NavItem[] = [
    { to: '/', label: t.nav.home, icon: Home, end: true, also: ['/zugang', '/bruecken', '/inneres-wetter'] },
    { to: '/sicherheit', label: t.nav.safety, icon: Shield, end: false },
    { to: '/entdecken', label: t.nav.explore, icon: Compass, end: false },
  ];

  const nurJetztItems = [
    { to: '/', label: t.nav.home, icon: Home, end: true },
    { to: '/inneres-wetter', label: t.home.checkInCta, icon: Compass, end: false },
    { to: '/zugang', label: t.zugang.navLabel, icon: KeyRound, end: false },
    { to: '/krisenmodus', label: t.crisisMode.homeCta, icon: LifeBuoy, end: false },
  ];

  const items: NavItem[] = settings.nurJetztMode ? nurJetztItems : fullItems;

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
        {items.map(({ to, label, icon: Icon, end, also }) => {
          const alsoActive = !!also && also.some((p) => pathname === p || pathname.startsWith(`${p}/`));
          return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-0.5 md:gap-1 text-[11px] md:text-[12px] font-medium transition-colors px-0.5',
                isActive || alsoActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-faint)]',
              ].join(' ')
            }
          >
            {({ isActive: active }) => {
              const isActive = active || alsoActive;
              return (
                <>
                  <Icon size={20} className="md:hidden" strokeWidth={isActive ? 2.3 : 1.8} />
                  <Icon size={22} className="hidden md:block" strokeWidth={isActive ? 2.3 : 1.8} />
                  <span className="leading-none">{label}</span>
                </>
              );
            }}
          </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
