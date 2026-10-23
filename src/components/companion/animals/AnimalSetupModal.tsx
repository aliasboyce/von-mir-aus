import { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { useSettings } from '../../../state/SettingsContext';
import { activeDaysSince, GROW_UP_DAYS, stageLabel } from '../../../services/companionGrowth';
import { CATEGORY_OPTIONS, MAX_CATEGORIES } from '../CreateCompanionModal';
import { createAnimalCompanion, deleteCustomLichtwesen, updateAnimalCompanion } from '../customLichtwesen';
import type { AnimalSpec, LichtwesenConfig } from '../lichtwesen';
import type { CompanionCategory } from '../companionRegistry';
import { AnimalFigure } from './AnimalFigure';
import { getAnimal, palOf, variantOf } from './animalRegistry';
import { ACCESSORIES, type AccKind } from './kit';
import { EXTRA_NAMES, isProp } from './extras';

const ACC_COLORS = ['#ff7aa8', '#e5566b', '#ffcf4a', '#4f9be0', '#5cc08a', '#a78bfa', '#2b2230', '#ffffff'];

interface Props {
  open: boolean;
  onClose: () => void;
  /** a new animal of this species moves in */
  speciesId?: string | null;
  /** or: an existing animal is changed */
  editing?: LichtwesenConfig | null;
  onSaved: (being: LichtwesenConfig) => void;
  onDeleted?: (id: string) => void;
}

/** "Tier einrichten": name, colour variant, accessory, own colour – the same freedom as with the light beings. */
export function AnimalSetupModal({ open, onClose, speciesId, editing = null, onSaved, onDeleted }: Props) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const animal = getAnimal(editing?.animal?.species ?? speciesId ?? undefined);
  // the form is remounted per animal (key) – so plain initial state is enough here
  if (!animal) return null;
  return <SetupForm key={editing?.id ?? animal.id} open={open} onClose={onClose} animalId={animal.id} editing={editing} onSaved={onSaved} onDeleted={onDeleted} en={en} />;
}

