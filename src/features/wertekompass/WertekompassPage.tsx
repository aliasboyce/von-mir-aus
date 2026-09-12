import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { valueSnapshot, totalPassesWithValues, manualPriorities, togglePriority, monthlyHistory, valueCards } from './wertekompassData';
import { ValuesRadarChart } from './ValuesRadarChart';
import { ValueCardModal } from './ValueCardModal';
import { ValueDiscoveryCards } from './ValueDiscoveryCards';
import { AccessDomainsSection } from './AccessDomainsSection';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';

/**
 * Priority 4 + 10/11 — deliberately not a radar/wheel chart: a ranked,
 * weighted set of value "tags" (size/prominence reflecting how often
 * each value has shown up recently) reads calmer and is easier to
 * scan on a small screen than a spoke chart, while still visually
 * conveying "some of these are more present than others right now" —
 * the same spirit as the earlier Zugangsrad, translated to something
 * simpler to build correctly and read at a glance. Always framed as a
 * snapshot ("gerade präsent"), never a fixed trait ("du bist jemand,
 * dem X wichtig ist").
 *
 * Usable from the very first visit (Priority 10): the manual priority
 * picker below needs zero Zugang history. The derived snapshot and
 * monthly history are an additional, richer layer that grows on top
 * once passes accumulate — never a gate blocking the whole page.
 */
