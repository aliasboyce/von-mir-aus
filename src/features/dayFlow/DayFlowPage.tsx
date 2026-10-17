import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { LichtCompanion } from '../../components/companion/LichtCompanion';
import { routinesRepo } from '../routines/routinesRepo';
import { doneOptions, markOpened, toggleManual, type DayOptionId, type DayPhase } from './dayFlowRepo';
import { useDayFlowTexts } from './dayFlowTexts';

interface Option {
  id: DayOptionId;
  emoji: string;
  title: string;
  sub: string;
  to?: string;
}

/**
 * Hub behind "Den Tag beginnen" / "Tag abschließen": a few doors. Back from a door lands here again,
 * and whatever was really done (saved) since the hub was opened shows green.
 */
export function DayFlowPage({ phase }: { phase: DayPhase }) {
  const dx = useDayFlowTexts();
  const navigate = useNavigate();
  const [, bump] = useState(0);
  const [routinesOpen, setRoutinesOpen] = useState(false);
  useEffect(() => {
    markOpened(phase);
    bump((n) => n + 1);
  }, [phase]);
  const done = doneOptions(phase);
  const routines = routinesRepo.getAll().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const start = phase === 'start';

  const options: Option[] = start
    ? [
        { id: 'skill', emoji: '✨', title: dx.skill, sub: dx.skillSub, to: '/entdecken/ressourcen/skills' },
        { id: 'medi', emoji: '💊', title: dx.medi, sub: dx.mediSub, to: '/entdecken/medi-log' },
        { id: 'diary', emoji: '📓', title: dx.diaryStart, sub: dx.diaryStartSub, to: '/sicherheit/tagebuch?template=builtin-tag-ausrichten' },
        { id: 'routine', emoji: '🔁', title: dx.routine, sub: dx.routineSub },
      ]
    : [
        { id: 'skill', emoji: '✨', title: dx.skill, sub: dx.skillSub, to: '/entdecken/ressourcen/skills' },
        { id: 'diary', emoji: '📓', title: dx.diaryEnd, sub: dx.diaryEndSub, to: '/sicherheit/tagebuch?template=builtin-abendlicher-rueckblick' },
        { id: 'park', emoji: '📦', title: dx.park, sub: dx.parkSub, to: '/parkbox' },
        { id: 'letgo', emoji: '🍃', title: dx.letgo, sub: dx.letgoSub, to: '/entdecken/loslassen' },
        { id: 'routine', emoji: '🔁', title: dx.routine, sub: dx.routineSub },
      ];
  const doneCount = options.filter((o) => done.has(o.id)).length;
  const allDone = doneCount === options.length;

  function open(o: Option) {
    if (o.id === 'routine') {
      if (routines.length === 0) navigate('/entdecken/garten');
      else setRoutinesOpen((v) => !v);
      return;
    }
    if (o.to) navigate(o.to);
  }

  return (
    <div className="animate-in" data-testid={`day-flow-${phase}`}>
      <TopBar />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{start ? dx.startTitle : dx.endTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5">{start ? dx.startSub : dx.endSub}</p>
        {doneCount > 0 && (
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] p-3" style={{ background: 'var(--color-primary-soft)' }} data-testid="day-flow-note">
            <LichtCompanion size="small" joyBurst={allDone ? 'dance' : 'hop'} />
            <p className="text-[13.5px] text-[var(--color-text)] leading-snug">{allDone ? dx.allDone : dx.someDone}</p>
          </div>
        )}
        <div className="flex flex-col gap-3 mt-3">
          {options.map((o) => {
            const isDone = done.has(o.id);
            return (
              <div key={o.id}>
                <Card
                  padding="md"
                  className="flex items-center gap-3"
                  style={isDone ? { background: 'color-mix(in srgb, #6fbf73 18%, var(--color-surface))', borderColor: '#6fbf73' } : undefined}
                  data-testid={`day-opt-${o.id}`}
                  data-done={isDone ? 'true' : 'false'}
                >
                  <button type="button" onClick={() => open(o)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <span className="text-[26px] flex-shrink-0" aria-hidden="true">{o.emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-[15.5px] text-[var(--color-text)] leading-snug">{o.title}</span>
                      <span className="block text-[12.5px] text-[var(--color-text-muted)]" data-hint>{o.sub}</span>
                    </span>
                    {o.id === 'routine' && routines.length > 0 && <ChevronDown size={16} className="ml-auto flex-shrink-0 text-[var(--color-text-muted)]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleManual(phase, o.id);
                      bump((n) => n + 1);
                    }}
                    aria-label={isDone ? dx.untick : dx.tick}
                    aria-pressed={isDone}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border"
                    style={isDone ? { background: '#6fbf73', borderColor: '#6fbf73', color: '#fff' } : { borderColor: 'var(--color-border-strong)', color: 'transparent' }}
                    data-testid={`day-tick-${o.id}`}
                  >
                    <Check size={17} />
                  </button>
                </Card>
                {o.id === 'routine' && routinesOpen && (
                  <div className="flex flex-col gap-2 mt-2 pl-4 animate-in">
                    {routines.map((r) => (
                      <button key={r.id} type="button" onClick={() => navigate(`/entdecken/routinen/${r.id}/start`)} className="text-left rounded-[var(--radius-lg)] px-4 py-3 text-[14.5px] text-[var(--color-text)] bg-[var(--color-surface-muted)]" data-testid={`day-routine-${r.id}`}>
                        {r.emoji} {r.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => navigate('/')} className="mt-6 block mx-auto text-[13.5px] text-[var(--color-primary)] underline underline-offset-2" data-testid="day-flow-home">
          {dx.toHome}
        </button>
      </div>
    </div>
  );
}