function SetupForm({ open, onClose, animalId, editing, onSaved, onDeleted, en }: { open: boolean; onClose: () => void; animalId: string; editing: LichtwesenConfig | null; onSaved: (b: LichtwesenConfig) => void; onDeleted?: (id: string) => void; en: boolean }) {
  const animal = getAnimal(animalId)!;
  const spec = editing?.animal;
  const [name, setName] = useState(editing?.name ?? animal.name);
  const [variantId, setVariantId] = useState(spec?.variantId ?? animal.variants[0].id);
  const [acc, setAcc] = useState<AccKind>(isProp(spec?.acc) ? 'none' : ((spec?.acc as AccKind) ?? 'none'));
  const [item, setItem] = useState<string>(spec?.item ?? (isProp(spec?.acc) ? (spec?.acc as string) : (animal.defaultItem ?? 'none')));
  const [accColor, setAccColor] = useState<string | undefined>(spec?.accColor);
  const [ownColor, setOwnColor] = useState<string | undefined>(spec?.bodyColor);
  const [harness, setHarness] = useState<boolean>(spec?.harness ?? variantOf(animal, spec?.variantId ?? animal.variants[0].id).opt?.harness ?? false);
  const [cats, setCats] = useState<CompanionCategory[]>(editing?.preferredCategories ?? animal.preferredCategories);

  const look = { variantId, acc, item, accColor, bodyColor: ownColor, harness: animal.harness ? harness : undefined };
  const body = ownColor ?? palOf(animal, variantId).body;

  function toggleCat(c: CompanionCategory) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : prev.length >= MAX_CATEGORIES ? [prev[1], c] : [...prev, c]));
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: AnimalSpec = { species: animal.id, variantId, acc: acc === 'none' ? undefined : acc, item: item === (animal.defaultItem ?? 'none') ? undefined : item, accColor: acc === 'none' ? undefined : accColor, bodyColor: ownColor, harness: animal.harness ? harness : undefined };
    const params = { name: trimmed, spec: next, color: body, glow: animal.glow, trait: animal.trait, movement: animal.movement, preferredCategories: cats.length ? cats : animal.preferredCategories };
    const saved = editing ? updateAnimalCompanion(editing.id, params) : createAnimalCompanion(params);
    if (saved) onSaved(saved);
    onClose();
  }

  function remove() {
    if (!editing) return;
    if (!window.confirm((en ? 'Really remove {name}?' : '{name} wirklich entfernen?').replace('{name}', editing.name))) return;
    deleteCustomLichtwesen(editing.id);
    onDeleted?.(editing.id);
    onClose();
  }

  const days = editing ? activeDaysSince(editing.adoptedAt) : 1;

  return (
    <Modal open={open} onClose={onClose} title={editing ? (en ? 'Change your animal' : 'Dein Tier anpassen') : en ? `Welcome ${animal.name}` : `${animal.name} richtet sich ein`} subtitle={editing ? undefined : en ? 'Name, colours and little extras – you can change everything later.' : 'Name, Farben und kleine Extras – du kannst später alles ändern.'}>
      <div className="flex flex-col gap-4" data-testid="animal-setup">
        <div className="flex items-end justify-center gap-5 rounded-[var(--radius-md)] py-3" style={{ background: 'var(--color-surface-alt, var(--color-surface))' }}>
          <div className="flex flex-col items-center">
            <AnimalFigure animal={animal} look={look} age={0} size={92} inert />
            <span className="text-[11px] text-[var(--color-text-faint)]">{en ? 'as a baby' : 'als Baby'}</span>
          </div>
          <div className="flex flex-col items-center">
            <AnimalFigure animal={animal} look={look} age={1} size={116} inert />
            <span className="text-[11px] text-[var(--color-text-faint)]">{en ? 'fully grown' : 'ausgewachsen'}</span>
          </div>
        </div>
        {!editing ? (
          <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">
            {en ? `Your animal moves in as a baby and grows with the days you use the app – after ${GROW_UP_DAYS} days with something done, it is fully grown. No pressure: pauses are fine, it never shrinks.` : `Dein Tier zieht als Baby ein und wächst mit den Tagen, an denen du die App nutzt – nach ${GROW_UP_DAYS} Tagen mit irgendeiner Aktion ist es ausgewachsen. Kein Druck: Pausen sind in Ordnung, es schrumpft nie.`}
          </p>
        ) : (
          <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed" data-testid="animal-age-info">
            {en ? `Day ${Math.min(days, GROW_UP_DAYS)} of ${GROW_UP_DAYS} – ${stageLabel(days)}.` : `Tag ${Math.min(days, GROW_UP_DAYS)} von ${GROW_UP_DAYS} – ${stageLabel(days)}.`}
          </p>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{en ? 'Name' : 'Name'}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder={animal.name} data-testid="animal-name" />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{en ? 'Colour' : 'Farbe'}</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={en ? 'Colour' : 'Farbe'}>
            {animal.variants.map((v) => {
              const on = variantId === v.id;
              const pal = palOf(animal, v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-testid={`animal-variant-${v.id}`}
                  onClick={() => {
                    setVariantId(v.id);
                    setOwnColor(undefined);
                    if (animal.harness) setHarness(variantOf(animal, v.id).opt?.harness ?? false);
                  }}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-[13px]"
                  style={{ borderColor: on ? 'var(--color-primary)' : 'var(--color-border-strong)', background: on ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'transparent', color: 'var(--color-text)' }}
                >
                  <span className="w-5 h-5 rounded-full border border-black/10" style={{ background: `linear-gradient(135deg, ${pal.body} 55%, ${pal.belly} 55%)` }} />
                  {v.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <label className="flex items-center gap-2 text-[12.5px] text-[var(--color-text-muted)]">
              <input type="checkbox" checked={!!ownColor} onChange={(e) => setOwnColor(e.target.checked ? body : undefined)} data-testid="animal-own-color-toggle" />
              {en ? 'Pick my own main colour' : 'Eigene Hauptfarbe wählen'}
            </label>
            {ownColor && <input type="color" value={ownColor} onChange={(e) => setOwnColor(e.target.value)} aria-label={en ? 'Main colour' : 'Hauptfarbe'} className="w-8 h-8 rounded-full border border-[var(--color-border)] p-0" data-testid="animal-own-color" />}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{en ? 'Little extra' : 'Kleines Extra'}</span>
          <div className="flex flex-wrap gap-2">
            {[...ACCESSORIES, ...animal.extras.map((id) => ({ id: id as AccKind, name: id }))].map((a) => (
              <Chip key={a.id} type="button" selected={acc === a.id} onClick={() => setAcc(a.id)} data-testid={`animal-acc-${a.id}`}>
                {accName(a.id, en)}
              </Chip>
            ))}
          </div>
          {acc !== 'none' && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1" aria-label={en ? 'Colour of the extra' : 'Farbe des Extras'}>
              {ACC_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setAccColor(c)} aria-label={c} aria-pressed={accColor === c} className="w-6 h-6 rounded-full border" style={{ background: c, borderColor: accColor === c ? 'var(--color-primary)' : 'var(--color-border-strong)', borderWidth: accColor === c ? 2 : 1 }} />
              ))}
              <button type="button" onClick={() => setAccColor(undefined)} className="text-[12px] text-[var(--color-text-faint)] px-2">{en ? 'standard' : 'Standard'}</button>
            </div>
          )}
          {animal.harness && (
            <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)] mt-1">
              <input type="checkbox" checked={harness} onChange={(e) => setHarness(e.target.checked)} data-testid="animal-harness" />
              {en ? 'Wears a harness' : 'Trägt ein Geschirr'}
            </label>
          )}
        </div>

        {animal.items.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{animal.itemHands ? (en ? 'What it holds' : 'Was es in der Hand hält') : en ? 'What it has with it' : 'Was es dabei hat'}</span>
            <div className="flex flex-wrap gap-2">
              {['none', ...animal.items].map((id) => (
                <Chip key={id} type="button" selected={item === id} onClick={() => setItem(id)} data-testid={`animal-item-${id}`}>
                  {id === 'none' ? (en ? 'Nothing' : 'Nichts') : accName(id as AccKind, en)}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{en ? 'How does your animal talk?' : 'Wie spricht dein Tier?'}</span>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((o) => (
              <Chip key={o.value} type="button" selected={cats.includes(o.value)} onClick={() => toggleCat(o.value)}>
                {o.label}
              </Chip>
            ))}
          </div>
        </div>

        <Button onClick={save} fullWidth disabled={!name.trim()} data-testid="animal-save">
          {editing ? (en ? 'Save' : 'Speichern') : en ? 'Welcome' : 'Willkommen'}
        </Button>
        {editing && (
          <button type="button" onClick={remove} className="text-[13px] text-[var(--color-danger)] text-center" data-testid="animal-delete">
            {en ? 'Remove this animal' : 'Dieses Tier entfernen'}
          </button>
        )}
      </div>
    </Modal>
  );
}

function accName(id: AccKind, en: boolean): string {
  const de: Record<string, string> = { none: 'Nichts', schleife: 'Schleife', halstuch: 'Halstuch', krone: 'Krone', blume: 'Blume', brille: 'Brille', muetze: 'Mütze' };
  const e: Record<string, string> = { none: 'None', schleife: 'Bow', halstuch: 'Scarf', krone: 'Crown', blume: 'Flower', brille: 'Glasses', muetze: 'Cap' };
  const extra = (EXTRA_NAMES as Record<string, { de: string; en: string }>)[id];
  if (extra) return en ? extra.en : extra.de;
  return (en ? e : de)[id] ?? id;
}
