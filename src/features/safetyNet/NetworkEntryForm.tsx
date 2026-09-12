import { useMemo, useRef, useState } from 'react';
import { Plus, X, Upload } from 'lucide-react';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { resizeImageFile } from '../../services/imageResize';
import { PhotoPositioner } from './PhotoPositioner';
import { HELPS_WITH_ORDER, helpsWithLabel, categoryLabel } from './networkMeta';
import { getIcon, ICON_PICKER_ORDER } from '../../components/icons/networkIcons';
import { networkPaletteStore } from './networkCategories';
import { createId } from '../../services/storage/repository';
import { resourcesRepo } from '../resources/resourcesRepo';
import type { HelpsWith, NetworkCategoryConfig, NetworkEntry } from '../../data/types';

interface NetworkEntryFormProps {
  draft: NetworkEntry;
  onChange: (next: NetworkEntry) => void;
  categories: NetworkCategoryConfig[];
  onAddCategory: (category: NetworkCategoryConfig) => void;
  allPersonEntries: NetworkEntry[];
  submitLabel: string;
  onSubmit: () => void;
  onCancel?: () => void;
}

export function NetworkEntryForm({
  draft,
  onChange,
  categories,
  onAddCategory,
  allPersonEntries,
  submitLabel,
  onSubmit,
  onCancel,
}: NetworkEntryFormProps) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const resources = useMemo(() => resourcesRepo.getAll(), []);
  const activePalette = useMemo(() => {
    const palettes = networkPaletteStore.getAllPalettes();
    return palettes.find((p) => p.id === networkPaletteStore.getActivePaletteId()) ?? palettes[0];
  }, []);
  const [addingHelp, setAddingHelp] = useState(false);
  const [newHelpText, setNewHelpText] = useState('');

  function toggleHelp(value: HelpsWith) {
    onChange({
      ...draft,
      helpsWith: draft.helpsWith.includes(value)
        ? draft.helpsWith.filter((h) => h !== value)
        : [...draft.helpsWith, value],
    });
  }

  function toggleConnection(id: string) {
    const current = draft.connections ?? [];
    onChange({
      ...draft,
      connections: current.includes(id) ? current.filter((c) => c !== id) : [...current, id],
    });
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImageFile(file)
      .then((dataUrl) => {
        onChange({ ...draft, photoDataUrl: dataUrl, iconKey: undefined });
      })
      .catch(() => {
        // Extremely rare (corrupt file, browser without canvas support) —
        // simply don't change the photo rather than show a broken image.
      });
  }

  function saveNewCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const id = createId('cat');
    // Cycle through the active palette's colors so a new custom category
    // doesn't always end up the same color as "Person".
    const paletteColors = Object.values(activePalette.colors);
    const usedColors = new Set(categories.map((c) => c.color));
    const freeColor = paletteColors.find((c) => !usedColors.has(c));
    const fallbackColor = freeColor ?? paletteColors[categories.length % paletteColors.length] ?? '#8FAF8A';
    onAddCategory({ id, label: name, color: fallbackColor, iconKey: 'star', isCustom: true });
    onChange({ ...draft, category: id });
    setNewCategoryName('');
    setAddingCategory(false);
  }

  const selectedCategory = categories.find((c) => c.id === draft.category) ?? categories[0];
  const relevantResources = resources.filter(
    () => draft.category === 'aktivitaet' || draft.category === 'ressource' || draft.linkedResourceId,
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field label={t.network.nameLabel}>
        <input
          autoFocus
          className="input"
          placeholder={t.network.namePlaceholder}
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          required
        />
      </Field>

      <Field label={t.network.roleLabel}>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Chip
              key={c.id}
              type="button"
              selected={draft.category === c.id}
              onClick={() => onChange({ ...draft, category: c.id })}
              style={draft.category === c.id ? { background: c.color, borderColor: c.color, color: '#fff' } : undefined}
            >
              {categoryLabel(t, c)}
            </Chip>
          ))}
          <Chip type="button" onClick={() => setAddingCategory((v) => !v)} icon={<Plus size={14} />}>
            {t.network.newCategory}
          </Chip>
        </div>
        {addingCategory && (
          <div className="flex items-center gap-2 mt-2">
            <input
              className="input"
              placeholder={t.network.newCategoryName}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button
              type="button"
              onClick={saveNewCategory}
              className="p-2.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex-shrink-0"
              aria-label={t.common.add}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </Field>

      <Field label={t.network.roleTextLabel}>
        <input
          className="input"
          value={draft.role ?? ''}
          onChange={(e) => onChange({ ...draft, role: e.target.value })}
        />
      </Field>

      <Field label={t.network.appearance}>
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: selectedCategory?.color }}
          >
            {draft.photoDataUrl ? (
              <img
                src={draft.photoDataUrl}
                alt=""
                className="w-full h-full object-cover"
                style={{
                  transform: `translate(${draft.photoOffsetX ?? 0}%, ${draft.photoOffsetY ?? 0}%) scale(${draft.photoScale ?? 1})`,
                }}
              />
            ) : (
              (() => {
                const Icon = getIcon(draft.iconKey, selectedCategory?.iconKey ?? 'sparkles');
                return <Icon size={22} color="#fff" />;
              })()
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
            >
              <Upload size={14} /> {t.network.uploadPhoto}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {draft.photoDataUrl && (
              <button
                type="button"
                onClick={() => onChange({ ...draft, photoDataUrl: undefined, photoScale: undefined, photoOffsetX: undefined, photoOffsetY: undefined })}
                className="flex items-center gap-1.5 text-[13px] text-[var(--color-danger)]"
              >
                <X size={14} /> {t.network.removePhoto}
              </button>
            )}
          </div>
        </div>
        {draft.photoDataUrl && (
          <div className="mt-4">
            <PhotoPositioner
              photoDataUrl={draft.photoDataUrl}
              scale={draft.photoScale ?? 1}
              offsetX={draft.photoOffsetX ?? 0}
              offsetY={draft.photoOffsetY ?? 0}
              onChange={(patch) => onChange({ ...draft, ...patch })}
            />
          </div>
        )}
        {!draft.photoDataUrl && (
          <div className="flex flex-wrap gap-2 mt-3">
            {ICON_PICKER_ORDER.map((key) => {
              const Icon = getIcon(key, key);
              const active = draft.iconKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ ...draft, iconKey: key })}
                  aria-pressed={active}
                  className={`w-9 h-9 rounded-full flex items-center justify-center border ${
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-[var(--color-text-faint)] mt-2">{t.network.paletteHint}</p>
      </Field>

      <Field label={t.network.helpsWithLabel}>
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] p-1">
          {HELPS_WITH_ORDER.map((h) => (
            <label key={h} className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-sm)] cursor-pointer">
              <span className="text-[14px] text-[var(--color-text)]">{helpsWithLabel(t, h)}</span>
              <input
                type="checkbox"
                checked={draft.helpsWith.includes(h)}
                onChange={() => toggleHelp(h)}
                className="w-5 h-5 accent-[var(--color-primary)]"
              />
            </label>
          ))}
          {draft.helpsWith.filter((h) => !HELPS_WITH_ORDER.includes(h)).map((h) => (
            <label key={h} className="flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-sm)] cursor-pointer">
              <span className="text-[14px] text-[var(--color-text)]">{h}</span>
              <input
                type="checkbox"
                checked
                onChange={() => toggleHelp(h)}
                className="w-5 h-5 accent-[var(--color-primary)]"
              />
            </label>
          ))}
        </div>
        {addingHelp ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              autoFocus
              className="input flex-1"
              value={newHelpText}
              onChange={(e) => setNewHelpText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newHelpText.trim()) toggleHelp(newHelpText.trim());
                  setNewHelpText('');
                  setAddingHelp(false);
                }
              }}
              placeholder={t.network.helpsWithOwnPlaceholder}
            />
            <button
              type="button"
              onClick={() => {
                if (newHelpText.trim()) toggleHelp(newHelpText.trim());
                setNewHelpText('');
                setAddingHelp(false);
              }}
              className="p-2 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex-shrink-0"
            >
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setAddingHelp(true)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-2">
            <Plus size={14} /> {t.network.helpsWithOwnCta}
          </button>
        )}
      </Field>

      <Field label={`${t.network.noteLabel} ${t.common.optional}`}>
        <textarea
          className="input"
          rows={2}
          placeholder={t.network.notePlaceholder}
          value={draft.note ?? ''}
          onChange={(e) => onChange({ ...draft, note: e.target.value })}
        />
      </Field>

      {draft.category === 'person' && (
        <>
          <Field label={`${t.network.phoneLabel} ${t.common.optional}`}>
            <input
              className="input"
              type="tel"
              value={draft.phone ?? ''}
              onChange={(e) => onChange({ ...draft, phone: e.target.value })}
            />
          </Field>
          <Field label={`${t.network.emailLabel} ${t.common.optional}`}>
            <input
              className="input"
              type="email"
              value={draft.email ?? ''}
              onChange={(e) => onChange({ ...draft, email: e.target.value })}
            />
          </Field>

          {allPersonEntries.filter((p) => p.id !== draft.id).length > 0 && (
            <Field label={`${t.network.connections} ${t.common.optional}`}>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.network.connectionsHint}</p>
              <div className="flex flex-wrap gap-2">
                {allPersonEntries
                  .filter((p) => p.id !== draft.id)
                  .map((p) => (
                    <Chip
                      key={p.id}
                      type="button"
                      selected={(draft.connections ?? []).includes(p.id)}
                      onClick={() => toggleConnection(p.id)}
                    >
                      {p.name}
                    </Chip>
                  ))}
              </div>
            </Field>
          )}

          <label className="flex items-center justify-between py-1">
            <span className="text-[14px] text-[var(--color-text)]">{t.network.markImportant}</span>
            <input
              type="checkbox"
              checked={!!draft.isImportantContact}
              onChange={(e) => onChange({ ...draft, isImportantContact: e.target.checked })}
              className="w-5 h-5 accent-[var(--color-primary)]"
            />
          </label>
        </>
      )}

      {(draft.category === 'aktivitaet' || draft.category === 'ressource') && relevantResources.length > 0 && (
        <Field label={`${t.network.linkedResource} ${t.common.optional}`}>
          <select
            className="input"
            value={draft.linkedResourceId ?? ''}
            onChange={(e) => onChange({ ...draft, linkedResourceId: e.target.value || undefined })}
          >
            <option value="">{t.network.linkedResourceNone}</option>
            {relevantResources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" fullWidth>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.common.cancel}
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}
