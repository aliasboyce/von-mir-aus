import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, X, Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { denkmaschineRepo, addGlaubenssatzNote, obstaclesFromZugangHistory } from './denkmaschineRepo';
import { DefusionBillboardExercise, AnchorExercise, WordsExercise } from './DenkmaschineExercises';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';
import { CompulsionAwarenessNote } from '../../components/shared/CompulsionAwarenessNote';
import { useRegisterModalOpen } from '../../state/ModalStackContext';

type ModalTab = 'abstand' | 'neu' | 'uebungen';

/**
 * Priority 9/10 of the "Verknüpfung, Inhalt & visuelle Ausbaustufe"
 * brief — extends the earlier minimal defusion-only version with two
 * more things, still deliberately scoped:
 *   1. "Neu formulieren": strike through the original belief, then
 *      write a believable, self-compassionate middle ground — with
 *      explicit guidance against turning this into hollow positive
 *      thinking, and worked examples of the difference.
 *   2. Two researched ACT exercises (GlaubenssaetzeExercises.tsx):
 *      the billboard/distance defusion exercise (matching the user's
 *      own idea) and the ACE "dropping anchor" exercise — both
 *      sourced from Dr. Sonia Jaeger's published ACT overview.
 * A small tab row keeps the modal from becoming one long scroll of
 * everything at once.
 */
