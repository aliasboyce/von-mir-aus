import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Link as LinkIcon, Pencil, Trash2, NotebookPen, Check, FileDown, Link2, Timer as TimerIcon } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { diaryRepo } from '../diary/diaryRepo';
import { DIARY_DEFAULT_CATEGORY_ID } from '../diary/diaryCategories';
import { logActivity } from '../../services/activityLog';
import { HelpfulnessPrompt } from '../../components/shared/HelpfulnessPrompt';
import { ResourceTimerView } from './ResourceTimerView';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';
import { createId } from '../../services/storage/repository';
import type { Resource, ResourceCategory } from '../../data/types';
import { ACCESS_CHANNEL_META } from '../zugangskanaele/accessChannels';
import { PhotoBackground } from '../../components/shared/PhotoBackground';

interface ResourceDetailModalProps {
  resource: Resource | null;
  categoryLabel: (cat: ResourceCategory) => string;
  onClose: () => void;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => boolean | void;
  onToggleFavorite: (resource: Resource) => void;
  onShareLink: (resource: Resource) => void;
  onExportPdf: (resource: Resource) => void;
}

export function ResourceDetailModal({
  resource,
  categoryLabel,
  onClose,
  onEdit,
  onDelete,
  onToggleFavorite,
  onShareLink,
  onExportPdf,
}: ResourceDetailModalProps) {
  const t = useT();
  const navigate = useNavigate();
  const say = useCompanionSay();
  const [savedToDiary, setSavedToDiary] = useState(false);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);
  const [timerOpen, setTimerOpen] = useState(false);
  const [diaryDraft, setDiaryDraft] = useState<string | null>(null);
  if (!resource) return null;

  function saveToDiary() {
    if (!resource) return;
    const now = new Date().toISOString();
    diaryRepo.save({
      id: createId('diary'),
      createdAt: now,
      updatedAt: now,
      categoryId: DIARY_DEFAULT_CATEGORY_ID,
      content: `${t.resources.usedResource}: ${resource.title}`,
    });
    const activityId = logActivity('resource', resource.title, resource.id);
    setLastActivityId(activityId);
    setSavedToDiary(true);
    say(pickLine({ page: '/sicherheit/tagebuch', trigger: 'speichern' }), { joy: true });
    setTimeout(() => setSavedToDiary(false), 1800);
  }

  function openDiaryDraftFromTimer(durationMin: number) {
    if (!resource) return;
    const timeLabel = new Date().toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const durationLabel = durationMin >= 60 ? `${(durationMin / 60).toFixed(durationMin % 60 === 0 ? 0 : 1)} h` : `${durationMin} min`;
    setDiaryDraft(`${resource.title}\n${timeLabel} · ${durationLabel}`);
  }

  function confirmDiaryDraft() {
    if (!diaryDraft) return;
    diaryRepo.save({
      id: createId('diary'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: diaryDraft,
    });
    setDiaryDraft(null);
    say(pickLine({ page: '/sicherheit/tagebuch', trigger: 'speichern' }), { joy: true });
  }

  return (
    <Modal open={!!resource} onClose={onClose} title={resource.title} subtitle={categoryLabel(resource.category)} flipAnimation>
      <div className="flex flex-col gap-4">
        {resource.image && (
          <PhotoBackground src={resource.image} className="w-full h-40 rounded-[var(--radius-lg)] bg-cover bg-center bg-[var(--color-surface-muted)]" />
        )}

        {/* "Es soll den Button geben 'Skill starten'"-Auftrag — opens the
         * run page (count-up timer without an end + the step list),
         * only for skills, not for Hilfsmittel or other resources. */}
        {RESOURCE_CATEGORY_TO_GROUP[resource.category] === 'faehigkeiten' && (
          <Button fullWidth onClick={() => navigate(`/entdecken/ressourcen/skill-start/${resource.id}`)}>
            {t.skillRun.startCta}
          </Button>
        )}

        {/* "Skills erstellen, strukturiertes Formular"-Auftrag — a
         * skill saved through SkillFormModal renders its structured
         * sections here instead of a plain paragraph; a skill without
         * skillDetails (every existing one, and anything from
         * Hilfsmittel) falls back to the plain description exactly as
         * before. Each sub-field only renders if it actually has
         * content, so a half-filled skill never shows empty labels. */}
        {resource.skillDetails ? (
          <SkillDetailsView details={resource.skillDetails} description={resource.description} />
        ) : resource.hilfsmittelDetails ? (
          <HilfsmittelDetailsView details={resource.hilfsmittelDetails} description={resource.description} />
        ) : (
          resource.description && <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{resource.description}</p>
        )}

        {resource.accessChannels && resource.accessChannels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {resource.accessChannels.map((id) => {
              const meta = ACCESS_CHANNEL_META[id];
              if (!meta) return null;
              return (
                <span key={id} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)] flex items-center gap-1">
                  <meta.icon size={12} /> {meta.label(t)}
                </span>
              );
            })}
          </div>
        )}

        {resource.note && (
          <p className="text-[13px] text-[var(--color-text-muted)] italic leading-relaxed">„{resource.note}“</p>
        )}

        {resource.link && (
          <a
            href={resource.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[13px] text-[var(--color-primary)] break-all"
          >
            <LinkIcon size={14} className="flex-shrink-0" />
            {resource.link}
          </a>
        )}

        <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button
            variant="ghost"
            icon={<Heart size={15} className={resource.favorite ? 'fill-current text-[var(--color-accent-clay)]' : ''} />}
            onClick={() => onToggleFavorite(resource)}
          >
            {t.common.favorite}
          </Button>
          <Button variant="ghost" icon={<Link2 size={15} />} onClick={() => onShareLink(resource)}>
            {t.resources.shareLink}
          </Button>
          <Button variant="ghost" icon={<FileDown size={15} />} onClick={() => onExportPdf(resource)}>
            {t.resources.exportPdf}
          </Button>
        </div>
        <p className="text-[11px] text-[var(--color-text-faint)] mb-2 leading-relaxed">{t.resources.shareVsPdfHint}</p>
        {resource.favorite && (
          <p className="text-[11px] text-[var(--color-text-faint)] mb-1">{t.resources.favoriteToNetworkHint}</p>
        )}
        <Button variant="ghost" fullWidth icon={<TimerIcon size={15} />} onClick={() => setTimerOpen(true)}>
          {t.bridges.startTimer}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          icon={savedToDiary ? <Check size={15} /> : <NotebookPen size={15} />}
          onClick={saveToDiary}
        >
          {savedToDiary ? t.resources.savedToDiary : t.resources.saveToDiary}
        </Button>
        {lastActivityId && <HelpfulnessPrompt activityId={lastActivityId} />}
        <div className="flex gap-2">
          <Button variant="ghost" icon={<Pencil size={15} />} onClick={() => onEdit(resource)}>
            {t.common.edit}
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={15} />}
            onClick={() => {
              const deleted = onDelete(resource.id);
              if (deleted !== false) onClose();
            }}
          >
            {t.common.delete}
          </Button>
        </div>
      </div>

      {timerOpen && (
        <ResourceTimerView
          contextLabel={resource.title}
          onClose={() => setTimerOpen(false)}
          onNaturalComplete={(durationMin) => {
            setTimerOpen(false);
            openDiaryDraftFromTimer(durationMin);
          }}
        />
      )}

      <Modal open={!!diaryDraft} onClose={() => setDiaryDraft(null)} title={t.mediLog.addToDiary}>
        {diaryDraft && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bridges.howWasIt}</span>
              <textarea autoFocus className="input" rows={4} value={diaryDraft} onChange={(e) => setDiaryDraft(e.target.value)} />
            </label>
            <Button fullWidth onClick={confirmDiaryDraft}>
              {t.mediLog.confirmAddToDiary}
            </Button>
          </div>
        )}
      </Modal>
    </Modal>
  );
}

