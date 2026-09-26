import { useEffect, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, Lightbulb, Pencil, NotebookPen, Check, Trash2, Timer as TimerIcon, Link2, FileDown } from 'lucide-react';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { bridgesRepo, migrateBridgeCategoriesIfNeeded, migrateBridgeAccessChannelsIfNeeded, addMissingDemoBridges } from './bridgesRepo';
import { zugangRepo } from '../zugang/zugangRepo';
import { SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { BRIDGE_CATEGORY_META, BRIDGE_CATEGORY_ORDER } from './bridgeMeta';
import { BridgeFormModal } from './BridgeFormModal';
import { AccessGapModal } from '../zugang/AccessGapModal';
import { finalizeZugangDraft, clearZugangDraft } from '../zugang/zugangDraft';
import { Modal } from '../../components/ui/Modal';
import { BridgeTimerView } from './BridgeTimerView';
import { BridgePrintView } from './BridgePrintView';
import { logActivity } from '../../services/activityLog';
import { HelpfulnessPrompt } from '../../components/shared/HelpfulnessPrompt';
import { CompanionGuidanceCard } from '../../components/companion/CompanionGuidanceCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PhotoBackground } from '../../components/shared/PhotoBackground';
import { diaryRepo } from '../diary/diaryRepo';
import { createId } from '../../services/storage/repository';
import type { Bridge } from '../../data/types';
import { ACCESS_CHANNEL_META } from '../zugangskanaele/accessChannels';
import { CONDITIONS } from './conditions';

migrateBridgeCategoriesIfNeeded();
migrateBridgeAccessChannelsIfNeeded();

export function BridgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromZugang = searchParams.get('fromZugang') === '1';
  const [showZugangExitDialog, setShowZugangExitDialog] = useState(false);
  const t = useT();
  const say = useCompanionSay();
  const [bridge, setBridge] = useState<Bridge | undefined>(() => (id ? bridgesRepo.getById(id) : undefined));
  // "Bruecken als Verbindungen"-Brief — a genuine, honest usage-history
  // insight computed from data ALREADY stored by every Zugang pass
  // (bridgeId + survivalState + feelings), not a new tracking system.
  // Only shown once there's enough real history to say something
  // meaningful (>=2 uses), and only names a pattern if one state or
  // feeling genuinely recurs — no pattern invented from a single use.
  const usagePattern = (() => {
    if (!bridge) return null;
    const uses = zugangRepo.getAll().filter((e) => e.bridgeId === bridge.id);
    if (uses.length < 2) return null;
    const stateCounts = new Map<string, number>();
    uses.forEach((u) => {
      if (u.survivalState) stateCounts.set(u.survivalState, (stateCounts.get(u.survivalState) ?? 0) + 1);
    });
    const feelingCounts = new Map<string, number>();
    uses.forEach((u) => u.feelings.forEach((f) => feelingCounts.set(f, (feelingCounts.get(f) ?? 0) + 1)));
    const topState = [...stateCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topFeeling = [...feelingCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const stateLabel = topState && topState[1] >= 2 ? SURVIVAL_STATE_META[topState[0] as keyof typeof SURVIVAL_STATE_META]?.label : undefined;
    const feelingLabel = topFeeling && topFeeling[1] >= 2 ? topFeeling[0] : undefined;
    return { count: uses.length, stateLabel, feelingLabel };
  })();
  const [selectedLevels, setSelectedLevels] = useState<number[]>(bridge?.levels[0] ? [bridge.levels[0].level] : []);
  const [editing, setEditing] = useState(false);
  const [showAccessGap, setShowAccessGap] = useState(false);
  const [savedToDiary, setSavedToDiary] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerWasUsed, setTimerWasUsed] = useState(false);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);
  const [printingBridge, setPrintingBridge] = useState(false);
  const [diaryDraft, setDiaryDraft] = useState<string | null>(null);

  // "Vier Hooks werden bedingt aufgerufen"-Fund (oxlint react-hooks/
  // rules-of-hooks) — these two effects used to sit AFTER the `if
  // (!bridge) return (...)` below, so on any render where the bridge
  // hadn't been found yet they were skipped entirely, then called on
  // a later render once it was — a genuine hook-count mismatch
  // between renders, not just a lint nitpick. Doubly bad here: the
  // seeding effect is specifically the one meant to FIND a missing
  // bridge, so skipping it exactly when the bridge is missing was
  // self-defeating. Both moved above the early return so they always
  // run, unconditionally, on every render.
  useEffect(() => {
    const clear = () => setPrintingBridge(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  // "Bruecken-Weiterleitung geht immer noch nicht"-Auftrag — the actual
  // fix: this page's own bridge lookup ran once, synchronously, before
  // any seeding could happen (seeding previously only ran when the
  // separate bridges LIST page was visited) — someone navigating here
  // directly (e.g. from the ladder slider's exercise suggestion,
  // without ever visiting the list first) got "not found" even though
  // the bridge is a real demo entry. Seeding runs here now too, and if
  // the initial lookup came back empty, it's retried once seeding is done.
  useEffect(() => {
    migrateBridgeCategoriesIfNeeded();
    migrateBridgeAccessChannelsIfNeeded();
    addMissingDemoBridges();
    if (!bridge && id) {
      const found = bridgesRepo.getById(id);
      if (found) setBridge(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bridge) {
    return (
      <div className="px-5 pt-6">
        <EmptyState
          title={t.bridges.notFound}
          action={
            <Button size="sm" onClick={() => navigate('/bruecken')}>
              {t.bridges.backToBridges}
            </Button>
          }
        />
      </div>
    );
  }

  function toggleFavorite() {
    const next = { ...bridge!, favorite: !bridge!.favorite };
    setBridge(next);
    bridgesRepo.save(next);
  }

  function deleteBridge() {
    if (!bridge) return;
    if (!window.confirm(t.bridges.confirmDelete)) return;
    bridgesRepo.remove(bridge.id);
    navigate('/bruecken');
  }

  function saveEdit(updated: Bridge) {
    bridgesRepo.save(updated);
    setBridge(updated);
    // the previously selected level number might no longer exist if levels
    // were removed during editing — fall back to the first level then.
    setSelectedLevels((prev: number[]) => {
      const stillValid = prev.filter((p) => updated.levels.some((l) => l.level === p));
      return stillValid.length > 0 ? stillValid : (updated.levels[0] ? [updated.levels[0].level] : []);
    });
    setEditing(false);
    say(pickLine({ page: '/bruecken', trigger: 'eintrag_bearbeiten' }));
  }

  async function shareBridgeLink() {
    if (!bridge) return;
    const payload = {
      title: bridge.title,
      description: bridge.description,
      categoryLabel: (BRIDGE_CATEGORY_META[bridge.category] ?? BRIDGE_CATEGORY_META[BRIDGE_CATEGORY_ORDER[0]]).label(t),
      levels: bridge.levels,
      tip: bridge.tip,
    };
    const url = `${window.location.origin}/bruecken/importieren?data=${encodeURIComponent(JSON.stringify(payload))}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: bridge.title, url });
      } catch {
        // person cancelled the share sheet — nothing to do
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert(t.resources.shareLinkCopied);
      } catch {
        // clipboard unavailable — silently ignore
      }
    }
  }

  function exportBridgePdf() {
    setPrintingBridge(true);
    setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
  }

  function openDiaryDraftFromTimer(durationMin: number, note?: string) {
    if (!bridge || !activeLevel) return;
    const timeLabel = new Date().toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const durationLabel =
      durationMin >= 60
        ? `${(durationMin / 60).toFixed(durationMin % 60 === 0 ? 0 : 1)} h`
        : `${durationMin} min`;
    setDiaryDraft(
      `${bridge.title} — ${activeLevel.title}\n${timeLabel} · ${durationLabel}\n${activeLevel.description}${note ? `\n\n${note}` : ''}`,
    );
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

  function saveLevelToDiary() {
    if (!bridge || !activeLevel) return;
    const now = new Date().toISOString();
    diaryRepo.save({
      id: createId('diary'),
      createdAt: now,
      updatedAt: now,
      content: `${bridge.title} — ${activeLevel.title}\n${activeLevel.description}`,
    });
    const activityId = logActivity('bridge', `${bridge.title} — ${activeLevel.title}`, bridge.id);
    setLastActivityId(activityId);
    setSavedToDiary(true);
    say(pickLine({ page: '/sicherheit/tagebuch', trigger: 'speichern' }), { joy: true });
    setTimeout(() => setSavedToDiary(false), 1800);
  }

  const CategoryMeta = BRIDGE_CATEGORY_META[bridge.category] ?? BRIDGE_CATEGORY_META[BRIDGE_CATEGORY_ORDER[0]];
  const activeLevel = bridge.levels.find((l) => l.level === Math.max(...selectedLevels, bridge.levels[0]?.level ?? 1)) ?? bridge.levels[0];

  return (
    <div className="animate-in card-flip">
      <div className="no-print">
      <PhotoBackground
        src={bridge.image}
        className="relative h-56 bg-cover bg-center"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.05) 35%, var(--color-bg) 100%)',
          }}
        />
        <div className="relative flex items-center justify-between p-5">
          <button
            onClick={() => (fromZugang ? setShowZugangExitDialog(true) : navigate(-1))}
            aria-label={t.common.back}
            className="w-10 h-10 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-[var(--color-text)]"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <HelpButton
              helpKey="bridgeDetail"
              className="w-10 h-10 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-[var(--color-text)]"
            />
            <button
              onClick={() => setEditing(true)}
              aria-label={t.common.edit}
              className="w-10 h-10 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-[var(--color-text)]"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={toggleFavorite}
              aria-label={t.common.favorite}
              aria-pressed={bridge.favorite}
              className="w-10 h-10 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-[var(--color-accent-clay)]"
            >
              <Heart size={19} className={bridge.favorite ? 'fill-current' : ''} />
            </button>
            <button
              onClick={deleteBridge}
              aria-label={t.common.delete}
              className="w-10 h-10 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-[var(--color-danger)]"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        <div className="relative px-5 pb-3">
          <span className="inline-block text-[12px] font-medium bg-white/90 text-[var(--color-primary)] rounded-full px-3 py-1 mb-2">
            {CategoryMeta.label(t)}
          </span>
        </div>
      </PhotoBackground>

      <div className="px-5 -mt-1 pb-6">
        <h1 className="text-[24px] mb-2">{bridge.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-3">{bridge.description}</p>

        {bridge.connectionTags && bridge.connectionTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {bridge.connectionTags.map((v) => (
              <span key={v} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                {v}
              </span>
            ))}
          </div>
        )}

        {bridge.accessChannels && bridge.accessChannels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {bridge.accessChannels.map((id) => {
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

        {((bridge.linkedNeeds && bridge.linkedNeeds.length > 0) || (bridge.linkedObstacles && bridge.linkedObstacles.length > 0)) && (
          <div className="mb-5 flex flex-col gap-2">
            {bridge.linkedNeeds && bridge.linkedNeeds.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">🤍 {t.zugang.step6Title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {bridge.linkedNeeds.map((n) => (
                    <span key={n} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {bridge.linkedObstacles && bridge.linkedObstacles.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">🚧 {t.zugang.step7Title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {bridge.linkedObstacles.map((o) => (
                    <span key={o} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {bridge.conditions && bridge.conditions.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">{t.bridges.conditionsLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {bridge.conditions.map((id) => {
                const c = CONDITIONS.find((x) => x.id === id);
                if (!c) return null;
                return (
                  <span key={id} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    {c.emoji} {c.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {usagePattern && (usagePattern.stateLabel || usagePattern.feelingLabel) && (
          <Card className="mb-5" style={{ background: 'var(--color-primary-soft)' }}>
            <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
              {t.bridges.usagePatternText
                .replace('{count}', String(usagePattern.count))
                .replace('{context}', usagePattern.stateLabel ?? usagePattern.feelingLabel ?? '')}
            </p>
          </Card>
        )}

        <p className="text-[13px] text-[var(--color-text-faint)] mb-3">{t.bridges.chooseLevelPrompt}</p>
        <CompanionGuidanceCard text={t.bridges.guidanceLevelStep} />

        {/* Level path — a connecting line runs behind the level dots, with
         * the portion up to the chosen level lit up in the primary color.
         * This gives a felt sense of "moving along a path" rather than
         * picking from a plain list. Architecture note: this is the
         * intended integration point for the custom-designed access wheel
         * planned for later — swap/extend this block, the level data model
         * (bridge.levels) and selection state (selectedLevel) stay the same. */}
        <div className="relative flex flex-col gap-3 mb-5">
          {bridge.levels.length > 1 && (
            <div
              className="absolute top-[22px] bottom-[22px] w-[2px] bg-[var(--color-border)] rounded-full"
              style={{ left: 30, pointerEvents: 'none' }}
              aria-hidden="true"
            >
              <div
                className="w-full bg-[var(--color-primary)] rounded-full transition-all duration-500 ease-out"
                style={{
                  height:
                    selectedLevels.length > 0
                      ? `${(Math.max(0, bridge.levels.findIndex((l) => l.level === Math.max(...selectedLevels))) / (bridge.levels.length - 1)) * 100}%`
                      : '0%',
                }}
              />
            </div>
          )}
          {bridge.levels.map((lvl) => {
            const active = selectedLevels.includes(lvl.level);
            return (
              <button
                key={lvl.level}
                onClick={() => {
                  setSelectedLevels((prev) => (prev.includes(lvl.level) ? prev.filter((l) => l !== lvl.level) : [...prev, lvl.level]));
                  logActivity('bridge', bridge.title, bridge.id);
                  say(pickLine({ page: '/bruecken', trigger: 'bruecke_auswahl' }));
                }}
                aria-pressed={active}
                className={[
                  'relative text-left rounded-[var(--radius-lg)] border p-4 flex items-start gap-3 transition-all duration-200',
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] scale-[1.01]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]',
                ].join(' ')}
              >
                <span
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-medium flex-shrink-0 transition-transform duration-300',
                    active
                      ? 'bg-[var(--color-primary)] text-[var(--color-surface)] scale-110'
                      : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  {lvl.level}
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] text-[var(--color-text)]">{lvl.title}</span>
                  <span className="block text-[13px] text-[var(--color-text-muted)] mt-0.5">
                    {lvl.description}
                  </span>
                  {lvl.energyLevel && (
                    <span className="inline-block mt-1 text-[11px] text-[var(--color-text-faint)]">
                      {'⚡'.repeat(lvl.energyLevel)}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {bridge.levels.length > 1 && (
          <p className="text-[11px] text-[var(--color-text-faint)] -mt-3 mb-4">{t.bridges.multiLevelHint}</p>
        )}
        <button onClick={() => setShowAccessGap(true)} className="text-[12px] text-[var(--color-primary)] mb-4 block">
          🌉 {t.bridges.accessGapEntryCta}
        </button>

        {bridge.tip && (
          <div className="flex items-start gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-4 mb-5">
            <Lightbulb size={18} className="text-[var(--color-accent-sun)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-0.5">{t.bridges.tip}</p>
              <p className="text-[14px] hand-note">{bridge.tip}</p>
            </div>
          </div>
        )}

        <button
          onClick={saveLevelToDiary}
          disabled={!activeLevel}
          className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] py-3 text-[14px] text-[var(--color-text)] disabled:opacity-40"
        >
          {savedToDiary ? <Check size={16} className="text-[var(--color-primary)]" /> : <NotebookPen size={16} />}
          {savedToDiary ? t.bridges.savedToDiary : t.bridges.saveLevelToDiary}
        </button>
        {lastActivityId && <HelpfulnessPrompt activityId={lastActivityId} />}

        <button
          onClick={() => {
            setTimerOpen(true);
            setTimerWasUsed(true);
          }}
          disabled={!activeLevel}
          className="w-full flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] py-3 mt-2 text-[14px] text-[var(--color-text)] disabled:opacity-40"
        >
          <TimerIcon size={16} />
          {t.bridges.startTimer}
        </button>

        {timerOpen && activeLevel && (
          <BridgeTimerView
            contextLabel={`${bridge.title} — ${t.bridges.level} ${activeLevel.level}: ${activeLevel.title}`}
            onClose={() => setTimerOpen(false)}
            onNaturalComplete={(durationMin, note) => {
              setTimerOpen(false);
              openDiaryDraftFromTimer(durationMin, note);
            }}
          />
        )}

        <div className="flex gap-2 mt-3">
          <Button variant="ghost" icon={<Link2 size={15} />} onClick={shareBridgeLink}>
            {t.resources.shareLink}
          </Button>
          <Button variant="ghost" icon={<FileDown size={15} />} onClick={exportBridgePdf}>
            {t.resources.exportPdf}
          </Button>
        </div>
        <p className="text-[11px] text-[var(--color-text-faint)] mt-1.5 leading-relaxed">{t.resources.shareVsPdfHint}</p>

        {activeLevel && (
          <p className="sr-only" role="status">
            {t.bridges.level} {activeLevel.level}: {activeLevel.title}
          </p>
        )}
      </div>
      </div>

      <BridgePrintView
        bridges={printingBridge ? [bridge] : []}
        categoryLabel={(catId) => BRIDGE_CATEGORY_META[catId as keyof typeof BRIDGE_CATEGORY_META]?.label(t) ?? catId}
      />

      <BridgeFormModal
        open={editing}
        bridge={bridge}
        onClose={() => setEditing(false)}
        onSave={saveEdit}
        title={t.common.edit}
      />

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
      {showAccessGap && <AccessGapModal subject={bridge.title} onClose={() => setShowAccessGap(false)} />}
      {showZugangExitDialog && (
        <div className="fixed inset-0 z-[240] bg-[rgba(44,42,34,0.35)] flex items-end sm:items-center justify-center" onClick={() => setShowZugangExitDialog(false)}>
          <div
            className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[380px] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[16px] text-[var(--color-text)] mb-1">{t.bridges.zugangExitTitle}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-5 leading-relaxed">{t.bridges.zugangExitHint}</p>
            <div className="flex flex-col gap-2">
              <Button
                fullWidth
                onClick={() => {
                  finalizeZugangDraft('bridge', { bridgeLevels: selectedLevels, bridgeTimerUsed: timerWasUsed });
                  navigate('/');
                }}
              >
                ✓ {t.bridges.zugangExitFinishCta}
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  setShowZugangExitDialog(false);
                  navigate('/zugang');
                }}
              >
                → {t.bridges.zugangExitContinueCta}
              </Button>
              <button
                onClick={() => {
                  clearZugangDraft();
                  navigate('/');
                }}
                className="text-[13px] text-[var(--color-text-faint)] mt-1"
              >
                × {t.bridges.zugangExitDiscardCta}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
