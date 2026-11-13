import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Shield, LifeBuoy, CalendarDays } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { scopeOf } from '../../services/scope';

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

const FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]):not([type=color]):not([type=file]), textarea, select, [contenteditable=""], [contenteditable="true"]';
const isField = (el: EventTarget | Element | null): boolean => el instanceof HTMLElement && el.matches(FIELD);

/**
 * „Das untere Menü fährt mit hoch und bleibt in der Mitte“: Wenn auf dem Handy die Tastatur aufgeht,
 * schieben Browser feste Leisten mit hoch – und lassen sie nach dem Schließen manchmal mitten im Bild
 * hängen. Darum ist das Menü weg, solange ein Eingabefeld Fokus hat oder die Tastatur offen ist,
 * und kommt danach an seinem festen Platz am Rand zurück.
 */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    const vv = window.visualViewport;
    const settle = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const shrunk = vv ? window.innerHeight - vv.height > 140 : false;
        const typing = isField(document.activeElement);
        setOpen(typing || shrunk);
        // iOS lässt die Seite manchmal seitlich/leicht verschoben zurück
        if (!typing && !shrunk && (window.scrollX !== 0 || (vv && (vv.offsetTop !== 0 || vv.offsetLeft !== 0)))) window.scrollTo(0, window.scrollY);
      }, 120);
    };
    const onIn = (e: FocusEvent) => { if (isField(e.target)) setOpen(true); };
    if (isField(document.activeElement)) setOpen(true);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', settle);
    vv?.addEventListener('resize', settle);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', settle);
      vv?.removeEventListener('resize', settle);
    };
  }, []);
  return open;
}

export function BottomNav() {
  const keyboardOpen = useKeyboardOpen();
  const t = useT();
  const { settings } = useSettings();
  const { pathname } = useLocation();

  const fullItems: NavItem[] = [
    { to: '/', label: t.nav.home, icon: Home, end: true, also: ['/zugang', '/bruecken', '/inneres-wetter'] },
    { to: '/sicherheit', label: t.nav.safety, icon: Shield, end: false },
    { to: '/alltag', label: t.nav.everyday, icon: CalendarDays, end: false, also: ['/kalender', '/parkbox'] },
    { to: '/entdecken', label: t.nav.explore, icon: Compass, end: false, also: ['/sicherheit/tagebuch'] },
  ];

  const nurJetztItems = [
    { to: '/', label: t.nav.home, icon: Home, end: true },
    { to: '/krisenmodus', label: t.crisisMode.homeCta, icon: LifeBuoy, end: false },
  ];

  const scope = scopeOf(settings);
  const coreItems: NavItem[] = [
    { to: '/', label: t.nav.home, icon: Home, end: true, also: ['/inneres-wetter', '/entdecken/tageskurve'] },
    { to: '/sicherheit/plan', label: t.crisisMode.safetyPlanCta, icon: Shield, end: false },
  ];
  const planItems: NavItem[] = fullItems.filter((i) => i.to !== '/entdecken' && i.to !== '/alltag');
  const items: NavItem[] = settings.nurJetztMode ? nurJetztItems : scope === 'core' ? coreItems : scope === 'plan' ? planItems : fullItems;

  return (
    <nav
      className="fixed bottom-0 z-40 no-print"
      style={{
        left: 0,
        right: 0,
        marginInline: 'auto',
        bottom: 0,
        width: '100%',
        maxWidth: 'var(--app-max-width-desktop)',
        display: keyboardOpen ? 'none' : undefined,
      }}
      data-testid="bottom-nav"
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
          // the diary lives in Explore (writing & review), not under Safety, although its address is older
          const diaryHere = pathname === '/sicherheit/tagebuch' || pathname.startsWith('/sicherheit/tagebuch/');
          const forceOff = diaryHere && to === '/sicherheit';
          return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-0.5 md:gap-1 text-[11px] md:text-[12px] font-medium transition-colors px-0.5',
                (isActive || alsoActive) && !forceOff ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-faint)]',
              ].join(' ')
            }
          >
            {({ isActive: active }) => {
              const isActive = (active || alsoActive) && !forceOff;
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
