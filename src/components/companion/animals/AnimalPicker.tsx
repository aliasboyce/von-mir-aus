import { ANIMALS, type AnimalConfig } from './animalRegistry';
import { AnimalFigure } from './AnimalFigure';

/** Still pictures of all animals – tapping one starts "Tier einrichten". No animation here: calm and light. */
export function AnimalPicker({ onPick, en }: { onPick: (animal: AnimalConfig) => void; en?: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-3" data-testid="animal-picker">
      {ANIMALS.map((a) => (
        <button key={a.id} type="button" onClick={() => onPick(a)} className="flex flex-col items-center gap-0.5" data-testid={`animal-pick-${a.id}`} aria-label={`${a.name} ${en ? 'set up' : 'einrichten'}`}>
          <AnimalFigure animal={a} size={58} inert age={1} />
          <span className="text-[10.5px] text-[var(--color-text-muted)] truncate max-w-full" style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
            {a.name}
          </span>
        </button>
      ))}
    </div>
  );
}
