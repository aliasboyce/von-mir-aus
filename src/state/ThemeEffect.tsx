import { useEffect, useState } from 'react';
import { useSettings } from './SettingsContext';
import { customPalettesRepo, derivePaletteVars } from '../services/customPalettes';
import { BUILT_IN_PALETTE_IDS } from '../data/types';
import { ensureContrast, parseColor, toHex } from '../services/contrast';

const CUSTOM_PALETTE_VAR_NAMES = [
  '--color-bg',
  '--color-bg-soft',
  '--color-surface',
  '--color-surface-muted',
  '--color-border',
  '--color-border-strong',
  '--color-primary',
  '--color-primary-strong',
  '--color-primary-soft',
  '--color-primary-soft-text',
];

/**
 * Side-effect-only component: reflects the current theme + palette settings
 * onto <html data-theme> / <html data-palette>, which the CSS in
 * styles/tokens.css reads. Kept separate from SettingsContext so the
 * context itself has no DOM dependency (easier to test / reuse).
 */
export function ThemeEffect() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme() {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const resolved =
        settings.themeMode === 'system' ? (prefersDark ? 'dark' : 'light') : settings.themeMode;
      root.setAttribute('data-theme', resolved);
    }

    applyTheme();

    if (settings.themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
    }
  }, [settings.themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    const isBuiltIn = BUILT_IN_PALETTE_IDS.includes(settings.palette);

    if (isBuiltIn) {
      root.setAttribute('data-palette', settings.palette);
      // Clear any leftover inline overrides from a previously active custom palette.
      CUSTOM_PALETTE_VAR_NAMES.forEach((k) => root.style.removeProperty(k));
      return;
    }

    // Custom palette: apply the derived variables directly as inline
    // styles on <html>, bypassing the built-in [data-palette] stylesheet
    // rules entirely (there's no pre-written CSS for an arbitrary custom
    // id) while still funneling through the exact same CSS custom
    // properties the rest of the design system reads from.
    root.removeAttribute('data-palette');
    const custom = customPalettesRepo.getById(settings.palette);
    if (custom) {
      const vars = derivePaletteVars(custom);
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    }
  }, [settings.palette]);

  // Whatever the palette: text stays readable. Runs after the palette /
  // theme effects above; only sets a colour when the stylesheet's own value
  // would be hard to read on the colours it sits on.
  const resolvedTheme = useResolvedTheme();
  useEffect(() => {
    const root = document.documentElement;
    const READABLE = ['--color-text', '--color-text-muted', '--color-text-faint', '--color-primary', '--color-primary-strong', '--color-primary-soft-text'];
    // Undo our own earlier nudges first (a self-made palette's own inline
    // values come back from the palette itself, built-in ones from the stylesheet).
    const custom = BUILT_IN_PALETTE_IDS.includes(settings.palette) ? undefined : customPalettesRepo.getById(settings.palette);
    const customVars = custom ? derivePaletteVars(custom) : {};
    READABLE.forEach((k) => {
      const own = (customVars as Record<string, string>)[k];
      if (own) root.style.setProperty(k, own);
      else root.style.removeProperty(k);
    });
    const cs = getComputedStyle(root);
    const get = (k: string) => parseColor(cs.getPropertyValue(k));
    const bgs = ['--color-bg', '--color-bg-soft', '--color-surface', '--color-surface-muted'].map(get).filter((c): c is NonNullable<typeof c> => !!c);
    if (bgs.length === 0) return;
    function fix(name: string, min: number, against = bgs) {
      const fg = get(name);
      if (!fg) return;
      const next = ensureContrast(fg, against, min);
      if (next !== fg) root.style.setProperty(name, toHex(next));
    }
    fix('--color-text', 7);
    fix('--color-text-muted', 4.5);
    fix('--color-text-faint', 4);
    // primary is used both as text on the page and as a button fill under page-coloured text
    fix('--color-primary', 4.5);
    fix('--color-primary-strong', 4.5);
    const soft = get('--color-primary-soft');
    if (soft) fix('--color-primary-soft-text', 4.5, [soft]);
  }, [settings.palette, settings.themeMode, resolvedTheme]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-reduce-motion',
      settings.reduceMotion ? 'true' : 'false',
    );
  }, [settings.reduceMotion]);

  useEffect(() => {
    document.documentElement.setAttribute('data-minimal-hints', settings.minimalHints ? 'true' : 'false');
  }, [settings.minimalHints]);

  useEffect(() => {
    document.documentElement.setAttribute('data-simple', settings.simple ? 'true' : 'false');
  }, [settings.simple]);

  return null;
}

/**
 * Reactively resolves 'system' down to an actual 'light' | 'dark', so a
 * per-page palette override (see AppShell) can carry an explicit
 * data-theme alongside data-palette — both attributes need to sit on the
 * same wrapper element for the dark-mode palette CSS rules to match.
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const { settings } = useSettings();
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function update() {
      setResolved(settings.themeMode === 'system' ? (mq.matches ? 'dark' : 'light') : settings.themeMode);
    }
    update();
    if (settings.themeMode === 'system') {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
  }, [settings.themeMode]);

  return resolved;
}
