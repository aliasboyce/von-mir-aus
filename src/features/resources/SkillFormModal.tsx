import { useState } from 'react';
import { networkRepo } from '../safetyNet/networkRepo';
import { NeedsMultiPicker } from '../../components/shared/NeedsMultiPicker';
import type { NeedDirection } from '../../data/types';
import { EnergyLevelPicker } from '../../components/shared/EnergyLevelPicker';
import type { EnergyLevel } from '../../content/energyLevels';
import { Plus, X, RefreshCw } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ImageSuggestionCarousel } from '../../components/shared/ImageSuggestionCarousel';
import { AccessChannelPicker } from '../../components/shared/AccessChannelPicker';
import { ZonePicker } from '../../components/shared/ZonePicker';
import { useT } from '../../i18n';
import { suggestedImage, suggestedImageOptions } from '../../services/suggestedImages';
import { createId } from '../../services/storage/repository';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_ORDER, RESOURCE_CATEGORY_TO_GROUP, resourceCategoryLabel } from './resourceMeta';
import type { Resource, ResourceCategory, AccessChannel } from '../../data/types';

interface SkillFormModalProps {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSave: (resource: Resource) => void;
}

const SKILL_CATEGORIES = RESOURCE_CATEGORY_ORDER.filter((c) => RESOURCE_CATEGORY_TO_GROUP[c] === 'faehigkeiten');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

/**
 * "Skills erstellen, strukturiertes Formular, nur bei Skills"-Auftrag
 * — a dedicated, structured form for Skills only (Hilfsmittel keeps
 * the plain title/description form in ResourcesPage.tsx unchanged).
 * Every field past the title is optional.
 *
 * "Echter Laufzeitfehler, per Bisektion gefunden"-Fund — the first
 * version used a single `draft: Resource` object plus a "reset on
 * resource prop change" pattern (comparing a stored lastResourceId
 * during render, conditionally calling setState mid-render to
 * re-sync). That pattern crashed in the browser despite compiling
 * cleanly. Isolated by rebuilding the component from a working
 * minimal version up, section by section, confirming each one
 * (category+image, all four structured sections, AccessChannelPicker)
 * works fine in isolation — the bug was specifically in that reset
 * mechanism, not any individual section. Replaced with the standard,
 * safer React pattern instead: ResourcesPage.tsx now mounts this with
 * key={editing?.id ?? 'new'}, so React remounts the whole component
 * fresh whenever the target resource changes, and every field below
 * is a plain useState initialized directly from the resource prop —
 * no runtime reset logic needed at all.
 */
