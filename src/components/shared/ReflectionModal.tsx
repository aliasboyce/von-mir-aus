import { useState } from 'react';
import { X, Check, ChevronLeft } from 'lucide-react';
import { useT } from '../../i18n';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface ReflectionStep {
  id: string;
  /** 'intro': a static framing card, no input. 'question': a labeled,
   * auto-growing textarea. 'checklist': a set of toggleable chips,
   * stored joined by "|||" in the same string-based values record so
   * no caller needs a second, array-typed values object — the caller
   * splits it back into an array when saving if needed. 'custom': any
   * read-only content the caller needs to render (e.g. a list of
   * linked bridges) — no value stored, purely presentational. */
  type: 'intro' | 'question' | 'checklist' | 'custom';
  introText?: string;
  label?: string;
  placeholder?: string;
  options?: string[];
  /** Only for type 'custom' — rendered as-is, no wrapper card. */
  render?: () => React.ReactNode;
  /** Small note shown directly below this question's textarea (not a
   * separate step) — e.g. "there's no wrong answer here". */
  trailingHint?: string;
}

export interface ReflectionModalProps {
  /** Shown at the top of the modal (e.g. the strategy name, the value,
   * or the thought being worked with). */
  heading: string;
  headingStrikethrough?: boolean;
  steps: ReflectionStep[];
  /** 'single': every step rendered stacked on one screen (ValueCardModal's
   * original shape). 'stepped': one step at a time with a progress bar
   * and Weiter/Zurück (ProtectionReflectionModal's original shape). */
  mode: 'single' | 'stepped';
  initialValues: Record<string, string>;
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
  /** When provided and non-empty, shown instead of the step flow — a
   * calm "here's what you already saved" summary with an edit button,
   * matching what Denkmaschine's reframe needed (distinct from
   * ValueCard/Schutzstrategie, which always show the editable form). */
  savedSummary?: { label: string; value: string }[] | null;
  savedNote?: string;
  editCta?: string;
}

/**
 * Audit follow-up, Problem 3 — one shared component behind what were
 * three separately built, structurally near-identical "guided
 * reflection with save" modals (ValueCardModal,
 * ProtectionReflectionModal, Denkmaschine's reframe). A fix to the
 * save/display pattern now needs to happen once, not three times.
 * Handles both interaction shapes the three originals used: several
 * questions shown stepped one at a time with a progress bar (when
 * `steps.length > 1`), or a single screen (when there's just one
 * question) — so each caller's existing feel is preserved exactly.
 */
