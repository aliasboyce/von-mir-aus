import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { OwnImageControl } from '../../components/shared/OwnImageControl';
import { goBack } from '../../services/navigation';
import { resourcesRepo } from '../resources/resourcesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { oldProtectionStrategies } from '../accessBuildingBlocks/strategyList';
import { RoutineCard3D } from './RoutineCard3D';
import { ROUTINE_COLORS, ROUTINE_EMOJIS, newCard, newRoutine, routinesRepo, type Routine, type RoutineCard } from './routinesRepo';
import { useRoutineTexts } from './routineTexts';
import { useSettings } from '../../state/SettingsContext';

const TIMER_PRESETS = [30, 60, 120, 300, 600, 900];

function timerLabel(sec: number, en: boolean): string {
  return sec < 60 ? `${sec} ${en ? 's' : 'Sek.'}` : `${Math.round(sec / 60)} Min.`;
}

/** Create / edit a routine: title, then the cards in order. Everything beyond the step text is optional and folded away. */
export function RoutineEditorPage() {
  const { id } = useParams<{ id: string }>();
  const rt = useRoutineTexts();
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const navigate = useNavigate();
  const existing = id ? routinesRepo.getById(id) : undefined;
  const [searchParams] = useSearchParams();
  const [routine, setRoutine] = useState<Routine>(() => existing ?? newRoutine({ alternativeFor: searchParams.get('alternativeFor') || undefined }));
  const [open, setOpen] = useState<string | null>(() => (existing ? null : routine.cards[0]?.id ?? null));
  const [moreOpen, setMoreOpen] = useState<Set<string>>(new Set());
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const gardens = useMemo(() => gardenRepo.getAll().filter((g) => g.kind === 'aufbau' && g.status !== 'ended'), []);
  const strategies = useMemo(() => oldProtectionStrategies(), []);

  function patchCard(cardId: string, patch: Partial<RoutineCard>) {
    setRoutine((r) => ({ ...r, cards: r.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)) }));
  }
  function move(i: number, dir: -1 | 1) {
    setRoutine((r) => {
      const cards = [...r.cards];
      const j = i + dir;
      if (j < 0 || j >= cards.length) return r;
      [cards[i], cards[j]] = [cards[j], cards[i]];
      return { ...r, cards };
    });
  }
  function addCard() {
    const c = newCard({ color: ROUTINE_COLORS[(routine.cards.length + 1) % ROUTINE_COLORS.length], emoji: '🌱' });
    setRoutine((r) => ({ ...r, cards: [...r.cards, c] }));
    setOpen(c.id);
  }
  function removeCard(cardId: string) {
    setRoutine((r) => ({ ...r, cards: r.cards.filter((c) => c.id !== cardId) }));
  }
  function save() {
    const cards = routine.cards.filter((c) => c.text.trim());
    if (!routine.title.trim() || cards.length === 0) {
      setError(true);
      return;
    }
    routinesRepo.save({ ...routine, title: routine.title.trim(), cards: cards.map((c) => ({ ...c, text: c.text.trim() })), updatedAt: new Date().toISOString(), isExample: existing?.isExample && routine.title === existing.title ? existing.isExample : undefined });
    goBack(navigate, '/entdecken/garten');
  }

  return (
    <div className="animate-in">
      <TopBar onBack={() => goBack(navigate, '/entdecken/garten')} />
      <div className="px-5 pb-10">
        <h1 className="text-[24px] mb-4">{existing ? rt.editorEdit : rt.editorNew}</h1>

        <label className="block mb-4">
          <span className="block text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.titleLabel}</span>
          <input className="input" value={routine.title} placeholder={rt.titlePh} onChange={(e) => { setRoutine({ ...routine, title: e.target.value }); setError(false); }} data-testid="routine-title" />
        </label>

        <div className="mb-5">
          <span className="block text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.symbol}</span>
          <EmojiColor emoji={routine.emoji} color={routine.color} onEmoji={(emoji) => setRoutine({ ...routine, emoji })} onColor={(color) => setRoutine({ ...routine, color })} rt={rt} />
        </div>

        {strategies.length > 0 && (
          <label className="block mb-5">
            <span className="block text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.alternativeFor}</span>
            <select className="input" value={routine.alternativeFor ?? ''} onChange={(e) => setRoutine({ ...routine, alternativeFor: e.target.value || undefined })}>
              <option value="">{rt.alternativeNone}</option>
              {strategies.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        )}

        <p className="text-[14px] font-medium text-[var(--color-text)] mb-0.5">{rt.cardsLabel}</p>
        <p data-hint className="text-[12px] text-[var(--color-text-faint)] mb-3">{rt.cardsHint}</p>

        <div className="flex flex-col gap-3 mb-4">
          {routine.cards.map((c, i) => {
            const isOpen = open === c.id;
            const more = moreOpen.has(c.id);
            const linked = c.linked?.kind === 'resource' ? resourcesRepo.getById(c.linked.id)?.title : c.linked?.kind === 'person' ? networkRepo.getById(c.linked.id)?.name : undefined;
            return (
              <Card key={c.id} padding="md" data-testid={`routine-card-${i}`}>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-[18px] flex-shrink-0" style={{ background: `${c.color}33` }}>{c.emoji}</span>
                    <span className="text-[14px] text-[var(--color-text)] truncate">{i + 1}. {c.text || rt.cardTextPh}</span>
                    {isOpen ? <ChevronUp size={15} className="ml-auto flex-shrink-0" /> : <ChevronDown size={15} className="ml-auto flex-shrink-0" />}
                  </button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={rt.moveUp} className="p-1.5 rounded-full disabled:opacity-25"><ArrowUp size={15} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === routine.cards.length - 1} aria-label={rt.moveDown} className="p-1.5 rounded-full disabled:opacity-25"><ArrowDown size={15} /></button>
                </div>

                {isOpen && (
                  <div className="mt-4 flex flex-col gap-4 animate-in">
                    <div className="mx-auto w-full" style={{ maxWidth: 190, height: 150 }}>
                      <RoutineCard3D card={c} size="mini" className="h-full" />
                    </div>
                    <label className="block">
                      <span className="block text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.cardText}</span>
                      <input className="input" value={c.text} placeholder={rt.cardTextPh} onChange={(e) => patchCard(c.id, { text: e.target.value })} data-testid={`routine-card-text-${i}`} />
                    </label>
                    <EmojiColor emoji={c.emoji} color={c.color} onEmoji={(emoji) => patchCard(c.id, { emoji })} onColor={(color) => patchCard(c.id, { color })} rt={rt} />
                    <div>
                      <OwnImageControl image={c.image ?? ''} onChange={(url) => patchCard(c.id, { image: url || undefined })} fallback={() => ''} />
                    </div>

                    <button type="button" onClick={() => setMoreOpen((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })} className="text-[13px] text-[var(--color-primary)] self-start flex items-center gap-1" data-testid={`routine-more-${i}`}>
                      {more ? rt.less : rt.more} {more ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {more && (
                      <div className="flex flex-col gap-4 animate-in">
                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.timer}</p>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            <Pill on={!c.timerSec} onClick={() => patchCard(c.id, { timerSec: undefined })}>{rt.timerNone}</Pill>
                            {TIMER_PRESETS.map((s) => (
                              <Pill key={s} on={c.timerSec === s} onClick={() => patchCard(c.id, { timerSec: s })}>{timerLabel(s, en)}</Pill>
                            ))}
                          </div>
                          <label className="flex items-center gap-2">
                            <span className="text-[12.5px] text-[var(--color-text-muted)]">{rt.timerCustom}</span>
                            <input type="number" min={1} max={120} className="input" style={{ width: 80 }} value={c.timerSec && !TIMER_PRESETS.includes(c.timerSec) ? Math.round(c.timerSec / 60) : ''} onChange={(e) => { const m = Number(e.target.value); patchCard(c.id, { timerSec: m > 0 ? Math.min(120, m) * 60 : undefined }); }} />
                          </label>
                          <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{rt.timerNote}</p>
                        </div>

                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.garden}</p>
                          {gardens.length === 0 ? (
                            <p className="text-[12.5px] text-[var(--color-text-faint)]">{rt.gardenEmpty}</p>
                          ) : (
                            <select className="input" value={c.gardenId ?? ''} onChange={(e) => patchCard(c.id, { gardenId: e.target.value || undefined })} data-testid={`routine-garden-${i}`}>
                              <option value="">{rt.gardenNone}</option>
                              {gardens.map((g) => (
                                <option key={g.id} value={g.id}>🌱 {g.name}</option>
                              ))}
                            </select>
                          )}
                          <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{rt.gardenNote}</p>
                        </div>

                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.linked}</p>
                          {linked ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] text-[var(--color-text)]">{c.linked?.kind === 'person' ? '🤝' : '🎁'} {linked}</span>
                              <button type="button" onClick={() => patchCard(c.id, { linked: undefined })} className="text-[12.5px] text-[var(--color-text-faint)] underline">{rt.linkedRemove}</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setPickFor(c.id)} className="text-[13px] text-[var(--color-primary)]" data-testid={`routine-pick-${i}`}>＋ {rt.linkedPick}</button>
                          )}
                        </div>
                      </div>
                    )}

                    {routine.cards.length > 1 && (
                      <button type="button" onClick={() => removeCard(c.id)} className="text-[13px] text-[var(--color-danger)] self-start flex items-center gap-1.5">
                        <Trash2 size={14} /> {rt.deleteCard}
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Button fullWidth variant="secondary" icon={<Plus size={16} />} onClick={addCard} className="mb-6" data-testid="routine-add-card">{rt.addCard}</Button>

        {error && <p className="text-[13px] text-[var(--color-danger)] mb-3">{rt.needTitle}</p>}
        <div className="flex gap-2">
          <Button fullWidth onClick={save} data-testid="routine-save">{rt.save}</Button>
          <Button variant="ghost" onClick={() => goBack(navigate, '/entdecken/garten')}>{rt.cancel}</Button>
        </div>
      </div>

      <LinkPicker open={!!pickFor} onClose={() => setPickFor(null)} onPick={(linkedItem) => { if (pickFor) patchCard(pickFor, { linked: linkedItem }); setPickFor(null); }} />
    </div>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="px-3 py-1.5 rounded-full text-[12.5px]" style={{ background: on ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: on ? 'var(--color-surface)' : 'var(--color-text)' }}>
      {children}
    </button>
  );
}

function EmojiColor({ emoji, color, onEmoji, onColor, rt }: { emoji: string; color: string; onEmoji: (e: string) => void; onColor: (c: string) => void; rt: ReturnType<typeof useRoutineTexts> }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{rt.symbol}</p>
        <div className="flex flex-wrap gap-1.5">
          {ROUTINE_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => onEmoji(e)} className="w-9 h-9 rounded-full text-[18px] flex items-center justify-center" style={{ background: emoji === e ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)', outline: emoji === e ? '2px solid var(--color-primary)' : 'none' }} aria-label={e}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{rt.colour}</p>
        <div className="flex flex-wrap gap-2">
          {ROUTINE_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => onColor(c)} className="w-8 h-8 rounded-full" style={{ background: c, outline: color === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} aria-label={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** One optional resource (any kind) or person to attach to a step – a plain searchable list, nothing more. */
function LinkPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (l: NonNullable<RoutineCard['linked']>) => void }) {
  const rt = useRoutineTexts();
  const [q, setQ] = useState('');
  const resources = resourcesRepo.getAll();
  const people = networkRepo.getAll();
  const norm = q.trim().toLowerCase();
  const rs = resources.filter((r) => !norm || r.title.toLowerCase().includes(norm)).slice(0, 40);
  const ps = people.filter((p) => !norm || p.name.toLowerCase().includes(norm)).slice(0, 20);
  return (
    <Modal open={open} onClose={onClose} title={rt.pickTitle}>
      <input className="input mb-3" placeholder={rt.pickSearch} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex flex-col gap-1.5" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
        {rs.map((r) => (
          <button key={r.id} type="button" onClick={() => onPick({ kind: 'resource', id: r.id })} className="text-left px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[14px] text-[var(--color-text)]">🎁 {r.title}</button>
        ))}
        {ps.map((p) => (
          <button key={p.id} type="button" onClick={() => onPick({ kind: 'person', id: p.id })} className="text-left px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[14px] text-[var(--color-text)]">🤝 {p.name}</button>
        ))}
        {rs.length + ps.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)]">{rt.pickNone}</p>}
      </div>
    </Modal>
  );
}
