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

/**
 * "Eigenes erstellen funktioniert bei keiner Kategorie"-Fund — nothing
 * was actually broken in the save logic. Save just stayed disabled
 * until a required "source" field was filled, and the only way to
 * skip it was a button labelled "Mark as own app text" — wording
 * written for reviewing shared library content, not for someone
 * quietly adding a private item here. From the person's side, typing
 * their text and hitting a still-disabled Save button looked exactly
 * like the feature not working. For a private item there's nothing to
 * attribute in the first place, so the field and button are gone —
 * source is always OWN_TEXT_SOURCE.
 */
export function AddOwnItemModal({ open, onClose, categoryId, categoryLabel, onSaved }: AddOwnItemModalProps) {
  const t = useT();
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');

  function save() {
    if (!text.trim()) return;
    const item: CustomDistractionItem = {
      id: createId('custom-item'),
      categoryId,
      text: text.trim(),
      answer: answer.trim() || undefined,
      source: OWN_TEXT_SOURCE,
    };
    customDistractionItemsRepo.save(item);
    setText('');
    setAnswer('');
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
        <Button fullWidth onClick={save} disabled={!text.trim()}>
          {t.common.save}
        </Button>
      </div>
    </Modal>
  );
}
