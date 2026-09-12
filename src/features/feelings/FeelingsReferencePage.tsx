import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { useSettings } from '../../state/SettingsContext';
import { FEELING_GROUPS, NEED_CATEGORY_GROUPS } from '../zugang/zugangContent';
import { FEELING_DETAILS } from './feelingDetails';
import { FeelingsWheel } from './FeelingsWheel';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';
import { getCustomColors, setCustomColor, resetCustomColor } from './feelingColors';
import { Palette, X } from 'lucide-react';

/**
 * Priority 10 — Zugang's own feeling groups (FEELING_GROUPS), enriched
 * with additive GFK-informed detail (FEELING_DETAILS) rather than a
 * second, separately maintained feelings list. Every claim uses "kann
 * damit zusammenhängen" phrasing, never "bedeutet immer" — see the
 * source note at the bottom.
 */
export function FeelingsReferencePage() {
  const t = useT();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [openId, setOpenId] = useState<string | null>(null);
  const [showExplainers, setShowExplainers] = useState(false);
  const [showColorEditor, setShowColorEditor] = useState(false);
  useRegisterModalOpen(showColorEditor);
  const [colorVersion, setColorVersion] = useState(0);
  const [customColors, setCustomColorsState] = useState(() => getCustomColors());

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="gefuehle" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.feelingsRef.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5 leading-relaxed">{t.feelingsRef.subtitle}</p>

        <button onClick={() => setShowExplainers((v) => !v)} className="text-[12px] text-[var(--color-primary)] mb-6 block">
          {showExplainers ? t.feelingsRef.hideExplainerCta : t.feelingsRef.showExplainerCta}
        </button>
        {showExplainers && (
          <div className="animate-in">
            <Card className="mb-4">
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.feelingsRef.signalTitle}</p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.feelingsRef.signalText}</p>
            </Card>

            <Card className="mb-4">
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.feelingsRef.pseudoTitle}</p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.feelingsRef.pseudoText}</p>
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-[12px] text-[var(--color-text-faint)] flex-shrink-0 mt-0.5">✕</span>
                <p className="text-[12px] text-[var(--color-text-faint)] italic">{t.feelingsRef.pseudoExample}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] text-[var(--color-primary)] flex-shrink-0 mt-0.5">✓</span>
                <p className="text-[12px] text-[var(--color-text)] italic">{t.feelingsRef.pseudoRealExample}</p>
              </div>
            </Card>

            <Card className="mb-6">
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.feelingsRef.thoughtTestTitle}</p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.feelingsRef.thoughtTestText}</p>
              <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed italic">{t.feelingsRef.thoughtTestTip}</p>
            </Card>
          </div>
        )}

        <Card className="mb-6">
          <p className="text-[12px] text-[var(--color-text-faint)] text-center mb-2">{t.feelingsRef.wheelHint}</p>
          <FeelingsWheel openId={openId} onSelect={(id) => setOpenId(openId === id ? null : id)} colorVersion={colorVersion} />
          <button
            onClick={() => setShowColorEditor(true)}
            className="flex items-center gap-1.5 text-[12px] text-[var(--color-primary)] mx-auto mt-3"
          >
            <Palette size={13} /> {t.feelingsRef.customizeColorsCta}
          </button>
        </Card>

        {showColorEditor && createPortal(
          <div className="fixed inset-0 z-[240] flex items-end sm:items-center justify-center animate-in" style={{ background: 'rgba(30,28,22,0.55)' }} onClick={() => setShowColorEditor(false)}>
            <div className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[420px] max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[16px] text-[var(--color-text)]">{t.feelingsRef.customizeColorsTitle}</p>
                <button onClick={() => setShowColorEditor(false)} aria-label={t.common.close}><X size={18} /></button>
              </div>
              <div className="flex flex-col gap-2.5">
                {FEELING_GROUPS.map((g) => {
                  const current = customColors[g.id] ?? g.color;
                  return (
                    <div key={g.id} className="flex items-center gap-3">
                      <label className="relative flex-shrink-0">
                        <input
                          type="color"
                          value={current}
                          onChange={(e) => {
                            setCustomColor(g.id, e.target.value);
                            setCustomColorsState(getCustomColors());
                            setColorVersion((v) => v + 1);
                          }}
                          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--color-border)', padding: 0, cursor: 'pointer' }}
                        />
                      </label>
                      <span className="flex-1 text-[13px] text-[var(--color-text)]">{isEn ? g.labelEn : g.label}</span>
                      {customColors[g.id] && (
                        <button
                          onClick={() => {
                            resetCustomColor(g.id);
                            setCustomColorsState(getCustomColors());
                            setColorVersion((v) => v + 1);
                          }}
                          className="text-[11px] text-[var(--color-text-faint)]"
                        >
                          {t.feelingsRef.resetColorCta}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}

        <div className="flex flex-col gap-2.5">
          {FEELING_GROUPS.map((group) => {
            const detail = FEELING_DETAILS[group.id];
            const open = openId === group.id;
            const sub = isEn ? group.subEn : group.sub;
            return (
              <Card key={group.id} padding="none" style={open ? { borderLeft: `4px solid ${customColors[group.id] ?? group.color}` } : undefined}>
                <button onClick={() => setOpenId(open ? null : group.id)} className="w-full flex items-center justify-between p-4 text-left">
                  <div className="min-w-0">
                    <p className="text-[16px] text-[var(--color-text)]" style={open ? { color: customColors[group.id] ?? group.color, fontWeight: 600 } : undefined}>{isEn ? group.labelEn : group.label}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)] truncate">{sub.join(' · ')}</p>
                  </div>
                  <ChevronDown size={16} className="text-[var(--color-text-faint)] flex-shrink-0 ml-2" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
                </button>
                {open && detail && (
                  <div className="px-4 pb-4 animate-in">
                    <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{isEn ? detail.meaningEn : detail.meaning}</p>

                    <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{t.feelingsRef.thoughtsLabel}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(isEn ? detail.typicalThoughtsEn : detail.typicalThoughts).map((th) => (
                        <span key={th} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)] italic">
                          „{th}"
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{t.feelingsRef.bodyLabel}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(isEn ? detail.bodySensationsEn : detail.bodySensations).map((b) => (
                        <span key={b} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                          {b}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">
                      {group.id === 'freude' ? t.feelingsRef.needsMetLabel : t.feelingsRef.needsLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.possibleNeeds.map((needId) => {
                        if (needId === 'alle') {
                          return (
                            <span key="alle" className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary)] italic">
                              {t.feelingsRef.allNeedsChip}
                            </span>
                          );
                        }
                        const needGroup = NEED_CATEGORY_GROUPS.find((g) => g.id === needId);
                        if (!needGroup) return null;
                        return (
                          <span key={needId} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                            {isEn ? needGroup.labelEn : needGroup.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <SourceNoteCard text={t.feelingsRef.sourceNote} sourceIds={['gfk-gefuehle', 'gfk-gefuehle-beduerfnisse-pdf']} />
      </div>
    </div>
  );
}
