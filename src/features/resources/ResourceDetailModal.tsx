import { useState } from 'react';
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
import { createId } from '../../services/storage/repository';
import type { Resource, ResourceCategory } from '../../data/types';
import { SENSORY_MODALITIES } from '../../data/sensoryModalities';
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

        {resource.description && (
          <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{resource.description}</p>
        )}

        {resource.sensoryModalities && resource.sensoryModalities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {resource.sensoryModalities.map((id) => {
              const m = SENSORY_MODALITIES.find((s) => s.id === id);
              if (!m) return null;
              return (
                <span key={id} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                  {m.emoji} {m.label}
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
