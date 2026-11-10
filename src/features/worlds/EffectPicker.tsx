import { Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { HomeEffectLayer } from '../../components/shared/HomeEffectLayer';
import { useSettings } from '../../state/SettingsContext';
import { HOME_EFFECTS, type HomeEffectDensity, type HomeEffectId } from '../../services/homeEffects';

const TXT = {
  de: {
    title: 'Bewegung auf der Startseite',
    intro: 'Was oben auf der Startseite leise fällt, schwebt oder funkelt. Du suchst aus, ob und was – unabhängig von der Welt. Bei „Bewegung reduzieren“ (Barrierefreiheit) bleibt es immer still.',
    density: 'Wie viel?',
    few: 'Wenig', normal: 'Normal', many: 'Viel',
    sky: 'Himmelsfarbe oben anzeigen',
    skySub: 'Der sanfte Farbverlauf je nach Tageszeit. Aus = schlicht.',
    reduced: 'Gerade ist „Bewegung reduzieren“ an – die Teilchen bleiben deshalb unsichtbar.',
  },
  en: {
    title: 'Motion on the start page',
    intro: 'What softly falls, floats or sparkles at the top of the start page. You choose whether and what – independent of the world. With “Reduce motion” (accessibility) it always stays still.',
    density: 'How much?',
    few: 'Few', normal: 'Normal', many: 'Many',
    sky: 'Show the sky colour at the top',
    skySub: 'The soft colour gradient by time of day. Off = plain.',
    reduced: '“Reduce motion” is on right now – the particles stay invisible because of that.',
  },
};

/** Settings card: pick the effect on the start page (or none), how much of it, and whether the sky colour shows. */
export function EffectPicker() {
  const { settings, updateSettings } = useSettings();
  const en = settings.language === 'en';
  const L = en ? TXT.en : TXT.de;
  const current = (settings.homeEffect ?? 'auto') as HomeEffectId;
  const density = (settings.homeEffectDensity ?? 'normal') as HomeEffectDensity;
  return (
    <Card className="mb-3" padding="md" data-testid="effect-picker">
      <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{L.title}</p>
      <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-3" data-hint>{L.intro}</p>
      {settings.reduceMotion && <p className="text-[12px] text-[var(--color-notice)] mb-3" role="note">{L.reduced}</p>}
      <div className="grid grid-cols-2 gap-2.5">
        {HOME_EFFECTS.map((e) => {
          const selected = current === e.id;
          const t = en ? e.en : e.de;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => updateSettings({ homeEffect: e.id })}
              aria-pressed={selected}
              data-testid={`effect-${e.id}`}
              className="text-left rounded-[var(--radius-md)] overflow-hidden border-2 transition-transform"
              style={{ borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)', background: 'var(--color-surface)', transform: selected ? 'scale(1.015)' : 'scale(1)' }}
            >
              <div className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 78, background: 'linear-gradient(180deg, var(--color-surface-muted) 0%, var(--color-bg) 100%)' }}>
                {e.id === 'auto' || e.id === 'off' ? <span className="text-[30px] opacity-80" aria-hidden>{e.emoji}</span> : <HomeEffectLayer kind={e.id} density="few" fall={78} />}
                {selected && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--color-primary)' }}><Check size={13} /></span>
                )}
              </div>
              <div className="px-2.5 py-2">
                <p className="text-[13.5px] text-[var(--color-text)]">{e.emoji} {t.name}</p>
                <p className="text-[11.5px] text-[var(--color-text-muted)] leading-snug">{t.sub}</p>
              </div>
            </button>
          );
        })}
      </div>
      {current !== 'auto' && current !== 'off' && (
        <div className="mt-4" data-testid="effect-density">
          <p className="text-[13px] text-[var(--color-text)] mb-1.5">{L.density}</p>
          <div className="inline-flex rounded-full border border-[var(--color-border-strong)] overflow-hidden" role="group">
            {(['few', 'normal', 'many'] as const).map((d) => (
              <button key={d} type="button" onClick={() => updateSettings({ homeEffectDensity: d })} aria-pressed={density === d} className="px-4 h-10 text-[13px]" style={density === d ? { background: 'var(--color-primary)', color: '#fff' } : { color: 'var(--color-text-muted)' }} data-testid={`effect-density-${d}`}>{L[d]}</button>
            ))}
          </div>
        </div>
      )}
      <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
        <input type="checkbox" className="mt-0.5" checked={!settings.homeSkyOff} onChange={(e) => updateSettings({ homeSkyOff: !e.target.checked })} data-testid="effect-sky" />
        <span>
          <span className="block text-[13px] text-[var(--color-text)]">{L.sky}</span>
          <span className="block text-[11.5px] text-[var(--color-text-faint)] leading-relaxed">{L.skySub}</span>
        </span>
      </label>
    </Card>
  );
}
