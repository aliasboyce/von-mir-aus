import { useState } from 'react';
import { Info } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { MarkdownLite } from '../shared/MarkdownLite';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import type { Bi } from './wesenFunctions';

/** An "i" that explains, in the app's voice, why a Wesen function exists. Works from inside the overlays (z above 240). */
export function WesenInfoButton({ info, className }: { info: { title: Bi; body: Bi }; className?: string }) {
  const { settings } = useSettings();
  const t = useT();
  const en = settings.language === 'en';
  const [open, setOpen] = useState(false);
  const body = (en ? info.body.en : info.body.de).replace(/^(#{1,3} .*)\n(?!\n)/gm, '$1\n\n');
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${en ? info.title.en : info.title.de} – ${t.common.help}`}
        className={className ?? 'w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)]'}
      >
        <Info size={18} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={en ? info.title.en : info.title.de} zIndex={280}>
        <MarkdownLite text={body} />
      </Modal>
    </>
  );
}
