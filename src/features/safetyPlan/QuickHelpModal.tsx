import { useState } from 'react';
import { shareOrCopy } from '../../services/shareOrCopy';
import { Send } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useT } from '../../i18n';
import { networkRepo } from '../safetyNet/networkRepo';

interface QuickHelpModalProps {
  open: boolean;
  onClose: () => void;
}

type Variant = 'kurz' | 'deutlich' | 'dringend';

export function QuickHelpModal({ open, onClose }: QuickHelpModalProps) {
  const t = useT();
  const [variant, setVariant] = useState<Variant>('kurz');
  const [message, setMessage] = useState(t.safetyPlan.quickHelpTexts.kurz);
  // "Hilfe holen uebernimmt 'Was hilft mir von dir' in die Nachricht an genau diese Person"
  const people = networkRepo.getAll().filter((e) => e.category === 'person' && e.whatHelps);
  const [personId, setPersonId] = useState<string | null>(null);
  const withPerson = (base: string, id: string | null) => {
    const p = people.find((x) => x.id === id);
    return p?.whatHelps ? `${base}\n${p.whatHelps}` : base;
  };

  function selectVariant(v: Variant) {
    // Choosing a variant always loads that template — that's the whole
    // point of tapping it. The previous version silently ignored variant
    // taps after any manual edit (an "edited" guard meant to protect
    // in-progress typing), which made switching look broken: the chip
    // would highlight but the text underneath never changed.
    setVariant(v);
    setMessage(withPerson(t.safetyPlan.quickHelpTexts[v], personId));
  }

  function selectPerson(id: string | null) {
    setPersonId(id);
    setMessage(withPerson(t.safetyPlan.quickHelpTexts[variant], id));
  }

  async function send() {
    await shareOrCopy({ text: message }, t.resources.shareCopied);
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
        {people.length > 0 && (
          <div>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{t.safetyPlan.quickHelpTo}</p>
            <div className="flex flex-wrap gap-2">
              <Chip selected={personId === null} onClick={() => selectPerson(null)}>
                {t.safetyPlan.quickHelpToNobody}
              </Chip>
              {people.map((p) => (
                <Chip key={p.id} selected={personId === p.id} onClick={() => selectPerson(p.id)}>
                  {p.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
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
