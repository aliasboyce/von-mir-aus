import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Info, X, AlertTriangle, Search } from 'lucide-react';
import { useT } from '../../i18n';
import { SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { useSettings } from '../../state/SettingsContext';
import { triggerHaptic } from '../../services/haptics';
import { playSound } from '../../services/sounds';
import { polyvagalRepo } from './polyvagalRepo';
import { tensionRepo } from './tensionRepo';
import {
  AROUSAL_BANDS,
  bandsForBoundaries,
  gradientStopsForBands,
  gradientStopsForBandsVisual,
  visualPositionForValue,
  valueForVisualPosition,
  visualExtentForBand,
  DEFAULT_ZONE_BOUNDARIES,
  COMFORT_ZONE_COLOR,
  polyvagalZoneForValue,
} from './arousalBands';
import { BodyDetectiveModal } from './BodyDetectiveModal';
import { windowProgressRepo } from './windowProgressRepo';
import { createId } from '../../services/storage/repository';
import { triggerPrint } from '../../services/printSupport';
import { WindowProgressPrintView } from './WindowProgressPrintView';
import { NervousSystemWave } from './NervousSystemWave';
import type { PolyvagalZone, ZugangSurvivalState } from '../../data/types';

/**
 * "6-Zonen-Modell nach Yerkes-Dodson + Stresstoleranzfenster"-Auftrag
 * — complete rebuild on the person's detailed clinical spec. Scale
 * now runs 0% (top) to 100% (bottom), HIGHER = more activation/
 * dysregulation, across six precisely-bounded bands instead of the
 * earlier three. See arousalBands.ts for the full band definitions
 * and sourcing.
 */
interface NervousSystemLadderSliderProps {
  onSelect: (zone: PolyvagalZone, state: ZugangSurvivalState) => void;
  selectedState?: ZugangSurvivalState | null;
  value?: number;
  onValueChange?: (v: number) => void;
  /** Hides the Soforthilfe / 'Passende Skills' links under the zone
   * text — used where the slider is only a measuring tool (the
   * reflection at the end of a Skill run), so nothing in it can
   * navigate away mid-reflection. */
  hideSupportLinks?: boolean;
}

/** The zones where the pop-up '>> zu den Skills' button shows. zone3
 * (Fokus & Flow) and calmer zones stay without it — skills are for when
 * regulation is actually needed, not the already-regulated zones. */
const SKILLS_BUTTON_ZONES = new Set(['zone4', 'zone5', 'zone6']);

export function NervousSystemLadderSlider({ onSelect, selectedState, value: controlledValue, onValueChange, hideSupportLinks = false }: NervousSystemLadderSliderProps) {
  const t = useT();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [internalValue, setInternalValue] = useState(20);
  const value = controlledValue ?? internalValue;
  // "Zonen selbst kalibrieren"-Fund — calibratedBands is the single
  // source of truth for this render: default AROUSAL_BANDS when
  // nobody has set arousalZoneBoundaries, otherwise the same six
  // zones/colors/labels/exercises with personal min/max. Everything
  // below (active band, gradient, label widths, dysregulation) reads
  // from this one array rather than branching on "which mode".
  // "Alte 5-Grenzen-Kalibrierung archivieren"-Auftrag — the old
  // calibration produced boundaries meant for the previous, single-
  // direction 0→100 scale; they're meaningless against the new
  // wrapping one, so calibratedBands is simply AROUSAL_BANDS now.
  // Variable name kept as-is since it's used all through this file.
  const calibratedBands = AROUSAL_BANDS;
  const band = useMemo(() => calibratedBands.find((b) => value >= b.min && value <= b.max) ?? calibratedBands[0], [value]);
  const [lastBandId, setLastBandId] = useState(band.id);
  const zoneT = t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones];

  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [bodyDetectiveOpen, setBodyDetectiveOpen] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [printingChronicle, setPrintingChronicle] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const hasCalibration = settings.arousalZoneBoundaries != null;
  // "Meldung fuer Dysregulation aendert sich dementsprechend"-Fund —
  // no separate threshold math anymore; a zone's own inWindow flag
  // (unchanged by calibration, only its min/max move) IS the
  // dysregulation signal now, exactly matching what's actually shown.
  const isDysregulated = !band.inWindow;
  // "Fenster erst nach Loslassen einblenden, Aufblitz-Effekt"-Auftrag —
  // both the window overlay on the slider bar and the dysregulation
  // warning stay completely invisible until the person has released
  // the slider at least once, so the very first, unbiased read of the
  // slider happens with zero judgment or expectation in view. After
  // that first release they fade/flash in and stay visible from then on.
  const [hasReleased, setHasReleased] = useState(false);
  const [justFlashed, setJustFlashed] = useState(false);

  const [draftBoundaries, setDraftBoundaries] = useState<string[]>(
    (settings.arousalZoneBoundaries ?? DEFAULT_ZONE_BOUNDARIES).map(String)
  );

  function handleChange(v: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    if (onValueChange) onValueChange(clamped);
    else setInternalValue(clamped);
  }

  function handleRelease() {
    if (!hasReleased) {
      setHasReleased(true);
      setJustFlashed(true);
      window.setTimeout(() => setJustFlashed(false), 900);
    }
  }

  /** Saves the current ladder value as a check-in (unless the very same
   * value was already saved in the last two minutes) and opens Skills
   * for this zone. "Der Check-in-Durchgang wird trotzdem abgespeichert.
   * Immer."-Auftrag. */
  function goToSkills() {
    const nowMs = Date.now();
    const alreadySaved = polyvagalRepo.getAll().some((c) => c.tensionValue === value && nowMs - new Date(c.createdAt).getTime() < 2 * 60 * 1000);
    if (!alreadySaved) {
      const nowIso = new Date(nowMs).toISOString();
      polyvagalRepo.save({ id: createId('pv'), createdAt: nowIso, zone: polyvagalZoneForValue(value), tensionValue: value });
      tensionRepo.save({ id: createId('tension'), createdAt: nowIso, value });
    }
    navigate(`/entdecken/ressourcen/skills?zone=${band.id}&v=${Math.round(value)}`);
  }

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function valueFromClientY(clientY: number): number {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const usableTop = rect.top + 12;
    const usableHeight = rect.height - 24;
    const ratio = (clientY - usableTop) / usableHeight;
    return Math.round(valueForVisualPosition(ratio * 100));
  }

  useEffect(() => {
    if (band.id !== lastBandId) {
      triggerHaptic('select', settings);
      // "Klick-Sounds fehlen beim Einchecken"-Fund — the ladder track is
      // a div with role=slider, which the global click listener in
      // AppShell didn't treat as tappable, and dragging across zones
      // gave no audio feedback at all. A soft tick each time the
      // marker crosses into a new zone now matches the haptic one.
      playSound('click', settings);
      setLastBandId(band.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [band.id]);

  useEffect(() => {
    const clear = () => setPrintingChronicle(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      handleChange(valueFromClientY(e.clientY));
    }
    function onUp() {
      if (dragging.current) handleRelease();
      dragging.current = false;
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onValueChange]);

  function onTrackPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    handleChange(valueFromClientY(e.clientY));
  }

  function saveCalibration() {
    const parsed = draftBoundaries.map((d) => Math.max(0, Math.min(100, Number(d) || 0)));
    updateSettings({ arousalZoneBoundaries: parsed as [number, number, number, number, number] });
    setCalibrationOpen(false);
  }

  function resetCalibration() {
    updateSettings({ arousalZoneBoundaries: undefined });
    setDraftBoundaries(DEFAULT_ZONE_BOUNDARIES.map(String));
    setCalibrationOpen(false);
  }

  function saveWindowProgress() {
    windowProgressRepo.save({ id: createId('winprog'), createdAt: new Date().toISOString(), boundaries: settings.arousalZoneBoundaries ?? DEFAULT_ZONE_BOUNDARIES });
    setProgressSaved(true);
    window.setTimeout(() => setProgressSaved(false), 2200);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* "Position auf der Nervensystem-Leiter selbst kalibrieren
       * archivieren"-Auftrag — the gear button that opened the old
       * 5-boundary calibration panel is removed here (too confusing
       * alongside the new wrapping scale); calibrationOpen and the
       * whole panel below stay in the file, dormant, in case this
       * gets rebuilt later — nothing about them was deleted. */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--color-text-faint)]">{t.polyvagal.ladderSliderLabel}</p>
      </div>

      {/* "Koerper-Detektiv"-Auftrag — placed right next to the main
       * slider, for anyone who genuinely can't tell where they are
       * right now (a real, documented effect of high stress or
       * dissociation blocking interoception), not just a decorative
       * extra. */}
      <button
        onClick={() => setBodyDetectiveOpen(true)}
        className="flex items-center justify-center gap-1.5 py-2 rounded-full text-[13px]"
        style={{ border: '1.5px solid var(--color-border)', color: 'var(--color-text-muted)' }}
      >
        <Search size={14} />
        {t.polyvagal.bodyDetective.triggerCta}
      </button>

      {hasReleased && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full transition-opacity duration-200"
          style={{
            background: 'var(--color-danger-soft)',
            color: 'var(--color-danger)',
            opacity: isDysregulated ? 1 : 0,
            pointerEvents: isDysregulated ? 'auto' : 'none',
            boxShadow: justFlashed && isDysregulated ? '0 0 0 3px var(--color-danger)' : 'none',
            transition: 'opacity 0.2s ease, box-shadow 0.5s ease',
          }}
          aria-hidden={!isDysregulated}
        >
          <AlertTriangle size={15} />
          <span className="text-[12px] font-medium tracking-wide">{t.polyvagal.arousalDysregulationWarning}</span>
        </div>
      )}

      {calibrationOpen && (
        <div className="rounded-[var(--radius-lg)] p-4 animate-in" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[13px] font-medium text-[var(--color-text)] flex-1">{t.polyvagal.arousalCalibrationTitle}</p>
            <button onClick={() => setInfoOpen(true)} aria-label="Info" className="text-[var(--color-text-faint)]">
              <Info size={16} />
            </button>
          </div>
          <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.polyvagal.arousalCalibrationIntro}</p>
          <div className="flex flex-col gap-2.5 mb-3">
            {(['zone2', 'zone3', 'zone4', 'zone5', 'zone6'] as const).map((zoneKey, i) => (
              <label key={zoneKey} className="flex items-center justify-between gap-3">
                <span className="text-[12.5px] text-[var(--color-text)]">
                  {t.polyvagal.arousalZones[zoneKey].label} {t.polyvagal.arousalCalibrationBeginsAt}
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draftBoundaries[i]}
                  onChange={(e) => setDraftBoundaries(draftBoundaries.map((d, j) => (j === i ? e.target.value : d)))}
                  className="w-20 px-2.5 py-1.5 rounded-[var(--radius-md)] text-[14px] text-right flex-shrink-0"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                />
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveCalibration} className="flex-1 py-2 rounded-full text-[13px]" style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}>
              {t.polyvagal.arousalCalibrationSave}
            </button>
            {hasCalibration && (
              <button onClick={resetCalibration} className="px-4 py-2 rounded-full text-[13px]" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                {t.polyvagal.arousalCalibrationReset}
              </button>
            )}
          </div>

          <button onClick={saveWindowProgress} className="w-full mt-2 py-2 rounded-full text-[13px]" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
            {progressSaved ? t.polyvagal.arousalProgressSaved : t.polyvagal.arousalProgressSaveCta}
          </button>
          <button onClick={() => setChronicleOpen((v) => !v)} className="w-full mt-2 text-[12.5px] text-[var(--color-primary)]">
            {chronicleOpen ? t.polyvagal.arousalChronicleHide : t.polyvagal.arousalChronicleShow}
          </button>
          {chronicleOpen && (
            <div className="mt-2 flex flex-col gap-1.5 animate-in">
              {windowProgressRepo
                .getAll()
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 text-[12.5px] px-3 py-2 rounded-[var(--radius-md)]" style={{ background: 'var(--color-surface)' }}>
                    <span className="text-[var(--color-text-faint)] flex-shrink-0">
                      {new Date(entry.createdAt).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    {/* "Fortschritt auf einen Blick statt fuenf Zahlen
                     * lesen muessen"-Fund — a tiny horizontal version
                     * of the same six-zone gradient, so a shrinking
                     * green/olive stretch or a growing blue one is
                     * visible at a glance across months, not something
                     * that has to be mentally parsed from numbers. */}
                    {entry.boundaries ? (
                      <div className="flex-1 h-2.5 rounded-full" style={{ background: `linear-gradient(to right, ${gradientStopsForBands(bandsForBoundaries(entry.boundaries))})` }} />
                    ) : (
                      <div className="flex-1 h-2.5 rounded-full" style={{ background: `linear-gradient(to right, var(--color-border) 0%, var(--color-border) ${entry.windowStart}%, ${COMFORT_ZONE_COLOR} ${entry.windowStart}%, ${COMFORT_ZONE_COLOR} ${entry.windowEnd}%, var(--color-border) ${entry.windowEnd}%, var(--color-border) 100%)` }} />
                    )}
                    <span className="text-[var(--color-text)] font-medium flex-shrink-0 text-[11px]">
                      {entry.boundaries ? entry.boundaries.join('·') + '%' : `${entry.windowStart}–${entry.windowEnd}%`}
                    </span>
                  </div>
                ))}
              {windowProgressRepo.getAll().length === 0 && <p className="text-[12px] text-[var(--color-text-faint)] text-center py-2">{t.polyvagal.arousalChronicleEmpty}</p>}
              {windowProgressRepo.getAll().length > 0 && (
                <button
                  onClick={() => {
                    setPrintingChronicle(true);
                    window.setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
                  }}
                  className="text-[12.5px] text-[var(--color-primary)] mt-1"
                >
                  {t.polyvagal.arousalChronicleExportCta}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {infoOpen && (
        createPortal(
<div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setInfoOpen(false)}>
          <div
            className="w-full max-w-[420px] max-h-[80vh] overflow-y-auto rounded-[var(--radius-xl)] p-5 animate-in"
            style={{ background: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2 mb-3">
              <p className="text-[15px] font-medium text-[var(--color-text)] flex-1">{t.polyvagal.arousalCalibrationInfoTitle}</p>
              <button onClick={() => setInfoOpen(false)} className="text-[var(--color-text-faint)]">
                <X size={18} />
              </button>
            </div>
            {t.polyvagal.arousalCalibrationInfoText.split('\n\n').map((para, i) => {
              // "Uebersichtlicher strukturieren"-Auftrag — bolds the
              // short lead-in label before the first colon (e.g. "Es
              // verengt sich:") as a mini-heading, without altering or
              // duplicating the person's own carefully-worded text.
              const colonIdx = para.indexOf(':');
              const hasLabel = colonIdx > 0 && colonIdx < 45;
              return (
                <p key={i} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
                  {hasLabel ? (
                    <>
                      <span className="font-medium text-[var(--color-text)]">{para.slice(0, colonIdx + 1)}</span>
                      {para.slice(colonIdx + 1)}
                    </>
                  ) : (
                    para
                  )}
                </p>
              );
            })}
          </div>
        </div>,
 document.body)
      )}

      <div className="flex items-stretch gap-4 rounded-[var(--radius-lg)] overflow-hidden" style={{ height: 340, background: 'var(--color-surface-muted)' }}>
        {/* vertical rainbow handle bar, 6 gradient stops */}
        <div
          ref={trackRef}
          className="relative flex-shrink-0 py-3"
          style={{ width: 44, touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onTrackPointerDown}
          role="slider"
          tabIndex={0}
          aria-label={t.polyvagal.ladderSliderLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') handleChange(value - 2);
            else if (e.key === 'ArrowDown') handleChange(value + 2);
            else return;
            handleRelease();
          }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: 12,
              bottom: 12,
              width: 14,
              background: `linear-gradient(to bottom, ${gradientStopsForBandsVisual(calibratedBands)})`,
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 pointer-events-none"
            style={{
              // A percentage multiplied by a length is not valid CSS calc() — the
              // old expression made the browser drop the whole declaration, so
              // the marker never left the top of the bar. Length * plain number is.
              top: `calc(12px + (100% - 24px - 28px) * ${visualPositionForValue(value) / 100})`,
              width: 28,
              height: 28,
              background: '#1a1a1a',
              borderColor: 'var(--color-surface)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        {/* six full-width zone bands */}
        <div className="relative flex-1 flex flex-col">
          {calibratedBands.map((b, i) => {
            const bZoneT = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones];
            const isActive = b.id === band.id;
            return (
              <div
                key={b.id}
                className="relative flex-1 flex items-center px-2.5"
                style={{
                  flexGrow: visualExtentForBand(b).height,
                  background: isActive ? `${b.color}22` : 'transparent',
                  borderTop: i > 0 ? `1px dashed ${calibratedBands[i - 1].color}55` : undefined,
                  transition: 'background 0.25s ease',
                }}
              >
                <span
                  className="text-[11px] leading-tight flex flex-col px-2 py-1 rounded-[10px] flex-shrink-0"
                  style={{ background: isActive ? 'var(--color-surface)' : 'transparent', color: isActive ? b.color : 'var(--color-text-faint)' }}
                >
                  <span className="font-medium">{bZoneT.label}</span>
                </span>
                {isActive && (
                  <svg viewBox="0 0 300 40" preserveAspectRatio="none" className="absolute left-0 right-0" style={{ top: '50%', height: 40, transform: 'translateY(-50%)' }}>
                    <path d="M 20 20 Q 80 12, 140 20 T 260 17" fill="none" stroke={b.color} strokeWidth="2.5" strokeLinecap="round" className="ladder-curve-line" />
                    <circle cx="270" cy="18" r="4.5" fill={b.color} className="ladder-curve-dot" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* "Nervensystem als Wasser-Bild"-Auftrag — placed right under
       * the slider itself so the wave's stillness/turbulence reads as
       * a direct extension of the value just chosen, not a separate,
       * disconnected decoration elsewhere on the page. */}
      <NervousSystemWave value={value} color={band.color} />

      {/* single unified status readout */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[11px] text-[var(--color-text-faint)]">{t.polyvagal.ladderStatusLabel}</p>
          <p className="text-[22px] font-medium" style={{ color: band.color }}>
            {value}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[var(--color-text-faint)]">{t.polyvagal.ladderZoneLabel}</p>
          <p className="text-[15px] font-medium" style={{ color: band.color }}>
            {zoneT.label} · {zoneT.sublabel}
          </p>
        </div>
      </div>
      <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: `${band.color}14` }}>
        <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-2">{zoneT.hint}</p>
        {!hideSupportLinks && (
        <button
          onClick={() => setExercisePickerOpen(true)}
          className="text-[12.5px] font-medium flex items-center gap-1"
          style={{ color: band.color }}
        >
          {t.polyvagal.arousalExercisePrompt.replace('{name}', band.exercises[0].exerciseName)} →
        </button>
        )}
        {/* "Sobald man im Fruehwarnbereich ist, soll es einen Button geben,
         * der aufpoppt: >> zu den Skills"-Auftrag — replaces the former
         * small text link. Appears (and re-pops, via the key) whenever
         * the marker enters Fruehwarnbereich, Hyperarousal or
         * Hypoarousal; zone3 (Fokus & Flow) and calmer zones don't show
         * it — skills are for when regulating is actually needed.
         * goToSkills() saves the current value as a check-in FIRST, so
         * the day curve never loses a point just because the person
         * went straight to the skills. */}
        {!hideSupportLinks && SKILLS_BUTTON_ZONES.has(band.id) && (
          <button
            key={band.id}
            onClick={goToSkills}
            className="pop-in w-full mt-3 py-3 rounded-[var(--radius-full)] text-[15px] font-semibold flex items-center justify-center gap-2"
            style={{ background: band.color, color: '#fff', boxShadow: `0 4px 14px ${band.color}55` }}
          >
            <span aria-hidden="true">&gt;&gt;</span> {t.polyvagal.toSkillsCta}
          </button>
        )}
      </div>

      {exercisePickerOpen && (
        createPortal(
<div
          className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setExercisePickerOpen(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-[var(--radius-xl)] p-5 animate-in"
            style={{ background: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-2 mb-1">
              <p className="text-[15px] font-medium text-[var(--color-text)] flex-1">{t.polyvagal.arousalExercisePickerTitle}</p>
              <button onClick={() => setExercisePickerOpen(false)} className="text-[var(--color-text-faint)]">
                <X size={18} />
              </button>
            </div>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-4">{zoneT.label} · {zoneT.sublabel}</p>
            <div className="flex flex-col gap-2">
              {band.exercises.map((ex) => (
                <button
                  key={ex.resourceId}
                  onClick={() => {
                    setExercisePickerOpen(false);
                    navigate(`/entdecken/ressourcen/skills?open=${ex.resourceId}`);
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] text-[14px] text-left"
                  style={{ border: `1.5px solid ${band.color}55`, background: `${band.color}0f`, color: 'var(--color-text)' }}
                >
                  {ex.exerciseName}
                  <span style={{ color: band.color }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>,
 document.body)
      )}

      {/* dynamic F-tags, 2-column grid, change per band */}
      <div>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.polyvagal.ladderWhatFitsLabel}</p>
        <div className="grid grid-cols-2 gap-2">
          {band.states.map((s) => {
            const sMeta = SURVIVAL_STATE_META[s];
            const isSelected = selectedState === s;
            return (
              <button
                key={s}
                onClick={() => onSelect(band.polyvagalZone, s)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-md)] text-[13px]"
                style={{
                  border: `1.5px solid ${isSelected ? band.color : 'var(--color-border)'}`,
                  background: isSelected ? `${band.color}1f` : 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              >
                <span>{sMeta.emoji}</span>
                <span>{settings.language === 'en' ? sMeta.labelEn : sMeta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedState && (
        <div className="rounded-[var(--radius-lg)] p-3.5 animate-in" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
            {t.zugang.survivalExplainers[SURVIVAL_STATE_META[selectedState].explanationKey as keyof typeof t.zugang.survivalExplainers]}
          </p>
        </div>
      )}

      {bodyDetectiveOpen && (
        <BodyDetectiveModal
          onClose={() => setBodyDetectiveOpen(false)}
          onResult={(v) => {
            handleChange(v);
            handleRelease();
          }}
        />
      )}

      {printingChronicle && (
        <WindowProgressPrintView
          entries={windowProgressRepo.getAll()}
          labels={{
            title: t.polyvagal.arousalChronicleTitle,
            subtitle: t.polyvagal.arousalCalibrationTitle,
            exportedOn: t.network.exportedOn,
            rangeLabel: t.polyvagal.arousalChronicleRangeLabel,
            dateLabel: t.polyvagal.arousalChronicleDateLabel,
          }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        />
      )}
    </div>
  );
}
