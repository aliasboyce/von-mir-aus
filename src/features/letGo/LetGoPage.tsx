import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Send, Wind, Scissors } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { CompulsionAwarenessNote } from '../../components/shared/CompulsionAwarenessNote';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { worriesRepo, addWorry, type Worry } from './worriesRepo';
import { LetGoIllustration, type LetGoRitual } from './LetGoIllustration';

/**
 * "Gesamtpruefung"-Auftrag, Section 6 — rebuilt again, this time to
 * genuinely address the concrete complaints: the previous full-screen
 * overlay had pointer-events-none on its container, which made real
 * touch/mouse interaction for crumpling or tearing technically
 * impossible no matter how the illustration itself was built. All
 * three rituals are back (not reduced to one), the paper is large and
 * immersive rather than a small centered box, and the overlay is now
 * genuinely interactive.
 */
export function LetGoPage() {
  const t = useT();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [, refresh] = useState(0);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [releasing, setReleasing] = useState<Worry | null>(null);
  useRegisterModalOpen(!!releasing);
  const [ritual, setRitual] = useState<LetGoRitual>('papierflieger');
  const [finalizing, setFinalizing] = useState(false);

  const worries = worriesRepo.getAll();

  function bump() {
    refresh((n) => n + 1);
  }

  function save() {
    if (!draft.trim()) return;
    addWorry(draft.trim());
    setDraft('');
    setAdding(false);
    bump();
  }

  function openRitual(worry: Worry, chosen: LetGoRitual) {
    setRitual(chosen);
    setReleasing(worry);
    setFinalizing(false);
  }

  // Called once the actual "flying away / falling / separating"
  // animation should begin — automatically for papierflieger, or once
  // the person has dragged far enough for crumple/tear and let go.
  function finalize() {
    if (!releasing) return;
    setFinalizing(true);
    window.setTimeout(
      () => {
        worriesRepo.remove(releasing.id);
        setReleasing(null);
        setFinalizing(false);
        bump();
      },
      settings.reduceMotion ? 700 : 2200,
    );
  }

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="letGo" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.letGo.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6 leading-relaxed">{t.letGo.subtitle}</p>

        <Button fullWidth variant="secondary" icon={<Plus size={17} />} onClick={() => setAdding(true)} className="mb-5">
          {t.letGo.addCta}
        </Button>

        {adding && (
          <Card className="mb-5 flex flex-col gap-3">
            <textarea
              autoFocus
              className="input"
              rows={Math.min(10, Math.max(3, draft.split('\n').length + 1))}
              style={{ resize: 'vertical', maxHeight: '40vh' }}
              placeholder={t.letGo.addPlaceholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <Button fullWidth onClick={save} disabled={!draft.trim()}>
                {t.letGo.saveCta}
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </Card>
        )}

        {worries.length === 0 ? (
          <EmptyState title={t.letGo.empty} />
        ) : (
          <div className="flex flex-col gap-2">
            {worries.map((w) => {
              if (releasing?.id === w.id) return null;
              return (
                <Card key={w.id} className="flex flex-col gap-2.5">
                  <p className="text-[14px] text-[var(--color-text)] whitespace-pre-wrap break-words">{w.text}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openRitual(w, 'papierflieger')}
                      disabled={!!releasing}
                      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] disabled:opacity-40"
                    >
                      <Send size={16} className="text-[var(--color-primary)]" />
                      <span className="text-[11px] text-[var(--color-text)]">{t.letGo.ritualPlaneLabel}</span>
                    </button>
                    <button
                      onClick={() => openRitual(w, 'zerknuellen')}
                      disabled={!!releasing}
                      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] disabled:opacity-40"
                    >
                      <Wind size={16} className="text-[var(--color-primary)]" />
                      <span className="text-[11px] text-[var(--color-text)]">{t.letGo.ritualCrumpleLabel}</span>
                    </button>
                    <button
                      onClick={() => openRitual(w, 'zerreissen')}
                      disabled={!!releasing}
                      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] disabled:opacity-40"
                    >
                      <Scissors size={16} className="text-[var(--color-primary)]" />
                      <span className="text-[11px] text-[var(--color-text)]">{t.letGo.ritualTearLabel}</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-3 mt-6">
          <InlineCompanionNote />
          <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed flex-1">{t.letGo.footerNote}</p>
        </div>
        <CompulsionAwarenessNote />
      </div>

      {releasing && createPortal(
        <div
          className="fixed inset-0 z-[235] flex items-center justify-center animate-in"
          style={{ background: 'rgba(30,28,22,0.72)', overflowY: 'auto', padding: '24px 0' }}
        >
          <LetGoIllustration
            ritual={ritual}
            finalizing={finalizing}
            thought={releasing.text}
            reduceMotion={settings.reduceMotion}
            onFinalize={finalize}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