export function WertekompassPage() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [, refresh] = useState(0);
  const [browsing, setBrowsing] = useState(false);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [showActExplainer, setShowActExplainer] = useState(false);
  const snapshot = valueSnapshot();
  const totalPasses = totalPassesWithValues();
  const priorities = manualPriorities();
  const history = monthlyHistory();
  const cards = valueCards();
  const [showMore, setShowMore] = useState(false);

  // Audit follow-up, "Fehlende Verbindung 2" — arriving here from a
  // Zugangsrückblick entry's value tags opens that value's card
  // directly, instead of landing on the page with no obvious next step.
  useEffect(() => {
    const wert = searchParams.get('wert');
    if (wert) {
      setOpenCard(wert);
      searchParams.delete('wert');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bump() {
    refresh((n) => n + 1);
  }

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="wertekompass" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.wertekompass.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-1 leading-relaxed">{t.wertekompass.pageFramingQuestion}</p>
        <p className="text-[13px] text-[var(--color-text-faint)] mb-6 leading-relaxed">{t.wertekompass.subtitle}</p>

        {/* Section A — Meine Lebensrichtungen: usable immediately, no data required */}
        <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.wertekompass.sectionDirectionsLabel}</p>
        <Card className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">{t.wertekompass.myPrioritiesTitle}</p>
          {priorities.length === 0 && !browsing ? (
            <p className="text-[13px] text-[var(--color-text-faint)] mb-3">{t.wertekompass.noPrioritiesYet}</p>
          ) : (
            <>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.wertekompass.tapForCardHint}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {priorities.map((v) => (
                <div key={v} className="flex items-center rounded-full bg-[var(--color-primary)] overflow-hidden">
                  <button onClick={() => setOpenCard(v)} className="px-3 py-1.5 text-[13px] text-[var(--color-surface)]">
                    {v}
                  </button>
                  <button
                    onClick={() => {
                      togglePriority(v);
                      bump();
                    }}
                    aria-label={t.common.remove}
                    className="pr-3 pl-1 py-1.5 text-[13px] text-[var(--color-surface)] opacity-70"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            </>
          )}
          <button onClick={() => setBrowsing((v) => !v)} className="text-[13px] text-[var(--color-primary)]">
            {browsing ? t.wertekompass.hideBrowseCta : t.wertekompass.browseCta}
          </button>
          {browsing && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <ValueDiscoveryCards key={priorities.length} onChanged={bump} />
            </div>
          )}
        </Card>

        {/* Section B — Meine Wertekarten: NEW, was missing entirely —
         * the reflections behind each priority (personalMeaning,
         * noticedThrough, obstacles, smallPossibilities, presence)
         * exist in storage via valueCards() but had no overview
         * anywhere on this page before now. */}
        {cards.length > 0 && (
          <>
            <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.wertekompass.sectionCardsLabel}</p>
            <Card className="mb-6">
              <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.wertekompass.myCardsHint}</p>
              <div className="flex flex-col gap-2">
                {cards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setOpenCard(c.value)}
                    className="text-left p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]"
                  >
                    <p className="text-[14px] text-[var(--color-text)] mb-0.5">{c.value}</p>
                    {c.personalMeaning && (
                      <p className="text-[12px] text-[var(--color-text-faint)] line-clamp-1">{c.personalMeaning}</p>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Section C — Was zeigt sich gerade: passive observation from
         * Zugang history, clearly separated from the two sections above
         * (which are things the person actively chose/wrote). */}
        <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.wertekompass.sectionSnapshotLabel}</p>
        {!snapshot ? (
          <Card className="mb-6">
            <EmptyState title={totalPasses === 0 ? t.wertekompass.emptyNoData : t.wertekompass.emptyNotEnough} />
          </Card>
        ) : (
          <Card className="mb-6">
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.wertekompass.snapshotTitle}</p>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.wertekompass.snapshotHint}</p>
            <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mb-3 pb-3 border-b border-[var(--color-border)]">
              {t.wertekompass.notARankingText}
            </p>
            {snapshot.length >= 3 && <p className="text-[11px] text-[var(--color-text-faint)] mb-1">{t.wertekompass.radarTapHint}</p>}
            {snapshot.length >= 3 ? (
              <ValuesRadarChart items={snapshot.slice(0, 8).map((v) => ({ label: v.value, weight: v.weight }))} onSelect={setOpenCard} />
            ) : (
              <div className="flex flex-wrap gap-2 justify-center py-2">
                {snapshot.map((v) => (
                  <span key={v.value} className="px-3 py-1.5 rounded-full text-[13px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    {v.value}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-3">
              {t.wertekompass.basedOnNote.replace('{n}', String(totalPasses))}
            </p>
          </Card>
        )}

        <Link to="/zugang" className="text-[13px] text-[var(--color-primary)] block mb-6">
          {t.wertekompass.startZugangLink} →
        </Link>

        {/* Section D — everything else, bundled behind one toggle so the
         * page above this line is the calm, scannable "was ist das,
         * was kann ich hier tun" view the brief asked for. */}
        <button onClick={() => setShowMore((v) => !v)} className="text-[13px] text-[var(--color-primary)] mb-4 block">
          {showMore ? t.wertekompass.hideMoreCta : t.wertekompass.showMoreCta}
        </button>
        {showMore && (
          <>
            <button onClick={() => setShowActExplainer((v) => !v)} className="text-[13px] text-[var(--color-primary)] mb-6 block">
              {showActExplainer ? t.wertekompass.hideActExplainerCta : t.wertekompass.showActExplainerCta}
            </button>
            {showActExplainer && (
              <Card className="mb-6 -mt-3">
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.wertekompass.actExplainerTitle}</p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.wertekompass.actExplainerGoalVsValue}</p>
                <ul className="flex flex-col gap-1.5 mb-3">
                  {t.wertekompass.actExplainerPoints.map((p) => (
                    <li key={p} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {p}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-[var(--color-text-faint)] leading-relaxed">{t.wertekompass.actExplainerSource}</p>
              </Card>
            )}

            {history.length > 1 && (
              <Card className="mb-5">
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">{t.wertekompass.historyTitle}</p>
                <div className="flex flex-col gap-2.5">
                  {history.map((m) => (
                    <div key={m.monthLabel} className="flex items-center gap-3">
                      <span className="text-[12px] text-[var(--color-text-faint)] w-16 flex-shrink-0">{m.monthLabel}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.topValues.map((v) => (
                          <span key={v} className="px-2 py-0.5 rounded-full text-[11px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <AccessDomainsSection />
          </>
        )}

        <SourceNoteCard text={t.wertekompass.sourceNote} sourceIds={['act-akzeptanz-schemapath']} />
      </div>
      {openCard && <ValueCardModal value={openCard} onClose={() => setOpenCard(null)} />}
    </div>
  );
}
