import { useState } from 'react';
import { ChevronLeft, ChevronRight, Phone, AlertTriangle } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { HELPER_SITUATIONS } from './helperSituations';

type Safety = 'ja' | 'unsicher' | 'nein' | null;

/**
 * "Großer Qualitäts- und Erweiterungsprompt" brief, Sections 3/4/5 —
 * three concrete corrections over the previous version:
 *  1. Real multi-select over the explicit situation list, with
 *     tailored guidance per selection instead of one generic tip set.
 *  2. An explicit, clearly-worded responsibility-boundary step: the
 *     helper is not responsible for solving everything, may set
 *     limits, step back, or bring in others.
 *  3. A prominent, always-reachable "🚨 Akuter Notfall" shortcut,
 *     separate from the step flow — someone in an acute emergency
 *     shouldn't have to click through six steps to find it.
 */
export function HelperSituationGuide({ onOpenGrounding }: { onOpenGrounding: () => void }) {
  const t = useT();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [step, setStep] = useState(0);
  const [safety, setSafety] = useState<Safety>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showEmergency, setShowEmergency] = useState(false);

  const steps = ['whats-happening', 'safety', 'guidance', 'boundaries', 'small-offer', 'professional-help'] as const;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  function next() {
    if (!isLast) setStep((s) => s + 1);
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }
  function restart() {
    setStep(0);
    setSafety(null);
    setSelected([]);
  }
  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const selectedSituations = HELPER_SITUATIONS.filter((s) => selected.includes(s.id));

  return (
    <>
      <button
        onClick={() => setShowEmergency(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-lg)] mb-5 text-[14px] font-medium"
        style={{ background: 'var(--color-accent-clay)', color: '#fff' }}
      >
        <AlertTriangle size={17} /> {t.helperMode.emergencyButtonLabel}
      </button>

      <Card className="mb-6">
        <div className="flex gap-1 mb-4">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= step ? 'var(--color-primary)' : 'var(--color-border)' }} />
          ))}
        </div>

        {current === 'whats-happening' && (
          <>
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">{t.helperMode.guideWhatTitle}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.helperMode.guideWhatMultiText}</p>
            <div className="flex flex-wrap gap-1.5">
              {HELPER_SITUATIONS.map((s) => {
                const isSel = selected.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className="px-3 py-1.5 rounded-full text-[12px]"
                    style={{ background: isSel ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: isSel ? 'var(--color-surface)' : 'var(--color-text)' }}
                  >
                    {isEn ? s.labelEn : s.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {current === 'safety' && (
          <>
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">{t.helperMode.guideSafetyTitle}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.helperMode.guideSafetyText}</p>
            <div className="flex gap-2">
              {(['ja', 'unsicher', 'nein'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSafety(v)}
                  className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[13px]"
                  style={{ background: safety === v ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: safety === v ? 'var(--color-surface)' : 'var(--color-text)' }}
                >
                  {t.helperMode.guideSafetyOptions[v]}
                </button>
              ))}
            </div>
            {safety === 'nein' && (
              <div className="mt-3 p-3 rounded-[var(--radius-md)] flex items-start gap-2" style={{ background: 'var(--color-accent-clay)', color: '#fff' }}>
                <Phone size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-[13px] leading-relaxed">{t.helperMode.emergencyText}</p>
              </div>
            )}
          </>
        )}

        {current === 'guidance' && (
          <>
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-3">{t.helperMode.guideTailoredTitle}</p>
            {selectedSituations.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-faint)]">{t.helperMode.guideNoneSelected}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedSituations.map((s) => (
                  <div key={s.id}>
                    <p className="text-[13px] font-medium text-[var(--color-primary)] mb-1.5">{isEn ? s.labelEn : s.label}</p>
                    <ul className="flex flex-col gap-1">
                      {(isEn ? s.guidanceEn : s.guidance).map((g) => (
                        <li key={g} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {g}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {current === 'boundaries' && (
          <>
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">{t.helperMode.guideBoundariesTitle}</p>
            <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.helperMode.guideBoundariesText}</p>
            <ul className="flex flex-col gap-1.5">
              {t.helperMode.guideBoundariesPoints.map((p) => (
                <li key={p} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {p}</li>
              ))}
            </ul>
          </>
        )}

        {current === 'small-offer' && (
          <>
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">{t.helperMode.guideOfferTitle}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.helperMode.guideOfferText}</p>
            <Button size="sm" onClick={onOpenGrounding}>
              {t.helperMode.groundingTogetherCta}
            </Button>
          </>
        )}

        {current === 'professional-help' && (
          <>
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">{t.helperMode.guideProfTitle}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.helperMode.guideProfText}</p>
            <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{t.helperMode.guideOwnLimitText}</p>
          </>
        )}

        <div className="flex gap-2 mt-5">
          {step > 0 && (
            <Button variant="ghost" onClick={back} icon={<ChevronLeft size={15} />}>
              {t.common.back}
            </Button>
          )}
          {!isLast ? (
            <Button fullWidth onClick={next} icon={<ChevronRight size={15} />}>
              {t.common.next}
            </Button>
          ) : (
            <Button variant="ghost" onClick={restart}>
              {t.helperMode.guideRestartCta}
            </Button>
          )}
        </div>
      </Card>

      {showEmergency && (
        <div className="fixed inset-0 z-[240] bg-[rgba(44,42,34,0.4)] flex items-end sm:items-center justify-center" onClick={() => setShowEmergency(false)}>
          <div className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[420px] p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-[18px] text-[var(--color-text)] mb-3 flex items-center gap-2">
              <AlertTriangle size={20} style={{ color: 'var(--color-accent-clay)' }} /> {t.helperMode.emergencyButtonLabel}
            </p>
            <div className="flex flex-col gap-2.5 mb-4">
              {t.helperMode.emergencyPoints.map((p) => (
                <p key={p} className="text-[13px] text-[var(--color-text)] leading-relaxed">{p}</p>
              ))}
            </div>
            <div className="p-3 rounded-[var(--radius-md)] flex items-start gap-2 mb-4" style={{ background: 'var(--color-accent-clay)', color: '#fff' }}>
              <Phone size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-[14px] leading-relaxed font-medium">{t.helperMode.emergencyText}</p>
            </div>
            <Button fullWidth variant="ghost" onClick={() => setShowEmergency(false)}>
              {t.common.close}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
