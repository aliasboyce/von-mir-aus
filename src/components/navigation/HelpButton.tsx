import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { HELP_CONTENT, type HelpKey } from './helpContent';
import { MarkdownLite } from '../shared/MarkdownLite';

/** A heading line is always its own block, so a `### Titel` directly followed by text on the next line still renders as heading + paragraph. */
function spaced(text: string): string {
  return text.replace(/^(#{1,3} .*)\n(?!\n)/gm, '$1\n\n');
}

interface HelpButtonProps {
  helpKey: HelpKey;
  /** Set when a page already uses TopBar's action slot for something
   * else (e.g. an export button) — renders the help button alongside
   * it in a row instead of needing every call site to build its own
   * flex wrapper. */
  className?: string;
}

/**
 * One small, consistent "?" affordance instead of scattering ad-hoc
 * explanations across every page differently — content lives centrally
 * in helpContent.ts so it's easy to review and keep in the app's actual
 * voice, not a generic tooltip generator. Deliberately page/feature
 * level, not a button-by-button annotation of the whole UI — that would
 * work against the calm, uncluttered feel the app is going for.
 */
export function HelpButton({ helpKey, className }: HelpButtonProps) {
  const t = useT();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [open, setOpen] = useState(false);
  const content = HELP_CONTENT[helpKey];
  if (!content) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t.common.help}
        className={
          className ??
          'w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-faint)] hover:bg-[var(--color-surface-muted)] transition-colors'
        }
      >
        <HelpCircle size={19} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={isEn ? content.titleEn : content.title}>
        <MarkdownLite text={spaced(isEn ? content.bodyEn : content.body)} />
      </Modal>
    </>
  );
}
