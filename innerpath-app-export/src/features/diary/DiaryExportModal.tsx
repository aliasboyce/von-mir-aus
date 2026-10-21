import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useT } from '../../i18n';
import { DIARY_DEFAULT_CATEGORY_ID, DIARY_DEFAULT_CATEGORY_LABEL } from './diaryCategories';

export interface DiaryExportChoice {
  kind: 'entries' | 'review';
  categoryId: string | 'all';
  fromDate: string;
  toDate: string;
}

interface DiaryExportModalProps {
  open: boolean;
  onClose: () => void;
  categories: { id: string; label: string }[];
  earliestDate: string;
  latestDate: string;
  onExport: (choice: DiaryExportChoice) => void;
}

/**
 * One shared entry point for both export types the brief asked for —
 * raw diary entries (optionally filtered to one category and/or a date
 * range) and the aggregated Tagesrückblick view (always a date range,
 * since a review only makes sense grouped by day). Defaults the range
 * to the person's actual earliest/latest content so "export everything"
 * is just accepting the defaults, not calculating dates by hand.
 */
export function DiaryExportModal({ open, onClose, categories, earliestDate, latestDate, onExport }: DiaryExportModalProps) {
  const t = useT();
  const [kind, setKind] = useState<'entries' | 'review'>('entries');
  const [categoryId, setCategoryId] = useState<string | 'all'>('all');
  const [fromDate, setFromDate] = useState(earliestDate);
  const [toDate, setToDate] = useState(latestDate);

  function handleExport() {
    onExport({ kind, categoryId, fromDate, toDate });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.diary.exportTitle}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">{t.diary.exportKindLabel}</p>
          <div className="flex gap-2">
            <Chip selected={kind === 'entries'} onClick={() => setKind('entries')}>
              {t.diary.exportKindEntries}
            </Chip>
            <Chip selected={kind === 'review'} onClick={() => setKind('review')}>
              {t.diary.exportKindReview}
            </Chip>
          </div>
        </div>

        {kind === 'entries' && (
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">{t.diary.exportCategoryLabel}</p>
            <div className="flex flex-wrap gap-2">
              <Chip selected={categoryId === 'all'} onClick={() => setCategoryId('all')}>
                {t.common.all}
              </Chip>
              <Chip selected={categoryId === DIARY_DEFAULT_CATEGORY_ID} onClick={() => setCategoryId(DIARY_DEFAULT_CATEGORY_ID)}>
                {DIARY_DEFAULT_CATEGORY_LABEL}
              </Chip>
              {categories.map((c) => (
                <Chip key={c.id} selected={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">{t.diary.exportRangeLabel}</p>
          <div className="flex items-center gap-2">
            <input type="date" className="input flex-1" value={fromDate} onChange={(e) => setFromDate(e.target.value)} max={toDate} />
            <span className="text-[13px] text-[var(--color-text-faint)]">–</span>
            <input type="date" className="input flex-1" value={toDate} onChange={(e) => setToDate(e.target.value)} min={fromDate} />
          </div>
          {kind === 'entries' && <p className="text-[11px] text-[var(--color-text-faint)] mt-1.5">{t.diary.exportRangeHint}</p>}
        </div>

        <Button fullWidth onClick={handleExport}>
          {t.diary.exportCta}
        </Button>
      </div>
    </Modal>
  );
}
