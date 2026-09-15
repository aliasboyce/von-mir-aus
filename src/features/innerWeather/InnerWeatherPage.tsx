import { useMemo, useState, useEffect } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { weatherRepo } from './weatherRepo';
import { WEATHER_META, NEED_META, NEED_ORDER } from './weatherMeta';
import { polyvagalRepo, todaysCheckIns } from '../polyvagal/polyvagalRepo';
import { NervousSystemLadderSlider } from '../polyvagal/NervousSystemLadderSlider';
import { ArousalModelExplainer } from '../polyvagal/ArousalModelExplainer';
import { WindowOfToleranceIllustration } from '../polyvagal/WindowOfToleranceIllustration';
import { tensionRepo } from '../polyvagal/tensionRepo';
import { MiniCurve } from '../polyvagal/MiniCurve';
import { WeatherWheel } from './WeatherWheel';
import { WeatherAnimation } from './WeatherAnimation';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import type { NeedDirection, WeatherCondition, PolyvagalZone, ZugangSurvivalState } from '../../data/types';
import { saveInnerWeatherDraft, loadRecentInnerWeatherDraft, clearInnerWeatherDraft } from './innerWeatherDraft';

type Step = 'select' | 'reflect' | 'zone' | 'tension' | 'need' | 'done';

/** A soft, non-diagnostic reflection line per condition, connecting the
 * weather metaphor the person just picked to what it might mean for their
 * nervous system right now — this is the actual content of the new,
 * separate "Wo bist du gerade?" step, distinct from the initial weather
 * pick itself. */
function reflectionFor(t: ReturnType<typeof useT>, condition: WeatherCondition): string {
  const map: Record<WeatherCondition, string> = {
    klar: t.weather.reflect.klar,
    sonnig: t.weather.reflect.sonnig,
    bewoelkt: t.weather.reflect.bewoelkt,
    windig: t.weather.reflect.windig,
    regnerisch: t.weather.reflect.regnerisch,
    gewitter: t.weather.reflect.gewitter,
    nebel: t.weather.reflect.nebel,
  };
  return map[condition];
}