export function DenkmaschinePage() {
  const t = useT();
  const navigate = useNavigate();
  const [, refresh] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [openNote, setOpenNote] = useState<{ text: string; noteId?: string } | null>(null);
  useRegisterModalOpen(!!openNote);
  const [reflectionDraft, setReflectionDraft] = useState('');
  const [reframeDraft, setReframeDraft] = useState('');
  const [modalTab, setModalTab] = useState<ModalTab>('abstand');
  const [showNameExplainer, setShowNameExplainer] = useState(false);
  const [editingReframe, setEditingReframe] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  function bump() {
    refresh((n) => n + 1);
  }

  const ownNotes = denkmaschineRepo.getAll();
  const fromHistory = obstaclesFromZugangHistory().filter((h) => !ownNotes.some((n) => n.text === h.text));

  function openThought(text: string, noteId?: string) {
    const existing = ownNotes.find((n) => n.id === noteId);
    setReflectionDraft(existing?.reflection ?? '');
    setReframeDraft(existing?.reframe ?? '');
    setEditingReframe(false);
    setModalTab(existing?.reframe ? 'neu' : 'abstand');
    setOpenNote({ text, noteId });
  }

  function ensureNoteId(): string {
    if (openNote?.noteId) return openNote.noteId;
    const created = addGlaubenssatzNote(openNote!.text);
    setOpenNote({ text: openNote!.text, noteId: created.id });
    return created.id;
  }

  function saveReflection() {
    if (!openNote) return;
    const noteId = ensureNoteId();
    const note = denkmaschineRepo.getAll().find((n) => n.id === noteId);
    if (note) denkmaschineRepo.save({ ...note, reflection: reflectionDraft.trim() || undefined });
    bump();
  }

  function saveReframe() {
    if (!openNote) return;
    const noteId = ensureNoteId();
    const note = denkmaschineRepo.getAll().find((n) => n.id === noteId);
    if (note) denkmaschineRepo.save({ ...note, reframe: reframeDraft.trim() || undefined });
    bump();
  }

  function addOwn() {
    if (!newText.trim()) return;
    addGlaubenssatzNote(newText.trim());
    setNewText('');
    setAdding(false);
    bump();
  }

  const hasAny = ownNotes.length > 0 || fromHistory.length > 0;
  // Read directly from the repo (not the draft state) so this always
  // reflects what's actually persisted — the thing the person is
  // worried about when they ask "did this really get saved?".
  const savedReframe = openNote?.noteId ? denkmaschineRepo.getAll().find((n) => n.id === openNote.noteId)?.reframe : undefined;

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="glaubenssaetze" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.glaubenssaetze.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-2 leading-relaxed">{t.glaubenssaetze.subtitle}</p>

        <button onClick={() => setShowNameExplainer((v) => !v)} className="text-[12px] text-[var(--color-primary)] mb-5 block">
          {showNameExplainer ? t.glaubenssaetze.hideNameExplainerCta : t.glaubenssaetze.showNameExplainerCta}
        </button>
        {showNameExplainer && (
          <Card className="mb-5 -mt-3">
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.glaubenssaetze.nameExplainerText}</p>
          </Card>
        )}

        <Card className="mb-4">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.glaubenssaetze.whatTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.glaubenssaetze.whatText}</p>
        </Card>

        <Card className="mb-4">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.glaubenssaetze.originTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.glaubenssaetze.originText}</p>
        </Card>

        <Card className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.glaubenssaetze.observeTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.glaubenssaetze.observeText}</p>
        </Card>

        <Button fullWidth variant="secondary" icon={<Plus size={17} />} onClick={() => setAdding(true)} className="mb-5">
          {t.glaubenssaetze.addOwnCta}
        </Button>

        {adding && (
          <Card className="mb-5 flex flex-col gap-3">
            <textarea
              autoFocus
              className="input"
              rows={Math.min(10, Math.max(2, newText.split('\n').length + 1))}
              style={{ resize: 'vertical', maxHeight: '40vh' }}
              placeholder={t.glaubenssaetze.addPlaceholder}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button fullWidth onClick={addOwn} disabled={!newText.trim()}>
                {t.common.save}
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </Card>
        )}

        {!hasAny ? (
          <EmptyState title={t.glaubenssaetze.empty} />
        ) : (
          <div className="flex flex-col gap-2">
            {ownNotes.map((note) => (
              <button key={note.id} onClick={() => openThought(note.text, note.id)} className="text-left w-full">
                <Card interactive className="flex flex-col gap-1.5">
                  <p
                    className="text-[14px] flex-1 whitespace-pre-wrap break-words line-clamp-3"
                    style={
                      note.reframe
                        ? { textDecoration: 'line-through', textDecorationThickness: 2, color: 'var(--color-text-faint)' }
                        : { color: 'var(--color-text)' }
                    }
                  >
                    {note.text}
                  </p>
                  {note.reframe && (
                    <p className="text-[14px] text-[var(--color-primary)] font-medium whitespace-pre-wrap break-words line-clamp-3">
                      {note.reframe}
                    </p>
                  )}
                  {!note.reframe && note.reflection && (
                    <span className="text-[11px] text-[var(--color-primary)]">{t.glaubenssaetze.hasReflectionTag}</span>
                  )}
                </Card>
              </button>
            ))}
            {fromHistory.map((h) => (
              <button key={h.text} onClick={() => openThought(h.text)} className="text-left w-full">
                <Card interactive className="flex items-center justify-between gap-2">
                  <p className="text-[14px] text-[var(--color-text)] flex-1 whitespace-pre-wrap break-words line-clamp-3">{h.text}</p>
                  {h.count > 1 && <span className="text-[11px] text-[var(--color-text-faint)] flex-shrink-0">×{h.count}</span>}
                </Card>
              </button>
            ))}
          </div>
        )}

        <Link to="/entdecken/loslassen" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-6 mb-1">
          🕊️ {t.glaubenssaetze.loslassenLink}
        </Link>
        <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-2">{t.glaubenssaetze.loslassenLinkHint}</p>

        <SourceNoteCard text={t.glaubenssaetze.sourceNote} sourceIds={['act-uebungen-jaeger']} />
        <CompulsionAwarenessNote />
      </div>

      {openNote && createPortal(
        <div className="fixed inset-0 z-[230] bg-[rgba(44,42,34,0.35)] flex items-end sm:items-center justify-center" onClick={() => setOpenNote(null)}>
          <div
            className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[440px] max-h-[85vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[16px] text-[var(--color-text)] flex-1 leading-relaxed whitespace-pre-wrap break-words">"{openNote.text}"</p>
              <button onClick={() => setOpenNote(null)} aria-label={t.common.close} className="p-1 text-[var(--color-text-faint)] flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="chip-row no-scrollbar mb-5 -mx-1 px-1">
              <Chip selected={modalTab === 'abstand'} onClick={() => setModalTab('abstand')}>
                {t.glaubenssaetze.tabAbstand}
              </Chip>
              <Chip selected={modalTab === 'neu'} onClick={() => setModalTab('neu')}>
                {t.glaubenssaetze.tabNeu}
              </Chip>
              <Chip selected={modalTab === 'uebungen'} onClick={() => setModalTab('uebungen')}>
                {t.glaubenssaetze.tabUebungen}
              </Chip>
            </div>

            {modalTab === 'abstand' && (
              <>
                <Card className="mb-5" style={{ background: 'var(--color-primary-soft)' }}>
                  <p className="text-[14px] text-[var(--color-text)] leading-relaxed italic">
                    {t.glaubenssaetze.defusionFraming.replace('{thought}', openNote.text)}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mt-2">{t.glaubenssaetze.defusionExplainer}</p>
                </Card>

                <label className="flex flex-col gap-1.5 mb-4">
                  <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.glaubenssaetze.reflectionLabel}</span>
                  <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.glaubenssaetze.reflectionPrompt}</p>
                  <textarea
                    className="input"
                    rows={Math.min(10, Math.max(3, reflectionDraft.split('\n').length + 1))}
                    style={{ resize: 'vertical', maxHeight: '40vh' }}
                    placeholder={t.glaubenssaetze.reflectionPlaceholder}
                    value={reflectionDraft}
                    onChange={(e) => setReflectionDraft(e.target.value)}
                  />
                </label>
                <Button fullWidth onClick={() => { saveReflection(); setReflectionSaved(true); window.setTimeout(() => setReflectionSaved(false), 2000); }}>
                  {reflectionSaved ? t.common.saved : t.common.save}
                </Button>
                {reflectionSaved && (
                  <p className="text-[12px] text-[var(--color-text-faint)] mt-2 flex items-center gap-1.5">
                    <Check size={13} className="text-[var(--color-primary)]" /> {t.glaubenssaetze.reframeSavedNote}
                  </p>
                )}
              </>
            )}

            {modalTab === 'neu' && (
              <>
                {savedReframe && !editingReframe ? (
                  <>
                    <Card className="mb-4">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{t.glaubenssaetze.originalLabel}</p>
                      <p
                        className="text-[15px] mb-4 whitespace-pre-wrap break-words"
                        style={{ textDecoration: 'line-through', textDecorationThickness: 2, color: 'var(--color-text-faint)' }}
                      >
                        {openNote.text}
                      </p>
                      <p className="text-[11px] uppercase tracking-wide text-[var(--color-primary)] mb-1.5">{t.glaubenssaetze.newFormulationLabel}</p>
                      <p className="text-[16px] text-[var(--color-text)] font-medium leading-relaxed whitespace-pre-wrap break-words">{savedReframe}</p>
                    </Card>
                    <p className="text-[12px] text-[var(--color-text-faint)] mb-4 flex items-center gap-1.5">
                      <Check size={13} className="text-[var(--color-primary)]" /> {t.glaubenssaetze.reframeSavedNote}
                    </p>
                    <Button fullWidth variant="secondary" onClick={() => setEditingReframe(true)}>
                      {t.glaubenssaetze.editReframeCta}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-[16px] text-center mb-1 whitespace-pre-wrap break-words" style={{ textDecoration: 'line-through', textDecorationThickness: 2, color: 'var(--color-text-faint)' }}>
                      {openNote.text}
                    </p>
                    <p className="text-[12px] text-[var(--color-text-faint)] text-center mb-5">{t.glaubenssaetze.strikethroughHint}</p>

                    <Card className="mb-4">
                      <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.glaubenssaetze.reframeGuidance}</p>
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-[12px] text-red-400 flex-shrink-0 mt-0.5">✕</span>
                        <p className="text-[12px] text-[var(--color-text-faint)] italic">{t.glaubenssaetze.reframeBadExample}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[12px] text-[var(--color-primary)] flex-shrink-0 mt-0.5">✓</span>
                        <p className="text-[12px] text-[var(--color-text)] italic">{t.glaubenssaetze.reframeGoodExample}</p>
                      </div>
                    </Card>

                    <label className="flex flex-col gap-1.5 mb-4">
                      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.glaubenssaetze.reframeLabel}</span>
                      <textarea
                        className="input"
                        rows={Math.min(10, Math.max(3, reframeDraft.split('\n').length + 1))}
                        style={{ resize: 'vertical', maxHeight: '40vh' }}
                        placeholder={t.glaubenssaetze.reframePlaceholder}
                        value={reframeDraft}
                        onChange={(e) => setReframeDraft(e.target.value)}
                      />
                    </label>
                    <Button fullWidth onClick={() => { saveReframe(); setEditingReframe(false); }} disabled={!reframeDraft.trim()}>
                      {t.common.save}
                    </Button>
                  </>
                )}
              </>
            )}

            {modalTab === 'uebungen' && (
              <>
                <DefusionBillboardExercise thought={openNote.text} />
                <WordsExercise thought={openNote.text} />
                <AnchorExercise />
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
