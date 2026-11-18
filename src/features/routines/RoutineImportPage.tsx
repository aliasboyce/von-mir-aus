import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Play } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SharedIdeaIntro } from '../../components/shared/SharedIdeaIntro';
import { BrowserTabNotice } from '../../components/shared/BrowserTabNotice';
import { useL } from '../projects/useL';
import { routinesRepo } from './routinesRepo';
import { routineFromPayload, sanitizeRoutinePayload } from '../../services/routineShare';

/** Takes over a routine someone sent (e.g. a helper built it for you). Nothing is saved until “Übernehmen”. */
export function RoutineImportPage() {
  const { L } = useL();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [savedId, setSavedId] = useState<string | null>(null);
  const payload = useMemo(() => {
    const raw = params.get('data');
    if (!raw) return null;
    try {
      return sanitizeRoutinePayload(JSON.parse(decodeURIComponent(raw)));
    } catch {
      return null;
    }
  }, [params]);

  const accept = () => {
    if (!payload) return;
    const r = routineFromPayload(payload);
    routinesRepo.save(r);
    setSavedId(r.id);
  };

  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-8">
        {!payload ? (
          <EmptyState title={L('Dieser Link enthält keine lesbare Routine.', 'This link does not contain a readable routine.')} />
        ) : savedId ? (
          <div className="flex flex-col items-center text-center gap-4 py-10" data-testid="routine-import-saved">
            <Check size={40} className="text-[var(--color-primary)]" />
            <p className="text-[16px] text-[var(--color-text)]">{L('Die Routine ist jetzt in deinem Garten – du kannst sie ändern, löschen oder starten.', 'The routine is now in your garden – you can change, delete or start it.')}</p>
            <Button icon={<Play size={16} />} onClick={() => navigate(`/entdecken/routinen/${savedId}/start`)}>{L('Jetzt starten', 'Start now')}</Button>
            <Button variant="secondary" onClick={() => navigate('/entdecken/garten')}>{L('Zu meinen Routinen', 'To my routines')}</Button>
          </div>
        ) : (
          <>
            <BrowserTabNotice />
            <SharedIdeaIntro kind="routine" from={payload.from} />
            <Card className="mb-5" data-testid="routine-import-preview">
              <p className="text-[18px] text-[var(--color-text)] mb-1">{payload.emoji} {payload.title}</p>
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-3">{L(`${payload.cards.length} kleine Schritte – beim Abspielen immer nur einer auf dem Bildschirm.`, `${payload.cards.length} small steps – only one on screen at a time.`)}</p>
              <ol className="flex flex-col gap-2">
                {payload.cards.map((c, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: c.color ? `${c.color}66` : 'var(--color-surface-muted)' }}>
                    <span className="text-[20px]" aria-hidden="true">{c.emoji ?? '🔹'}</span>
                    <span className="flex-1 text-[14.5px] text-[var(--color-text)]">{c.text}</span>
                    {c.timerSec ? <span className="text-[12px] text-[var(--color-text-muted)]">{Math.max(1, Math.round(c.timerSec / 60))} min</span> : null}
                  </li>
                ))}
              </ol>
            </Card>
            <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mb-4">{L('Es kommt nur der Ablauf an – keine Fotos, Medikamente oder Verknüpfungen der anderen Person. Du kannst alles danach ändern.', 'Only the sequence arrives – no photos, medication or links from the other person. You can change everything afterwards.')}</p>
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={accept} data-testid="routine-import-accept">{L('Übernehmen', 'Take over')}</Button>
              <Button fullWidth variant="ghost" onClick={() => navigate('/entdecken/garten')}>{L('Später', 'Later')}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
