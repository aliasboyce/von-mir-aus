import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { PhotoBackground } from '../../components/shared/PhotoBackground';
import { useT } from '../../i18n';
import { PROTECTION_STRATEGIES_DE, OBSTACLES_DE } from '../zugang/zugangContent';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';
import { ProtectionReflectionModal } from './ProtectionReflectionModal';
import { protectionReflectionFor } from './protectionReflectionRepo';
import { DismissibleCustomList } from '../../components/shared/DismissibleCustomList';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * Priority 3 + Priority 14 — Zugang's Schutzstrategie step, browsable on
 * its own, with the "was sind Muster, warum können sie einmal sinnvoll
 * gewesen sein" explainer the brief asked for. The same explainer text
 * is what Mein Garten links to (see GardenPage.tsx), rather than the
 * two pages maintaining separate copies of the same explanation.
 *
 * "Großer Qualitäts- und Erweiterungsprompt" brief, Section 10 —
 * strategy chips are now tappable, opening a guided reflection
 * (ProtectionReflectionModal) instead of being purely decorative text.
 */
export function ProtectionStrategiesReferencePage() {
  const t = useT();
  const navigate = useNavigate();
  const [openStrategy, setOpenStrategy] = useState<string | null>(null);
  const [showStrategyExplainer, setShowStrategyExplainer] = useState(false);
  const [showObstacleExplainer, setShowObstacleExplainer] = useState(false);
  const [, bump] = useState(0);
  const [selectedObstaclesStore] = useState(() => createKeyValueStore<string[]>('selected-obstacles', []));
  const [selectedObstacles, setSelectedObstacles] = useState<string[]>(() => selectedObstaclesStore.get() ?? []);
  const matchingBridgesForObstacles = useMemo(() => {
    if (selectedObstacles.length === 0) return [];
    return bridgesRepo.getAll().filter((b) => (b.linkedObstacles ?? []).some((o) => selectedObstacles.includes(o)));
  }, [selectedObstacles]);

  function toggleObstacle(o: string) {
    const next = selectedObstacles.includes(o) ? selectedObstacles.filter((x) => x !== o) : [...selectedObstacles, o];
    selectedObstaclesStore.set(next);
    setSelectedObstacles(next);
  }

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="schutzstrategien" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.protectionRef.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5 leading-relaxed">{t.protectionRef.subtitle}</p>

        <button onClick={() => setShowStrategyExplainer((v) => !v)} className="text-[12px] text-[var(--color-primary)] mb-4 block">
          {showStrategyExplainer ? t.protectionRef.hideExplainerCta : t.protectionRef.showExplainerCta}
        </button>
        {showStrategyExplainer && (
          <div className="animate-in">
            <Card className="mb-6">
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.protectionRef.explainer1}</p>
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.protectionRef.explainer2}</p>
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.protectionRef.explainer3}</p>
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.protectionRef.explainerResourcesNote}</p>
            </Card>

            <Card className="mb-6" style={{ background: 'var(--color-primary-soft)' }}>
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">{t.protectionRef.vsResourcesTitle}</p>
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.protectionRef.vsResourcesText}</p>
            </Card>

            <Card className="mb-6">
              <BalanceIllustration />
              <div className="flex justify-between mt-2 px-2">
                <p className="text-[12px] text-[var(--color-text-muted)] max-w-[45%] text-center leading-snug">{t.protectionRef.balanceShortTerm}</p>
                <p className="text-[12px] text-[var(--color-text-muted)] max-w-[45%] text-center leading-snug">{t.protectionRef.balanceLongTerm}</p>
              </div>
            </Card>

            <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.protectionRef.reflectTitle}</p>
            <div className="flex flex-col gap-2 mb-6">
              {t.protectionRef.reflectQuestions.map((q, i) => (
                <div key={i} className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]">
                  <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.protectionRef.tapToReflectLabel}</p>
        <DismissibleCustomList listKey="schutzstrategien" builtins={PROTECTION_STRATEGIES_DE} onTapBuiltin={(s) => setOpenStrategy(s)} isMarked={(s) => !!protectionReflectionFor(s)} />

        <Link to="/entdecken/garten" className="text-[13px] text-[var(--color-primary)] mt-4 block">
          🌱 {t.protectionRef.gardenLink} →
        </Link>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <h2 className="text-[19px] mb-1">{t.protectionRef.obstaclesTitle}</h2>
          <p className="text-[14px] text-[var(--color-text-muted)] mb-4 leading-relaxed">{t.protectionRef.obstaclesSubtitle}</p>

          <button onClick={() => setShowObstacleExplainer((v) => !v)} className="text-[12px] text-[var(--color-primary)] mb-4 block">
            {showObstacleExplainer ? t.protectionRef.hideExplainerCta : t.protectionRef.showExplainerCta}
          </button>
          {showObstacleExplainer && (
            <div className="animate-in">
              <Card className="mb-4">
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.protectionRef.obstaclesExplainer1}</p>
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.protectionRef.obstaclesExplainer2}</p>
              </Card>

              <Card className="mb-4">
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.protectionRef.connectionExampleTitle}</p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-1.5">
                  🚧 {t.protectionRef.connectionExampleObstacle}
                </p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
                  🛡️ {t.protectionRef.connectionExampleStrategy}
                </p>
                <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{t.protectionRef.connectionExampleNote}</p>
              </Card>

              <Card className="mb-5" style={{ background: 'var(--color-primary-soft)' }}>
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed font-medium mb-1.5">{t.protectionRef.obstaclesKeyInsightTitle}</p>
                <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.protectionRef.obstaclesKeyInsightText}</p>
              </Card>
            </div>
          )}

          <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.protectionRef.obstaclesExamplesLabel}</p>
          <DismissibleCustomList
            listKey="hindernisse"
            builtins={OBSTACLES_DE}
            onTapBuiltin={(o) => toggleObstacle(o)}
            isMarked={(o) => selectedObstacles.includes(o)}
          />

          {matchingBridgesForObstacles.length > 0 ? (
            <div className="mt-5">
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.protectionRef.obstaclesMatchingBridgesTitle}</p>
              <div className="flex flex-col gap-2">
                {matchingBridgesForObstacles.slice(0, 4).map((b) => (
                  <Link key={b.id} to={`/bruecken/${b.id}`}>
                    <Card interactive className="flex items-center gap-3">
                      <PhotoBackground src={b.image} className="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0" />
                      <p className="text-[14px] text-[var(--color-text)] truncate">{b.title}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link to="/bruecken" className="text-[13px] text-[var(--color-primary)] mt-4 block">
              🌉 {t.protectionRef.obstaclesBridgeLink} →
            </Link>
          )}
        </div>

        <SourceNoteCard text={t.protectionRef.sourceNote} />
      </div>
      {openStrategy && (
        <ProtectionReflectionModal
          strategy={openStrategy}
          onClose={() => {
            setOpenStrategy(null);
            bump((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}

/** A simple balance scale — tilted toward the left (short-term relief)
 * to visually anchor the "what it gives now vs. what it costs later"
 * idea from the reflection questions above, without needing a chart. */
function BalanceIllustration() {
  return (
    <svg viewBox="0 0 220 100" width="100%" role="img" aria-hidden="true" style={{ aspectRatio: '220 / 100', maxWidth: 340, display: 'block', margin: '0 auto' }}>
      <line x1="110" y1="14" x2="110" y2="78" stroke="var(--color-border-strong)" strokeWidth="3" />
      <path d="M96,88 L124,88 L118,78 L102,78 Z" fill="var(--color-border-strong)" />
      <g style={{ transform: 'rotate(-8deg)', transformOrigin: '110px 20px' }}>
        <line x1="30" y1="24" x2="190" y2="16" stroke="var(--color-border-strong)" strokeWidth="2.5" />
        <line x1="30" y1="24" x2="30" y2="46" stroke="var(--color-border-strong)" strokeWidth="1.5" />
        <ellipse cx="30" cy="52" rx="26" ry="9" fill="var(--color-accent-clay)" />
        <line x1="190" y1="16" x2="190" y2="34" stroke="var(--color-border-strong)" strokeWidth="1.5" />
        <ellipse cx="190" cy="38" rx="20" ry="7" fill="var(--color-surface-muted)" stroke="var(--color-border)" />
      </g>
      <circle cx="110" cy="18" r="5" fill="var(--color-border-strong)" />
    </svg>
  );
}
