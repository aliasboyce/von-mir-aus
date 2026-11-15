import { ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';

/**
 * Ein einziger, ruhiger Einstieg: „Was brauche ich heute?“. Ein Tipp öffnet die Wege
 * (mich auffangen, Zustand & Zugang, verstehen, tun …) und die ganze Übersicht –
 * so liegen auf der Startseite nicht mehr mehrere Kästen nebeneinander.
 */
export function HomeWays({ isEn, onIntent }: { isEn: boolean; onIntent: () => void }) {
  return (
    <div className="mb-6" data-testid="home-ways">
      <button type="button" onClick={onIntent} className="block w-full text-left" data-testid="home-intent-open">
        <Card interactive padding="lg" className="flex items-center gap-3">
          <span className="text-[24px]" aria-hidden="true">🌿</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] text-[var(--color-text)]">{isEn ? 'What do I need today?' : 'Was brauche ich heute?'}</span>
            <span className="block text-[12.5px] text-[var(--color-text-faint)] mt-0.5">{isEn ? 'Tap – the ways open up. Nothing is wrong or right.' : 'Antippen – dann öffnen sich die Wege. Nichts ist falsch oder richtig.'}</span>
          </span>
          <ChevronRight size={18} className="text-[var(--color-text-faint)] flex-shrink-0" />
        </Card>
      </button>
    </div>
  );
}
