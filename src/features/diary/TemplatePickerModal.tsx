import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import {
  allDiaryTemplates,
  addCustomDiaryTemplate,
  updateCustomDiaryTemplate,
  removeCustomDiaryTemplate,
  applyTemplate,
  type DiaryTemplate,
  type DiaryTemplatePhase,
} from './diaryTemplates';

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (startingText: string) => void;
}

export function TemplatePickerModal({ open, onClose, onPick }: TemplatePickerModalProps) {
  const t = useT();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [, refresh] = useState(0);
  const [editing, setEditing] = useState<{ id?: string; name: string; questions: string[]; phase?: DiaryTemplatePhase } | null>(null);

  function bump() {
    refresh((n) => n + 1);
  }

  function pick(template: DiaryTemplate) {
    onPick(applyTemplate(template, isEn));
    onClose();
  }

  function startEditing(template?: DiaryTemplate) {
    setEditing(template ? { id: template.id, name: template.name, questions: [...template.questions, ''], phase: template.phase } : { name: '', questions: [''], phase: 'rueckblickend' });
  }

  function saveEditing() {
    if (!editing || !editing.name.trim()) return;
    const questions = editing.questions.map((q) => q.trim()).filter(Boolean);
    if (questions.length === 0) return;
    if (editing.id) {
      updateCustomDiaryTemplate(editing.id, editing.name.trim(), questions, editing.phase);
    } else {
      addCustomDiaryTemplate(editing.name.trim(), questions, editing.phase);
    }
    setEditing(null);
    bump();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? (editing.id ? t.diaryTemplates.editTitle : t.diaryTemplates.newTitle) : t.diaryTemplates.pickerTitle}>
      {!editing ? (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-[var(--color-text-faint)]">{t.diaryTemplates.pickerHint}</p>
          {(
            [
              { phase: 'vorausschauend' as const, title: t.diaryTemplates.phaseForward, hint: t.diaryTemplates.phaseForwardHint },
              { phase: 'rueckblickend' as const, title: t.diaryTemplates.phaseBackward, hint: t.diaryTemplates.phaseBackwardHint },
              { phase: undefined, title: t.diaryTemplates.phaseNone, hint: t.diaryTemplates.phaseNoneHint },
            ]
          ).map((group) => {
            const list = allDiaryTemplates().filter((tpl) => tpl.phase === group.phase);
            if (list.length === 0) return null;
            return (
              <div key={group.title} className="flex flex-col gap-2">
                <div className="mt-1">
                  <p className="text-[13px] font-semibold text-[var(--color-text)]">{group.title}</p>
                  <p className="text-[11.5px] text-[var(--color-text-faint)]">{group.hint}</p>
                </div>
                {list.map((template) => (
                  <div key={template.id} className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                    <button onClick={() => pick(template)} className="flex-1 text-left">
                      <p className="text-[14px] text-[var(--color-text)]">{isEn && template.nameEn ? template.nameEn : template.name}</p>
                      <p className="text-[12px] text-[var(--color-text-faint)]">
                        {t.diaryTemplates.questionCount.replace('{n}', String(template.questions.length))}
                        {template.source && !isEn ? ` · ${template.source}` : ''}
                      </p>
                    </button>
                    {!template.isBuiltin && (
                      <>
                        <button onClick={() => startEditing(template)} aria-label={t.common.edit} className="p-1.5 text-[var(--color-text-muted)]">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            removeCustomDiaryTemplate(template.id);
                            bump();
                          }}
                          aria-label={t.common.delete}
                          className="p-1.5 text-[var(--color-danger)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
          <Button fullWidth variant="secondary" icon={<Plus size={16} />} onClick={() => startEditing()}>
            {t.diaryTemplates.createOwnCta}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-[13px] text-[var(--color-primary)] -mt-2 w-fit">
            <ChevronLeft size={14} /> {t.diaryTemplates.pickerTitle}
          </button>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.diaryTemplates.nameLabel}</span>
            <input
              autoFocus
              className="input"
              placeholder={t.diaryTemplates.namePlaceholder}
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </label>
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{t.diaryTemplates.phaseLabel}</p>
            <div className="flex flex-wrap gap-2">
              {(['vorausschauend', 'rueckblickend'] as const).map((ph) => (
                <button
                  key={ph}
                  type="button"
                  aria-pressed={editing.phase === ph}
                  onClick={() => setEditing({ ...editing, phase: ph })}
                  className="rounded-full px-3.5 py-1.5 text-[13px] border"
                  style={editing.phase === ph ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-surface)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  {ph === 'vorausschauend' ? t.diaryTemplates.phaseForward : t.diaryTemplates.phaseBackward}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.diaryTemplates.questionsLabel}</span>
            {editing.questions.map((q, i) => (
              <input
                key={i}
                className="input"
                placeholder={t.diaryTemplates.questionPlaceholder}
                value={q}
                onChange={(e) => {
                  const next = [...editing.questions];
                  next[i] = e.target.value;
                  // Typing into the last (empty) field grows a fresh
                  // blank one underneath, so the person never has to
                  // hunt for an "add question" button mid-flow.
                  if (i === editing.questions.length - 1 && e.target.value.trim()) next.push('');
                  setEditing({ ...editing, questions: next });
                }}
              />
            ))}
          </label>
          <Button
            fullWidth
            onClick={saveEditing}
            disabled={!editing.name.trim() || editing.questions.every((q) => !q.trim())}
          >
            {t.common.save}
          </Button>
        </div>
      )}
    </Modal>
  );
}
