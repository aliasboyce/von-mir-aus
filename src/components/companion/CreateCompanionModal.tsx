import { useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { useT } from '../../i18n';
import { createCustomLichtwesen, deriveGlow, updateCustomLichtwesen, deleteCustomLichtwesen } from './customLichtwesen';
import type { LichtwesenMovement, LichtwesenEyeStyle, LichtwesenConfig } from './lichtwesen';
import type { CompanionCategory } from './companionRegistry';

interface CreateCompanionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (being: LichtwesenConfig) => void;
  /** when set, the modal edits this existing custom being instead of
   * creating a new one — same form, same validation, one implementation */
  editing?: LichtwesenConfig | null;
  /** called after a custom being is deleted, so the caller can fall back
   * to a built-in being if the deleted one was currently selected */
  onDeleted?: (id: string) => void;
}

const MOVEMENT_OPTIONS: { value: LichtwesenMovement; label: string }[] = [
  { value: 'bounce-joy', label: 'Hüpfend & fröhlich' },
  { value: 'sway-slow', label: 'Langsam schaukelnd' },
  { value: 'still-deep', label: 'Ruhig & still' },
  { value: 'tilt-steady', label: 'Fest & gerade' },
  { value: 'pulse-warm', label: 'Warm pulsierend' },
  { value: 'drift-shy', label: 'Schüchtern treibend' },
  { value: 'rise-gentle', label: 'Sanft aufsteigend' },
  { value: 'listen-tilt', label: 'Zuhörend geneigt' },
  { value: 'quick-alert', label: 'Wachsam & schnell' },
  { value: 'precise-hover', label: 'Genau schwebend' },
];

const EYE_OPTIONS: { value: LichtwesenEyeStyle; label: string }[] = [
  { value: 'round', label: 'Rund & aufmerksam' },
  { value: 'half-closed', label: 'Halb geschlossen' },
  { value: 'soft-closed', label: 'Sanft geschlossen' },
  { value: 'direct', label: 'Direkt & klar' },
  { value: 'curved-happy', label: 'Fröhlich geschwungen' },
  { value: 'narrow-peek', label: 'Schmal, neugierig' },
  { value: 'wide-fresh', label: 'Groß & wach' },
  { value: 'star-sparkle', label: 'Funkelnd' },
  { value: 'sharp-focused', label: 'Fokussiert' },
  { value: 'steady-trust', label: 'Ruhig vertrauend' },
];

const CATEGORY_OPTIONS: { value: CompanionCategory; label: string }[] = [
  { value: 'positiv', label: 'Positiv' },
  { value: 'beruhigend', label: 'Beruhigend' },
  { value: 'humorvoll', label: 'Humorvoll' },
  { value: 'ermutigung', label: 'Ermutigend' },
  { value: 'erklaerung', label: 'Erklärend' },
  { value: 'kontext', label: 'Aufmerksam' },
  { value: 'tipp', label: 'Tipp-freudig' },
  { value: 'funktionshinweis', label: 'Hinweisend' },
];

const MAX_CATEGORIES = 2;

export function CreateCompanionModal({ open, onClose, onCreated, editing = null, onDeleted }: CreateCompanionModalProps) {
  const t = useT();
  const [name, setName] = useState(editing?.name ?? '');
  const [color, setColor] = useState(editing?.color ?? '#7B9E7A');
  const [movement, setMovement] = useState<LichtwesenMovement>(editing?.movement ?? 'pulse-warm');
  const [eyeStyle, setEyeStyle] = useState<LichtwesenEyeStyle>(editing?.eyeStyle ?? 'round');
  const [preferredCategories, setPreferredCategories] = useState<CompanionCategory[]>(
    editing?.preferredCategories ?? ['positiv', 'beruhigend'],
  );
  const editingId = useRef(editing?.id ?? null);

  // Re-sync the form whenever a different being is opened for editing (or
  // the modal switches from "new" to "edit" and back). Both sides are
  // normalized through the same `?? null` before comparing — comparing
  // `editing?.id` (which is `undefined` when creating) directly against
  // `editingId.current` (which starts as `null`) meant `undefined !== null`
  // was true on every single render while creating, since those two are
  // never strictly equal no matter how many times the state "settles" —
  // that re-triggered the state update every render, an infinite loop
  // that crashed the whole modal to a blank screen.
  const editingKey = editing?.id ?? null;
  if (editingKey !== editingId.current && open) {
    editingId.current = editingKey;
    setName(editing?.name ?? '');
    setColor(editing?.color ?? '#7B9E7A');
    setMovement(editing?.movement ?? 'pulse-warm');
    setEyeStyle(editing?.eyeStyle ?? 'round');
    setPreferredCategories(editing?.preferredCategories ?? ['positiv', 'beruhigend']);
  }

  function toggleCategory(cat: CompanionCategory) {
    setPreferredCategories((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= MAX_CATEGORIES) return [prev[1], cat];
      return [...prev, cat];
    });
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const finalCategories: CompanionCategory[] =
      preferredCategories.length > 0 ? preferredCategories : ['positiv', 'beruhigend'];
    const being = editing
      ? updateCustomLichtwesen(editing.id, { name: trimmed, color, glow: deriveGlow(color), movement, eyeStyle, preferredCategories: finalCategories })
      : createCustomLichtwesen({ name: trimmed, color, glow: deriveGlow(color), movement, eyeStyle, preferredCategories: finalCategories });
    onCreated(being);
    if (!editing) setName('');
    onClose();
  }

  function handleDelete() {
    if (!editing) return;
    if (!window.confirm(t.companion.confirmDeleteCompanion.replace('{name}', editing.name))) return;
    deleteCustomLichtwesen(editing.id);
    onDeleted?.(editing.id);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t.companion.editTitle : t.companion.createTitle}
      subtitle={editing ? undefined : t.companion.createSubtitle}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <label className="relative w-16 h-16 rounded-full flex-shrink-0 overflow-hidden cursor-pointer border border-[var(--color-border)]">
            <span className="absolute inset-0" style={{ background: color }} />
            <span className="absolute inset-0 flex items-center justify-center text-white text-[13px] font-medium">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              aria-label={t.network.centerNodeColor}
            />
          </label>
          <label className="flex-1 flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.companion.nameLabel}</span>
            <input
              autoFocus
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.companion.namePlaceholder}
              maxLength={20}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.companion.movementLabel}</span>
          <select className="input" value={movement} onChange={(e) => setMovement(e.target.value as LichtwesenMovement)}>
            {MOVEMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.companion.eyeLabel}</span>
          <select className="input" value={eyeStyle} onChange={(e) => setEyeStyle(e.target.value as LichtwesenEyeStyle)}>
            {EYE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.companion.personalityLabel}</span>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.companion.personalityHint}</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((o) => (
              <Chip key={o.value} type="button" selected={preferredCategories.includes(o.value)} onClick={() => toggleCategory(o.value)}>
                {o.label}
              </Chip>
            ))}
          </div>
        </div>

        <Button onClick={submit} fullWidth disabled={!name.trim()}>
          {editing ? t.common.save : t.companion.createSubmit}
        </Button>
        {editing && (
          <button type="button" onClick={handleDelete} className="text-[13px] text-[var(--color-danger)] text-center">
            {t.companion.deleteCompanion}
          </button>
        )}
      </div>
    </Modal>
  );
}