export function InnerWeatherPage() {
  const t = useT();
  const say = useCompanionSay();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [recentDraft] = useState(() => loadRecentInnerWeatherDraft());
  const [step, setStep] = useState<Step>(recentDraft?.step ?? 'select');
  const [showZoneHelp, setShowZoneHelp] = useState(false);
  const [condition, setCondition] = useState<WeatherCondition | null>(recentDraft?.condition ?? null);
  const [need, setNeed] = useState<NeedDirection | null>(recentDraft?.need ?? null);
  const [checkInId, setCheckInId] = useState<string | null>(recentDraft?.checkInId ?? null);
  const [tensionValue, setTensionValue] = useState(recentDraft?.tensionValue ?? 50);
  const [justPickedState, setJustPickedState] = useState<PolyvagalZone | ZugangSurvivalState | null>(null);
  // Persist on every relevant change so navigating away mid-flow (e.g.
  // via "Mehr zu den drei Zuständen") and back doesn't lose progress —
  // the concrete bug this addresses. Cleared once the flow genuinely
  // finishes ('done'), so a completed check-in never gets mistaken for
  // an in-progress one later.
  useEffect(() => {
    if (step === 'done') {
      clearInnerWeatherDraft();
    } else if (step !== 'select' || condition || need) {
      saveInnerWeatherDraft({ step, condition, need, checkInId, tensionValue });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, condition, need, checkInId, tensionValue]);
  // Recomputed fresh whenever the reflect step is entered, so it
  // includes the check-in that was just saved a moment before landing
  // here — not a stale snapshot from before this weather pick.
  const todaysPolyvagalCheckIns = useMemo(() => todaysCheckIns(), [step]);

  // The order this whole flow now follows end to end — see Schritt 1-4
  // in the brief: Wetter → Wo bist du gerade? → Spannung → Bedürfnisse.
  // Kept as one linear array so the back button and "weiter" always
  // agree on what's next/previous, rather than hand-writing the
  // adjacency in two separate places that could drift out of sync.
  const STEP_ORDER: Step[] = ['select', 'reflect', 'zone', 'need', 'done'];

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  function chooseZone(zone: PolyvagalZone, survivalState?: ZugangSurvivalState) {
    polyvagalRepo.save({ id: createId('pv'), createdAt: new Date().toISOString(), zone, survivalState, tensionValue });
    tensionRepo.save({ id: createId('tension'), createdAt: new Date().toISOString(), value: tensionValue });
    // "Nicht sofort weiterspringen"-Auftrag — this used to auto-advance
    // to the 'need' step 450ms after tapping an F-tag, with no way to
    // stay and look around. Now it only marks the pick (for the visible
    // selected/highlighted state) — moving on is a deliberate "Weiter"
    // tap below, matching how Zugang's equivalent step already works.
    setJustPickedState(survivalState ?? zone);
  }

  function advanceFromZone() {
    setStep('need');
    setJustPickedState(null);
    say(pickLine({ page: '/inneres-wetter', trigger: 'checkin_zu_beduerfnis' }));
  }

  function chooseCondition(c: WeatherCondition) {
    setCondition(c);
    const id = createId('weather');
    setCheckInId(id);
    weatherRepo.save({
      id,
      createdAt: new Date().toISOString(),
      condition: c,
    });
    // No longer auto-derives a polyvagal zone from the weather pick
    // (WEATHER_TO_ZONE in weatherMeta.ts is now unused, kept only for
    // reference) — the new flow asks "Wo bist du gerade?" as its own
    // explicit step right after this one, and mixing an inferred zone
    // with a person's own stated one would be exactly the blending the
    // brief asked to stop.
    setStep('reflect');
  }

  function chooseNeed(n: NeedDirection) {
    setNeed(n);
    if (checkInId && condition) {
      weatherRepo.save({
        id: checkInId,
        createdAt: new Date().toISOString(),
        condition,
        need: n,
      });
    }
    setStep('done');
    say(pickLine({ page: '/inneres-wetter', trigger: 'speichern' }), { joy: true });
  }

  function skipToDone() {
    setStep('done');
    say(pickLine({ page: '/inneres-wetter', trigger: 'speichern' }));
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-10">
      <div className="flex items-center justify-between mb-6">
        {step !== 'select' ? (
          <button
            onClick={goBack}
            aria-label={t.common.back}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)]"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            aria-label={t.common.close}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)]"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {step !== 'done' && (
          <div className="flex items-center gap-1">
            <HelpButton helpKey="checkin" />
            <button
              onClick={() => navigate('/')}
              className="text-[14px] text-[var(--color-text-faint)]"
            >
              {t.common.skip}
            </button>
          </div>
        )}
      </div>

      {step !== 'done' && (
        <button
          onClick={() => {
            say(pickLine({ page: '/inneres-wetter', trigger: 'checkin_zu_zugang' }));
            navigate('/zugang');
          }}
          className="text-[12px] text-[var(--color-text-faint)] underline mb-2 self-center"
        >
          {t.weather.stuckHereCta}
        </button>
      )}

      {step === 'select' && (
        <div className="animate-in flex-1">
          <h1 className="text-[24px] mb-1 text-center">{t.weather.title}</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mb-6 text-center">{t.weather.subtitle}</p>
          <WeatherWheel onSelect={chooseCondition} />
        </div>
      )}

      {step === 'reflect' && condition && (
        <div className="animate-in flex-1">
          <div className="relative flex flex-col items-center mb-6 pt-2 pb-1">
            {!settings.reduceMotion && <WeatherAnimation condition={condition} />}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center bg-[var(--color-primary-soft)] text-[32px] mb-3"
              aria-hidden="true"
            >
              {WEATHER_META[condition].emoji}
            </div>
            <h1 className="text-[22px] text-center">{t.weather.reflectTitle}</h1>
          </div>

          <div className="flex items-start gap-3 mb-6">
            <InlineCompanionNote />
            <p className="text-[14px] text-[var(--color-text)] leading-relaxed flex-1">
              {reflectionFor(t, condition)}
            </p>
          </div>

          <button
            onClick={() => navigate('/entdecken/tageskurve/entwicklung')}
            className="w-full text-left rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-3 mb-6"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-[var(--color-text-muted)]">{t.weather.seeDevelopment}</span>
              <ChevronLeft size={15} className="rotate-180 flex-shrink-0 text-[var(--color-text-faint)]" />
            </div>
            {todaysPolyvagalCheckIns.length > 0 ? (
              <div className="flex items-center gap-2 mt-1.5">
                <MiniCurve points={todaysPolyvagalCheckIns} width={140} height={36} />
                <span className="text-[11px] text-[var(--color-text-faint)]">
                  {t.weather.todaysCheckInsCount.replace('{n}', String(todaysPolyvagalCheckIns.length))}
                </span>
              </div>
            ) : (
              <p className="text-[12px] text-[var(--color-text-faint)] mt-1">{t.weather.firstCheckInOfDay}</p>
            )}
          </button>

          <Button fullWidth onClick={() => setStep('zone')}>
            {t.companion.pickerContinue}
          </Button>

          <div className="flex items-center justify-between mt-4">
            <span className="text-[12px] text-[var(--color-text-faint)]">{t.settings.dailyReviewWeather}</span>
            <button
              role="switch"
              aria-checked={settings.dailyReviewShowWeather !== false}
              onClick={() => updateSettings({ dailyReviewShowWeather: !(settings.dailyReviewShowWeather !== false) })}
              className="w-9 h-5 rounded-full relative flex-shrink-0"
              style={{ background: settings.dailyReviewShowWeather !== false ? 'var(--color-primary)' : 'var(--color-border)' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: settings.dailyReviewShowWeather !== false ? 17 : 2 }}
              />
            </button>
          </div>
        </div>
      )}

      {step === 'zone' && (
        <div className="animate-in flex-1">
          <div className="flex flex-col items-center mb-4">
            <h1 className="text-[20px] text-center">{t.polyvagal.quickPrompt}</h1>
            <p className="text-[14px] text-[var(--color-text-muted)] text-center mt-1 max-w-[280px]">
              {t.home.zoneStepHint}
            </p>
          </div>
          <button onClick={() => setShowZoneHelp((v) => !v)} className="text-[12px] text-[var(--color-primary)] block mx-auto mb-4">
            {showZoneHelp ? t.polyvagal.hideZoneHelpCta : t.polyvagal.showZoneHelpCta}
          </button>
          {showZoneHelp && (
            <Card className="mb-5 animate-in">
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.polyvagal.zoneHelpIntro}</p>
              <WindowOfToleranceIllustration />
              <p className="text-[11px] text-[var(--color-text-faint)] leading-relaxed mt-3">{t.polyvagal.zoneHelpCaveat}</p>
            </Card>
          )}

          <ArousalModelExplainer />
          <NervousSystemLadderSlider
            onSelect={(zone, state) => chooseZone(zone, state)}
            selectedState={justPickedState as ZugangSurvivalState | null}
            value={tensionValue}
            onValueChange={setTensionValue}
          />
          {justPickedState && (
            <button
              onClick={advanceFromZone}
              className="w-full text-center text-[15px] mt-4 py-3 rounded-full animate-in"
              style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}
            >
              {t.common.next} →
            </button>
          )}
          <Link to="/entdecken/tageskurve" className="block text-[13px] text-[var(--color-primary)] text-center mt-4">
            {t.home.zoneMoreDetail}
          </Link>
        </div>
      )}

      {step === 'need' && condition && (
        <div className="animate-in flex-1">
          <div className="flex flex-col items-center mb-6">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-surface)] text-[36px] mb-3"
              aria-hidden="true"
            >
              {WEATHER_META[condition].emoji}
            </div>
            <h1 className="text-[22px] text-center">{t.weather.needTitle}</h1>
            <p className="text-[14px] text-[var(--color-text-muted)] text-center mt-1 max-w-[280px]">
              {t.weather.needSubtitle}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {NEED_ORDER.map((n) => (
              <Card
                key={n}
                interactive
                onClick={() => chooseNeed(n)}
                className="flex items-center gap-4"
              >
                <span className="text-[24px]" aria-hidden="true">
                  {NEED_META[n].icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] text-[var(--color-text)]">{NEED_META[n].label(t)}</p>
                  <p className="text-[13px] text-[var(--color-text-muted)]">{NEED_META[n].hint(t)}</p>
                </div>
              </Card>
            ))}
          </div>
          <button
            onClick={() => {
              say(pickLine({ page: '/inneres-wetter', trigger: 'checkin_zu_zugang' }));
              navigate('/zugang');
            }}
            className="w-full text-center text-[14px] text-[var(--color-primary)] mt-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)]"
          >
            {t.weather.needUnsureCta}
          </button>
          <button
            onClick={skipToDone}
            className="w-full text-center text-[14px] text-[var(--color-text-faint)] mt-2 py-2"
          >
            {t.common.skip}
          </button>
        </div>
      )}

      {step === 'done' && condition && (
        <div className="animate-in flex-1 flex flex-col items-center justify-center text-center gap-6 py-10">
          <span className="text-[56px]" aria-hidden="true">
            {WEATHER_META[condition].emoji}
          </span>
          <div>
            <h1 className="text-[22px] mb-2">{t.weather.doneTitle}</h1>
            <p className="text-[14px] text-[var(--color-text-muted)] text-center">
              {t.weather.doneSubtitle}
            </p>
          </div>
          {need && (
            <div className="text-[14px] text-[var(--color-primary)] bg-[var(--color-primary-soft)] rounded-full px-4 py-2">
              {NEED_META[need].icon} {NEED_META[need].label(t)}
            </div>
          )}
          <div className="w-full flex flex-col gap-3 mt-4">
            <Button
              fullWidth
              onClick={() => navigate(need ? `/entdecken/beduerfnis-kompass?need=${need}` : '/bruecken')}
            >
              {need ? t.weather.exploreBridges : t.weather.exploreBridges}
            </Button>
            <Button fullWidth variant="ghost" onClick={() => navigate('/')}>
              {t.weather.backHome}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
