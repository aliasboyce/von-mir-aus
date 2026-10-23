import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useT } from '../../i18n';

/**
 * "Mitteilungen des Wesens: besondere Darstellung"-Auftrag — real
 * function/orientation hints (as opposed to normal companion small-talk
 * bubbles) get a visually distinct, persistent card: a soft colored
 * border, its own icon, and it stays on screen until the person
 * actively taps "Verstanden" — not a timed toast that can be missed.
 * Dismissal is per-mount (not persisted forever) — the point is "stay
 * until acknowledged this time", not "never show again", since a
 * returning person may genuinely want the reminder again later.
 */
export function CompanionGuidanceCard({ text }: { text: string }) {
  const t = useT();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      className="flex gap-2.5 p-3.5 rounded-[var(--radius-lg)] mb-4 animate-in"
      style={{ border: '1.5px solid var(--color-accent-sun)', background: 'var(--color-primary-soft)' }}
    >
      <Sparkles size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent-sun)' }} />
      <div className="flex-1">
        <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-2">{text}</p>
        <button onClick={() => setDismissed(true)} className="text-[12px] font-medium" style={{ color: 'var(--color-primary)' }}>
          {t.common.understood}
        </button>
      </div>
    </div>
  );
}
