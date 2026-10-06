import { useState } from 'react';
import { networkRepo } from '../safetyNet/networkRepo';
import { NeedsMultiPicker } from '../../components/shared/NeedsMultiPicker';
import type { NeedDirection } from '../../data/types';
import { useSettings } from '../../state/SettingsContext';
import { HILFSMITTEL_MAIN, subtypesFor } from '../../content/hilfsmittelCategories';
import { EnergyLevelPicker } from '../../components/shared/EnergyLevelPicker';
import type { EnergyLevel } from '../../content/energyLevels';
import { RefreshCw } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ImageSuggestionCarousel } from '../../components/shared/ImageSuggestionCarousel';
import { AccessChannelPicker } from '../../components/shared/AccessChannelPicker';
import { ZonePicker } from '../../components/shared/ZonePicker';
import { useT } from '../../i18n';
import { suggestedImage, suggestedImageOptions } from '../../services/suggestedImages';
import { createId } from '../../services/storage/repository';
import { resourceCategoryLabel } from './resourceMeta';
import type { Resource, ResourceCategory, AccessChannel } from '../../data/types';

interface HilfsmittelFormModalProps {
  open: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSave: (resource: Resource) => void;
}

const HILFSMITTEL_CATEGORIES = [...HILFSMITTEL_MAIN] as string[];

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
  const { settings } = useSettings();
  const d = resource?.hilfsmittelDetails;
  const [title, setTitle] = useState(resource?.title ?? '');
  const [category, setCategory] = useState<ResourceCategory>(resource?.category ?? 'haptisch');
  const [subcategory, setSubcategory] = useState<string | undefined>(resource?.subcategory);
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
  const [inNetwork, setInNetwork] = useState<boolean>(() => resource?.inNetwork ?? networkRepo.getAll().some((e) => e.linkedResourceId === resource?.id));
  const [linkedNeeds, setLinkedNeeds] = useState<NeedDirection[]>(resource?.linkedNeeds ?? []);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | undefined>(resource?.energyLevel);

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id: resource?.id ?? createId('res'),
      title,
      category,
      subcategory: subtypesFor(category).some((s) => s.id === subcategory) ? subcategory : undefined,
      image,
      tags: resource?.tags ?? [],
      favorite: resource?.favorite ?? false,
      accessChannels,
      energyLevel,
      linkedNeeds: linkedNeeds.length > 0 ? linkedNeeds : undefined,
      inNetwork,
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
          <select className="input" value={category} onChange={(e) => { setCategory(e.target.value as ResourceCategory); setSubcategory(undefined); }}>
            {(HILFSMITTEL_CATEGORIES.includes(category) ? HILFSMITTEL_CATEGORIES : [...HILFSMITTEL_CATEGORIES, category]).map((c) => (
              <option key={c} value={c}>
                {resourceCategoryLabel(t, c)}
              </option>
            ))}
          </select>
        </Field>

        {/* Medienart / Orts-Art as a sub-category of the chosen category:
         * Videos under Visuell, Musik under Auditiv, Wissen / Texte /
         * Buecher / Apps under Kognitiv, Natur / Ort / besondere Umgebung /
         * Platz (and own ones) under Orte. */}
        {subtypesFor(category).length > 0 && (
          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{t.resources.subcategoryField}</p>
            <div className="flex flex-wrap gap-2">
              {subtypesFor(category).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubcategory(subcategory === s.id ? undefined : s.id)}
                  aria-pressed={subcategory === s.id}
                  className="rounded-full px-3.5 py-1.5 text-[13px] border"
                  style={subcategory === s.id ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-surface)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  {settings.language === 'en' ? s.en : s.de}
                </button>
              ))}
            </div>
          </div>
        )}

        <ZonePicker selected={zoneIds} onChange={setZoneIds} />

        {/* "Bei Hilfsmittel erstellen soll man auch die Energie angeben,
         * die man dafuer braucht"-Auftrag */}
        <div>
          <p className="text-[13px] font-semibold text-[var(--color-text)] mb-0.5">{t.energy.formTitleHilfsmittel}</p>
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
