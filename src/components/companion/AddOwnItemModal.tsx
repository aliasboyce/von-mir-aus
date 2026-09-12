import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { customDistractionItemsRepo } from './customDistractionRepo';
import { OWN_TEXT_SOURCE } from './companionContentManagement';
import type { CustomDistractionItem } from '../../data/types';

interface AddOwnItemModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryLabel: string;
  onSaved?: () => void;
}

export function AddOwnItemModal({ open, onClose, categoryId, categoryLabel, onSaved }: AddOwnItemModalProps) {
  const t = useT();
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState('');

  function save() {
    if (!text.trim() || !source.trim()) return;
    const item: CustomDistractionItem = {
      id: createId('custom-item'),
      categoryId,
      text: text.trim(),
      answer: answer.trim() || undefined,
      source: source.trim(),
    };
    customDistractionItemsRepo.save(item);
    setText('');
    setAnswer('');
    setSource('');
    onSaved?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.customDistraction.addOwnToCategory.replace('{category}', categoryLabel)}>
      <div className="flex flex-col gap-4">
        <p className="text-[12px] text-[var(--color-text-faint)]">{t.customDistraction.contentGuidance}</p>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.customDistraction.textLabel}</span>
          <textarea autoFocus className="input" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.customDistraction.answerLabel}</span>
          <input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <span className="text-[11px] text-[var(--color-text-faint)]">{t.customDistraction.answerHint}</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.customDistraction.sourceLabel}</span>
          <input
            className="input"
            placeholder={t.customDistraction.sourcePlaceholder}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <button type="button" onClick={() => setSource(OWN_TEXT_SOURCE)} className="text-[12px] text-[var(--color-primary)] text-left">
            {t.companionContent.markAsOwnText}
          </button>
        </label>
        <Button fullWidth onClick={save} disabled={!text.trim() || !source.trim()}>
          {t.common.save}
        </Button>
      </div>
    </Modal>
  );
}
