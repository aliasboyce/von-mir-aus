import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ImageSuggestionCarousel } from '../../components/shared/ImageSuggestionCarousel';
import { AccessChannelPicker } from '../../components/shared/AccessChannelPicker';
import { ZonePicker } from '../../components/shared/ZonePicker';
import { useT } from '../../i18n';
import { suggestedImage, suggestedImageOptions } from '../../services/suggestedImages';
import { createId } from '../../services/storage/repository';
import { RESOURCE_CATEGORY_ORDER, RESOURCE_CATEGORY_TO_GROUP, resourceCategoryLabel } from './resourceMeta';
import type { Resource, ResourceCategory, AccessChannel } from '../../data/types';

interface HilfsmittelFormModalProps {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSave: (resource: Resource) => void;
}

const HILFSMITTEL_CATEGORIES = RESOURCE_CATEGORY_ORDER.filter((c) => RESOURCE_CATEGORY_TO_GROUP[c] === 'hilfsmittel');

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

/**
 * "Hilfsmittel/Werkzeug erstellen, strukturiertes Formular"-Auftrag
 * — same structured-form pattern as SkillFormModal.tsx, with the
 * person's own five-section Hilfsmittel template instead. Every field
 * past the title is optional, same as Skills.
 *
 * Mounted by ResourcesPage.tsx with key={editing?.id ?? 'new'} —
 * see SkillFormModal.tsx's own doc comment for why: a first version
 * of that sibling form crashed from a fragile "reset state during
 * render when the resource prop changes" pattern. This form skips
 * that mistake from the start — every field is a plain useState
 * initialized directly from the resource prop, no runtime reset
 * logic at all.
 */