export function SkillFormModal({ open, resource, onClose, onSave }: SkillFormModalProps) {
  const t = useT();
  const d = resource?.skillDetails;
  const [title, setTitle] = useState(resource?.title ?? '');
  const [category, setCategory] = useState<ResourceCategory>(resource?.category ?? 'stresstoleranz');
  const [image, setImage] = useState(resource?.image ?? suggestedImage(resource?.title ?? '', resource?.category ?? 'stresstoleranz'));
  const [imageSuggestions, setImageSuggestions] = useState(() => suggestedImageOptions(resource?.title ?? '', resource?.category ?? 'stresstoleranz'));
  const [subtitle, setSubtitle] = useState(d?.subtitle ?? '');
  const [anspannungsbereich, setAnspannungsbereich] = useState(d?.anspannungsbereich ?? '');
  const [ausloeser, setAusloeser] = useState(d?.ausloeser ?? '');
  const [fruehwarnzeichen, setFruehwarnzeichen] = useState(d?.fruehwarnzeichen ?? '');
  const [wirkung, setWirkung] = useState(d?.wirkung ?? '');
  const [wirkungsdauer, setWirkungsdauer] = useState(d?.wirkungsdauer ?? '');
  const [steps, setSteps] = useState<string[]>(d?.schritte ?? []);
  const [gegenanzeigen, setGegenanzeigen] = useState(d?.gegenanzeigen ?? '');
  const [unterwegsAlternative, setUnterwegsAlternative] = useState(d?.unterwegsAlternative ?? '');
  const [accessChannels, setAccessChannels] = useState<AccessChannel[]>(resource?.accessChannels ?? []);
  const [inNetwork, setInNetwork] = useState<boolean>(() => resource?.inNetwork ?? networkRepo.getAll().some((e) => e.linkedResourceId === resource?.id));
  const [linkedNeeds, setLinkedNeeds] = useState<NeedDirection[]>(resource?.linkedNeeds ?? []);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | undefined>(resource?.energyLevel);
  const [zoneIds, setZoneIds] = useState<string[]>(d?.zoneIds ?? []);
  const [relatedHilfsmittelIds, setRelatedHilfsmittelIds] = useState<string[]>(d?.relatedHilfsmittelIds ?? []);
  const hilfsmittelOptions = resourcesRepo.getAll().filter((r) => RESOURCE_CATEGORY_TO_GROUP[r.category] === 'hilfsmittel');

  function toggleHilfsmittel(id: string) {
    setRelatedHilfsmittelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function setStep(i: number, value: string) {
    const next = [...steps];
    next[i] = value;
    setSteps(next);
  }

  function handleSave() {
    if (!title.trim()) return;
    const cleanedSteps = steps.map((s) => s.trim()).filter(Boolean);
    onSave({
      id: resource?.id ?? createId('res'),
      title,
      category,
      image,
      tags: resource?.tags ?? ['dbt'],
      favorite: resource?.favorite ?? false,
      accessChannels,
      energyLevel,
      linkedNeeds: linkedNeeds.length > 0 ? linkedNeeds : undefined,
      inNetwork,
      createdAt: resource?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      skillDetails: {
        subtitle: subtitle || undefined,
        zoneIds: zoneIds.length > 0 ? zoneIds : undefined,
        relatedHilfsmittelIds: relatedHilfsmittelIds.length > 0 ? relatedHilfsmittelIds : undefined,
        anspannungsbereich: anspannungsbereich || undefined,
        ausloeser: ausloeser || undefined,
        fruehwarnzeichen: fruehwarnzeichen || undefined,
        wirkung: wirkung || undefined,
        wirkungsdauer: wirkungsdauer || undefined,
        schritte: cleanedSteps.length > 0 ? cleanedSteps : undefined,
        gegenanzeigen: gegenanzeigen || undefined,
        unterwegsAlternative: unterwegsAlternative || undefined,
      },
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={resource ? title || t.resources.skillFormTitle : t.resources.skillFormTitleNew}>
      <div className="flex flex-col gap-4 pb-2">
        <Field label={t.resources.skillNameLabel}>
          <input autoFocus className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>

        <Field label={t.resources.skillSubtitleLabel}>
          <input className="input" placeholder={t.resources.skillSubtitlePlaceholder} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </Field>

        <Field label={t.resources.categoryLabel}>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ResourceCategory)}>
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {resourceCategoryLabel(t, c)}
              </option>
            ))}
          </select>
        </Field>

        <ZonePicker selected={zoneIds} onChange={setZoneIds} />

        <div>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-0.5">{t.energy.formTitleSkill}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.energy.fieldHint}</p>
          <EnergyLevelPicker value={energyLevel} onChange={setEnergyLevel} />
        </div>

        <NeedsMultiPicker selected={linkedNeeds} onChange={setLinkedNeeds} />

        {/* "Beim Erstellen abhaken, dass es im Netzwerk erscheinen soll" */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" className="mt-0.5" checked={inNetwork} onChange={(e) => setInNetwork(e.target.checked)} />
          <span>
            <span className="block text-[13px] text-[var(--color-text)]">{t.resources.inNetworkToggle}</span>
            <span className="block text-[11.5px] text-[var(--color-text-faint)]">{t.resources.inNetworkHint}</span>
          </span>
        </label>

        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2">{t.resources.skillSection1Title}</p>
          <div className="flex flex-col gap-3">
            <Field label={t.resources.skillAnspannungsbereichLabel}>
              <input className="input" placeholder={t.resources.skillAnspannungsbereichPlaceholder} value={anspannungsbereich} onChange={(e) => setAnspannungsbereich(e.target.value)} />
            </Field>
            <Field label={t.resources.skillAusloeserLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.skillAusloeserPlaceholder} value={ausloeser} onChange={(e) => setAusloeser(e.target.value)} />
            </Field>
            <Field label={t.resources.skillFruehwarnzeichenLabel}>
              <input className="input" placeholder={t.resources.skillFruehwarnzeichenPlaceholder} value={fruehwarnzeichen} onChange={(e) => setFruehwarnzeichen(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2">{t.resources.skillSection2Title}</p>
          <div className="flex flex-col gap-3">
            <Field label={t.resources.skillWirkungLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.skillWirkungPlaceholder} value={wirkung} onChange={(e) => setWirkung(e.target.value)} />
            </Field>
            <Field label={t.resources.skillWirkungsdauerLabel}>
              <input className="input" placeholder={t.resources.skillWirkungsdauerPlaceholder} value={wirkungsdauer} onChange={(e) => setWirkungsdauer(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">{t.resources.skillSection3Title}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.skillSection3Hint}</p>
          <div className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[12px] text-[var(--color-text-faint)] w-4 flex-shrink-0">{i + 1}.</span>
                <input className="input flex-1" value={s} onChange={(e) => setStep(i, e.target.value)} placeholder={t.resources.skillStepPlaceholder} />
                <button type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))} aria-label={t.common.delete} className="text-[var(--color-text-faint)] flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setSteps([...steps, ''])} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-1">
              <Plus size={14} /> {t.resources.skillAddStepCta}
            </button>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] p-3.5 border" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2">⚠️ {t.resources.skillSection4Title}</p>
          <div className="flex flex-col gap-3">
            <Field label={t.resources.skillGegenanzeigenLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.skillGegenanzeigenPlaceholder} value={gegenanzeigen} onChange={(e) => setGegenanzeigen(e.target.value)} />
            </Field>
            <Field label={t.resources.skillAlternativeLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.skillAlternativePlaceholder} value={unterwegsAlternative} onChange={(e) => setUnterwegsAlternative(e.target.value)} />
            </Field>
          </div>
        </div>

        <Field label={`${t.resources.categoryLabel} — Bild`}>
          <div className="flex flex-col gap-2">
            <ImageSuggestionCarousel images={imageSuggestions} selected={image} onSelect={(url) => setImage(url)} ariaLabel={t.resources.pickThisImage} />
            <button type="button" onClick={() => setImageSuggestions(suggestedImageOptions(title, category))} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]">
              <RefreshCw size={13} /> {t.resources.moreSuggestions}
            </button>
          </div>
        </Field>

        <Field label={t.resources.hilfsmittelPickerLabel}>
          {hilfsmittelOptions.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-faint)]">{t.resources.hilfsmittelPickerNone}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hilfsmittelOptions.map((r) => {
                const isSelected = relatedHilfsmittelIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleHilfsmittel(r.id)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-full)] px-3 py-1.5 text-[13px] font-medium border"
                    style={isSelected ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-surface)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    {r.title}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        <AccessChannelPicker selected={accessChannels} onChange={setAccessChannels} />

        <div className="flex gap-2 mt-2">
          <Button fullWidth onClick={handleSave} disabled={!title.trim()}>
            {t.common.save}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t.common.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
