import { Copy } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';

/** „Das steht schon da“ – ein leiser Hinweis, kein Verbot. */
export function DuplicateHint({ found, where }: { found?: string; where?: string }) {
  const { settings } = useSettings();
  if (!found) return null;
  const en = settings.language === 'en';
  const short = found.length > 60 ? `${found.slice(0, 60)}…` : found;
  return (
    <p className="flex items-start gap-1.5 text-[12.5px] text-[var(--color-text-muted)] mt-1.5 leading-snug" role="status" data-testid="duplicate-hint">
      <Copy size={13} className="flex-shrink-0 mt-[2px]" />
      <span>{en ? `This (or almost this) is already there${where ? ` ${where}` : ''}: “${short}”. You can still add it.` : `Das steht schon da${where ? ` ${where}` : ''}: „${short}“. Du kannst es trotzdem hinzufügen.`}</span>
    </p>
  );
}
