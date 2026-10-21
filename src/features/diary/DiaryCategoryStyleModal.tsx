import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { DIARY_FONT_ORDER, DIARY_FONT_META } from './diaryFonts';
import { hasInsufficientContrast } from './diaryContrast';
import type { DiaryFont } from './diaryFonts';
import type { DiaryCategoryStyle } from './diaryCategoryStyles';

interface DiaryCategoryStyleModalProps {
  open: boolean;
  onClose: () => void;
  categoryLabel: string;
  current: DiaryCategoryStyle;
  onSave: (style: DiaryCategoryStyle) => void;
}

const SUGGESTED_COLORS = ['#2A2520', '#4A3F35', '#3E5C4A', '#3F5C7A', '#6E4A6E', '#7A4A3F', '#5C5C3F', '#4A5C6E'];

/**
 * Per-category (the app's "Tagebuch A/B/C" from the person's point of
 * view — see the diary categories store) font and color, opened from
 * the category itself so the setting always stays attached to the
 * category it was set for, not a separate global picker that could
 * drift out of sync with which category is even open.
 */
export function DiaryCategoryStyleModal({ open, onClose, categoryLabel, current, onSave }: DiaryCategoryStyleModalProps) {
  const t = useT();
  const [font, setFont] = useState<DiaryFont>(current.font ?? 'klar');
  const [color, setColor] = useState(current.color ?? '#2A2520');

  const lowContrast = hasInsufficientContrast(color);

  return (
    <Modal open={open} onClose={onClose} title={t.diary.styleModalTitle.replace('{category}', categoryLabel)}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">{t.diary.fontLabel}</p>
          <div className="flex flex-wrap gap-2">
            {DIARY_FONT_ORDER.map((f) => (
              <button
                key={f}
                onClick={() => setFont(f)}
                className="px-3 py-1.5 rounded-full text-[13px]"
                style={{
                  fontFamily: DIARY_FONT_META[f].family,
                  background: font === f ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                  color: font === f ? 'var(--color-surface)' : 'var(--color-text)',
                }}
              >
                {t.diary.fontNames[f]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">{t.diary.colorLabel}</p>
          <div className="flex flex-wrap gap-2 items-center">
            {SUGGESTED_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                className="w-8 h-8 rounded-full"
                style={{ background: c, outline: color === c ? '2.5px solid var(--color-primary)' : '1px solid var(--color-border)', outlineOffset: 2 }}
              />
            ))}
            <label className="w-8 h-8 rounded-full cursor-pointer relative overflow-hidden" style={{ background: color, outline: '1.5px dashed var(--color-border-strong)', outlineOffset: 2 }}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={t.diary.customColorLabel} />
            </label>
          </div>
        </div>

        <div
          className="rounded-[var(--radius-lg)] p-3 border border-[var(--color-border)]"
          style={{ fontFamily: DIARY_FONT_META[font].family, fontSize: DIARY_FONT_META[font].fontSize, lineHeight: DIARY_FONT_META[font].lineHeight, color }}
        >
          {t.diary.stylePreviewText}
        </div>

        {lowContrast && (
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-[var(--color-danger)] leading-relaxed">{t.diary.lowContrastWarning}</p>
          </div>
        )}

        <Button fullWidth onClick={() => onSave({ font, color })} disabled={lowContrast}>
          {t.common.save}
        </Button>
      </div>
    </Modal>
  );
}