/** Mirrors SkillDetailsView below, for the Hilfsmittel structured
 * template instead (see HilfsmittelFormModal.tsx): Funktion des
 * Objekts, Einsatz-Moment, Gebrauchsanweisung, fester Platz,
 * Pflege & Vorbereitung — each sub-field only shown when filled in. */
function HilfsmittelDetailsView({ details, description }: { details: NonNullable<Resource['hilfsmittelDetails']>; description?: string }) {
  const t = useT();
  const hasSection1 = details.beruhigungTrost || details.fokusAblenkung || details.ventilAnspannung;
  const hasSection2 = details.anspannungsbereich || details.alarmSituation;
  const hasSection3 = details.dauer || details.methode || details.ausschlusskriterium;
  const hasSection4 = details.platzZuhause || details.platzUnterwegs;
  const hasSection5 = !!details.bereitschaft;

  return (
    <div className="flex flex-col gap-3">
      {details.subtitle && <p className="text-[14px] text-[var(--color-text-muted)] italic">{details.subtitle}</p>}
      {description && <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{description}</p>}

      {hasSection1 && (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.hilfsmittelSection1Title}</p>
          {details.beruhigungTrost && <p className="text-[13px] text-[var(--color-text)] mb-1">{details.beruhigungTrost}</p>}
          {details.fokusAblenkung && <p className="text-[13px] text-[var(--color-text)] mb-1">{details.fokusAblenkung}</p>}
          {details.ventilAnspannung && <p className="text-[13px] text-[var(--color-text)]">{details.ventilAnspannung}</p>}
        </div>
      )}

      {hasSection2 && (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.hilfsmittelSection2Title}</p>
          {details.anspannungsbereich && (
            <p className="text-[13px] text-[var(--color-text)] mb-1">
              <span className="text-[var(--color-text-faint)]">{t.resources.hilfsmittelAnspannungsbereichLabel}: </span>
              {details.anspannungsbereich}
            </p>
          )}
          {details.alarmSituation && <p className="text-[13px] text-[var(--color-text)]">{details.alarmSituation}</p>}
        </div>
      )}

      {hasSection3 && (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.hilfsmittelSection3Title}</p>
          {details.dauer && (
            <p className="text-[13px] text-[var(--color-text)] mb-1">
              <span className="text-[var(--color-text-faint)]">{t.resources.hilfsmittelDauerLabel}: </span>
              {details.dauer}
            </p>
          )}
          {details.methode && <p className="text-[13px] text-[var(--color-text)] mb-1">{details.methode}</p>}
          {details.ausschlusskriterium && <p className="text-[13px] text-[var(--color-text)]">{details.ausschlusskriterium}</p>}
        </div>
      )}

      {hasSection4 && (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.hilfsmittelSection4Title}</p>
          {details.platzZuhause && (
            <p className="text-[13px] text-[var(--color-text)] mb-1">
              <span className="text-[var(--color-text-faint)]">{t.resources.hilfsmittelPlatzZuhauseLabel}: </span>
              {details.platzZuhause}
            </p>
          )}
          {details.platzUnterwegs && (
            <p className="text-[13px] text-[var(--color-text)]">
              <span className="text-[var(--color-text-faint)]">{t.resources.hilfsmittelPlatzUnterwegsLabel}: </span>
              {details.platzUnterwegs}
            </p>
          )}
        </div>
      )}

      {hasSection5 && (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.hilfsmittelSection5Title}</p>
          <p className="text-[13px] text-[var(--color-text)]">{details.bereitschaft}</p>
        </div>
      )}
    </div>
  );
}

