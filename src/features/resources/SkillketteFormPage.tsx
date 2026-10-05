import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { skillkettenRepo } from './skillkettenRepo';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';
import type { Skillkette, SkillketteStage } from '../../data/types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function blankStage(): SkillketteStage {
  return {};
}

function blankSkillkette(): Skillkette {
  return {
    id: createId('skk'),
    title: '',
    stufeHoch: blankStage(),
    stufeMittel: blankStage(),
    stufeNiedrig: blankStage(),
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * "Fuer die Skillketten folgendes bauen... die einzelnen Schritte
 * sollen visuell gezeigt werden... man sucht sich Skills aus"-Auftrag
 * — a full page (not a modal, given ~19 fields — more room than a
 * squeezed-in dialog allows) with the person's own five-section
 * template. The three stages render as connected cards (an arrow
 * between each) tinted with their own tension-range color, each
 * action a SELECT of existing Skill resources, not free text — the
 * person builds the chain by picking from Skills they already have.
 *
 * Mounted fresh per route param (:id or "neu") rather than needing a
 * key={} trick — this is a page, not a component instance toggled by
 * a boolean, so React already remounts it on navigation.
 */
export function SkillketteFormPage() {
  const t = useT();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const existing = id ? skillkettenRepo.getById(id) : null;
  const [draft, setDraft] = useState<Skillkette>(() => existing ?? blankSkillkette());

  const skills = resourcesRepo.getAll().filter((r) => RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten');

  function setStage(key: 'stufeHoch' | 'stufeMittel' | 'stufeNiedrig', patch: Partial<SkillketteStage>) {
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function handleSave() {
    if (!draft.title.trim()) return;
    skillkettenRepo.save({ ...draft, updatedAt: new Date().toISOString() });
    // "Ich finde die Skillkette dann nicht gespeichert"-Fund — used to
    // go back to the Skills page, where nothing showed the new chain.
    // Now lands on the chain itself (replace: Back doesn't return to the form).
    navigate(`/entdecken/ressourcen/skillketten/${draft.id}`, { replace: true });
  }

  const stages: { key: 'stufeHoch' | 'stufeMittel' | 'stufeNiedrig'; icon: string; title: string; range: string; color: string; aktion1Label: string; aktion2Label: string }[] = [
    { key: 'stufeHoch', icon: '🚨', title: t.resources.skillketteStufeHochTitle, range: '70–100 %', color: '#c9522f', aktion1Label: t.resources.skillketteAktionKoerperchemie, aktion2Label: t.resources.skillketteAktionMotorik },
    { key: 'stufeMittel', icon: '⚠️', title: t.resources.skillketteStufeMittelTitle, range: '40–70 %', color: '#e8a83d', aktion1Label: t.resources.skillketteAktionSensorik, aktion2Label: t.resources.skillketteAktionKognitiv },
    { key: 'stufeNiedrig', icon: '🧘', title: t.resources.skillketteStufeNiedrigTitle, range: '0–40 %', color: '#6fbf73', aktion1Label: t.resources.skillketteAktionKomfort, aktion2Label: t.resources.skillketteAktionAchtsamkeit },
  ];

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="ressourcen" />} />
      <div className="px-5 pb-10">
        <h1 className="text-[24px] mb-4">{existing ? draft.title || t.resources.skillketteFormTitle : t.resources.skillketteFormTitleNew}</h1>

        <div className="flex flex-col gap-4">
          <Field label={t.resources.skillketteNameLabel}>
            <input autoFocus className="input" placeholder={t.resources.skillketteNamePlaceholder} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required />
          </Field>

          <Field label={t.resources.skillketteSubtitleLabel}>
            <input className="input" placeholder={t.resources.skillketteSubtitlePlaceholder} value={draft.subtitle ?? ''} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
          </Field>

          <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">{t.resources.skillketteSection1Title}</p>
            <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.skillketteSection1Hint}</p>
            <div className="flex flex-col gap-3">
              <Field label={t.resources.skillketteTriggerLabel}>
                <textarea className="input" rows={2} placeholder={t.resources.skillketteTriggerPlaceholder} value={draft.notfallTrigger ?? ''} onChange={(e) => setDraft({ ...draft, notfallTrigger: e.target.value })} />
              </Field>
              <Field label={t.resources.skillketteWarnsignaleLabel}>
                <textarea className="input" rows={2} placeholder={t.resources.skillketteWarnsignalePlaceholder} value={draft.koerperlicheWarnsignale ?? ''} onChange={(e) => setDraft({ ...draft, koerperlicheWarnsignale: e.target.value })} />
              </Field>
              <Field label={t.resources.skillketteStartLabel}>
                <input className="input" placeholder="z. B. 80" value={draft.startProzent ?? ''} onChange={(e) => setDraft({ ...draft, startProzent: e.target.value })} />
              </Field>
            </div>
          </div>

          <p className="text-[13px] font-semibold text-[var(--color-text)] mt-2">{t.resources.skillketteSection2Title}</p>

          {stages.map((stage, i) => (
            <div key={stage.key}>
              <div className="rounded-[var(--radius-lg)] p-3.5 border-2" style={{ borderColor: stage.color, background: `${stage.color}14` }}>
                <p className="text-[13px] font-semibold mb-0.5" style={{ color: stage.color }}>
                  {stage.icon} {stage.title}
                </p>
                <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.resources.skillketteAnspannung}: {stage.range}</p>
                <div className="flex flex-col gap-3">
                  <Field label={t.resources.skillketteZielLabel}>
                    <input className="input" value={draft[stage.key].ziel ?? ''} onChange={(e) => setStage(stage.key, { ziel: e.target.value })} />
                  </Field>
                  <Field label={stage.aktion1Label}>
                    <select className="input" value={draft[stage.key].aktion1SkillId ?? ''} onChange={(e) => setStage(stage.key, { aktion1SkillId: e.target.value || undefined })}>
                      <option value="">{t.resources.skillketteSkillAuswahlPlaceholder}</option>
                      {skills.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={stage.aktion2Label}>
                    <select className="input" value={draft[stage.key].aktion2SkillId ?? ''} onChange={(e) => setStage(stage.key, { aktion2SkillId: e.target.value || undefined })}>
                      <option value="">{t.resources.skillketteSkillAuswahlPlaceholder}</option>
                      {skills.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t.resources.skillketteDauerLabel}>
                    <input className="input" value={draft[stage.key].dauer ?? ''} onChange={(e) => setStage(stage.key, { dauer: e.target.value })} />
                  </Field>
                </div>
              </div>
              {i < stages.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown size={20} className="text-[var(--color-text-faint)]" />
                </div>
              )}
            </div>
          ))}

          <div className="rounded-[var(--radius-lg)] p-3.5 mt-2" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1">{t.resources.skillketteSection3Title}</p>
            <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.skillketteSection3Hint}</p>
            <div className="flex flex-col gap-3">
              <Field label={t.resources.skillketteLogistikZuhauseLabel}>
                <textarea className="input" rows={2} placeholder={t.resources.skillketteLogistikZuhausePlaceholder} value={draft.logistikZuhause ?? ''} onChange={(e) => setDraft({ ...draft, logistikZuhause: e.target.value })} />
              </Field>
              <Field label={t.resources.skillketteLogistikUnterstuetzungLabel}>
                <textarea className="input" rows={2} placeholder={t.resources.skillketteLogistikUnterstuetzungPlaceholder} value={draft.logistikUnterstuetzung ?? ''} onChange={(e) => setDraft({ ...draft, logistikUnterstuetzung: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] p-3.5 border" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2">{t.resources.skillketteSection4Title}</p>
            <div className="flex flex-col gap-3">
              <Field label={t.resources.skillketteStopCheckLabel}>
                <textarea className="input" rows={2} placeholder={t.resources.skillketteStopCheckPlaceholder} value={draft.stopCheckRegel ?? ''} onChange={(e) => setDraft({ ...draft, stopCheckRegel: e.target.value })} />
              </Field>
              <Field label={t.resources.skillkettePlanBLabel}>
                <textarea className="input" rows={2} placeholder={t.resources.skillkettePlanBPlaceholder} value={draft.planB ?? ''} onChange={(e) => setDraft({ ...draft, planB: e.target.value })} />
              </Field>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <Button fullWidth onClick={handleSave} disabled={!draft.title.trim()}>
              {t.common.save}
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
