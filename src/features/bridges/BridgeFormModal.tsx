import { useRef, useState } from 'react';
import { Plus, Upload, Tag, RefreshCw } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ImageSuggestionCarousel } from '../../components/shared/ImageSuggestionCarousel';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { useT } from '../../i18n';
import { resizeImageFile } from '../../services/imageResize';
import { ImageCropModal } from '../../components/shared/ImageCropModal';
import { suggestedImageOptions } from '../../services/suggestedImages';
import { BRIDGE_CATEGORY_META, BRIDGE_CATEGORY_ORDER, BRIDGE_CATEGORY_GROUPS_ORDER, BRIDGE_CATEGORY_GROUP_META } from './bridgeMeta';
import { createCustomCategoryStore } from '../../services/customCategories';
import { CONNECTION_ITEMS_DE, NEED_CATEGORY_GROUPS, OBSTACLES_DE } from '../zugang/zugangContent';
import { getCustomSuggestions, addCustomSuggestion } from '../zugang/zugangSuggestions';

const ALL_NEEDS_DE = NEED_CATEGORY_GROUPS.flatMap((g) => g.items);
import { SensoryModalityPicker } from '../../components/shared/SensoryModalityPicker';
import { ConditionsPicker } from './ConditionsPicker';
import type { Bridge, BridgeCategory } from '../../data/types';

const customCategoryStore = createCustomCategoryStore('bridge-custom-categories');

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
 * plan) keeps working unchanged since the id never changes. */
