import { useEffect, useMemo, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, History } from 'lucide-react';
import { ZugangStepHeader } from './ZugangStepHeader';
import { TensionScale } from '../polyvagal/TensionScale';
import { POLYVAGAL_ZONE_META } from '../polyvagal/polyvagalMeta';
import { saveZugangDraft, loadZugangDraft, clearZugangDraft, isDraftRecent } from './zugangDraft';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { createId } from '../../services/storage/repository';
import { SuggestionMultiSelect } from './SuggestionMultiSelect';
import { zugangRepo, SURVIVAL_TO_POLYVAGAL_ZONE } from './zugangRepo';
import { getCustomSuggestions, addCustomSuggestion, editCustomSuggestion, removeCustomSuggestion } from './zugangSuggestions';
import {
  BODY_SENSATIONS_DE,
  SURVIVAL_STATE_META,
  EXTENDED_STATE_GROUPS,
  FEELING_GROUPS,
  PROTECTION_STRATEGIES_DE,
  PROTECTION_GARDEN_SUGGESTIONS,
  CARE_WISH_OPTIONS,
  CARE_ACTIONS_DE,
  NEED_CATEGORY_GROUPS,
  OBSTACLES_DE,
  CONNECTION_ITEMS_DE,
  ACTION_EXAMPLES_DE,
} from './zugangContent';
import { PROTECTION_TO_NEEDS_DE } from './protectionToNeeds';
import { findSimilarPastEntry } from './zugangPatterns';
import { AccessGapModal } from './AccessGapModal';
import { GroundingOverlay } from '../../components/companion/GroundingOverlay';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { BRIDGE_CATEGORY_META } from '../bridges/bridgeMeta';
import { resourcesRepo } from '../resources/resourcesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { useSettings } from '../../state/SettingsContext';
import type { ZugangSurvivalState } from '../../data/types';
import { EnergyLevelFilter, energyExactMatch } from '../../components/shared/EnergyLevelFilter';
import { PhotoBackground } from '../../components/shared/PhotoBackground';

