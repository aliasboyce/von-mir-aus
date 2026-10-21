import { useMemo, useRef, useState } from 'react';
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
import { StrategyLinkField, resolveNewStrategy } from '../accessBuildingBlocks/StrategyLinkField';
import { registerNewStrategy } from '../accessBuildingBlocks/strategyLinks';
import { RoutineCard3D } from './RoutineCard3D';
import { parseMediaLink, reportsEnd } from './mediaLink';
import { EmojiPicker, ColorPicker } from '../../components/shared/SymbolColorPicker';
import { ENERGY_COLORS, ROUTINE_COLORS, cardNoSymbol, newCard, newRoutine, routinesRepo, releaseRoutineFiles, type Routine, type RoutineCard } from './routinesRepo';
import { saveOwnMedia, deleteOwnMedia, kindOfFile } from '../../services/mediaStore';
import { resizeImageFile } from '../../services/imageResize';
import { useRoutineTexts } from './routineTexts';
import { mediNameOf, mediOptions } from './routineEffects';
import { RESOURCE_CATEGORY_GROUP_META, RESOURCE_CATEGORY_GROUP_ORDER, RESOURCE_CATEGORY_TO_GROUP, resourceCategoryLabel } from '../resources/resourceMeta';
import { useT } from '../../i18n';
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
  const [routine, setRoutine] = useState<Routine>(() => existing ?? newRoutine({ alternativeFor: searchParams.get('alternativeFor') || undefined, newStrategy: searchParams.get('newStrategy') ?? undefined, title: searchParams.get('newStrategy') ?? '', forObstacle: searchParams.get('forObstacle') || undefined }));
  const [open, setOpen] = useState<string | null>(() => (existing ? null : routine.cards[0]?.id ?? null));
  const [moreOpen, setMoreOpen] = useState<Set<string>>(new Set());
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [mediFor, setMediFor] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const gardens = useMemo(() => gardenRepo.getAll().filter((g) => g.kind === 'aufbau' && g.status !== 'ended'), []);

  function patchCard(cardId: string, patch: Partial<RoutineCard>) {
    setRoutine((r) => ({ ...r, cards: r.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)) }));
  }
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileFor = useRef<string | null>(null);
  async function pickFile(file: File | undefined) {
    const cardId = fileFor.current;
    if (!file || !cardId) return;
    setFileError(null);
    const kind = kindOfFile(file);
    let toSave: File | Blob = file;
    if (kind === 'image') {
      try {
        const url = await resizeImageFile(file, 1400);
        toSave = await (await fetch(url)).blob();
      } catch {
        toSave = file;
      }
    }
    const ref = await saveOwnMedia(toSave, file.name);
    if (!ref) {
      setFileError(cardId);
      return;
    }
    const old = routine.cards.find((c) => c.id === cardId)?.ownMedia;
    if (old) void deleteOwnMedia(old.id);
    patchCard(cardId, { ownMedia: { ...ref, name: file.name } });
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
    releaseRoutineFiles(routine.cards.filter((c) => c.id === cardId));
    setRoutine((r) => ({ ...r, cards: r.cards.filter((c) => c.id !== cardId) }));
  }
  function save() {
    const cards = routine.cards.filter((c) => c.text.trim());
    if (!routine.title.trim() || cards.length === 0) {
      setError(true);
      return;
    }
    const newStrategy = resolveNewStrategy(routine, routine.title);
    if (newStrategy) registerNewStrategy(newStrategy);
    routinesRepo.save({ ...routine, newStrategy, title: routine.title.trim(), cards: cards.map((c) => ({ ...c, text: c.text.trim() })), updatedAt: new Date().toISOString(), isExample: existing?.isExample && routine.title === existing.title ? existing.isExample : undefined });
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
          <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label={rt.symbol}>
            <Pill on={!routine.noSymbol} onClick={() => setRoutine({ ...routine, noSymbol: undefined })} testId="routine-sym-on">{en ? 'With symbol' : 'Mit Symbol'}</Pill>
            <Pill on={!!routine.noSymbol} onClick={() => setRoutine({ ...routine, noSymbol: true })} testId="routine-sym-off">{en ? 'No symbol – colour only' : 'Kein Symbol – nur Farbe'}</Pill>
          </div>
          <EmojiColor emoji={routine.emoji} color={routine.color} onEmoji={(emoji) => setRoutine({ ...routine, emoji })} onColor={(color) => setRoutine({ ...routine, color })} rt={rt} hideEmoji={!!routine.noSymbol} />
          <div className="mt-3" data-testid="routine-polaroid-block">
            <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1">{en ? 'Own picture as polaroid' : 'Eigenes Bild als Polaroid'}</p>
            <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] mb-1.5">{en ? 'Shown on the routine like a little photo – with or without symbol.' : 'Wird bei der Routine wie ein kleines Foto gezeigt – mit oder ohne Symbol.'}</p>
            <OwnImageControl image={routine.polaroid ?? ''} onChange={(url) => setRoutine({ ...routine, polaroid: url || undefined })} fallback={() => ''} />
          </div>
          <label className="flex items-center gap-2 mt-3 text-[13px] text-[var(--color-text)]">
            <input type="checkbox" checked={!!routine.cardsNoSymbol} onChange={(e) => setRoutine({ ...routine, cardsNoSymbol: e.target.checked || undefined })} data-testid="routine-cards-nosym" />
            {en ? 'All cards of this routine without symbol (colour only)' : 'Alle Karten dieser Routine ohne Symbol (nur Farbe)'}
          </label>
        </div>

        <StrategyLinkField value={routine} onChange={(v) => setRoutine({ ...routine, alternativeFor: v.alternativeFor, newStrategy: v.newStrategy, forObstacle: v.forObstacle })} defaultName={routine.title} />

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
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-[18px] flex-shrink-0 overflow-hidden" style={{ background: `${c.color}33` }}>{c.polaroid ? <span className="w-full h-full" style={{ backgroundImage: `url(${c.polaroid})`, backgroundSize: 'cover', backgroundPosition: 'center' }} /> : cardNoSymbol(routine, c) ? <span className="w-3.5 h-3.5 rounded-full" style={{ background: c.color }} /> : c.emoji}</span>
                    <span className="text-[14px] text-[var(--color-text)] truncate">{i + 1}. {c.text || rt.cardTextPh}</span>
                    {isOpen ? <ChevronUp size={15} className="ml-auto flex-shrink-0" /> : <ChevronDown size={15} className="ml-auto flex-shrink-0" />}
                  </button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={rt.moveUp} className="p-1.5 rounded-full disabled:opacity-25"><ArrowUp size={15} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === routine.cards.length - 1} aria-label={rt.moveDown} className="p-1.5 rounded-full disabled:opacity-25"><ArrowDown size={15} /></button>
                </div>

                {isOpen && (
                  <div className="mt-4 flex flex-col gap-4 animate-in">
                    <div className="mx-auto w-full" style={{ maxWidth: 190, height: 150 }}>
                      <RoutineCard3D card={c} noSymbol={cardNoSymbol(routine, c)} size="mini" className="h-full" />
                    </div>
                    <label className="block">
                      <span className="block text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.cardText}</span>
                      <input className="input" value={c.text} placeholder={rt.cardTextPh} onChange={(e) => patchCard(c.id, { text: e.target.value })} data-testid={`routine-card-text-${i}`} />
                    </label>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.symbol}</p>
                      <div className="flex flex-wrap gap-1.5" role="group" aria-label={rt.symbol}>
                        <Pill on={c.noSymbol === undefined} onClick={() => patchCard(c.id, { noSymbol: undefined })} testId={`routine-card-sym-auto-${i}`}>{routine.cardsNoSymbol ? (en ? 'Like routine (none)' : 'Wie Routine (keins)') : (en ? 'Like routine (symbol)' : 'Wie Routine (Symbol)')}</Pill>
                        <Pill on={c.noSymbol === false} onClick={() => patchCard(c.id, { noSymbol: false })} testId={`routine-card-sym-on-${i}`}>{en ? 'With symbol' : 'Mit Symbol'}</Pill>
                        <Pill on={c.noSymbol === true} onClick={() => patchCard(c.id, { noSymbol: true })} testId={`routine-card-sym-off-${i}`}>{en ? 'No symbol' : 'Kein Symbol'}</Pill>
                      </div>
                    </div>
                    <EmojiColor emoji={c.emoji} color={c.color} onEmoji={(emoji) => patchCard(c.id, { emoji })} onColor={(color) => patchCard(c.id, { color })} rt={rt} hideEmoji={cardNoSymbol(routine, c)} />
                    <div data-testid={`routine-card-polaroid-${i}`}>
                      <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1">{en ? 'Own picture as polaroid' : 'Eigenes Bild als Polaroid'}</p>
                      <OwnImageControl image={c.polaroid ?? ''} onChange={(url) => patchCard(c.id, { polaroid: url || undefined })} fallback={() => ''} />
                    </div>
                    <div data-testid={`routine-energy-${i}`}>
                      <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.energyLabel}</p>
                      <div className="flex flex-col gap-1.5">
                        {([1, 2, 3] as const).map((lv) => (
                          <button key={lv} type="button" aria-pressed={(c.minEnergy ?? 3) === lv} onClick={() => patchCard(c.id, { minEnergy: lv === 3 ? undefined : lv })} data-testid={`routine-energy-${i}-${lv}`} className="text-left px-3 py-2 rounded-[var(--radius-md)] flex items-center gap-2.5 text-[13.5px] border-2" style={{ borderColor: (c.minEnergy ?? 3) === lv ? 'var(--color-primary)' : 'var(--color-border)', background: (c.minEnergy ?? 3) === lv ? 'var(--color-primary-soft)' : 'var(--color-surface)', color: 'var(--color-text)' }}>
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ENERGY_COLORS[lv] }} aria-hidden="true" />
                            {lv === 1 ? rt.energyOpt1 : lv === 2 ? rt.energyOpt2 : rt.energyOpt3}
                          </button>
                        ))}
                      </div>
                      <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{rt.energyLabelNote}</p>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1">{en ? 'Photo as card background (fills the whole card)' : 'Foto als Karten-Hintergrund (füllt die ganze Karte)'}</p>
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
                          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">🎵 {rt.media}</p>
                          <input className="input" inputMode="url" value={c.media?.url ?? ''} placeholder={rt.mediaPh} onChange={(e) => patchCard(c.id, { media: e.target.value.trim() ? { url: e.target.value, autoNext: c.media?.autoNext } : undefined })} data-testid={`routine-media-${i}`} />
                          {c.media?.url && (() => {
                            const pm = parseMediaLink(c.media.url);
                            if (!pm) return <p className="text-[12px] text-[var(--color-danger)] mt-1">{rt.mediaBad}</p>;
                            return (
                              <div className="mt-1.5">
                                <p className="text-[12px] text-[var(--color-primary)]" data-testid={`routine-media-kind-${i}`}>✓ {rt.mediaOk.replace('{kind}', pm.label)}{pm.kind === 'other' ? ` – ${rt.mediaOther}` : ''}</p>
                                {pm.kind === 'spotify' && (
                                  <div className="mt-1.5 rounded-[var(--radius-md)] px-3 py-2" style={{ background: 'var(--color-primary-soft)' }} data-testid={`routine-spotify-tip-${i}`}>
                                    <p className="text-[12px] text-[var(--color-text)] leading-relaxed">{rt.spotifyTip}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {[120, 180, 240, 300, 360].map((sec) => (
                                        <Pill key={sec} on={c.timerSec === sec} onClick={() => patchCard(c.id, { timerSec: sec })}>{timerLabel(sec, en)}</Pill>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {reportsEnd(pm.kind) && (
                                  <label className="flex items-center gap-2 mt-1.5 text-[12.5px] text-[var(--color-text-muted)]">
                                    <input type="checkbox" checked={!!c.media.autoNext} onChange={(ev) => patchCard(c.id, { media: { url: c.media!.url, autoNext: ev.target.checked } })} /> {rt.mediaAuto}
                                  </label>
                                )}
                              </div>
                            );
                          })()}
                          <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{rt.mediaNote}</p>
                        </div>

                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">📎 {rt.ownFile}</p>
                          {c.ownMedia ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[13.5px] text-[var(--color-text)] truncate" data-testid={`routine-own-name-${i}`}>{c.ownMedia.kind === 'video' ? '🎬' : c.ownMedia.kind === 'audio' ? '🎵' : '🖼️'} {c.ownMedia.name}</span>
                              <button type="button" onClick={() => { void deleteOwnMedia(c.ownMedia!.id); patchCard(c.id, { ownMedia: undefined }); }} className="text-[12.5px] text-[var(--color-text-faint)] underline flex-shrink-0">{rt.ownFileRemove}</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => { fileFor.current = c.id; fileInput.current?.click(); }} className="text-[13px] text-[var(--color-primary)]" data-testid={`routine-own-pick-${i}`}>＋ {rt.ownFilePick}</button>
                          )}
                          {fileError === c.id && <p className="text-[12px] text-[var(--color-danger)] mt-1">{rt.ownFileTooBig}</p>}
                          <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{rt.ownFileNote}</p>
                        </div>

                        <div data-testid={`routine-medi-${i}`}>
                          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">💊 {en ? 'Medication in this step' : 'Medikament in diesem Schritt'}</p>
                          {c.medi && mediNameOf(c.medi) ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] text-[var(--color-text)]">{mediNameOf(c.medi)}</span>
                              <button type="button" onClick={() => patchCard(c.id, { medi: undefined })} className="text-[12.5px] text-[var(--color-text-faint)] underline" data-testid={`routine-medi-remove-${i}`}>{en ? 'Remove' : 'Entfernen'}</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setMediFor(c.id)} className="text-[13px] text-[var(--color-primary)]" data-testid={`routine-medi-pick-${i}`}>＋ {en ? 'Add a medication' : 'Medikament dazu'}</button>
                          )}
                          <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{en ? 'When you tick this card, the intake is entered in your medication log automatically.' : 'Wenn du diese Karte abhakst, wird die Einnahme automatisch im Medikamenten-Log eingetragen.'}</p>
                        </div>

                        <div>
                          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5">{rt.linked}</p>
                          {linked ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] text-[var(--color-text)]">{c.linked?.kind === 'person' ? '🤝' : '🧩'} {linked}</span>
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

      <input ref={fileInput} type="file" accept="image/*,video/*,audio/*" className="hidden" data-testid="routine-own-file" onChange={(e) => { void pickFile(e.target.files?.[0]); e.target.value = ''; }} />
      <MediPicker open={!!mediFor} onClose={() => setMediFor(null)} onPick={(m) => { if (mediFor) patchCard(mediFor, { medi: m }); setMediFor(null); }} />
      <LinkPicker open={!!pickFor} onClose={() => setPickFor(null)} onPick={(linkedItem) => { if (pickFor) patchCard(pickFor, { linked: linkedItem }); setPickFor(null); }} />
    </div>
  );
}

