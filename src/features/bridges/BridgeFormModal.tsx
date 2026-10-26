import { useMemo, useRef, useState } from 'react';
import { Plus, Upload, RefreshCw, ChevronDown } from 'lucide-react';
import { EnergyLevelPicker } from '../../components/shared/EnergyLevelPicker';
import { Modal } from '../../components/ui/Modal';
import { ImageSuggestionCarousel } from '../../components/shared/ImageSuggestionCarousel';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { resizeImageFile } from '../../services/imageResize';
import { ImageCropModal } from '../../components/shared/ImageCropModal';
import { suggestedImageOptions } from '../../services/suggestedImages';
import { CONNECTION_ITEMS_DE, NEED_CATEGORY_GROUPS, OBSTACLES_DE } from '../zugang/zugangContent';
import { zl } from '../zugang/zugangEn';
import { getCustomSuggestions, addCustomSuggestion } from '../zugang/zugangSuggestions';
import { AccessChannelPicker } from '../../components/shared/AccessChannelPicker';
import { ConditionsPicker } from './ConditionsPicker';
import { StepExtrasEditor, loadStepExtraOptions } from '../resources/StepExtras';
import { resourcesRepo } from '../resources/resourcesRepo';
import { indicatorsFor } from '../wertekompass/valueIndicators';
import { BridgeExample } from './BridgeExample';
import { bridgeNeeds, needsForValues, categoryForValues, resourcesForNeeds } from './bridgeValues';
import type { Bridge, BridgeLevel } from '../../data/types';

function PickChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="px-3 py-2 rounded-full text-[13px] leading-tight"
      style={{
        background: selected ? 'var(--color-primary)' : 'var(--color-surface-muted)',
        color: selected ? 'var(--color-surface)' : 'var(--color-text)',
      }}
    >
      {children}
    </button>
  );
}

/** A folded section: summary line always visible, content on tap. */
function Fold({ title, summary, defaultOpen = false, children }: { title: string; summary?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="group rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3.5 py-3">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-[14px] font-medium text-[var(--color-text)]">{title}</span>
          {summary && <span className="block text-[12px] text-[var(--color-text-faint)] mt-0.5 truncate">{summary}</span>}
        </span>
        <ChevronDown size={18} className="text-[var(--color-text-faint)] flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </details>
  );
}

interface BridgeFormModalProps {
  open: boolean;
  bridge: Bridge | null;
  onClose: () => void;
  onSave: (bridge: Bridge) => void;
  title: string;
}

/** Create AND edit share this exact form — a bridge passed in with existing
 * data is edited in place; save always writes the full object back, so
 * anything already linking to this bridge by id (diary entries, safety
 * plan) keeps working unchanged since the id never changes.
 *
 * Order follows the idea of a bridge: WHERE does it lead (Wert / Lebensrichtung,
 * with guiding questions) → what is behind it (Bedürfnisse, folded) → the
 * SCHRITTE, each with the resources that carry it → everything else, folded. */
