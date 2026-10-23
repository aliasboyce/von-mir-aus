import { useEffect, useRef, useState } from 'react';
import { goBack as goBackSafe } from '../../services/navigation';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, History } from 'lucide-react';
import { ZugangStepHeader } from './ZugangStepHeader';
import { NervousSystemLadderSlider } from '../polyvagal/NervousSystemLadderSlider';
import { ArousalModelExplainer } from '../polyvagal/ArousalModelExplainer';
import { saveZugangDraft, loadZugangDraft, clearZugangDraft, isDraftRecent, finalizeZugangDraft, currentFitSnapshot } from './zugangDraft';
import { ZugangSuggestions } from './ZugangSuggestions';
import { startFollowUp, getFollowUp, clearFollowUp } from './zugangFollowUp';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { createId } from '../../services/storage/repository';
import { SuggestionMultiSelect } from './SuggestionMultiSelect';
import { NamingInput } from './NamingInput';
import { ZugangBranch, type ZugangIntent } from './ZugangBranch';
import { bandForValue } from '../polyvagal/arousalBands';
import { BodySensationPicker } from './BodySensationPicker';
import { zugangRepo, SURVIVAL_TO_POLYVAGAL_ZONE } from './zugangRepo';
import { getCustomSuggestions, addCustomSuggestion, editCustomSuggestion, removeCustomSuggestion } from './zugangSuggestions';
import {
  BODY_SENSATIONS_DE,
  SURVIVAL_STATE_META,
  FEELING_GROUPS,
  PROTECTION_STRATEGIES_DE,
  PROTECTION_POSITIVE_DE,
  PROTECTION_GARDEN_SUGGESTIONS,
  CARE_WISH_OPTIONS,
  CARE_ACTIONS_DE,
  NEED_CATEGORY_GROUPS,
  OBSTACLES_DE,
  CONNECTION_ITEMS_DE,
} from './zugangContent';
import { PROTECTION_TO_NEEDS_DE } from './protectionToNeeds';
import { findSimilarPastEntry } from './zugangPatterns';
import { AccessGapModal } from './AccessGapModal';
import { GroundingOverlay } from '../../components/companion/GroundingOverlay';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { tensionRepo } from '../polyvagal/tensionRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { useSettings } from '../../state/SettingsContext';
import type { ZugangSurvivalState, ZugangEntry, PolyvagalZone } from '../../data/types';
import { FitFilterPanel } from '../../components/shared/FitFilterPanel';

const STEP_COUNT = 12; // 0..11, see render switch below
/** the last step: the short look back + save */
const FINAL_STEP = 11;

/**
 * The whole point of this page: not one more disconnected mini-tool,
 * but the thread connecting the ones that already exist. Nothing here
 * duplicates Tageskurve, Bedürfnisse, Brücken, Sicherheitsnetz, or
 * Garten data — every step either writes into an existing repo
 * (polyvagalRepo for the survival state) or links out to one
 * (bridgesRepo, resourcesRepo, networkRepo, gardenRepo).
 */