function Pill({ on, onClick, children, testId }: { on: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} data-testid={testId} className="px-3 py-1.5 rounded-full text-[12.5px]" style={{ background: on ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: on ? 'var(--color-surface)' : 'var(--color-text)' }}>
      {children}
    </button>
  );
}

function EmojiColor({ emoji, color, onEmoji, onColor, rt, hideEmoji }: { emoji: string; color: string; onEmoji: (e: string) => void; onColor: (c: string) => void; rt: ReturnType<typeof useRoutineTexts>; hideEmoji?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {!hideEmoji && <EmojiPicker value={emoji} onChange={onEmoji} label={rt.symbol} />}
      <ColorPicker value={color} onChange={onColor} label={rt.colour} />
    </div>
  );
}

/** One optional resource (any kind) or person to attach to a step – neutral, sorted into clear groups, searchable. */
function LinkPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (l: NonNullable<RoutineCard['linked']>) => void }) {
  const rt = useRoutineTexts();
  const t = useT();
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const [q, setQ] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const resources = open ? resourcesRepo.getAll() : [];
  const people = open ? networkRepo.getAll() : [];
  const norm = q.trim().toLowerCase();
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: { kind: 'resource' | 'person'; id: string; title: string; sub?: string }[] }[] = [];
    const rs = resources.filter((r) => !norm || r.title.toLowerCase().includes(norm));
    for (const g of RESOURCE_CATEGORY_GROUP_ORDER) {
      const items = rs.filter((r) => RESOURCE_CATEGORY_TO_GROUP[r.category] === g).sort((a, b) => a.title.localeCompare(b.title));
      if (items.length) out.push({ key: g, label: RESOURCE_CATEGORY_GROUP_META[g].label(t), items: items.map((r) => ({ kind: 'resource' as const, id: r.id, title: r.title, sub: resourceCategoryLabel(t, r.category) })) });
    }
    const rest = rs.filter((r) => !RESOURCE_CATEGORY_TO_GROUP[r.category]).sort((a, b) => a.title.localeCompare(b.title));
    if (rest.length) out.push({ key: 'rest', label: en ? 'Other resources' : 'Weitere Ressourcen', items: rest.map((r) => ({ kind: 'resource' as const, id: r.id, title: r.title, sub: resourceCategoryLabel(t, r.category) })) });
    const ps = people.filter((p) => !norm || p.name.toLowerCase().includes(norm)).sort((a, b) => a.name.localeCompare(b.name));
    if (ps.length) out.push({ key: 'people', label: en ? 'People' : 'Personen', items: ps.map((p) => ({ kind: 'person' as const, id: p.id, title: p.name, sub: p.role })) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, norm, t]);
  // while searching, every group with a hit is open
  const isOpen = (k: string) => !!norm || openGroup === k;
  return (
    <Modal open={open} onClose={onClose} title={rt.pickTitle}>
      <input className="input mb-3" placeholder={rt.pickSearch} value={q} onChange={(e) => setQ(e.target.value)} data-testid="routine-pick-search" />
      <div className="flex flex-col gap-2" style={{ maxHeight: '58vh', overflowY: 'auto' }} data-testid="routine-pick-groups">
        {groups.map((g) => (
          <div key={g.key} className="rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden" data-testid={`routine-pick-group-${g.key}`}>
            <button type="button" onClick={() => setOpenGroup(openGroup === g.key ? null : g.key)} aria-expanded={isOpen(g.key)} className="w-full flex items-center justify-between px-3.5 py-3 text-left bg-[var(--color-surface-muted)]">
              <span className="text-[14px] font-medium text-[var(--color-text)]">{g.label}</span>
              <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-faint)]">{g.items.length} {isOpen(g.key) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
            </button>
            {isOpen(g.key) && (
              <ul className="flex flex-col">
                {g.items.map((it) => (
                  <li key={`${it.kind}-${it.id}`}>
                    <button type="button" onClick={() => onPick({ kind: it.kind, id: it.id })} className="w-full text-left px-3.5 py-2.5 border-t border-[var(--color-border)] text-[14px] text-[var(--color-text)] flex flex-col" data-testid={`routine-pick-${it.kind}-${it.id}`}>
                      <span>{it.title}</span>
                      {it.sub && <span className="text-[11.5px] text-[var(--color-text-faint)]">{it.sub}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {groups.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)]">{rt.pickNone}</p>}
      </div>
    </Modal>
  );
}

/** A medication for a step: regular ones (with their times) and saved ones, from the medication log. */
function MediPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (m: NonNullable<RoutineCard['medi']>) => void }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const opts = open ? mediOptions() : [];
  return (
    <Modal open={open} onClose={onClose} title={en ? 'Choose a medication' : 'Medikament wählen'}>
      <div className="flex flex-col gap-1.5" style={{ maxHeight: '58vh', overflowY: 'auto' }} data-testid="routine-medi-list">
        {opts.map((o) => (
          <button key={o.key} type="button" onClick={() => onPick({ kind: o.kind, id: o.id })} className="text-left px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[14px] text-[var(--color-text)] flex flex-col" data-testid={`routine-medi-opt-${o.id}`}>
            <span>{o.name}</span>
            {o.sub && <span className="text-[11.5px] text-[var(--color-text-faint)]">{o.sub}</span>}
          </button>
        ))}
        {opts.length === 0 && <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{en ? 'No medications yet. Add them first under "Medication log" – then they can be chosen here.' : 'Noch keine Medikamente. Lege sie zuerst im Medikamenten-Log an – dann kannst du sie hier auswählen.'}</p>}
      </div>
    </Modal>
  );
}
