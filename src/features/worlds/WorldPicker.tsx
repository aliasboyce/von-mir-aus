import { Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { tint, WORLDS, type WorldInfo } from './worldData';
import { WorldScene } from './WorldScene';

const TXT = {
  de: {
    title: 'Ästhetik-Welten',
    intro: 'Eine ganze Stimmung für die App: eine ruhige Landschaft im Hintergrund, auf Wunsch mit sanfter Bewegung. Die passenden Farben werden mitgewählt – Farbwelt und Hell/Dunkel änderst du danach trotzdem frei.',
    none: 'Keine Welt',
    noneSub: 'Schlicht, wie bisher.',
    still: 'Nur Bild, ohne Bewegung',
    stillSub: 'Die Landschaft bleibt still – ruhiger für Augen und Nervensystem.',
    chosen: 'Gewählt',
  },
  en: {
    title: 'Aesthetic worlds',
    intro: 'A whole mood for the app: a calm landscape in the background, gently moving if you like. The matching colours are picked along – you can still change colour world and light/dark freely afterwards.',
    none: 'No world',
    noneSub: 'Plain, as before.',
    still: 'Picture only, no motion',
    stillSub: 'The landscape stays still – calmer for eyes and nervous system.',
    chosen: 'Chosen',
  },
};

function Tile({ selected, onPick, label, sub, info, testId }: { selected: boolean; onPick: () => void; label: string; sub: string; info?: WorldInfo; testId: string }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      data-testid={testId}
      className="text-left rounded-[var(--radius-md)] overflow-hidden border-2 transition-transform"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)', background: 'var(--color-surface)', transform: selected ? 'scale(1.015)' : 'scale(1)' }}
    >
      <div className="relative w-full" style={{ height: 78, background: 'var(--color-bg)' }}>
        {info && (
          <>
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${tint(info.wash, info.id === 'nacht' ? 30 : 24)} 0%, transparent 100%)` }} />
            <WorldScene id={info.id} />
          </>
        )}
        {selected && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--color-primary)' }}>
            <Check size={13} />
          </span>
        )}
      </div>
      <div className="px-2.5 py-2">
        <p className="text-[13.5px] text-[var(--color-text)]">{label}</p>
        <p className="text-[11.5px] text-[var(--color-text-muted)] leading-snug">{sub}</p>
      </div>
    </button>
  );
}

/** Settings card: pick a complete aesthetic world (or none). Everything else stays individually adjustable. */
export function WorldPicker() {
  const { settings, updateSettings } = useSettings();
  const en = settings.language === 'en';
  const L = en ? TXT.en : TXT.de;
  return (
    <Card className="mb-3" padding="md" data-testid="world-picker">
      <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{L.title}</p>
      <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-3" data-hint>{L.intro}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <Tile testId="world-none" selected={!settings.world} onPick={() => updateSettings({ world: undefined })} label={L.none} sub={L.noneSub} />
        {WORLDS.map((w) => (
          <Tile
            key={w.id}
            testId={`world-${w.id}`}
            selected={settings.world === w.id}
            onPick={() => updateSettings({ world: w.id, palette: w.palette })}
            label={en ? w.en.name : w.de.name}
            sub={en ? w.en.sub : w.de.sub}
            info={w}
          />
        ))}
      </div>
      {settings.world && (
        <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
          <input type="checkbox" className="mt-0.5" checked={!!settings.worldStill} onChange={(e) => updateSettings({ worldStill: e.target.checked })} data-testid="world-still" />
          <span>
            <span className="block text-[13px] text-[var(--color-text)]">{L.still}</span>
            <span className="block text-[11.5px] text-[var(--color-text-faint)] leading-relaxed">{L.stillSub}</span>
          </span>
        </label>
      )}
    </Card>
  );
}
