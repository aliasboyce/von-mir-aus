import { useState } from 'react';
import { Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { getAnyLichtwesen } from '../../components/companion/customLichtwesen';
import { useSettings } from '../../state/SettingsContext';
import { WESEN_PALETTE_ID, WESEN_PRESETS, saveWesenPalette, wesenColors } from '../../services/wesenColors';

/**
 * „Farben ans Wesen anpassen“: ein Tipp setzt die ganze App in die Farbe des Wesens (Hintergrund, Menü, Knöpfe).
 * Nichts anderes geht verloren – Farbwelten, Welten und Hell/Dunkel bleiben danach frei änderbar, und „Zurück“ stellt den vorigen Stand wieder her.
 */
export function WesenColorPicker() {
  const { settings, updateSettings } = useSettings();
  const en = settings.language === 'en';
  const being = getAnyLichtwesen(settings.selectedBrainId);
  const active = settings.palette === WESEN_PALETTE_ID ? (settings.wesenColorPreset ?? 4) : 0;
  const [undo, setUndo] = useState<{ palette: string; themeMode: typeof settings.themeMode; preset?: number } | null>(null);

  function apply(n: 1 | 2 | 3 | 4 | 5) {
    setUndo({ palette: settings.palette, themeMode: settings.themeMode, preset: settings.wesenColorPreset });
    const c = wesenColors(being.color, n);
    saveWesenPalette(being.color, n);
    updateSettings({ palette: WESEN_PALETTE_ID, wesenColorPreset: n, themeMode: c.dark ? 'dark' : 'light' });
  }

  return (
    <Card className="mb-3" padding="md" data-testid="wesen-color-picker">
      <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{en ? 'Colours matching my companion' : 'Farben passend zum Wesen'}</p>
      <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-3" data-hint>
        {en ? 'The whole app takes on the colour of your companion, so everything harmonises. Pick one of five looks. Afterwards you can still change colour world, light/dark and world freely.' : 'Die ganze App nimmt die Farbe deines Wesens an, damit alles zusammenpasst. Such dir eine von fünf Stimmungen aus. Danach kannst du Farbwelt, Hell/Dunkel und Welt trotzdem frei ändern.'}
      </p>
      <p className="flex items-center gap-2 text-[13px] text-[var(--color-text)] mb-3">
        <span className="w-5 h-5 rounded-full border border-[var(--color-border-strong)]" style={{ background: being.color }} aria-hidden />
        {en ? `Your companion: ${being.name}` : `Dein Wesen: ${being.name}`}
      </p>
      <div className="grid grid-cols-5 gap-2" role="group" data-testid="wesen-color-presets">
        {WESEN_PRESETS.map((p) => {
          const c = wesenColors(being.color, p.n);
          const sel = active === p.n;
          return (
            <button key={p.n} type="button" onClick={() => apply(p.n)} aria-pressed={sel} aria-label={`${p.n}: ${en ? p.en.name : p.de.name}`} data-testid={`wesen-color-${p.n}`} className="rounded-[var(--radius-md)] overflow-hidden border-2 text-left" style={{ borderColor: sel ? 'var(--color-primary)' : 'var(--color-border)' }}>
              <span className="block relative" style={{ background: c.bg, height: 62 }}>
                <span className="absolute left-1.5 right-1.5 top-2 h-2 rounded-full" style={{ background: c.primary, opacity: 0.9 }} />
                <span className="absolute left-1.5 top-6 h-1.5 w-7 rounded-full" style={{ background: c.dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.4)' }} />
                <span className="absolute left-1.5 right-1.5 bottom-1.5 h-3.5 rounded-md" style={{ background: c.primary }} />
                {sel && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center"><Check size={11} /></span>}
              </span>
              <span className="block px-1 py-1 text-[12px] text-center text-[var(--color-text)]">{p.n}</span>
            </button>
          );
        })}
      </div>
      <ul className="mt-2 text-[11.5px] text-[var(--color-text-faint)] leading-snug">
        {WESEN_PRESETS.map((p) => <li key={p.n}>{p.n} · <span className="text-[var(--color-text-muted)]">{en ? p.en.name : p.de.name}</span> – {en ? p.en.sub : p.de.sub}</li>)}
      </ul>
      {undo && (
        <button type="button" onClick={() => { updateSettings({ palette: undo.palette, themeMode: undo.themeMode, wesenColorPreset: undo.preset }); setUndo(null); }} className="mt-3 text-[13px] text-[var(--color-primary)] underline underline-offset-2 py-1" data-testid="wesen-color-undo">
          {en ? 'Back to how it was' : 'Zurück zum vorigen Stand'}
        </button>
      )}
    </Card>
  );
}
