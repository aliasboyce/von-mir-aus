import { useState } from 'react';
import { Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { effectById } from '../../services/homeEffects';
import { PACK_PALETTE_ID, WORLD_PACKS, packColors, savePackPalette } from './worldPacks';
import { tint, WORLDS } from './worldData';
import { WorldScene } from './WorldScene';

/** „Welt-Pakete“: ein Klick = Welt + Farbe + Bewegung auf der Startseite. Alles bleibt einzeln änderbar, „Zurück“ stellt den vorigen Stand her. */
export function WorldPackPicker() {
  const { settings, updateSettings } = useSettings();
  const en = settings.language === 'en';
  const [undo, setUndo] = useState<Partial<typeof settings> | null>(null);

  function apply(id: string) {
    const pack = WORLD_PACKS.find((p) => p.id === id);
    if (!pack) return;
    setUndo({ world: settings.world, worldStill: settings.worldStill, palette: settings.palette, themeMode: settings.themeMode, homeEffect: settings.homeEffect, homeSkyOff: settings.homeSkyOff, worldPack: settings.worldPack });
    updateSettings(savePackPalette(pack));
  }

  return (
    <Card className="mb-3" padding="md" data-testid="world-pack-picker">
      <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{en ? 'World packages – one tap' : 'Welt-Pakete – ein Tipp'}</p>
      <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-3" data-hint>
        {en
          ? 'A world, matching colours (light or dark) and the motion on the start page, all at once. Afterwards you can still change each of them on its own – and “Back” restores how it was.'
          : 'Eine Welt, dazu passende Farben (hell oder dunkel) und die Bewegung auf der Startseite – alles auf einmal. Danach kannst du jedes einzeln ändern, und „Zurück“ stellt den vorigen Stand wieder her.'}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {WORLD_PACKS.map((p) => {
          const w = WORLDS.find((x) => x.id === p.world);
          const c = packColors(p);
          const sel = settings.worldPack === p.id && settings.world === p.world && settings.palette === PACK_PALETTE_ID;
          const fx = effectById(p.effect);
          return (
            <button key={p.id} type="button" onClick={() => apply(p.id)} aria-pressed={sel} data-testid={`pack-${p.id}`} className="text-left rounded-[var(--radius-md)] overflow-hidden border-2" style={{ borderColor: sel ? 'var(--color-primary)' : 'var(--color-border)', background: 'var(--color-surface)' }}>
              <div className="relative w-full" style={{ height: 64, background: c.bg }}>
                {w && (<>
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${tint(w.wash, c.dark ? 30 : 24)} 0%, transparent 100%)` }} />
                  <WorldScene id={w.id} />
                </>)}
                <span className="absolute left-2 bottom-1.5 h-2 w-10 rounded-full" style={{ background: c.primary }} aria-hidden />
                <span className="absolute right-1.5 bottom-1 text-[15px]" aria-hidden>{fx?.emoji}</span>
                {sel && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--color-primary)' }}><Check size={13} /></span>}
              </div>
              <div className="px-2.5 py-2">
                <p className="text-[13.5px] text-[var(--color-text)]">{en ? p.en.name : p.de.name}</p>
                <p className="text-[11.5px] text-[var(--color-text-muted)] leading-snug">{en ? p.en.sub : p.de.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
      {undo && (
        <button type="button" data-testid="pack-undo" onClick={() => { updateSettings(undo); setUndo(null); }} className="mt-3 text-[13px] text-[var(--color-primary)] underline underline-offset-2 py-1.5">
          {en ? 'Back to how it was' : 'Zurück zum vorigen Stand'}
        </button>
      )}
    </Card>
  );
}