export function BridgeFormModal({ open, bridge, onClose, onSave, title }: BridgeFormModalProps) {
  const t = useT();
  const [draft, setDraft] = useState<Bridge | null>(bridge);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imageSuggestions, setImageSuggestions] = useState<string[]>(() =>
    suggestedImageOptions(bridge?.title ?? '', bridge?.category ?? 'sonstiges'),
  );
  const [customCategories, setCustomCategories] = useState(() => customCategoryStore.getAll());
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customObstacles, setCustomObstacles] = useState(() => getCustomSuggestions('obstacle'));
  const [addingObstacle, setAddingObstacle] = useState(false);
  const [newObstacleName, setNewObstacleName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync when a different bridge is opened (or the modal re-opens for "new").
  if (bridge?.id !== draft?.id && open) {
    setDraft(bridge);
    setImageSuggestions(suggestedImageOptions(bridge?.title ?? '', bridge?.category ?? 'sonstiges'));
  }

  if (!draft) return null;

  // "Mehrere Kategorien gleichzeitig auswaehlbar"-Auftrag
  const currentDraft = draft;
  const selectedCategories = currentDraft.categories ?? [currentDraft.category];
  function toggleCategory(id: string) {
    const next = selectedCategories.includes(id) ? selectedCategories.filter((c) => c !== id) : [...selectedCategories, id];
    if (next.length === 0) return; // always keep at least one selected
    const primary: BridgeCategory = next[0];
    setDraft({ ...currentDraft, categories: next, category: primary });
  }

  function categoryLabel(cat: BridgeCategory): string {
    if (BRIDGE_CATEGORY_META[cat]) return BRIDGE_CATEGORY_META[cat].label(t);
    return customCategories.find((c) => c.id === cat)?.label ?? cat;
  }

  const allCategoryChips = [
    ...BRIDGE_CATEGORY_ORDER.map((c) => ({ id: c as BridgeCategory, label: categoryLabel(c), icon: BRIDGE_CATEGORY_META[c].icon })),
    ...customCategories.map((c) => ({ id: c.id as BridgeCategory, label: c.label, icon: Tag })),
  ];

  function addCategory() {
    const name = newCategoryName.trim();
    if (!name || !draft) return;
    const created = customCategoryStore.add(name);
    setCustomCategories(customCategoryStore.getAll());
    setDraft({ ...draft, category: created.id });
    setNewCategoryName('');
    setAddingCategory(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    resizeImageFile(file, 1200)
      .then((dataUrl) => setCropSrc(dataUrl))
      .catch(() => {
        // rare (corrupt file, no canvas support) — leave the image unchanged
      });
  }

  function updateLevel(index: number, patch: Partial<{ title: string; description: string; energyLevel: 1 | 2 | 3 | undefined }>) {
    if (!draft) return;
    const levels = draft.levels.map((l, i) => (i === index ? { ...l, ...patch } : l));
    setDraft({ ...draft, levels });
  }

  function addLevel() {
    // A generous ceiling, not a tight technical cap — a bridge with a
    // very long staircase of small steps is a legitimate way to build
    // one, and there was no documented reason for the much lower limit
    // this used to have. Kept as SOME upper bound purely so the level
    // list in the UI stays scrollable/manageable rather than unbounded.
    if (!draft || draft.levels.length >= 12) return;
    setDraft({ ...draft, levels: [...draft.levels, { level: draft.levels.length + 1, title: '', description: '' }] });
  }

  function removeLevel(index: number) {
    if (!draft || draft.levels.length <= 1) return;
    setDraft({ ...draft, levels: draft.levels.filter((_, i) => i !== index) });
  }

  function submit() {
    if (!draft || !draft.title.trim()) return;
    const cleanedLevels = draft.levels.filter((l) => l.title.trim());
    if (cleanedLevels.length === 0) return;
    onSave({ ...draft, levels: cleanedLevels.map((l, i) => ({ ...l, level: i + 1 })) });
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bridges.titleLabel}</span>
          <input
            autoFocus
            className="input"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.resources.categoryLabel}</span>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.bridges.multiCategoryHint}</p>
          {BRIDGE_CATEGORY_GROUPS_ORDER.map((groupId) => (
            <div key={groupId} className="mb-1">
              <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">
                {BRIDGE_CATEGORY_GROUP_META[groupId].label(t)}
              </p>
              <div className="flex flex-wrap gap-2">
                {allCategoryChips
                  .filter(({ id }) => BRIDGE_CATEGORY_META[id]?.group === groupId)
                  .map(({ id, label, icon: Icon }) => (
                    <Chip key={id} type="button" selected={selectedCategories.includes(id)} onClick={() => toggleCategory(id)} icon={<Icon size={14} />}>
                      {label}
                    </Chip>
                  ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {allCategoryChips
              .filter(({ id }) => !BRIDGE_CATEGORY_META[id])
              .map(({ id, label, icon: Icon }) => (
                <Chip key={id} type="button" selected={selectedCategories.includes(id)} onClick={() => toggleCategory(id)} icon={<Icon size={14} />}>
                  {label}
                </Chip>
              ))}
            {!addingCategory ? (
              <Chip type="button" onClick={() => setAddingCategory(true)} icon={<Plus size={14} />}>
                {t.bridges.newCategory}
              </Chip>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  className="input"
                  style={{ width: 140 }}
                  placeholder={t.bridges.newCategoryPlaceholder}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="p-2 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex-shrink-0"
                >
                  <Plus size={15} />
                </button>
              </div>
            )}
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bridges.connectionTagsLabel}</span>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.bridges.connectionTagsHint}</p>
          <div className="flex flex-wrap gap-1.5">
            {CONNECTION_ITEMS_DE.map((v) => {
              const selected = (draft.connectionTags ?? []).includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      connectionTags: selected
                        ? (draft.connectionTags ?? []).filter((tag) => tag !== v)
                        : [...(draft.connectionTags ?? []), v],
                    })
                  }
                  className="px-2.5 py-1.5 rounded-full text-[12px]"
                  style={{
                    background: selected ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                    color: selected ? 'var(--color-surface)' : 'var(--color-text)',
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </label>

        <SensoryModalityPicker
          selected={draft.sensoryModalities ?? []}
          onChange={(ids) => setDraft({ ...draft, sensoryModalities: ids })}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bridges.linkedNeedsLabel}</span>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.bridges.linkedNeedsHint}</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_NEEDS_DE.map((v) => {
              const selected = (draft.linkedNeeds ?? []).includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      linkedNeeds: selected
                        ? (draft.linkedNeeds ?? []).filter((tag) => tag !== v)
                        : [...(draft.linkedNeeds ?? []), v],
                    })
                  }
                  className="px-2.5 py-1.5 rounded-full text-[12px]"
                  style={{
                    background: selected ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                    color: selected ? 'var(--color-surface)' : 'var(--color-text)',
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bridges.linkedObstaclesLabel}</span>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.bridges.linkedObstaclesHint}</p>
          <div className="flex flex-wrap gap-1.5">
            {[...OBSTACLES_DE, ...customObstacles].map((v) => {
              const selected = (draft.linkedObstacles ?? []).includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      linkedObstacles: selected
                        ? (draft.linkedObstacles ?? []).filter((tag) => tag !== v)
                        : [...(draft.linkedObstacles ?? []), v],
                    })
                  }
                  className="px-2.5 py-1.5 rounded-full text-[12px]"
                  style={{
                    background: selected ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                    color: selected ? 'var(--color-surface)' : 'var(--color-text)',
                  }}
                >
                  {v}
                </button>
              );
            })}
            {/* "Eigene Hindernisse ergaenzen, app-weit verfuegbar"-Auftrag
             * — saved through the same shared custom-suggestions store
             * Zugang's own obstacle step already uses, so anything
             * added here shows up there too (and vice versa), instead
             * of being a second, disconnected list. */}
            {addingObstacle ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  className="input"
                  style={{ width: 140, padding: '6px 10px', fontSize: 12 }}
                  value={newObstacleName}
                  onChange={(e) => setNewObstacleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newObstacleName.trim()) {
                      addCustomSuggestion('obstacle', newObstacleName.trim());
                      setCustomObstacles(getCustomSuggestions('obstacle'));
                      setDraft({ ...draft, linkedObstacles: [...(draft.linkedObstacles ?? []), newObstacleName.trim()] });
                      setNewObstacleName('');
                      setAddingObstacle(false);
                    }
                  }}
                  onBlur={() => {
                    if (newObstacleName.trim()) {
                      addCustomSuggestion('obstacle', newObstacleName.trim());
                      setCustomObstacles(getCustomSuggestions('obstacle'));
                      setDraft({ ...draft, linkedObstacles: [...(draft.linkedObstacles ?? []), newObstacleName.trim()] });
                    }
                    setNewObstacleName('');
                    setAddingObstacle(false);
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingObstacle(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]"
              >
                <Plus size={12} /> {t.zugang.ownSuggestionCta}
              </button>
            )}
          </div>
        </label>

        <ConditionsPicker
          selected={draft.conditions ?? []}
          onChange={(ids) => setDraft({ ...draft, conditions: ids })}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">Bild</span>
          <ImageSuggestionCarousel
            images={imageSuggestions}
            selected={draft.image}
            onSelect={(url) => setDraft({ ...draft, image: url })}
            ariaLabel={t.resources.pickThisImage}
          />
          <button
            type="button"
            onClick={() => setImageSuggestions(suggestedImageOptions(draft.title, draft.category))}
            className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
          >
            <RefreshCw size={13} /> {t.resources.moreSuggestions}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-1"
          >
            <Upload size={14} /> {t.resources.uploadOwnImage}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.resources.descriptionLabel}</span>
          <textarea
            className="input"
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </label>

        <div>
          <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2 block">{t.bridges.levelsLabel}</span>
          <div className="flex flex-col gap-2">
            {draft.levels.map((level, i) => (
              <div key={i} className="flex flex-col gap-1.5 border border-[var(--color-border)] rounded-[var(--radius-md)] p-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center text-[12px] text-[var(--color-text-muted)] flex-shrink-0">
                    {i + 1}
                  </span>
                  <input
                    className="input"
                    placeholder={t.bridges.levelTitlePlaceholder}
                    value={level.title}
                    onChange={(e) => updateLevel(i, { title: e.target.value })}
                  />
                  {draft.levels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLevel(i)}
                      aria-label={t.common.delete}
                      className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] flex-shrink-0 p-1"
                    >
                      ×
                    </button>
                  )}
                </div>
                <input
                  className="input"
                  placeholder={t.bridges.levelDescriptionPlaceholder}
                  value={level.description}
                  onChange={(e) => updateLevel(i, { description: e.target.value })}
                />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-[var(--color-text-faint)] mr-1">{t.bridges.levelEnergyLabel}</span>
                  {([1, 2, 3] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateLevel(i, { energyLevel: level.energyLevel === n ? undefined : n })}
                      className="px-2 py-1 rounded-full text-[11px] border"
                      style={{
                        borderColor: level.energyLevel === n ? 'var(--color-primary)' : 'var(--color-border)',
                        background: level.energyLevel === n ? 'var(--color-primary-soft)' : 'transparent',
                      }}
                    >
                      {'⚡'.repeat(n)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {draft.levels.length < 4 && (
            <button type="button" onClick={addLevel} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-2">
              <Plus size={14} /> {t.bridges.addLevel}
            </button>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{`${t.bridges.tip} ${t.common.optional}`}</span>
          <input className="input" value={draft.tip ?? ''} onChange={(e) => setDraft({ ...draft, tip: e.target.value })} />
        </label>

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