export function ReflectionModal({
  heading,
  headingStrikethrough,
  steps,
  mode,
  initialValues,
  onSave,
  onClose,
  savedSummary,
  savedNote,
  editCta,
}: ReflectionModalProps) {
  const t = useT();
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [stepIndex, setStepIndex] = useState(0);
  const [editing, setEditing] = useState(!savedSummary || savedSummary.length === 0);
  const [saved, setSaved] = useState(false);

  const stepped = mode === 'stepped';
  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function setValue(id: string, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  function handleSave() {
    onSave(values);
    setSaved(true);
    setEditing(false);
    window.setTimeout(() => setSaved(false), 2000);
  }

  function renderQuestion(step: ReflectionStep) {
    const val = values[step.id] ?? '';
    return (
      <label className="flex flex-col gap-1.5 mb-2" key={step.id}>
        {step.label && <span className="text-[14px] font-medium text-[var(--color-text)]">{step.label}</span>}
        <textarea
          className="input"
          rows={Math.min(8, Math.max(3, val.split('\n').length + 1))}
          style={{ resize: 'vertical' }}
          placeholder={step.placeholder}
          value={val}
          onChange={(e) => setValue(step.id, e.target.value)}
        />
        {step.trailingHint && <span className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{step.trailingHint}</span>}
      </label>
    );
  }

  function renderChecklist(step: ReflectionStep) {
    const raw = values[step.id] ?? '';
    const selected = raw ? raw.split('|||') : [];
    function toggle(opt: string) {
      const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
      setValue(step.id, next.join('|||'));
    }
    return (
      <div className="flex flex-col gap-1.5 mb-2" key={step.id}>
        {step.label && <span className="text-[14px] font-medium text-[var(--color-text)]">{step.label}</span>}
        <div className="flex flex-col gap-1.5 mt-1">
          {(step.options ?? []).map((opt) => {
            const isSel = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="flex items-center gap-2.5 text-left px-3 py-2 rounded-[var(--radius-md)]"
                style={{ background: isSel ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)' }}
              >
                <span
                  className="w-4 h-4 rounded-[4px] border flex-shrink-0 flex items-center justify-center"
                  style={{ borderColor: isSel ? 'var(--color-primary)' : 'var(--color-border-strong)', background: isSel ? 'var(--color-primary)' : 'transparent' }}
                >
                  {isSel && <Check size={11} className="text-[var(--color-surface)]" />}
                </span>
                <span className="text-[13px] text-[var(--color-text)]">{opt}</span>
              </button>
            );
          })}
        </div>
        {step.trailingHint && <span className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-1">{step.trailingHint}</span>}
      </div>
    );
  }

  const showSummary = savedSummary && savedSummary.length > 0 && !editing;

  return (
    <div className="fixed inset-0 z-[230] bg-[rgba(44,42,34,0.35)] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[440px] max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <p
            className="text-[18px] text-[var(--color-text)] flex-1 leading-relaxed"
            style={headingStrikethrough ? { textDecoration: 'line-through', textDecorationThickness: 2, color: 'var(--color-text-faint)' } : undefined}
          >
            {heading}
          </p>
          <button onClick={onClose} aria-label={t.common.close} className="p-1 text-[var(--color-text-faint)] flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {showSummary ? (
          <>
            <Card className="mb-4">
              {savedSummary!.map((item) => (
                <div key={item.label} className="mb-3 last:mb-0">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">{item.label}</p>
                  <p className="text-[14px] text-[var(--color-text)] leading-relaxed whitespace-pre-wrap break-words">{item.value}</p>
                </div>
              ))}
            </Card>
            {savedNote && (
              <p className="text-[12px] text-[var(--color-text-faint)] mb-4 flex items-center gap-1.5">
                <Check size={13} className="text-[var(--color-primary)]" /> {savedNote}
              </p>
            )}
            <Button fullWidth variant="secondary" onClick={() => setEditing(true)}>
              {editCta ?? t.common.edit}
            </Button>
          </>
        ) : (
          <>
            {stepped && (
              <div className="flex gap-1 mb-5">
                {steps.map((_, i) => (
                  <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= stepIndex ? 'var(--color-primary)' : 'var(--color-border)' }} />
                ))}
              </div>
            )}

            {stepped ? (
              <>
                {current.type === 'intro' ? (
                  <Card className="mb-5" style={{ background: 'var(--color-primary-soft)' }}>
                    <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{current.introText}</p>
                  </Card>
                ) : current.type === 'checklist' ? (
                  renderChecklist(current)
                ) : current.type === 'custom' ? (
                  <div className="mb-5">{current.render?.()}</div>
                ) : (
                  renderQuestion(current)
                )}
                <div className="flex gap-2 mt-3">
                  {stepIndex > 0 && (
                    <Button variant="ghost" onClick={() => setStepIndex((s) => s - 1)} icon={<ChevronLeft size={15} />}>
                      {t.common.back}
                    </Button>
                  )}
                  {!isLast ? (
                    <Button fullWidth onClick={() => setStepIndex((s) => s + 1)}>
                      {t.common.next}
                    </Button>
                  ) : (
                    <Button fullWidth onClick={handleSave} icon={saved ? <Check size={15} /> : undefined}>
                      {saved ? t.common.saved : t.common.save}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                {steps.map((step) => (step.type === 'intro' ? (
                  <Card className="mb-4" style={{ background: 'var(--color-primary-soft)' }} key={step.id}>
                    <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{step.introText}</p>
                  </Card>
                ) : step.type === 'checklist' ? (
                  renderChecklist(step)
                ) : step.type === 'custom' ? (
                  <div className="mb-4" key={step.id}>{step.render?.()}</div>
                ) : renderQuestion(step)))}
                <Button fullWidth onClick={handleSave} icon={saved ? <Check size={15} /> : undefined} className="mt-2">
                  {saved ? t.common.saved : t.common.save}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
