import { useState } from 'react';
import { Send } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useT } from '../../i18n';

interface QuickHelpModalProps {
  open: boolean;
  onClose: () => void;
}

type Variant = 'kurz' | 'deutlich' | 'dringend';

export function QuickHelpModal({ open, onClose }: QuickHelpModalProps) {
  const t = useT();
  const [variant, setVariant] = useState<Variant>('kurz');
  const [message, setMessage] = useState(t.safetyPlan.quickHelpTexts.kurz);

  function selectVariant(v: Variant) {
    // Choosing a variant always loads that template — that's the whole
    // point of tapping it. The previous version silently ignored variant
    // taps after any manual edit (an "edited" guard meant to protect
    // in-progress typing), which made switching look broken: the chip
    // would highlight but the text underneath never changed.
    setVariant(v);
    setMessage(t.safetyPlan.quickHelpTexts[v]);
  }

  async function send() {
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // person cancelled the share sheet - nothing to do
      }
    } else {
      await navigator.clipboard.writeText(message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t.safetyPlan.quickHelpTitle} subtitle={t.safetyPlan.quickHelpSubtitle}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(['kurz', 'deutlich', 'dringend'] as Variant[]).map((v) => (
            <Chip key={v} selected={variant === v} onClick={() => selectVariant(v)}>
              {t.safetyPlan.quickHelpVariants[v]}
            </Chip>
          ))}
        </div>
        <textarea
          className="input"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="text-[12px] text-[var(--color-text-faint)]">{t.safetyPlan.quickHelpHint}</p>
        <Button fullWidth icon={<Send size={16} />} onClick={send}>
          {typeof navigator.share === 'function' ? t.safetyPlan.quickHelpSend : t.safetyPlan.quickHelpCopy}
        </Button>
      </div>
    </Modal>
  );
}
