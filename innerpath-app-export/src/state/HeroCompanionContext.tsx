import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface HeroCompanionContextValue {
  heroMounted: boolean;
  registerMounted: () => void;
  registerUnmounted: () => void;
}

const HeroCompanionContext = createContext<HeroCompanionContextValue | undefined>(undefined);

/**
 * Tracks whether a "hero" (large, embedded) companion is currently mounted
 * anywhere in the tree. AppShell reads this to decide whether to also
 * render the small floating companion - structurally impossible for both
 * to show at once, and correct automatically if a future page adds its own
 * hero companion, unlike checking location.pathname === '/' which would
 * need to be remembered and updated by hand for every new page.
 */
export function HeroCompanionProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <HeroCompanionContext.Provider
      value={{
        heroMounted: count > 0,
        registerMounted: () => setCount((c) => c + 1),
        registerUnmounted: () => setCount((c) => Math.max(0, c - 1)),
      }}
    >
      {children}
    </HeroCompanionContext.Provider>
  );
}

export function useHeroCompanion(): HeroCompanionContextValue {
  const ctx = useContext(HeroCompanionContext);
  if (!ctx) throw new Error('useHeroCompanion must be used within HeroCompanionProvider');
  return ctx;
}

/** Call from any page that renders a hero companion so the floating one
 * hides itself automatically for as long as this page is mounted. Pass
 * `active=false` (e.g. for the floating variant reusing the same
 * component) to make this a no-op — matches the same pattern as
 * useRegisterModalOpen so it's always safe to call unconditionally.
 * Deliberately useLayoutEffect, not useEffect: useEffect fires AFTER the
 * browser has already painted, so for one frame both the floating and
 * hero companion would be visible together — exactly the "doppelt beim
 * Start" flash that was reported. useLayoutEffect runs before paint,
 * closing that window entirely. */
export function useRegisterHeroCompanion(active: boolean) {
  const { registerMounted, registerUnmounted } = useHeroCompanion();
  const registered = useRef(false);

  useLayoutEffect(() => {
    if (active && !registered.current) {
      registerMounted();
      registered.current = true;
    } else if (!active && registered.current) {
      registerUnmounted();
      registered.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useLayoutEffect(
    () => () => {
      if (registered.current) registerUnmounted();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
