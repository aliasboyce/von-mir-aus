import { useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Search, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { zugangRepo } from './zugangRepo';
import { SURVIVAL_STATE_META, colorForFeelingWord } from './zugangContent';
import { stateActionPatterns, stateLabel } from './zugangPatterns';
import { bridgesRepo } from '../bridges/bridgesRepo';
import type { ZugangEntry } from '../../data/types';

/**
 * Point 7/8 — a plain chronological list, plus (per the
 * "ChatGPT-Konzept" brief) an optional, collapsed pattern-observation
 * section built on the same underlying data. Deliberately hedged
 * ("scheint", "bisher") and requires at least two occurrences before
 * saying anything about a state×action combination — never framed as
 * a rule or diagnosis, always as something the person can recognize or
 * dismiss for themselves.
 */
export function ZugangReviewPage() {
  const t = useT();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [entries] = useState<ZugangEntry[]>(() => zugangRepo.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  const [query, setQuery] = useState('');
  const filteredEntries = query.trim()
    ? entries.filter((e) => {
        const haystack = [e.ichJetzt, e.action, e.reflection, ...e.body, ...e.feelings, ...e.need, ...e.obstacle, ...e.connection]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
    : entries;
  const [viewing, setViewing] = useState<ZugangEntry | null>(null);
  const [showPatterns, setShowPatterns] = useState(false);
  const patterns = stateActionPatterns();
  const allBridges = bridgesRepo.getAll();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const isEn = settings.language === 'en';

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="zugangRueckblick" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.zugang.reviewTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.zugang.reviewSubtitle}</p>

        {patterns.length > 0 && (
          <>
            <button onClick={() => setShowPatterns((v) => !v)} className="text-[13px] text-[var(--color-primary)] mb-6 block">
              {showPatterns ? t.zugang.hidePatternsCta : t.zugang.showPatternsCta}
            </button>
            {showPatterns && (
              <Card className="mb-6 -mt-3">
                <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">🌱 {t.zugang.patternsTitle}</p>
                <p className="text-[12px] text-[var(--color-text-faint)] mb-3 leading-relaxed">{t.zugang.patternsHint}</p>
                <div className="flex flex-col gap-2.5">
                  {patterns.slice(0, 8).map((p) => {
                    const ratio = p.smoothCount / p.total;
                    const state = stateLabel(p.survivalState, isEn);
                    return (
                      <div key={`${p.survivalState}-${p.action}`} className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
                        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
                          {ratio >= 0.6
                            ? t.zugang.patternSmoothText.replace('{action}', p.action).replace('{state}', state)
                            : ratio <= 0.4
                              ? t.zugang.patternHarderText.replace('{action}', p.action).replace('{state}', state)
                              : t.zugang.patternMixedText.replace('{action}', p.action).replace('{state}', state)}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-faint)] mt-1">
                          {t.zugang.patternCountNote.replace('{n}', String(p.total))}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}

        {entries.length === 0 ? (
          <EmptyState title={t.zugang.reviewEmpty} />
        ) : (
          <>
            {entries.length > 4 && (
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
                <input
                  className="input"
                  style={{ paddingLeft: 38 }}
                  placeholder={t.zugang.reviewSearchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    aria-label={t.common.close}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            )}
            {filteredEntries.length === 0 ? (
              <EmptyState title={t.zugang.reviewSearchEmpty} />
            ) : (
              <div className="flex flex-col gap-3">
                {filteredEntries.map((e) => {
                  const bridge = e.bridgeId ? allBridges.find((b) => b.id === e.bridgeId) : undefined;
                  return (
                <button key={e.id} onClick={() => setViewing(e)} className="text-left w-full">
                  <Card interactive>
                    <p className="text-[12px] text-[var(--color-text-faint)] mb-2">
                      {new Date(e.createdAt).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {' · '}
                      {new Date(e.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      {e.endedVia === 'bridge' && bridge && (
                        <span className="text-[var(--color-primary)]"> · {t.zugang.endedViaBridge.replace('{bridge}', bridge.title)}</span>
                      )}
                      {e.endedVia === 'safetynet' && (
                        <span className="text-[var(--color-primary)]"> · {t.zugang.endedViaSafetyNet}</span>
                      )}
                    </p>
                    {e.survivalState && (
                      <p className="text-[13px] text-[var(--color-text)] mb-1">
                        {SURVIVAL_STATE_META[e.survivalState].emoji}{' '}
                        {isEn ? SURVIVAL_STATE_META[e.survivalState].labelEn : SURVIVAL_STATE_META[e.survivalState].label}
                        {e.tensionValue != null && <span className="text-[var(--color-text-faint)]"> · {e.tensionValue}%</span>}
                      </p>
                    )}
                    {e.ichJetzt && <Row label={t.zugang.step0Title} value={e.ichJetzt} />}
                    {e.feelings.length > 0 && <Row label={t.zugang.step3Title} value={e.feelings.join(', ')} />}
                    {e.need.length > 0 && <Row label={t.zugang.step6Title} value={e.need.join(', ')} />}
                    {bridge && (
                      <Row
                        label={t.zugang.step8Title}
                        value={bridge.title + (e.bridgeLevels && e.bridgeLevels.length > 0 ? ` (Level ${e.bridgeLevels.join(', ')})` : '') + (e.bridgeTimerUsed ? ` · ${t.zugang.timerUsedLabel}` : '')}
                      />
                    )}
                    {e.action && <Row label={t.zugang.step10Title} value={e.action} />}
                    {e.reflection && (
                      <p className="text-[13px] text-[var(--color-text-muted)] italic mt-2 pt-2 border-t border-[var(--color-border)] leading-relaxed">
                        „{e.reflection}"
                      </p>
                    )}
                  </Card>
                </button>
              );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={t.zugang.reviewDetailTitle}>
        {viewing && (
          <div className="flex flex-col gap-5">
            <p className="text-[13px] text-[var(--color-text-faint)] text-center -mt-1">
              {new Date(viewing.createdAt).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              {' · '}
              {new Date(viewing.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            </p>
            {viewing.endedVia === 'bridge' && viewing.bridgeId && (
              <p className="text-[13px] text-[var(--color-primary)] text-center -mt-3">
                {t.zugang.endedViaBridge.replace('{bridge}', allBridges.find((b) => b.id === viewing.bridgeId)?.title ?? '')}
              </p>
            )}
            {viewing.endedVia === 'safetynet' && (
              <p className="text-[13px] text-[var(--color-primary)] text-center -mt-3">{t.zugang.endedViaSafetyNet}</p>
            )}

            {viewing.ichJetzt && <DetailStep title={t.zugang.step0Title} emoji="📝" items={[viewing.ichJetzt]} />}
            <DetailStep title={t.zugang.step1Title} emoji="🫀" items={viewing.body} />
            {viewing.tensionValue != null && (
              <DetailStep title={t.tension.valueLabel} emoji="🌡️" items={[`${viewing.tensionValue}%`]} />
            )}
            {viewing.survivalState && (
              <DetailStep
                title={t.zugang.step2Title}
                emoji="🧠"
                items={[`${SURVIVAL_STATE_META[viewing.survivalState].emoji} ${isEn ? SURVIVAL_STATE_META[viewing.survivalState].labelEn : SURVIVAL_STATE_META[viewing.survivalState].label}`]}
              />
            )}
            <DetailStep title={t.zugang.step3Title} emoji="🤍" items={viewing.feelings} colorFor={colorForFeelingWord} />
            <DetailStep title={t.zugang.step4Title} emoji="🛡️" items={viewing.protectionStrategy} />
            <DetailStep title={t.zugang.step5Title} emoji="🫂" items={viewing.careWish} />
            <DetailStep title={t.zugang.step6Title} emoji="🌱" items={viewing.need} />
            <DetailStep title={t.zugang.step7Title} emoji="🚧" items={viewing.obstacle} />
            {viewing.harderFactors && viewing.harderFactors.length > 0 && (
              <DetailStep title={t.zugang.harderTitle} emoji="🌫️" items={viewing.harderFactors} />
            )}
            {viewing.whatMightHaveHelped && (
              <div>
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">🌫️ {t.zugang.helpedLabel}</p>
                <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{viewing.whatMightHaveHelped}</p>
              </div>
            )}
            {viewing.bridgeId && (
              <DetailStep
                title={t.zugang.step8Title}
                emoji="🌉"
                items={[allBridges.find((b) => b.id === viewing.bridgeId)?.title ?? '']}
              />
            )}
            {viewing.bridgeLevels && viewing.bridgeLevels.length > 0 && (
              <p className="text-[13px] text-[var(--color-text-muted)] -mt-2">
                {t.zugang.levelUsedLabel.replace('{levels}', viewing.bridgeLevels.join(', '))}
                {viewing.bridgeTimerUsed ? ` · ${t.zugang.timerUsedLabel}` : ''}
              </p>
            )}
            {viewing.connection.length > 0 && viewing.connection[0] && (
              <div>
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">
                  🌍 {t.zugang.step9Title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {viewing.connection.map((v) => (
                    <Link
                      key={v}
                      to={`/entdecken/wertekompass?wert=${encodeURIComponent(v)}`}
                      className="px-2.5 py-1.5 rounded-full text-[13px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    >
                      {v}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {viewing.action && <DetailStep title={t.zugang.step10Title} emoji="👣" items={[viewing.action]} />}

            {viewing.reflection && (
              <div className="pt-3 border-t border-[var(--color-border)]">
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{t.zugang.reflectionLabel}</p>
                <p className="text-[14px] text-[var(--color-text)] italic leading-relaxed">„{viewing.reflection}"</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailStep({ title, emoji, items, colorFor }: { title: string; emoji: string; items: string[]; colorFor?: (item: string) => string | undefined }) {
  if (items.length === 0 || (items.length === 1 && !items[0])) return null;
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">
        {emoji} {title}
      </p>
      {colorFor ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => {
            const color = colorFor(item);
            return (
              <span
                key={item}
                className="px-2.5 py-1 rounded-full text-[13px]"
                style={color ? { background: `${color}26`, color: 'var(--color-text)', border: `1px solid ${color}66` } : { background: 'var(--color-surface-muted)', color: 'var(--color-text)' }}
              >
                {item}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{items.join(' · ')}</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[13px] text-[var(--color-text-muted)]">
      <span className="text-[var(--color-text-faint)]">{label}: </span>
      {value}
    </p>
  );
}
