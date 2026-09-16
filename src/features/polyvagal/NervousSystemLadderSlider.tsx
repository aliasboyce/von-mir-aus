import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Info, X, AlertTriangle, Search } from 'lucide-react';
import { useT } from '../../i18n';
import { SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { useSettings } from '../../state/SettingsContext';
import { triggerHaptic } from '../../services/haptics';
import { AROUSAL_BANDS, AROUSAL_GRADIENT_STOPS, bandForValue } from './arousalBands';
import { BodyDetectiveModal } from './BodyDetectiveModal';
import { windowProgressRepo } from './windowProgressRepo';
import { createId } from '../../services/storage/repository';
import { triggerPrint } from '../../services/printSupport';
import { WindowProgressPrintView } from './WindowProgressPrintView';
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
}

export function NervousSystemLadderSlider({ onSelect, selectedState, value: controlledValue, onValueChange }: NervousSystemLadderSliderProps) {
  const t = useT();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [internalValue, setInternalValue] = useState(20);
  const value = controlledValue ?? internalValue;
  const band = useMemo(() => bandForValue(value), [value]);
  const [lastBandId, setLastBandId] = useState(band.id);
  const zoneT = t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones];

  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [bodyDetectiveOpen, setBodyDetectiveOpen] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [printingChronicle, setPrintingChronicle] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const hasCalibration = settings.arousalWindowStart != null && settings.arousalWindowEnd != null;
  const windowStart = settings.arousalWindowStart ?? 0;
  const windowEnd = settings.arousalWindowEnd ?? 55;
  // "Basic-Fenster 0-55%"-Auftrag — the dysregulation check now always
  // applies, using the clinical default window (0-55%) when nobody has
  // calibrated their own — it's no longer an opt-in feature that does
  // nothing until someone visits the gear icon first.
  const isDysregulated = value < windowStart || value > windowEnd;
  // "Fenster erst nach Loslassen einblenden, Aufblitz-Effekt"-Auftrag —
  // both the window overlay on the slider bar and the dysregulation
  // warning stay completely invisible until the person has released
  // the slider at least once, so the very first, unbiased read of the
  // slider happens with zero judgment or expectation in view. After
  // that first release they fade/flash in and stay visible from then on.
  const [hasReleased, setHasReleased] = useState(false);
  const [justFlashed, setJustFlashed] = useState(false);

  const [draftStart, setDraftStart] = useState(String(windowStart));
  const [draftEnd, setDraftEnd] = useState(String(windowEnd));

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

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function valueFromClientY(clientY: number): number {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const usableTop = rect.top + 12;
    const usableHeight = rect.height - 24;
    const ratio = (clientY - usableTop) / usableHeight;
    return Math.round(ratio * 100);
  }

  useEffect(() => {
    if (band.id !== lastBandId) {
      triggerHaptic('select', settings);
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
    const s = Math.max(0, Math.min(100, Number(draftStart) || 0));
    const e = Math.max(0, Math.min(100, Number(draftEnd) || 100));
    updateSettings({ arousalWindowStart: Math.min(s, e), arousalWindowEnd: Math.max(s, e) });
    setCalibrationOpen(false);
  }

  function resetCalibration() {
    updateSettings({ arousalWindowStart: undefined, arousalWindowEnd: undefined });
    setDraftStart('0');
    setDraftEnd('55');
    setCalibrationOpen(false);
  }

  function saveWindowProgress() {
    windowProgressRepo.save({ id: createId('winprog'), createdAt: new Date().toISOString(), windowStart, windowEnd });
    setProgressSaved(true);
    window.setTimeout(() => setProgressSaved(false), 2200);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[var(--color-text-faint)]">{t.polyvagal.ladderSliderLabel}</p>
        <button
          onClick={() => setCalibrationOpen((v) => !v)}
          aria-label={t.polyvagal.arousalCalibrationTitle}
          className="p-1.5 rounded-full"
          style={{ background: hasCalibration ? 'var(--color-primary-soft)' : 'transparent', color: hasCalibration ? 'var(--color-primary)' : 'var(--color-text-faint)' }}
        >
          <Settings size={16} />
        </button>
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
          <div className="flex gap-3 mb-3">
            <label className="flex-1">
              <span className="text-[11px] text-[var(--color-text-faint)] block mb-1">{t.polyvagal.arousalCalibrationStart}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
                className="w-full px-2.5 py-2 rounded-[var(--radius-md)] text-[14px]"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
              />
            </label>
            <label className="flex-1">
              <span className="text-[11px] text-[var(--color-text-faint)] block mb-1">{t.polyvagal.arousalCalibrationEnd}</span>
              <input
                type="number"
                min={0}
                max={100}
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="w-full px-2.5 py-2 rounded-[var(--radius-md)] text-[14px]"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
              />
            </label>
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
                  <div key={entry.id} className="flex items-center justify-between text-[12.5px] px-3 py-2 rounded-[var(--radius-md)]" style={{ background: 'var(--color-surface)' }}>
                    <span className="text-[var(--color-text-faint)]">
                      {new Date(entry.createdAt).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    <span className="text-[var(--color-text)] font-medium">
                      {entry.windowStart}% – {entry.windowEnd}%
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
        </div>
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
            style={{ top: 12, bottom: 12, width: 14, background: `linear-gradient(to bottom, ${AROUSAL_GRADIENT_STOPS})` }}
          />
          {/* "Fenster erst nach Loslassen einblenden, Aufblitz"-Auftrag
           * — always rendered now (the basic 0-55% window applies even
           * without custom calibration), but invisible until the first
           * release, then a brief glow marks the moment it appears. */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{
              top: `calc(12px + ${windowStart}% * (100% - 24px) / 100%)`,
              height: `calc(${windowEnd - windowStart}% * (100% - 24px) / 100%)`,
              width: 22,
              border: '2px dashed rgba(255,255,255,0.85)',
              borderRadius: 11,
              opacity: hasReleased ? 1 : 0,
              boxShadow: justFlashed ? '0 0 12px 4px rgba(255,255,255,0.9)' : 'none',
              transition: 'opacity 0.4s ease, box-shadow 0.6s ease',
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 pointer-events-none"
            style={{
              top: `calc(12px + ${value}% * (100% - 24px - 30px) / 100%)`,
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
          {AROUSAL_BANDS.map((b, i) => {
            const bZoneT = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones];
            const isActive = b.id === band.id;
            return (
              <div
                key={b.id}
                className="relative flex-1 flex items-center px-2.5"
                style={{
                  flexGrow: b.max - b.min,
                  background: isActive ? `${b.color}22` : 'transparent',
                  borderTop: i > 0 ? `1px dashed ${AROUSAL_BANDS[i - 1].color}55` : undefined,
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
        <button
          onClick={() => setExercisePickerOpen(true)}
          className="text-[12.5px] font-medium flex items-center gap-1"
          style={{ color: band.color }}
        >
          {t.polyvagal.arousalExercisePrompt.replace('{name}', band.exercises[0].exerciseName)} →
        </button>
      </div>

      {exercisePickerOpen && (
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
                  key={ex.bridgeId}
                  onClick={() => {
                    setExercisePickerOpen(false);
                    navigate(`/bruecken/${ex.bridgeId}`);
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
        </div>
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