export function BridgeFormModal({ open, bridge, onClose, onSave, title }: BridgeFormModalProps) {
  const t = useT();
  const b = t.bridges;
  const [draft, setDraft] = useState<Bridge | null>(bridge);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imageSuggestions, setImageSuggestions] = useState<string[]>(() =>
    suggestedImageOptions(bridge?.title ?? '', bridge?.category ?? 'sonstiges'),
  );
  const [customObstacles, setCustomObstacles] = useState(() => getCustomSuggestions('obstacle'));
  const [addingObstacle, setAddingObstacle] = useState(false);
  const [newObstacleName, setNewObstacleName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // only existing things can be attached to a step — read again whenever the form opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const extraOptions = useMemo(() => loadStepExtraOptions(), [open]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allResources = useMemo(() => resourcesRepo.getAll(), [open]);

  // Re-sync when a different bridge is opened (or the modal re-opens for "new").
  if (bridge?.id !== draft?.id && open) {
    setDraft(bridge);
    setImageSuggestions(suggestedImageOptions(bridge?.title ?? '', bridge?.category ?? 'sonstiges'));
  }

  if (!draft) return null;
  const currentDraft = draft;
  const startsBlank = !bridge?.title?.trim();
  const isBlank = !currentDraft.title.trim() && !(currentDraft.connectionTags ?? []).length && currentDraft.levels.every((l) => !l.title.trim());
  const values = currentDraft.connectionTags ?? [];
  const needs = currentDraft.linkedNeeds ?? [];
  const suggestedNeeds = needsForValues(values);
  const suggestions = resourcesForNeeds(bridgeNeeds(currentDraft), allResources).map((x) => ({ id: x.resource.id, title: x.resource.title, kind: x.kind }));
  const ideas = Array.from(new Set(values.flatMap((v) => indicatorsFor(v)?.indicators ?? []))).slice(0, 6);

  function toggleIn(list: string[], v: string): string[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImageFile(file, 1200)
      .then((dataUrl) => setCropSrc(dataUrl))
      .catch(() => {
        // rare (corrupt file, no canvas support) — leave the image unchanged
      });
  }

  function updateStep(index: number, patch: Partial<BridgeLevel>) {
    const levels = currentDraft.levels.map((l, i) => (i === index ? { ...l, ...patch } : l));
    setDraft({ ...currentDraft, levels });
  }

  function addStep(titleText = '') {
    // A generous ceiling, not a tight technical cap — a long staircase of small steps is a
    // legitimate way to build a bridge. Some upper bound just keeps the list manageable.
    if (currentDraft.levels.length >= 12) return;
    setDraft({ ...currentDraft, levels: [...currentDraft.levels, { level: currentDraft.levels.length + 1, title: titleText, description: '' }] });
  }

  function applyIdea(text: string) {
    const emptyIndex = currentDraft.levels.findIndex((l) => !l.title.trim());
    if (emptyIndex >= 0) updateStep(emptyIndex, { title: text });
    else addStep(text);
  }

  function removeStep(index: number) {
    if (currentDraft.levels.length <= 1) return;
    setDraft({ ...currentDraft, levels: currentDraft.levels.filter((_, i) => i !== index) });
  }

  function submit() {
    if (!currentDraft.title.trim()) return;
    const cleanedSteps = currentDraft.levels.filter((l) => l.title.trim());
    if (cleanedSteps.length === 0) return;
    onSave({
      ...currentDraft,
      // the old grouping category stays on the record for older places, derived from the values
      category: values.length > 0 ? categoryForValues(values, currentDraft.category) : currentDraft.category,
      levels: cleanedSteps.map((l, i) => ({ ...l, level: i + 1 })),
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Fold title={b.exampleTitle} summary={b.exampleSummary} defaultOpen={startsBlank}>
          <BridgeExample canApply={isBlank} onApply={(patch) => setDraft({ ...currentDraft, ...patch })} />
        </Fold>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{b.titleLabel}</span>
          <input autoFocus className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.resources.descriptionLabel}</span>
          <textarea className="input" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>

        {/* 1 — where does it lead */}
        <section className="flex flex-col gap-2.5">
          <div>
            <h3 className="text-[16px] text-[var(--color-text)]">{b.connectionTagsLabel}</h3>
            <p data-hint className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mt-0.5">{b.connectionTagsHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CONNECTION_ITEMS_DE.map((v) => (
              <PickChip key={v} selected={values.includes(v)} onClick={() => setDraft({ ...draft, connectionTags: toggleIn(values, v) })}>
                {v}
              </PickChip>
            ))}
          </div>
          <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-primary-soft)' }}>
            <p className="text-[12.5px] font-medium text-[var(--color-text)] mb-1.5">{b.guideTitle}</p>
            <ul className="text-[13px] text-[var(--color-text-muted)] leading-relaxed list-disc pl-4 mb-2.5">
              <li>{b.guideValue1}</li>
              <li>{b.guideValue2}</li>
              <li>{b.guideValue3}</li>
            </ul>
            <textarea className="input" rows={3} placeholder={b.reflectionPlaceholder} aria-label={b.reflectionLabel} value={draft.reflection ?? ''} onChange={(e) => setDraft({ ...draft, reflection: e.target.value })} />
          </div>
        </section>

        {/* 2 — which needs are behind it (folded: there are many) */}
        <Fold
          title={b.linkedNeedsLabel}
          summary={needs.length > 0 ? needs.join(', ') : suggestedNeeds.length > 0 ? b.needsFromValues.replace('{n}', String(suggestedNeeds.length)) : b.needsNone}
        >
          <p data-hint className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed -mt-1">{b.linkedNeedsHint}</p>
          {suggestedNeeds.length > 0 && (
            <div>
              <p className="text-[12.5px] font-medium text-[var(--color-text)] mb-1.5">{b.needsSuggested}</p>
              <div className="flex flex-wrap gap-2">
                {suggestedNeeds.map((n) => (
                  <PickChip key={n} selected={needs.includes(n)} onClick={() => setDraft({ ...draft, linkedNeeds: toggleIn(needs, n) })}>
                    {n}
                  </PickChip>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-[12.5px] font-medium text-[var(--color-text)]">{b.needsAll}</p>
            {NEED_CATEGORY_GROUPS.map((g) => {
              const chosen = g.items.filter((n) => needs.includes(n)).length;
              return (
                <details key={g.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2">
                  <summary className="cursor-pointer list-none text-[13px] text-[var(--color-text)] flex items-center gap-2">
                    <span aria-hidden="true">{g.emoji}</span>
                    {g.label}
                    {chosen > 0 && <span className="text-[11.5px] text-[var(--color-primary)]">· {chosen}</span>}
                  </summary>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {g.items.map((n) => (
                      <PickChip key={n} selected={needs.includes(n)} onClick={() => setDraft({ ...draft, linkedNeeds: toggleIn(needs, n) })}>
                        {n}
                      </PickChip>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </Fold>

        {/* 3 — the steps, each with its resources */}
        <section className="flex flex-col gap-3">
          <div>
            <h3 className="text-[16px] text-[var(--color-text)]">{b.levelsLabel}</h3>
            <p data-hint className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed mt-0.5">{b.stepsHint}</p>
          </div>
          {ideas.length > 0 && (
            <div>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{b.stepIdeas}</p>
              <div className="flex flex-wrap gap-1.5">
                {ideas.map((idea) => (
                  <button key={idea} type="button" onClick={() => applyIdea(idea)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)] text-left">
                    <Plus size={11} className="flex-shrink-0" /> {idea}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {draft.levels.map((level, i) => (
              <div key={i} className="flex flex-col gap-2 border border-[var(--color-border)] rounded-[var(--radius-lg)] p-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center text-[13px] text-[var(--color-text-muted)] flex-shrink-0">{i + 1}</span>
                  <input className="input" placeholder={b.levelTitlePlaceholder} value={level.title} onChange={(e) => updateStep(i, { title: e.target.value })} />
                  {draft.levels.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)} aria-label={t.common.delete} className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] flex-shrink-0 p-1 text-[18px] leading-none">
                      ×
                    </button>
                  )}
                </div>
                <input className="input" placeholder={b.levelDescriptionPlaceholder} value={level.description} onChange={(e) => updateStep(i, { description: e.target.value })} />
                <StepExtrasEditor value={level.extras} onChange={(v) => updateStep(i, { extras: v })} options={extraOptions} withSkills suggestions={suggestions} />
                <div>
                  <span className="block text-[11.5px] text-[var(--color-text-faint)] mb-1">{b.levelEnergyLabel}</span>
                  <EnergyLevelPicker value={level.energyLevel} onChange={(v) => updateStep(i, { energyLevel: v })} />
                </div>
              </div>
            ))}
          </div>
          {draft.levels.length < 12 && (
            <button type="button" onClick={() => addStep()} className="flex items-center gap-1.5 text-[14px] text-[var(--color-primary)]">
              <Plus size={15} /> {b.addLevel}
            </button>
          )}
        </section>

        {/* 4 — everything else, folded */}
        <Fold title={b.moreTitle} summary={b.moreSummary}>
          <div>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{b.linkedObstaclesLabel}</span>
            <p data-hint className="text-[12px] text-[var(--color-text-faint)] mb-2">{b.linkedObstaclesHint}</p>
            <div className="flex flex-wrap gap-2">
              {[...OBSTACLES_DE, ...customObstacles].map((v) => (
                <PickChip key={v} selected={(draft.linkedObstacles ?? []).includes(v)} onClick={() => setDraft({ ...draft, linkedObstacles: toggleIn(draft.linkedObstacles ?? [], v) })}>
                  {zl(v)}
                </PickChip>
              ))}
              {/* Eigene Hindernisse ergänzen, app-weit verfügbar — saved through the shared
               * custom-suggestions store Zugang's own obstacle step uses, too. */}
              {addingObstacle ? (
                <input
                  autoFocus
                  className="input"
                  style={{ width: 160, padding: '6px 10px', fontSize: 13 }}
                  value={newObstacleName}
                  onChange={(e) => setNewObstacleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  onBlur={() => {
                    const name = newObstacleName.trim();
                    if (name) {
                      addCustomSuggestion('obstacle', name);
                      setCustomObstacles(getCustomSuggestions('obstacle'));
                      setDraft({ ...draft, linkedObstacles: [...(draft.linkedObstacles ?? []), name] });
                    }
                    setNewObstacleName('');
                    setAddingObstacle(false);
                  }}
                />
              ) : (
                <button type="button" onClick={() => setAddingObstacle(true)} className="flex items-center gap-1 px-3 py-2 rounded-full text-[13px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]">
                  <Plus size={12} /> {t.zugang.ownSuggestionCta}
                </button>
              )}
            </div>
          </div>

          <ConditionsPicker selected={draft.conditions ?? []} onChange={(ids) => setDraft({ ...draft, conditions: ids })} />

          <AccessChannelPicker selected={draft.accessChannels ?? []} onChange={(ids) => setDraft({ ...draft, accessChannels: ids })} />

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{`${b.tip} ${t.common.optional}`}</span>
            <input className="input" value={draft.tip ?? ''} onChange={(e) => setDraft({ ...draft, tip: e.target.value })} />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{b.imageLabel}</span>
            <ImageSuggestionCarousel images={imageSuggestions} selected={draft.image} onSelect={(url) => setDraft({ ...draft, image: url })} ariaLabel={t.resources.pickThisImage} />
            <button type="button" onClick={() => setImageSuggestions(suggestedImageOptions(draft.title, draft.category))} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]">
              <RefreshCw size={13} /> {t.resources.moreSuggestions}
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-1">
              <Upload size={14} /> {t.resources.uploadOwnImage}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </Fold>

        <Button type="submit" fullWidth data-sound="complete">
          {t.common.save}
        </Button>
      </form>
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={(cropped) => {
            setDraft((d) => (d ? { ...d, image: cropped } : d));
            setCropSrc(null);
          }}
        />
      )}
    </Modal>
  );
}
