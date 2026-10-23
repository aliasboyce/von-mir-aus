import { useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { BridgeTimerView } from '../bridges/BridgeTimerView';
import { diaryRepo } from '../diary/diaryRepo';
import { createId } from '../../services/storage/repository';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { useT } from '../../i18n';

/**
 * Deliberately reuses BridgeTimerView as-is (durations, companion
 * presence/tap, cancel confirmation, sleep mode, diary hand-off) instead
 * of building a second timer implementation - the only difference here is
 * that the "context" is a free-typed intention instead of a bridge/level.
 */
export function SimpleTimerPage() {
  const t = useT();
  const say = useCompanionSay();
  const [intention, setIntention] = useState('');
  const [timerOpen, setTimerOpen] = useState(false);
  const [diaryDraft, setDiaryDraft] = useState<string | null>(null);

  function start() {
    setTimerOpen(true);
  }

  function handleNaturalComplete(durationMin: number) {
    setTimerOpen(false);
    const timeLabel = new Date().toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const durationLabel = durationMin >= 60 ? `${(durationMin / 60).toFixed(durationMin % 60 === 0 ? 0 : 1)} h` : `${durationMin} min`;
    const parts = [intention.trim() || t.simpleTimer.title, `${timeLabel} · ${durationLabel}`].filter(Boolean);
    setDiaryDraft(parts.join('\n'));
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
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="timer" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.simpleTimer.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.simpleTimer.subtitle}</p>

        <div className="flex items-start gap-3 mb-6">
          <InlineCompanionNote />
          <p className="text-[14px] text-[var(--color-text)] flex-1">{t.simpleTimer.prompt}</p>
        </div>

        <input
          className="input mb-4"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder={t.simpleTimer.placeholder}
          maxLength={80}
        />

        <Button fullWidth onClick={start}>
          {t.bridges.startTimer}
        </Button>
      </div>

      {timerOpen && (
        <BridgeTimerView
          contextLabel={intention.trim() || t.simpleTimer.title}
          onClose={() => setTimerOpen(false)}
          onNaturalComplete={handleNaturalComplete}
        />
      )}

      <Modal open={!!diaryDraft} onClose={() => setDiaryDraft(null)} title={t.mediLog.addToDiary}>
        {diaryDraft && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bridges.howWasIt}</span>
              <textarea
                autoFocus
                className="input"
                rows={4}
                value={diaryDraft}
                onChange={(e) => setDiaryDraft(e.target.value)}
              />
            </label>
            <Button fullWidth onClick={confirmDiaryDraft}>
              {t.mediLog.confirmAddToDiary}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