/** Renders a skill's structured sections (see SkillFormModal.tsx for
 * where this data comes from), each sub-field shown only when it
 * actually has content. Deliberately mirrors the person's own
 * four-section template: Einsatzbereich, Wirkung, Schritt-fuer-
 * Schritt, Hinweise — the last one visually called out (border +
 * warning icon) since it's specifically about risks/pitfalls. */
function SkillDetailsView({ details, description }: { details: NonNullable<Resource['skillDetails']>; description?: string }) {
  const t = useT();
  const hasSection1 = details.anspannungsbereich || details.ausloeser || details.fruehwarnzeichen;
  const hasSection2 = details.wirkung || details.wirkungsdauer;
  const hasSteps = details.schritte && details.schritte.length > 0;
  const hasSection4 = details.gegenanzeigen || details.unterwegsAlternative;

  return (
    <div className="flex flex-col gap-3">
      {details.subtitle && <p className="text-[14px] text-[var(--color-text-muted)] italic">{details.subtitle}</p>}
      {description && <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{description}</p>}

      {hasSection1 && (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.skillSection1Title}</p>
          {details.anspannungsbereich && (
            <p className="text-[13px] text-[var(--color-text)] mb-1">
              <span className="text-[var(--color-text-faint)]">{t.resources.skillAnspannungsbereichLabel}: </span>
              {details.anspannungsbereich}
            </p>
          )}
          {details.ausloeser && (
            <p className="text-[13px] text-[var(--color-text)] mb-1">
              <span className="text-[var(--color-text-faint)]">{t.resources.skillAusloeserLabel}: </span>
              {details.ausloeser}
            </p>
          )}
          {details.fruehwarnzeichen && (
            <p className="text-[13px] text-[var(--color-text)]">
              <span className="text-[var(--color-text-faint)]">{t.resources.skillFruehwarnzeichenLabel}: </span>
              {details.fruehwarnzeichen}
            </p>
          )}
        </div>
      )}

      {hasSection2 && (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">{t.resources.skillSection2Title}</p>
          {details.wirkung && <p className="text-[13px] text-[var(--color-text)] mb-1">{details.wirkung}</p>}
          {details.wirkungsdauer && (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              <span className="text-[var(--color-text-faint)]">{t.resources.skillWirkungsdauerLabel}: </span>
              {details.wirkungsdauer}
            </p>
          )}
        </div>
      )}

      {hasSteps && (
        <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-2">{t.resources.skillSection3Title}</p>
          <ol className="flex flex-col gap-1.5">
            {details.schritte!.map((s, i) => (
              <li key={i} className="text-[13px] text-[var(--color-text)] flex gap-2">
                <span className="text-[var(--color-text-faint)] flex-shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {hasSection4 && (
        <div className="rounded-[var(--radius-lg)] p-3.5 border" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-[12.5px] font-semibold text-[var(--color-text)] mb-1.5">⚠️ {t.resources.skillSection4Title}</p>
          {details.gegenanzeigen && (
            <p className="text-[13px] text-[var(--color-text)] mb-1">
              <span className="text-[var(--color-text-faint)]">{t.resources.skillGegenanzeigenLabel}: </span>
              {details.gegenanzeigen}
            </p>
          )}
          {details.unterwegsAlternative && (
            <p className="text-[13px] text-[var(--color-text)]">
              <span className="text-[var(--color-text-faint)]">{t.resources.skillAlternativeLabel}: </span>
              {details.unterwegsAlternative}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