export function ZugangPage() {
  const t = useT();
  const navigate = useNavigate();
  const say = useCompanionSay();
  const { settings } = useSettings();

  // "Materialien"-Auftrag, Section 40 — a recent draft (touched in the
  // last 15 minutes, i.e. almost certainly "stepped out to a connected
  // page and pressed back") resumes silently, with every field
  // seeded straight from it — no flash of step 0 first, no
  // interruption screen. An older draft still goes through the
  // existing "Weitermachen/Von vorne beginnen" choice further down,
  // since silently dropping someone back into a days-old half-finished
  // pass without asking would be confusing more often than helpful.
  const [recentDraft] = useState(() => {
    const d = loadZugangDraft();
    if (!d) return null;
    if (isDraftRecent(d)) return d;
    // Stale draft (older than the resume window) — this is where
    // genuine abandonment is now detected, retroactively, using the
    // draft's own saved data rather than live component state (which
    // doesn't exist yet at this point in a fresh mount).
    finalizeZugangDraft('abandoned');
    return null;
  });

  // a pass that was saved and then went on to Ressourcen / a Brücke, and was not
  // reflected on yet (e.g. the phone's back button skipped the "danach" page)
  const [pendingFollowUp, setPendingFollowUp] = useState<string | null>(() => {
    const f = getFollowUp();
    if (!f) return null;
    const e = zugangRepo.getById(f.entryId);
    return e && !e.reflectedAt ? f.entryId : null;
  });
  const [step, setStep] = useState(recentDraft?.step ?? 0);
  const [showIntro, setShowIntro] = useState(!recentDraft);
  const [ichJetzt, setIchJetzt] = useState(recentDraft?.ichJetzt ?? '');
  const [body, setBody] = useState<string[]>(recentDraft?.body ?? []);
  // Wahrnehmen zuerst selbst: free words first, then plain options, and only
  // then the nervous-system colours as help for placing what was noticed.
  const [bodyStage, setBodyStage] = useState<'free' | 'neutral' | 'colored'>('free');
  const [feelingStage, setFeelingStage] = useState<'free' | 'options'>('free');
  // The fork after perceiving: 'choose' (two doors), 'regulate' (skills and
  // Skillketten), 'need' (passed through, continue with the existing path).
  const [branch, setBranch] = useState<'choose' | 'regulate' | 'need' | null>(recentDraft?.branch ?? null);
  const [intent, setIntent] = useState<ZugangIntent>(recentDraft?.intent ?? null);
  // what was decided at the fork, what was tried while regulating, and which
  // Ressourcen are ticked for use — all saved with the pass
  const [choice, setChoice] = useState<'regulate' | 'need' | 'done' | undefined>(recentDraft?.choice);
  const [regulateTried, setRegulateTried] = useState<string[]>(recentDraft?.regulateTried ?? []);
  const [usedResources, setUsedResources] = useState<{ id: string; title: string }[]>(recentDraft?.usedResources ?? []);
  const inBranch = branch === 'choose' || branch === 'regulate';
  const [survivalState, setSurvivalState] = useState<ZugangSurvivalState | null>(recentDraft?.survivalState ?? null);
  const [tensionValue, setTensionValue] = useState<number>(recentDraft?.tensionValue ?? 50);
  const [feelings, setFeelings] = useState<string[]>(recentDraft?.feelings ?? []);
  const [recognitionAnswer, setRecognitionAnswer] = useState<'ja' | 'nein' | 'gerade_nicht' | null>(null);
  const [openFeelingGroup, setOpenFeelingGroup] = useState<string | null>(null);
  const [openNeedGroup, setOpenNeedGroup] = useState<string | null>(null);
  const [protectionStrategy, setProtectionStrategy] = useState<string[]>(recentDraft?.protectionStrategy ?? []);
  const [gardenOfferShown, setGardenOfferShown] = useState(false);
  const [careWish, setCareWish] = useState<string[]>(recentDraft?.careWish ?? []);
  const [selfSufficient, setSelfSufficient] = useState<'ja' | 'nein' | null>(recentDraft?.selfSufficient ?? null);
  const [need, setNeed] = useState<string[]>(recentDraft?.need ?? []);
  const suggestedNeeds = Array.from(
    new Set(protectionStrategy.flatMap((s) => PROTECTION_TO_NEEDS_DE[s] ?? [])),
  );
  const similarPastEntry = findSimilarPastEntry(survivalState, feelings);
  const [obstacle, setObstacle] = useState<string[]>(recentDraft?.obstacle ?? []);
  const [bridgeId, setBridgeId] = useState<string | null>(recentDraft?.bridgeId ?? null);
  // "Starre Zone-Zuordnung ist doof — die Person soll selbst sagen, was
  // gerade offen ist"-Fund — deliberately session-only state, not part
  // of the persisted draft or the final saved entry. This is a
  // transient preference for "right now, while picking", not a
  // long-term record like feelings or needs are — keeping it out of
  // storage keeps the whole feature simple and easy to remove later
  // if it doesn't earn its place.
  // Now the same state as the Zugangskanäle page ("Was ist gerade
  // vorhanden?") and the shared "Was geht gerade?" filter, so what the
  // person says once counts everywhere (still session-only).
  const [connection, setConnection] = useState<string[]>(recentDraft?.connection ?? []);
  const [action, setAction] = useState(recentDraft?.action ?? '');
  const [reflection, setReflection] = useState(recentDraft?.reflection ?? '');
  const [showWhatMadeHarder, setShowWhatMadeHarder] = useState(false);
  const [showAccessGap, setShowAccessGap] = useState(false);
  // "Materialien"-Auftrag, Section 41 — adaptive use at low capacity.
  // Deliberately a narrow, low-risk signal (repeated back-navigation
  // within THIS pass) rather than trying to infer capacity from every
  // possible interaction pattern across the whole app. One gentle
  // offer per pass, never repeated once dismissed, never labeling the
  // person ("du bist überfordert") — only naming what's available.
  const [backCount, setBackCount] = useState(0);
  const [lowCapacityDismissed, setLowCapacityDismissed] = useState(false);
  const [groundingOpen, setGroundingOpen] = useState(false);
  const [harderFactors, setHarderFactors] = useState<string[]>([]);
  const [whatMightHaveHelped, setWhatMightHaveHelped] = useState('');
  const [saved, setSaved] = useState(false);
  // "Wo bricht der Zugang ab, soll im Rueckblick stehen"-Auftrag — a
  // ref mirror so the unmount cleanup below always calls the LATEST
  // saveEntry (closing over the current render's state), not a stale
  // one captured back when the effect first mounted.
  const saveEntryRef = useRef(saveEntry);
  saveEntryRef.current = saveEntry;
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const stepRef = useRef(step);
  stepRef.current = step;
  const showIntroRef = useRef(showIntro);
  showIntroRef.current = showIntro;

  // "Navigation-Persistenz: Verlinkungen sollen den Fortschritt nie
  // verlieren"-Fund — this used to save the pass as 'abandoned' (and,
  // via saveEntry, immediately clear the draft) on EVERY unmount past
  // step 0. That fired just as much for "briefly checked the linked
  // Gefühle/Nervensystem/Wertekompass page and is coming right back"
  // as for genuinely leaving — undermining the draft-resume mechanism
  // built specifically for that first case. Abandonment is now
  // detected lazily instead, on the NEXT mount: see the recentDraft
  // block below, which retroactively logs a stale (non-recent) draft
  // as abandoned only once it's clear the person didn't come back in
  // time, rather than assuming abandonment the instant this unmounts.

  // Priority 8 — additive sync to a persisted draft so opening a
  // connected page (Nervensystem, Schutzstrategien, Brücken, ...) and
  // coming back never loses progress. Only runs once real progress
  // exists (step > 0 or something was typed/selected) — an empty,
  // just-opened pass has nothing worth persisting yet.
  useEffect(() => {
    if (showIntro || saved) return;
    const hasProgress = step > 0 || ichJetzt.trim() || body.length > 0;
    if (!hasProgress) return;
    saveZugangDraft({
      step, ichJetzt, body, survivalState, tensionValue, feelings, protectionStrategy,
      careWish, selfSufficient, need, obstacle, bridgeId, connection, action, reflection, branch, intent,
      choice, regulateTried, usedResources,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ichJetzt, body, survivalState, tensionValue, feelings, protectionStrategy, careWish, selfSufficient, need, obstacle, bridgeId, connection, action, reflection, branch, intent, choice, regulateTried, usedResources, showIntro, saved]);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function goNext() {
    // after seeing what is there (Körper … Wert): the fork, once
    if (step === 8 && branch === null) {
      setBranch('choose');
      return;
    }
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }
  function goBack() {
    setBackCount((c) => c + 1);
    if (branch === 'regulate') {
      setBranch('choose');
      return;
    }
    if (branch === 'choose') {
      setBranch(null);
      return;
    }
    if (branch === 'need' && step === 9) {
      setBranch('choose');
      return;
    }
    if (step === 0) {
      goBackSafe(navigate);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  const [noState, setNoState] = useState(false);
  function chooseNoState(zone: PolyvagalZone) {
    setSurvivalState(null);
    setNoState(true);
    const at = new Date().toISOString();
    polyvagalRepo.save({ id: createId('pv'), createdAt: at, zone, tensionValue });
    tensionRepo.save({ id: createId('tension'), createdAt: at, value: tensionValue });
  }
  function chooseSurvivalState(state: ZugangSurvivalState) {
    setNoState(false);
    setSurvivalState(state);
    // Reused, not reinvented: this is the exact same PolyvagalCheckIn
    // record the Tageskurve reads — Zugang never keeps its own separate
    // "what state am I in" data.
    // "Status-Niveau/Anspannung vereinen"-Auftrag — tensionValue is now
    // the ladder's own raw value (set in the same interaction, see the
    // NervousSystemLadderSlider above), so it's included here too
    // instead of leaving this particular PolyvagalCheckIn without one.
    polyvagalRepo.save({ id: createId('pv'), createdAt: new Date().toISOString(), zone: SURVIVAL_TO_POLYVAGAL_ZONE[state], survivalState: state, tensionValue });
    tensionRepo.save({ id: createId('tension'), createdAt: new Date().toISOString(), value: tensionValue, survivalState: state });
  }

  function offerGardenIfRelevant(strategies: string[]) {
    if (gardenOfferShown) return;
    const relevant = strategies.some((s) => PROTECTION_GARDEN_SUGGESTIONS.some((kw) => s.toLowerCase().includes(kw)));
    if (relevant) setGardenOfferShown(true);
  }

  function createGardenFromStrategy(name: string) {
    gardenRepo.save({
      id: createId('garden'),
      name,
      kind: 'aufbau',
      createdAt: new Date().toISOString(),
      status: 'active',
      plantStyle: 'bluete_gaensebluemchen',
      frequency: 'daily',
      checkIns: [],
    });
    say(pickLine({ page: '/entdecken/garten', trigger: 'garden_neu' }), { joy: true });
  }

  function goToSafetyNet() {
    // A legitimate branch, not an abandoned pass — save whatever was
    // gathered so far before leaving, same shape as a full completion.
    saveEntry('safetynet');
    navigate('/sicherheit/netzwerk');
  }

  function saveEntry(endedVia: 'complete' | 'bridge' | 'safetynet' | 'abandoned' | 'regulate' | 'resource' = 'complete', overrides: Partial<ZugangEntry> = {}): string {
    const now = new Date().toISOString();
    const id = createId('zugang');
    zugangRepo.save({
      id,
      createdAt: now,
      ichJetzt: ichJetzt.trim() || undefined,
      body,
      survivalState: survivalState ?? undefined,
      tensionValue: survivalState || noState ? tensionValue : undefined,
      feelings,
      protectionStrategy,
      careWish,
      selfSufficient: selfSufficient ?? undefined,
      need,
      obstacle,
      bridgeId: bridgeId ?? undefined,
      connection,
      action,
      reflection: reflection.trim() || undefined,
      harderFactors: harderFactors.length > 0 ? harderFactors : undefined,
      whatMightHaveHelped: whatMightHaveHelped.trim() || undefined,
      fitFilter: currentFitSnapshot(),
      choice,
      regulateTried: regulateTried.length > 0 ? regulateTried : undefined,
      usedResources: usedResources.length > 0 ? usedResources : undefined,
      endedVia,
      stoppedAtStep: endedVia === 'abandoned' ? step : undefined,
      ...overrides,
    });
    // The pass has genuinely concluded through one of its real endings —
    // nothing left to resume, so the draft is cleared here rather than
    // lingering and offering a stale "Weitermachen" later.
    clearZugangDraft();
    return id;
  }

  /** Door 1 on the suggestions page: save the pass, then open the chosen Ressourcen. */
  function useChosenResources() {
    const id = saveEntry('resource', { bridgeId: undefined });
    startFollowUp(id);
    navigate(`/zugang/nutzen/${id}`);
  }

  /** Door 2: save the pass, then go into the Brücke (more guidance). */
  function useChosenBridge() {
    if (!bridgeId) return;
    const id = saveEntry('bridge', { usedResources: undefined });
    startFollowUp(id);
    navigate(`/bruecken/${bridgeId}?zugangEntry=${id}`);
  }

  function finishRegulate() {
    setBranch(null);
    setStep(FINAL_STEP);
    saveEntry('regulate', { choice: 'regulate' });
    setSaved(true);
    say(pickLine({ page: '/zugang', trigger: 'speichern' }), { joy: true });
  }

  /** "Fertig" at the fork: stop here, nothing more is asked. The perceiving so far is kept. */
  function finishAtFork() {
    setBranch(null);
    setStep(FINAL_STEP);
    saveEntry('complete', { choice: 'done' });
    setSaved(true);
    say(pickLine({ page: '/zugang', trigger: 'speichern' }), { joy: true });
  }

  function finish() {
    saveEntry();
    setSaved(true);
    say(pickLine({ page: '/zugang', trigger: 'speichern' }), { joy: true });
  }

  const shownStep = inBranch ? -1 : step;
  const stepLabels = [
    t.zugang.step0Title, t.zugang.step1Title, t.zugang.step2Title, t.zugang.step3Title,
    t.zugang.step4Title, t.zugang.step5Title, t.zugang.step6Title, t.zugang.step7Title,
    t.zugang.step9Title, t.zugang.stepChannelsTitle, t.zugang.stepSuggestTitle, t.zugang.step11Title,
  ];

  if (showIntro) {
    const draft = loadZugangDraft();
    const hasDraft = !!draft && (draft.step > 0 || draft.ichJetzt.trim() || draft.body.length > 0);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
        <button
          onClick={() => goBackSafe(navigate)}
          aria-label={t.common.close}
          className="absolute top-5 left-5 w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)]"
          style={{ top: 'max(20px, env(safe-area-inset-top))' }}
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-[40px] mb-4">🌱</span>
        <h1 className="text-[22px] mb-3">{t.zugang.title}</h1>
        {hasDraft ? (
          <>
            <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed max-w-[300px] mb-8">{t.zugang.draftFoundText}</p>
            <Button
              onClick={() => {
                if (draft) {
                  setStep(draft.step);
                  setBranch(draft.branch ?? null);
                  setIntent(draft.intent ?? null);
                  setIchJetzt(draft.ichJetzt);
                  setBody(draft.body);
                  setSurvivalState(draft.survivalState);
                  setTensionValue(draft.tensionValue ?? 50);
                  setFeelings(draft.feelings);
                  setProtectionStrategy(draft.protectionStrategy);
                  setCareWish(draft.careWish);
                  setSelfSufficient(draft.selfSufficient);
                  setNeed(draft.need);
                  setObstacle(draft.obstacle);
                  setBridgeId(draft.bridgeId);
                  setConnection(draft.connection);
                  setAction(draft.action);
                  setReflection(draft.reflection);
                  setChoice(draft.choice);
                  setRegulateTried(draft.regulateTried ?? []);
                  setUsedResources(draft.usedResources ?? []);
                }
                setShowIntro(false);
              }}
              className="mb-3"
            >
              {t.zugang.resumeDraftCta}
            </Button>
            <button
              onClick={() => {
                clearZugangDraft();
                setShowIntro(false);
              }}
              className="text-[13px] text-[var(--color-text-faint)] underline mb-5"
            >
              {t.zugang.startFreshCta}
            </button>
          </>
        ) : (
          <>
            <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed max-w-[300px] mb-2">{t.zugang.introText1}</p>
            <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed max-w-[300px] mb-8">{t.zugang.introText2}</p>
            <div className="w-full max-w-[320px] flex flex-col gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => {
                  setIntent('regulate');
                  setShowIntro(false);
                }}
                className="rounded-[var(--radius-lg)] border px-4 py-3 text-left"
                style={{ borderColor: 'var(--color-primary)', background: 'var(--color-surface)' }}
              >
                <span className="block text-[15px] text-[var(--color-text)]">{t.zugang.intentRegulate}</span>
                <span data-hint className="block text-[12px] text-[var(--color-text-faint)]">{t.zugang.intentRegulateHint}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntent('act');
                  setShowIntro(false);
                }}
                className="rounded-[var(--radius-lg)] border px-4 py-3 text-left"
                style={{ borderColor: 'var(--color-primary)', background: 'var(--color-surface)' }}
              >
                <span className="block text-[15px] text-[var(--color-text)]">{t.zugang.intentAct}</span>
                <span data-hint className="block text-[12px] text-[var(--color-text-faint)]">{t.zugang.intentActHint}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowIntro(false)}
              className="w-full max-w-[320px] rounded-[var(--radius-lg)] border border-dashed px-4 py-3 text-left mb-5"
              style={{ borderColor: 'var(--color-border)', background: 'transparent' }}
            >
              <span className="block text-[15px] text-[var(--color-text)]">{t.zugang.introOpenCta}</span>
              <span data-hint className="block text-[12px] text-[var(--color-text-faint)]">{t.zugang.introOpenHint}</span>
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => navigate('/entdecken/garten')}
          className="w-full max-w-[320px] rounded-[var(--radius-lg)] border px-4 py-3 text-left mb-5"
          style={{ borderColor: 'var(--color-border-strong)', background: 'var(--color-surface)' }}
          data-testid="zugang-routine"
        >
          <span className="block text-[15px] text-[var(--color-text)]">🔁 {settings.language === 'en' ? 'I want to do a routine' : 'Ich will eine Routine machen'}</span>
        </button>
        {pendingFollowUp && (
          <div className="w-full max-w-[320px] rounded-[var(--radius-lg)] p-4 mb-5 text-left" style={{ background: 'var(--color-primary-soft)' }}>
            <p className="text-[14px] text-[var(--color-text)] mb-0.5">{t.zugang.after.pendingTitle}</p>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-3">{t.zugang.after.pendingText}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate(`/zugang/danach/${pendingFollowUp}`)}>{t.zugang.after.pendingAnswer}</Button>
              <Button size="sm" variant="ghost" onClick={() => { clearFollowUp(); setPendingFollowUp(null); }}>{t.zugang.after.pendingDismiss}</Button>
            </div>
          </div>
        )}
        <Link to="/zugang/rueckblick" className="flex items-center justify-center gap-1.5 text-[13px] text-[var(--color-primary)]">
          <History size={14} /> {t.zugang.reviewCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-10">
      <div className="flex items-center justify-between mb-2">
        <button onClick={goBack} aria-label={t.common.back} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)]">
          <ChevronLeft size={22} />
        </button>
        {!saved && (
          <div className="flex items-center gap-1">
            <HelpButton helpKey="zugang" />
            <button onClick={() => navigate('/')} className="text-[14px] text-[var(--color-text-faint)]">
              {t.common.skip}
            </button>
          </div>
        )}
      </div>

      {!saved && (
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: i === step ? 14 : 5,
                height: 5,
                background: i === step ? 'var(--color-primary)' : 'var(--color-border)',
                transition: settings.reduceMotion ? 'none' : 'width 0.2s ease',
              }}
            />
          ))}
        </div>
      )}

      {!saved && !inBranch && (
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] text-center mb-4">
          {stepLabels[step]}
        </p>
      )}

      {!saved && backCount >= 3 && !lowCapacityDismissed && (
        <Card className="mb-4" style={{ background: 'var(--color-primary-soft)' }}>
          <p className="text-[15px] text-[var(--color-text)] mb-1">{t.zugang.lowCapacityTitle}</p>
          <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.zugang.lowCapacityText}</p>
          <div className="flex flex-col gap-2">
            <Button
              fullWidth
              size="sm"
              onClick={() => {
                setLowCapacityDismissed(true);
                setGroundingOpen(true);
              }}
            >
              {t.zugang.lowCapacityGroundingCta}
            </Button>
            <Button fullWidth size="sm" variant="secondary" onClick={() => navigate('/sicherheit')}>
              {t.zugang.lowCapacitySafetyCta}
            </Button>
            <button onClick={() => setLowCapacityDismissed(true)} className="text-[12px] text-[var(--color-text-faint)] mt-1">
              {t.zugang.lowCapacityContinueCta}
            </button>
          </div>
        </Card>
      )}

      <div className="flex-1 animate-in" key={inBranch ? `branch-${branch}` : step}>
        {inBranch && (
          <ZugangBranch
            mode={branch === 'regulate' ? 'regulate' : 'choose'}
            band={survivalState || noState ? bandForValue(tensionValue) : null}
            intent={intent}
            needWords={need}
            onTry={(title) => setRegulateTried((list) => (list.includes(title) ? list : [...list, title]))}
            onChoose={(c) => {
              setChoice(c);
              if (c === 'regulate') setBranch('regulate');
              else {
                setBranch('need');
                setStep(9);
              }
            }}
            onFinishRegulate={finishRegulate}
            onFinish={finishAtFork}
          />
        )}
        {shownStep === 0 && (
          <div>
            <ZugangStepHeader question={t.zugang.step0Question} hint={t.zugang.step0Hint} />
            <textarea
              className="input"
              rows={5}
              placeholder={t.zugang.step0Placeholder}
              value={ichJetzt}
              onChange={(e) => setIchJetzt(e.target.value)}
            />
          </div>
        )}

        {shownStep === 1 && (
          <div>
            <ZugangStepHeader question={t.zugang.step1Question} hint={t.zugang.step1Hint} />
            {bodyStage === 'free' && (
              <>
                <p data-hint className="text-[12.5px] text-[var(--color-text-faint)] mb-3">{t.zugang.bodyNamingHint}</p>
                <NamingInput
                  placeholder={t.zugang.bodyNamingPlaceholder}
                  terms={body}
                  onAdd={(v) => {
                    if (!BODY_SENSATIONS_DE.includes(v) && !getCustomSuggestions('body').includes(v)) addCustomSuggestion('body', v);
                    setBody([...body, v]);
                  }}
                  onRemove={(v) => setBody(body.filter((b) => b !== v))}
                />
                <button type="button" onClick={() => setBodyStage('neutral')} className="mt-4 text-[13px] text-[var(--color-primary)] underline underline-offset-2 text-left">
                  {t.zugang.bodyShowOptions}
                </button>
              </>
            )}
            {bodyStage === 'neutral' && (
              <>
                <p data-hint className="text-[12.5px] text-[var(--color-text-faint)] mb-3">{t.zugang.bodyOptionsIntro}</p>
                <SuggestionMultiSelect
                  suggestions={[...BODY_SENSATIONS_DE].sort((a, b) => a.localeCompare(b, 'de'))}
                  customSuggestions={getCustomSuggestions('body')}
                  selected={body}
                  onToggle={(v) => toggle(body, setBody, v)}
                  onAddCustom={(v) => {
                    addCustomSuggestion('body', v);
                    setBody([...body, v]);
                  }}
                  onEditCustom={(o, n) => {
                    editCustomSuggestion('body', o, n);
                    setBody(body.map((b) => (b === o ? n : b)));
                  }}
                  onDeleteCustom={(v) => {
                    removeCustomSuggestion('body', v);
                    setBody(body.filter((b) => b !== v));
                  }}
                />
                <button type="button" onClick={() => setBodyStage('colored')} className="mt-4 text-[13px] text-[var(--color-primary)] underline underline-offset-2 text-left">
                  {t.zugang.bodyShowColors}
                </button>
              </>
            )}
            {bodyStage === 'colored' && (
              <BodySensationPicker
                suggestions={BODY_SENSATIONS_DE}
                customSuggestions={getCustomSuggestions('body')}
                selected={body}
                onToggle={(v) => toggle(body, setBody, v)}
                onAddCustom={(v) => {
                  addCustomSuggestion('body', v);
                  setBody([...body, v]);
                }}
                onEditCustom={(o, n) => {
                  editCustomSuggestion('body', o, n);
                  setBody(body.map((b) => (b === o ? n : b)));
                }}
                onDeleteCustom={(v) => {
                  removeCustomSuggestion('body', v);
                  setBody(body.filter((b) => b !== v));
                }}
              />
            )}
            <Link to="/entdecken/koerper" className="text-[12px] text-[var(--color-primary)] block mt-4">
              {t.zugang.bodyRefLink}
            </Link>
          </div>
        )}

        {shownStep === 2 && (
          <div>
            <ZugangStepHeader question={t.zugang.step2Question} questionOnly />
            <ArousalModelExplainer />
            <NervousSystemLadderSlider
              onSelect={(_zone, state) => chooseSurvivalState(state)}
              onNone={chooseNoState}
              noneSelected={noState && !survivalState}
              selectedState={survivalState}
              value={tensionValue}
              onValueChange={setTensionValue}
            />
            <Link to="/entdecken/nervensystem" className="text-[12px] text-[var(--color-primary)] block mt-4">
              {t.zugang.nervousSystemRefLink}
            </Link>
          </div>
        )}

        {shownStep === 3 && (
          <div>
            <ZugangStepHeader question={t.zugang.step3Question} hint={t.zugang.step3Hint} />
            {feelingStage === 'free' && (
              <>
                <p data-hint className="text-[12.5px] text-[var(--color-text-faint)] mb-3">{t.zugang.feelingNamingHint}</p>
                <NamingInput
                  placeholder={t.zugang.feelingNamingPlaceholder}
                  terms={feelings}
                  onAdd={(v) => {
                    if (!getCustomSuggestions('feeling').includes(v) && !FEELING_GROUPS.some((g) => g.sub.includes(v) || g.subEn.includes(v))) addCustomSuggestion('feeling', v);
                    setFeelings([...feelings, v]);
                  }}
                  onRemove={(v) => setFeelings(feelings.filter((f) => f !== v))}
                />
                <button type="button" onClick={() => setFeelingStage('options')} className="mt-4 text-[13px] text-[var(--color-primary)] underline underline-offset-2 text-left">
                  {t.zugang.feelingShowOptions}
                </button>
              </>
            )}
            {feelingStage === 'options' && (
              <>
            <div className="flex flex-col gap-2">
              {FEELING_GROUPS.map((g) => {
                const label = isEnLang(settings) ? g.labelEn : g.label;
                const subs = isEnLang(settings) ? g.subEn : g.sub;
                const groupSelectedCount = subs.filter((s) => feelings.includes(s)).length;
                const isOpen = openFeelingGroup === g.id;
                return (
                  <div key={g.id} className="rounded-[var(--radius-lg)] border overflow-hidden" style={{ borderColor: isOpen ? g.color : 'var(--color-border)' }}>
                    <button
                      onClick={() => setOpenFeelingGroup(isOpen ? null : g.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                      style={{ borderLeft: `4px solid ${g.color}` }}
                    >
                      <span className="text-[14px] text-[var(--color-text)]">{label}</span>
                      {groupSelectedCount > 0 && (
                        <span className="text-[12px]" style={{ color: g.color }}>{groupSelectedCount}</span>
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-0.5 flex flex-wrap gap-2">
                        {subs.map((s) => (
                          <button
                            key={s}
                            onClick={() => toggle(feelings, setFeelings, s)}
                            className="px-3 py-1.5 rounded-full text-[13px]"
                            style={{
                              background: feelings.includes(s) ? g.color : 'var(--color-surface-muted)',
                              color: feelings.includes(s) ? '#fff' : 'var(--color-text)',
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] text-[var(--color-text-faint)] mt-3 mb-2">{t.zugang.ownFeelingLabel}</p>
            <SuggestionMultiSelect
              suggestions={[]}
              customSuggestions={getCustomSuggestions('feeling')}
              selected={feelings}
              onToggle={(v) => toggle(feelings, setFeelings, v)}
              onAddCustom={(v) => {
                addCustomSuggestion('feeling', v);
                setFeelings([...feelings, v]);
              }}
              onEditCustom={(o, n) => {
                editCustomSuggestion('feeling', o, n);
                setFeelings(feelings.map((f) => (f === o ? n : f)));
              }}
              onDeleteCustom={(v) => {
                removeCustomSuggestion('feeling', v);
                setFeelings(feelings.filter((f) => f !== v));
              }}
            />
              </>
            )}
            <Link to="/entdecken/gefuehle" className="text-[12px] text-[var(--color-primary)] block mt-4">
              {t.zugang.feelingsRefLink}
            </Link>

            {similarPastEntry && recognitionAnswer === null && feelings.length > 0 && (
              <Card className="mt-5 animate-in" style={{ background: 'var(--color-primary-soft)' }}>
                <div className="flex items-start gap-3">
                  <InlineCompanionNote />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">🌿 {t.zugang.recognitionTitle}</p>
                    <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">
                      {t.zugang.recognitionText.replace('{action}', similarPastEntry.action)}
                    </p>
                    <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.zugang.recognitionQuestion}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setRecognitionAnswer('ja')}>
                        {t.common.yes}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setRecognitionAnswer('nein')}>
                        {t.common.no}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRecognitionAnswer('gerade_nicht')}>
                        {t.zugang.recognitionNotNowCta}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            {recognitionAnswer === 'ja' && (
              <p className="text-[12px] text-[var(--color-primary)] mt-3">🌱 {t.zugang.recognitionYesNote}</p>
            )}
          </div>
        )}

        {shownStep === 4 && (
          <div>
            <ZugangStepHeader question={t.zugang.step4Question} hint={t.zugang.step4Hint} />
            {(() => {
              // Three clearly named groups instead of one mixed list:
              // protective patterns / calmer-open states / everything else.
              const toggle = (v: string) => {
                const next = protectionStrategy.includes(v) ? protectionStrategy.filter((p) => p !== v) : [...protectionStrategy, v];
                setProtectionStrategy(next);
                offerGardenIfRelevant(next);
              };
              const noop = () => {};
              const patterns = PROTECTION_STRATEGIES_DE.filter((x) => !PROTECTION_POSITIVE_DE.includes(x) && x !== 'weiß ich nicht');
              const calm = PROTECTION_STRATEGIES_DE.filter((x) => PROTECTION_POSITIVE_DE.includes(x));
              const other = PROTECTION_STRATEGIES_DE.filter((x) => x === 'weiß ich nicht');
              const groupLabel = 'text-[12px] text-[var(--color-text-faint)] mb-2';
              return (
                <div className="flex flex-col gap-5">
                  <div data-testid="protection-group-patterns">
                    <p className={groupLabel}>{t.zugang.step4GroupPatterns}</p>
                    <SuggestionMultiSelect suggestions={patterns} customSuggestions={[]} selected={protectionStrategy} onToggle={toggle} onAddCustom={noop} onEditCustom={noop} onDeleteCustom={noop} hideAddCustom />
                  </div>
                  <div data-testid="protection-group-calm">
                    <p className={groupLabel}>{t.zugang.step4GroupCalm}</p>
                    <SuggestionMultiSelect suggestions={calm} customSuggestions={[]} selected={protectionStrategy} onToggle={toggle} onAddCustom={noop} onEditCustom={noop} onDeleteCustom={noop} hideAddCustom />
                  </div>
                  <div data-testid="protection-group-other">
                    <p className={groupLabel}>{t.zugang.step4GroupOther}</p>
                    <SuggestionMultiSelect
                      suggestions={other}
                      customSuggestions={getCustomSuggestions('protection')}
                      selected={protectionStrategy}
                      onToggle={toggle}
                      onAddCustom={(v) => {
                        addCustomSuggestion('protection', v);
                        const next = [...protectionStrategy, v];
                        setProtectionStrategy(next);
                        offerGardenIfRelevant(next);
                      }}
                      onEditCustom={(o, n) => {
                        editCustomSuggestion('protection', o, n);
                        setProtectionStrategy(protectionStrategy.map((p) => (p === o ? n : p)));
                      }}
                      onDeleteCustom={(v) => {
                        removeCustomSuggestion('protection', v);
                        setProtectionStrategy(protectionStrategy.filter((p) => p !== v));
                      }}
                    />
                  </div>
                </div>
              );
            })()}
            <Link to="/entdecken/schutzstrategien" className="text-[12px] text-[var(--color-primary)] block mt-3">
              {t.zugang.protectionRefLink}
            </Link>
            {gardenOfferShown && (
              <Card className="mt-4 animate-in">
                <div className="flex items-start gap-3">
                  <InlineCompanionNote />
                  <div className="flex-1">
                    <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.zugang.gardenOfferText}</p>
                    <Button size="sm" onClick={() => createGardenFromStrategy(protectionStrategy[protectionStrategy.length - 1] ?? '')}>
                      {t.zugang.gardenOfferCta}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            {/* "Verbinden, glätten" Regressions-Runde, Punkt 2 — die
             * Garten-Verbindung darf nicht nur bei einer schmalen
             * Stichwortauswahl (4 von 20 Strategien) auftauchen, sonst
             * wirkt sie wie verschwunden, sobald jemand eine andere
             * Strategie waehlt. Dieser Link ist unabhaengig davon immer
             * da, sobald mindestens eine Strategie gewaehlt wurde. */}
            {protectionStrategy.length > 0 && (
              <Link to="/entdecken/garten" className="text-[12px] text-[var(--color-primary)] block mt-4">
                🌱 {t.zugang.protectionGardenLink}
              </Link>
            )}
            {suggestedNeeds.length > 0 && (
              <Card className="mt-4">
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.zugang.behindItTitle}</p>
                <p data-hint className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.zugang.behindItHint}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedNeeds.map((n) => {
                    const added = need.includes(n);
                    return (
                      <button
                        key={n}
                        onClick={() => !added && setNeed([...need, n])}
                        disabled={added}
                        className="px-3 py-1.5 rounded-full text-[13px] flex items-center gap-1"
                        style={{
                          background: added ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                          color: added ? 'var(--color-surface)' : 'var(--color-text)',
                        }}
                      >
                        {added && '✓ '}
                        {n}
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {shownStep === 5 && (
          <div>
            <ZugangStepHeader question={t.zugang.step5Question} hint={t.zugang.step5Hint} />
            <div className="flex flex-col gap-2 mb-5">
              {CARE_WISH_OPTIONS.map((o) => {
                const text = isEnLang(settings) ? o.textEn : o.text;
                const cat = isEnLang(settings) ? o.categoryEn : o.category;
                return (
                  <button
                    key={text}
                    onClick={() => toggle(careWish, setCareWish, text)}
                    className="text-left px-4 py-2.5 rounded-[var(--radius-lg)] border"
                    style={{
                      borderColor: careWish.includes(text) ? 'var(--color-primary)' : 'var(--color-border)',
                      background: careWish.includes(text) ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                    }}
                  >
                    <span className="text-[14px] text-[var(--color-text)] block">{text}</span>
                    <span className="text-[11px] text-[var(--color-text-faint)]">{cat}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.zugang.careActionsLabel}</p>
            <SuggestionMultiSelect
              suggestions={CARE_ACTIONS_DE}
              customSuggestions={getCustomSuggestions('care')}
              selected={careWish}
              onToggle={(v) => toggle(careWish, setCareWish, v)}
              onAddCustom={(v) => {
                addCustomSuggestion('care', v);
                setCareWish([...careWish, v]);
              }}
              onEditCustom={(o, n) => {
                editCustomSuggestion('care', o, n);
                setCareWish(careWish.map((c) => (c === o ? n : c)));
              }}
              onDeleteCustom={(v) => {
                removeCustomSuggestion('care', v);
                setCareWish(careWish.filter((c) => c !== v));
              }}
            />

            {/* "Kann ich mir das gerade selber geben oder brauche ich Hilfe
             * ist aufeinmal weg, das soll da bleiben"-Fund — the card used
             * to disappear for good as soon as it was answered (and never
             * showed at all until a care wish was picked). Now always
             * present in this step, the current answer stays highlighted,
             * and it can be changed at any time. */}
            <Card className="mt-6">
              <p className="text-[14px] text-[var(--color-text)] mb-3">{t.zugang.selfSufficientQuestion}</p>
              <div className="flex gap-2">
                <Button size="sm" fullWidth variant={selfSufficient === 'ja' ? 'primary' : 'secondary'} onClick={() => setSelfSufficient('ja')}>
                  {t.zugang.selfSufficientYes}
                </Button>
                <Button size="sm" fullWidth variant={selfSufficient === 'nein' ? 'primary' : 'secondary'} onClick={() => setSelfSufficient('nein')}>
                  {t.zugang.needSupportCta}
                </Button>
              </div>
            </Card>
            {selfSufficient === 'nein' && (
              <Card className="mt-4 animate-in" style={{ borderColor: 'var(--color-primary)', borderWidth: 1.5 }}>
                <div className="flex items-start gap-3">
                  <InlineCompanionNote />
                  <div className="flex-1">
                    <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.zugang.needSupportText}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={goToSafetyNet}>
                        {t.network.title} →
                      </Button>
                      <Button size="sm" variant="secondary" onClick={goNext}>
                        {t.zugang.continueHereCta}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {shownStep === 6 && (
          <div>
            <ZugangStepHeader question={t.zugang.step6Question} hint={t.zugang.step6Hint} />
            <div className="flex flex-col gap-4">
              {NEED_CATEGORY_GROUPS.map((g) => {
                const items = isEnLang(settings) ? g.itemsEn : g.items;
                const groupSelectedCount = items.filter((s) => need.includes(s)).length;
                const isOpen = openNeedGroup === g.id;
                return (
                  <div key={g.id} className="rounded-[var(--radius-lg)] border overflow-hidden" style={{ borderColor: isOpen ? 'var(--color-primary)' : 'var(--color-border)' }}>
                    <button
                      onClick={() => setOpenNeedGroup(isOpen ? null : g.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <span className="text-[14px] text-[var(--color-text)]">
                        {g.emoji} {isEnLang(settings) ? g.labelEn : g.label}
                      </span>
                      {groupSelectedCount > 0 && <span className="text-[12px] text-[var(--color-primary)]">{groupSelectedCount}</span>}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-0.5 flex flex-wrap gap-2">
                        {items.map((s) => (
                          <button
                            key={s}
                            onClick={() => toggle(need, setNeed, s)}
                            className="px-3.5 py-2 rounded-full text-[14px]"
                            style={{
                              background: need.includes(s) ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                              color: need.includes(s) ? 'var(--color-surface)' : 'var(--color-text)',
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div>
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.zugang.ownNeedLabel}</p>
                <SuggestionMultiSelect
                  suggestions={[]}
                  customSuggestions={getCustomSuggestions('need')}
                  selected={need}
                  onToggle={(v) => toggle(need, setNeed, v)}
                  onAddCustom={(v) => {
                    addCustomSuggestion('need', v);
                    setNeed([...need, v]);
                  }}
                  onEditCustom={(o, n) => {
                    editCustomSuggestion('need', o, n);
                    setNeed(need.map((n2) => (n2 === o ? n : n2)));
                  }}
                  onDeleteCustom={(v) => {
                    removeCustomSuggestion('need', v);
                    setNeed(need.filter((n2) => n2 !== v));
                  }}
                />
              </div>
            </div>
            <Link to="/entdecken/beduerfnis-kompass" className="text-[12px] text-[var(--color-primary)] block mt-4">
              {t.zugang.needsRefLink}
            </Link>
          </div>
        )}

        {shownStep === 7 && (
          <div>
            <ZugangStepHeader question={t.zugang.step7Question} hint={t.zugang.step7Hint} />
            <SuggestionMultiSelect
              suggestions={OBSTACLES_DE}
              customSuggestions={getCustomSuggestions('obstacle')}
              selected={obstacle}
              onToggle={(v) => toggle(obstacle, setObstacle, v)}
              onAddCustom={(v) => {
                addCustomSuggestion('obstacle', v);
                setObstacle([...obstacle, v]);
              }}
              onEditCustom={(o, n) => {
                editCustomSuggestion('obstacle', o, n);
                setObstacle(obstacle.map((o2) => (o2 === o ? n : o2)));
              }}
              onDeleteCustom={(v) => {
                removeCustomSuggestion('obstacle', v);
                setObstacle(obstacle.filter((o2) => o2 !== v));
              }}
            />
            <Link to="/entdecken/schutzstrategien" className="text-[12px] text-[var(--color-primary)] block text-center mt-4">
              {t.zugang.obstaclesRefLink}
            </Link>
            <Link to="/entdecken/denkmaschine" className="text-[12px] text-[var(--color-primary)] block text-center mt-2">
              {t.zugang.glaubenssaetzeLink}
            </Link>
          </div>
        )}

        {shownStep === 8 && (
          <div>
            <ZugangStepHeader question={t.zugang.step9Question} hint={t.zugang.step9Hint} />
            <SuggestionMultiSelect
              suggestions={CONNECTION_ITEMS_DE}
              customSuggestions={getCustomSuggestions('connection')}
              selected={connection}
              onToggle={(v) => toggle(connection, setConnection, v)}
              onAddCustom={(v) => {
                addCustomSuggestion('connection', v);
                setConnection([...connection, v]);
              }}
              onEditCustom={(o, n) => {
                editCustomSuggestion('connection', o, n);
                setConnection(connection.map((c) => (c === o ? n : c)));
              }}
              onDeleteCustom={(v) => {
                removeCustomSuggestion('connection', v);
                setConnection(connection.filter((c) => c !== v));
              }}
            />
            <Link to="/entdecken/wertekompass" className="text-[12px] text-[var(--color-primary)] block text-center mt-4">
              {t.zugang.wertekompassLink}
            </Link>
          </div>
        )}

        {shownStep === 9 && (
          <div>
            <ZugangStepHeader question={t.zugang.stepChannelsQuestion} hint={t.zugang.stepChannelsHint} />
            {/* The person says what is open right now (or skips it —
             * nothing is ever hidden, only fitted). The next page uses it. */}
            <p data-hint className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.zugang.openChannelsHint}</p>
            <FitFilterPanel defaultOpen />
          </div>
        )}

        {shownStep === 10 && (
          <div>
            <ZugangStepHeader question={t.zugang.stepSuggestQuestion} hint={t.zugang.stepSuggestHint} />
            <ZugangSuggestions
              need={need}
              obstacle={obstacle}
              connection={connection}
              bridgeId={bridgeId}
              setBridgeId={setBridgeId}
              usedResources={usedResources}
              setUsedResources={setUsedResources}
              action={action}
              setAction={setAction}
              onUseResources={useChosenResources}
              onUseBridge={useChosenBridge}
            />
          </div>
        )}

        {shownStep === FINAL_STEP && !saved && (
          <div>
            <h1 className="text-[20px] text-center mb-5">{t.zugang.step11Title2}</h1>
            <div className="flex flex-col gap-2 mb-6 text-[13px] text-[var(--color-text-muted)]">
              {body.length > 0 && <SummaryRow label={t.zugang.step1Title} value={body.join(', ')} />}
              <SummaryRow label={t.tension.valueLabel} value={`${tensionValue}%`} />
              {survivalState && <SummaryRow label={t.zugang.step2Title} value={isEnLang(settings) ? SURVIVAL_STATE_META[survivalState].labelEn : SURVIVAL_STATE_META[survivalState].label} />}
              {feelings.length > 0 && <SummaryRow label={t.zugang.step3Title} value={feelings.join(', ')} />}
              {protectionStrategy.length > 0 && <SummaryRow label={t.zugang.step4Title} value={protectionStrategy.join(', ')} />}
              {careWish.length > 0 && <SummaryRow label={t.zugang.step5Title} value={careWish.join(', ')} />}
              {need.length > 0 && <SummaryRow label={t.zugang.step6Title} value={need.join(', ')} />}
              {obstacle.length > 0 && <SummaryRow label={t.zugang.step7Title} value={obstacle.join(', ')} />}
              {connection.length > 0 && <SummaryRow label={t.zugang.step9Title} value={connection.join(', ')} />}
              {regulateTried.length > 0 && <SummaryRow label={t.zugang.reviewRegulateTried} value={regulateTried.join(', ')} />}
              {action && <SummaryRow label={t.zugang.step10Title} value={action} />}
            </div>
            <label className="flex flex-col gap-1.5 mb-4">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.zugang.reflectionLabel}</span>
              <textarea className="input" rows={3} placeholder={t.zugang.reflectionPlaceholder} value={reflection} onChange={(e) => setReflection(e.target.value)} />
            </label>

            <button onClick={() => setShowWhatMadeHarder((v) => !v)} className="text-[13px] text-[var(--color-primary)] mb-6 block">
              {showWhatMadeHarder ? t.zugang.hideHarderCta : t.zugang.showHarderCta}
            </button>
            {showWhatMadeHarder && (
              <Card className="mb-6 -mt-3">
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.zugang.harderTitle}</p>
                <p data-hint className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.zugang.harderHint}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {t.zugang.harderOptions.map((o) => (
                    <button
                      key={o}
                      onClick={() => toggle(harderFactors, setHarderFactors, o)}
                      className="px-3 py-1.5 rounded-full text-[13px]"
                      style={{
                        background: harderFactors.includes(o) ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                        color: harderFactors.includes(o) ? 'var(--color-surface)' : 'var(--color-text)',
                      }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.zugang.helpedLabel}</span>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder={t.zugang.helpedPlaceholder}
                    value={whatMightHaveHelped}
                    onChange={(e) => setWhatMightHaveHelped(e.target.value)}
                  />
                </label>
                <button onClick={() => setShowAccessGap(true)} className="text-[12px] text-[var(--color-primary)] mt-3 block">
                  🌉 {t.zugang.accessGapEntryCta}
                </button>
              </Card>
            )}

            <Button fullWidth onClick={finish} data-sound="complete">
              {t.common.save}
            </Button>
          </div>
        )}

        {shownStep === FINAL_STEP && saved && (
          <div className="flex flex-col items-center justify-center text-center gap-5 py-6 animate-in">
            <span className="text-[48px]">🌱</span>
            <div>
              <h1 className="text-[20px] mb-2">{t.zugang.doneTitle}</h1>
              <p className="text-[14px] text-[var(--color-text-muted)] max-w-[280px] mx-auto">{t.zugang.doneSubtitle}</p>
            </div>
            <div className="w-full flex flex-col gap-2.5 mt-2">
              <Link to="/zugang/rueckblick" className="w-full">
                <Button fullWidth variant="secondary">
                  {t.zugang.reviewCta}
                </Button>
              </Link>
              <Button fullWidth onClick={() => navigate('/')}>
                {t.weather.backHome}
              </Button>
            </div>
          </div>
        )}
      </div>

      {!saved && !inBranch && step !== FINAL_STEP && !(step === 5 && selfSufficient === 'nein') && (
        <Button fullWidth onClick={goNext} className="mt-6">
          {t.companion.pickerContinue}
        </Button>
      )}
      {showAccessGap && <AccessGapModal onClose={() => setShowAccessGap(false)} />}
      {groundingOpen && <GroundingOverlay onClose={() => setGroundingOpen(false)} />}
    </div>
  );
}

function isEnLang(settings: { language: string }): boolean {
  return settings.language === 'en';
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-[var(--color-border)]">
      <span className="text-[var(--color-text-faint)] flex-shrink-0">{label}</span>
      <span className="text-[var(--color-text)] text-right">{value}</span>
    </div>
  );
}
