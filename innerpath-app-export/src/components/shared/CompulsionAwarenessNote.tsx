import { useT } from '../../i18n';

/**
 * Perspektiven-Audit follow-up — several functions that help most
 * people (repeating an exercise, journaling, reformulating a thought)
 * can become compulsive for someone prone to that pattern (Zwangsstörung
 * perspective). This is deliberately NOT a warning or a gate — just a
 * quiet, self-responsibility-framed note placed at the functions where
 * it's most relevant, matching the app's "du darfst, du musst nicht"
 * voice rather than a clinical caution.
 */
export function CompulsionAwarenessNote() {
  const t = useT();
  return (
    <p className="text-[11px] text-[var(--color-text-faint)] leading-relaxed mt-4">{t.common.compulsionAwarenessNote}</p>
  );
}