const STEP_COUNT = 12; // 0..11, see render switch below

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
    return d && isDraftRecent(d) ? d : null;
  });

  const [step, setStep] = useState(recentDraft?.step ?? 0);
  const [showIntro, setShowIntro] = useState(!recentDraft);
  const [ichJetzt, setIchJetzt] = useState(recentDraft?.ichJetzt ?? '');
  const [body, setBody] = useState<string[]>(recentDraft?.body ?? []);
  const [survivalState, setSurvivalState] = useState<ZugangSurvivalState | null>(recentDraft?.survivalState ?? null);
  const [tensionValue, setTensionValue] = useState<number>(recentDraft?.tensionValue ?? 50);
  const [feelings, setFeelings] = useState<string[]>(recentDraft?.feelings ?? []);
  const [recognitionAnswer, setRecognitionAnswer] = useState<'ja' | 'nein' | 'gerade_nicht' | null>(null);
  const [openFeelingGroup, setOpenFeelingGroup] = useState<string | null>(null);
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
      careWish, selfSufficient, need, obstacle, bridgeId, connection, action, reflection,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ichJetzt, body, survivalState, tensionValue, feelings, protectionStrategy, careWish, selfSufficient, need, obstacle, bridgeId, connection, action, reflection, showIntro, saved]);

  const allBridges = useMemo(() => bridgesRepo.getAll(), []);
  const selectedBridge = useMemo(() => allBridges.find((b) => b.id === bridgeId), [allBridges, bridgeId]);
  const favoriteResources = useMemo(() => resourcesRepo.getAll().filter((r) => r.favorite).slice(0, 4), []);
  const [energyFilter, setEnergyFilter] = useState<1 | 2 | 3 | null>(null);
  const activityContacts = useMemo(() => networkRepo.getAll().filter((e) => e.category === 'aktivitaet').slice(0, 4), []);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }
  function goBack() {
    setBackCount((c) => c + 1);
    if (step === 0) {
      navigate(-1);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  function chooseSurvivalState(state: ZugangSurvivalState) {
    setSurvivalState(state);
    // Reused, not reinvented: this is the exact same PolyvagalCheckIn
    // record the Tageskurve reads — Zugang never keeps its own separate
    // "what state am I in" data.
    polyvagalRepo.save({ id: createId('pv'), createdAt: new Date().toISOString(), zone: SURVIVAL_TO_POLYVAGAL_ZONE[state] });
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

  function goToBridge() {
    // "Brücke: Beenden/Fortführen/Verwerfen" brief — no longer finalizes
    // immediately. The draft (already being saved continuously by the
    // effect below) stays alive, and BridgeDetailPage shows the actual
    // three-way choice once the person is ready to leave the bridge —
    // matching what the brief explicitly asks for instead of silently
    // deciding "bridge = done" the moment the bridge opens.
    navigate(`/bruecken/${bridgeId}?fromZugang=1`);
  }

  function saveEntry(endedVia: 'complete' | 'bridge' | 'safetynet' = 'complete') {
    const now = new Date().toISOString();
    zugangRepo.save({
      id: createId('zugang'),
      createdAt: now,
      ichJetzt: ichJetzt.trim() || undefined,
      body,
      survivalState: survivalState ?? undefined,
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
      endedVia,
    });
    // The pass has genuinely concluded through one of its three real
    // endings — nothing left to resume, so the draft is cleared here
    // rather than lingering and offering a stale "Weitermachen" later.
    clearZugangDraft();
  }

  function finish() {
    saveEntry();
    setSaved(true);
    say(pickLine({ page: '/zugang', trigger: 'speichern' }), { joy: true });
  }

  const stepLabels = [
    t.zugang.step0Title, t.zugang.step1Title, t.zugang.step2Title, t.zugang.step3Title,
    t.zugang.step4Title, t.zugang.step5Title, t.zugang.step6Title, t.zugang.step7Title,
    t.zugang.step8Title, t.zugang.step9Title, t.zugang.step10Title, t.zugang.step11Title,
  ];

  if (showIntro) {
    const draft = loadZugangDraft();
    const hasDraft = !!draft && (draft.step > 0 || draft.ichJetzt.trim() || draft.body.length > 0);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
        <button
          onClick={() => navigate(-1)}
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
            <Button onClick={() => setShowIntro(false)} className="mb-3">
              {t.zugang.introStartCta}
            </Button>
          </>
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

      {!saved && (
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

      <div className="flex-1 animate-in" key={step}>
        {step === 0 && (
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

        {step === 1 && (
          <div>
            <ZugangStepHeader question={t.zugang.step1Question} hint={t.zugang.step1Hint} />
            <SuggestionMultiSelect
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
            <Link to="/entdecken/koerper" className="text-[12px] text-[var(--color-primary)] block mt-4">
              {t.zugang.bodyRefLink}
            </Link>
          </div>
        )}

        {step === 2 && (
          <div>
            <ZugangStepHeader question={t.tension.whichIntensityQuestion} questionOnly />
            <Card className="mb-5">
              <TensionScale value={tensionValue} onChange={setTensionValue} />
            </Card>

            <ZugangStepHeader question={t.zugang.step2Question} questionOnly />
            <div className="flex flex-col gap-4">
              {EXTENDED_STATE_GROUPS.map(({ zone, states }) => (
                <div key={zone}>
                  <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: POLYVAGAL_ZONE_META[zone].color }}>
                    {POLYVAGAL_ZONE_META[zone].label(t)}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {states.map((s) => {
                      const meta = SURVIVAL_STATE_META[s];
                      return (
                        <button
                          key={s}
                          onClick={() => chooseSurvivalState(s)}
                          className="flex flex-col items-center gap-1.5 py-4 rounded-[var(--radius-lg)] border"
                          style={{
                            borderColor: survivalState === s ? 'var(--color-primary)' : 'var(--color-border)',
                            background: survivalState === s ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                            borderWidth: survivalState === s ? 1.5 : 1,
                          }}
                        >
                          <span className="text-[24px]">{meta.emoji}</span>
                          <span className="text-[13px] text-[var(--color-text)]">{isEnLang(settings) ? meta.labelEn : meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {survivalState && (
              <Card className="mt-4 animate-in">
                <div className="flex items-start gap-3">
                  <InlineCompanionNote />
                  <p className="text-[13px] text-[var(--color-text)] leading-relaxed flex-1">
                    {t.zugang.survivalExplainers[SURVIVAL_STATE_META[survivalState].explanationKey as keyof typeof t.zugang.survivalExplainers]}
                  </p>
                </div>
              </Card>
            )}
            <Link to="/entdecken/nervensystem" className="text-[12px] text-[var(--color-primary)] block mt-4">
              {t.zugang.nervousSystemRefLink}
            </Link>
          </div>
        )}

        {step === 3 && (
          <div>
            <ZugangStepHeader question={t.zugang.step3Question} hint={t.zugang.step3Hint} />
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

        {step === 4 && (
          <div>
            <ZugangStepHeader question={t.zugang.step4Question} hint={t.zugang.step4Hint} />
            <SuggestionMultiSelect
              suggestions={PROTECTION_STRATEGIES_DE}
              customSuggestions={getCustomSuggestions('protection')}
              selected={protectionStrategy}
              onToggle={(v) => {
                const next = protectionStrategy.includes(v) ? protectionStrategy.filter((p) => p !== v) : [...protectionStrategy, v];
                setProtectionStrategy(next);
                offerGardenIfRelevant(next);
              }}
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
                <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.zugang.behindItHint}</p>
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

        {step === 5 && (
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

            {careWish.length > 0 && selfSufficient === null && (
              <Card className="mt-6 animate-in">
                <p className="text-[14px] text-[var(--color-text)] mb-3">{t.zugang.selfSufficientQuestion}</p>
                <div className="flex gap-2">
                  <Button size="sm" fullWidth onClick={() => setSelfSufficient('ja')}>
                    {t.zugang.selfSufficientYes}
                  </Button>
                  <Button size="sm" variant="secondary" fullWidth onClick={() => setSelfSufficient('nein')}>
                    {t.zugang.needSupportCta}
                  </Button>
                </div>
              </Card>
            )}
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

        {step === 6 && (
          <div>
            <ZugangStepHeader question={t.zugang.step6Question} hint={t.zugang.step6Hint} />
            <div className="flex flex-col gap-4">
              {NEED_CATEGORY_GROUPS.map((g) => {
                const items = isEnLang(settings) ? g.itemsEn : g.items;
                return (
                  <div key={g.id}>
                    <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                      {g.emoji} {isEnLang(settings) ? g.labelEn : g.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
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

        {step === 7 && (
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

        {step === 8 && (
          <div>
            <ZugangStepHeader question={t.zugang.step8Question} hint={t.zugang.step8Hint} />
            {allBridges.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-faint)] text-center">{t.zugang.noBridgesYet}</p>
            ) : (
              <div className="flex flex-col gap-2.5 mb-4">
                {allBridges.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBridgeId(b.id)}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-3 text-left"
                    style={{ borderColor: bridgeId === b.id ? 'var(--color-primary)' : 'var(--color-border)', borderWidth: bridgeId === b.id ? 1.5 : 1 }}
                  >
                    <PhotoBackground src={b.image} className="w-11 h-11 rounded-[var(--radius-md)] bg-cover bg-center flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[14px] text-[var(--color-text)] truncate">{b.title}</p>
                      <p className="text-[12px] text-[var(--color-text-muted)]">{BRIDGE_CATEGORY_META[b.category]?.label(t)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {bridgeId ? (
              <div className="flex gap-2 animate-in">
                <Button fullWidth onClick={goToBridge}>
                  {t.zugang.goToBridgeCta}
                </Button>
                <Button fullWidth variant="secondary" onClick={goNext}>
                  {t.zugang.stayInZugangCta}
                </Button>
              </div>
            ) : (
              <Button fullWidth variant="secondary" onClick={goNext}>
                {t.companion.pickerContinue}
              </Button>
            )}
          </div>
        )}

        {step === 9 && (
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

        {step === 10 && (
          <div>
            <ZugangStepHeader question={t.zugang.step10Question} hint={t.zugang.step10Hint} />

            {selectedBridge && (
              <Card className="mb-4" style={{ background: 'var(--color-primary-soft)' }}>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">{t.zugang.bridgeToActionLabel}</p>
                <p className="text-[14px] text-[var(--color-text)] mb-2">🌉 {selectedBridge.title}</p>
                <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">{t.zugang.bridgeToActionHint}</p>
              </Card>
            )}

            {favoriteResources.length > 0 && (
              <div className="mb-4">
                <EnergyLevelFilter value={energyFilter} onChange={setEnergyFilter} />
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.accessWheel.favoriteResources}</p>
                <div className="flex flex-wrap gap-2">
                  {energyExactMatch(favoriteResources, energyFilter).map((r) => (
                    <button key={r.id} onClick={() => setAction(r.title)} className="px-3.5 py-2 rounded-full text-[14px]" style={{ background: action === r.title ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: action === r.title ? 'var(--color-surface)' : 'var(--color-text)' }}>
                      {r.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {activityContacts.length > 0 && (
              <div className="mb-4">
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.network.title}</p>
                <div className="flex flex-wrap gap-2">
                  {activityContacts.map((c) => (
                    <button key={c.id} onClick={() => setAction(c.name)} className="px-3.5 py-2 rounded-full text-[14px]" style={{ background: action === c.name ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: action === c.name ? 'var(--color-surface)' : 'var(--color-text)' }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-2">
              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.zugang.actionExamplesLabel}</p>
              <div className="flex flex-wrap gap-2">
                {ACTION_EXAMPLES_DE.map((a) => (
                  <button key={a} onClick={() => setAction(a)} className="px-3.5 py-2 rounded-full text-[14px]" style={{ background: action === a ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: action === a ? 'var(--color-surface)' : 'var(--color-text)' }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <input
              className="input mt-3"
              placeholder={t.zugang.actionOwnPlaceholder}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
        )}

        {step === 11 && !saved && (
          <div>
            <h1 className="text-[20px] text-center mb-5">{t.zugang.step11Title2}</h1>
            <div className="flex flex-col gap-2 mb-6 text-[13px] text-[var(--color-text-muted)]">
              {body.length > 0 && <SummaryRow label={t.zugang.step1Title} value={body.join(', ')} />}
              <SummaryRow label={t.tension.valueLabel} value={`${tensionValue}%`} />
              {survivalState && <SummaryRow label={t.zugang.step2Title} value={isEnLang(settings) ? SURVIVAL_STATE_META[survivalState].labelEn : SURVIVAL_STATE_META[survivalState].label} />}
              {feelings.length > 0 && <SummaryRow label={t.zugang.step3Title} value={feelings.join(', ')} />}
              {protectionStrategy.length > 0 && <SummaryRow label={t.zugang.step4Title} value={protectionStrategy.join(', ')} />}
              {need.length > 0 && <SummaryRow label={t.zugang.step6Title} value={need.join(', ')} />}
              {obstacle.length > 0 && <SummaryRow label={t.zugang.step7Title} value={obstacle.join(', ')} />}
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
                <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.zugang.harderHint}</p>
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

            <Button fullWidth onClick={finish}>
              {t.common.save}
            </Button>
          </div>
        )}

        {step === 11 && saved && (
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

      {!saved && step !== 8 && step !== 11 && !(step === 5 && selfSufficient === 'nein') && (
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