export function HilfsmittelFormModal({ open, resource, onClose, onSave }: HilfsmittelFormModalProps) {
  const t = useT();
  const d = resource?.hilfsmittelDetails;
  const [title, setTitle] = useState(resource?.title ?? '');
  const [category, setCategory] = useState<ResourceCategory>(resource?.category ?? 'haptisch');
  const [image, setImage] = useState(resource?.image ?? suggestedImage(resource?.title ?? '', resource?.category ?? 'haptisch'));
  const [imageSuggestions, setImageSuggestions] = useState(() => suggestedImageOptions(resource?.title ?? '', resource?.category ?? 'haptisch'));
  const [subtitle, setSubtitle] = useState(d?.subtitle ?? '');
  const [beruhigungTrost, setBeruhigungTrost] = useState(d?.beruhigungTrost ?? '');
  const [fokusAblenkung, setFokusAblenkung] = useState(d?.fokusAblenkung ?? '');
  const [ventilAnspannung, setVentilAnspannung] = useState(d?.ventilAnspannung ?? '');
  const [anspannungsbereich, setAnspannungsbereich] = useState(d?.anspannungsbereich ?? '');
  const [alarmSituation, setAlarmSituation] = useState(d?.alarmSituation ?? '');
  const [dauer, setDauer] = useState(d?.dauer ?? '');
  const [methode, setMethode] = useState(d?.methode ?? '');
  const [ausschlusskriterium, setAusschlusskriterium] = useState(d?.ausschlusskriterium ?? '');
  const [platzZuhause, setPlatzZuhause] = useState(d?.platzZuhause ?? '');
  const [platzUnterwegs, setPlatzUnterwegs] = useState(d?.platzUnterwegs ?? '');
  const [bereitschaft, setBereitschaft] = useState(d?.bereitschaft ?? '');
  const [accessChannels, setAccessChannels] = useState<AccessChannel[]>(resource?.accessChannels ?? []);
  const [zoneIds, setZoneIds] = useState<string[]>(d?.zoneIds ?? []);

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id: resource?.id ?? createId('res'),
      title,
      category,
      image,
      tags: resource?.tags ?? [],
      favorite: resource?.favorite ?? false,
      accessChannels,
      createdAt: resource?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hilfsmittelDetails: {
        subtitle: subtitle || undefined,
        zoneIds: zoneIds.length > 0 ? zoneIds : undefined,
        beruhigungTrost: beruhigungTrost || undefined,
        fokusAblenkung: fokusAblenkung || undefined,
        ventilAnspannung: ventilAnspannung || undefined,
        anspannungsbereich: anspannungsbereich || undefined,
        alarmSituation: alarmSituation || undefined,
        dauer: dauer || undefined,
        methode: methode || undefined,
        ausschlusskriterium: ausschlusskriterium || undefined,
        platzZuhause: platzZuhause || undefined,
        platzUnterwegs: platzUnterwegs || undefined,
        bereitschaft: bereitschaft || undefined,
      },
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={resource ? title || t.resources.hilfsmittelFormTitle : t.resources.hilfsmittelFormTitleNew}>
      <div className="flex flex-col gap-4 pb-2">
        <Field label={t.resources.hilfsmittelNameLabel}>
          <input autoFocus className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>

        <Field label={t.resources.hilfsmittelSubtitleLabel}>
          <input className="input" placeholder={t.resources.hilfsmittelSubtitlePlaceholder} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </Field>

        <Field label={t.resources.categoryLabel}>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ResourceCategory)}>
            {HILFSMITTEL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {resourceCategoryLabel(t, c)}
              </option>
            ))}
          </select>
        </Field>

        <ZonePicker selected={zoneIds} onChange={setZoneIds} />

        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">{t.resources.hilfsmittelSection1Title}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.hilfsmittelSection1Hint}</p>
          <div className="flex flex-col gap-3">
            <Field label={t.resources.hilfsmittelBeruhigungLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.hilfsmittelBeruhigungPlaceholder} value={beruhigungTrost} onChange={(e) => setBeruhigungTrost(e.target.value)} />
            </Field>
            <Field label={t.resources.hilfsmittelFokusLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.hilfsmittelFokusPlaceholder} value={fokusAblenkung} onChange={(e) => setFokusAblenkung(e.target.value)} />
            </Field>
            <Field label={t.resources.hilfsmittelVentilLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.hilfsmittelVentilPlaceholder} value={ventilAnspannung} onChange={(e) => setVentilAnspannung(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">{t.resources.hilfsmittelSection2Title}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.hilfsmittelSection2Hint}</p>
          <div className="flex flex-col gap-3">
            <Field label={t.resources.hilfsmittelAnspannungsbereichLabel}>
              <input className="input" placeholder={t.resources.hilfsmittelAnspannungsbereichPlaceholder} value={anspannungsbereich} onChange={(e) => setAnspannungsbereich(e.target.value)} />
            </Field>
            <Field label={t.resources.hilfsmittelAlarmLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.hilfsmittelAlarmPlaceholder} value={alarmSituation} onChange={(e) => setAlarmSituation(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">{t.resources.hilfsmittelSection3Title}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.hilfsmittelSection3Hint}</p>
          <div className="flex flex-col gap-3">
            <Field label={t.resources.hilfsmittelDauerLabel}>
              <input className="input" placeholder={t.resources.hilfsmittelDauerPlaceholder} value={dauer} onChange={(e) => setDauer(e.target.value)} />
            </Field>
            <Field label={t.resources.hilfsmittelMethodeLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.hilfsmittelMethodePlaceholder} value={methode} onChange={(e) => setMethode(e.target.value)} />
            </Field>
            <Field label={t.resources.hilfsmittelAusschlussLabel}>
              <textarea className="input" rows={2} placeholder={t.resources.hilfsmittelAusschlussPlaceholder} value={ausschlusskriterium} onChange={(e) => setAusschlusskriterium(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">{t.resources.hilfsmittelSection4Title}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.hilfsmittelSection4Hint}</p>
          <div className="flex flex-col gap-3">
            <Field label={t.resources.hilfsmittelPlatzZuhauseLabel}>
              <input className="input" placeholder={t.resources.hilfsmittelPlatzZuhausePlaceholder} value={platzZuhause} onChange={(e) => setPlatzZuhause(e.target.value)} />
            </Field>
            <Field label={t.resources.hilfsmittelPlatzUnterwegsLabel}>
              <input className="input" placeholder={t.resources.hilfsmittelPlatzUnterwegsPlaceholder} value={platzUnterwegs} onChange={(e) => setPlatzUnterwegs(e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">{t.resources.hilfsmittelSection5Title}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.hilfsmittelSection5Hint}</p>
          <Field label={t.resources.hilfsmittelBereitschaftLabel}>
            <textarea className="input" rows={2} placeholder={t.resources.hilfsmittelBereitschaftPlaceholder} value={bereitschaft} onChange={(e) => setBereitschaft(e.target.value)} />
          </Field>
        </div>

        <Field label={`${t.resources.categoryLabel} — Bild`}>
          <div className="flex flex-col gap-2">
            <ImageSuggestionCarousel images={imageSuggestions} selected={image} onSelect={(url) => setImage(url)} ariaLabel={t.resources.pickThisImage} />
            <button type="button" onClick={() => setImageSuggestions(suggestedImageOptions(title, category))} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]">
              <RefreshCw size={13} /> {t.resources.moreSuggestions}
            </button>
          </div>
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
