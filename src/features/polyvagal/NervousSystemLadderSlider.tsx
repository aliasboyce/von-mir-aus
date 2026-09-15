import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, Info, X, AlertTriangle } from 'lucide-react';
import { useT } from '../../i18n';
import { SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { useSettings } from '../../state/SettingsContext';
import { triggerHaptic } from '../../services/haptics';
import { AROUSAL_BANDS, AROUSAL_GRADIENT_STOPS, bandForValue } from './arousalBands';
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
  const { settings, updateSettings } = useSettings();
  const [internalValue, setInternalValue] = useState(20);
  const value = controlledValue ?? internalValue;
  const band = useMemo(() => bandForValue(value), [value]);
  const [lastBandId, setLastBandId] = useState(band.id);
  const zoneT = t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones];

  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const hasCalibration = settings.arousalWindowStart != null && settings.arousalWindowEnd != null;
  const windowStart = settings.arousalWindowStart ?? 0;
  const windowEnd = settings.arousalWindowEnd ?? 55;
  const isDysregulated = hasCalibration && (value < windowStart || value > windowEnd);

  const [draftStart, setDraftStart] = useState(String(windowStart));
  const [draftEnd, setDraftEnd] = useState(String(windowEnd));

  function handleChange(v: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    if (onValueChange) onValueChange(clamped);
    else setInternalValue(clamped);
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
    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      handleChange(valueFromClientY(e.clientY));
    }
    function onUp() {
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

      {isDysregulated && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full animate-in" style={{ background: 'var(--color-danger-soft)', color: 'var(--color-danger)' }}>
          <AlertTriangle size={15} />
          <span className="text-[12px] font-medium tracking-wide">{t.polyvagal.arousalDysregulationWarning}</span>
        </div>
      )}

      {calibrationOpen && (
        <div className="rounded-[var(--radius-lg)] p-4 animate-in" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[13px] font-medium text-[var(--color-text)] flex-1">{t.polyvagal.arousalCalibrationTitle}</p>
            <button onClick={() => setInfoOpen(true)} aria-label="Info" className="text-[var(--color-text-faint)]">
              <Info size={16} />
            </button>
          </div>
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
            {t.polyvagal.arousalCalibrationInfoText.split('\n\n').map((para, i) => (
              <p key={i} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
                {para}
              </p>
            ))}
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
          }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{ top: 12, bottom: 12, width: 14, background: `linear-gradient(to bottom, ${AROUSAL_GRADIENT_STOPS})` }}
          />
          {hasCalibration && (
            <div
              className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
              style={{
                top: `calc(12px + ${windowStart}% * (100% - 24px) / 100%)`,
                height: `calc(${windowEnd - windowStart}% * (100% - 24px) / 100%)`,
                width: 22,
                border: '2px dashed rgba(255,255,255,0.85)',
                borderRadius: 11,
              }}
            />
          )}
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
        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{zoneT.hint}</p>
      </div>

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
    </div>
  );
}
