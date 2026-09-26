import { useMemo, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { PhotoBackground } from '../../components/shared/PhotoBackground';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Info, ChevronDown } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { NEED_DIRECTION_TO_GFK } from './needDirectionToGfk';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { NEED_META, NEED_ORDER } from '../innerWeather/weatherMeta';
import { NEED_CATEGORY_GROUPS } from '../zugang/zugangContent';
import { networkRepo } from '../safetyNet/networkRepo';
import { useNetworkCategories } from '../safetyNet/useNetworkCategories';
import { getIcon } from '../../components/icons/networkIcons';
import { bridgesRepo, migrateBridgeCategoriesIfNeeded, migrateBridgeAccessChannelsIfNeeded } from '../bridges/bridgesRepo';
import { BRIDGE_CATEGORY_META } from '../bridges/bridgeMeta';
import { resourcesRepo } from '../resources/resourcesRepo';
import type { NeedDirection, HelpsWith, BridgeCategory } from '../../data/types';

/**
 * Bridges the abstract "Bedürfnis" to concrete parts of the network and to
 * bridges — the connection described in the project's core philosophy
 * (Inner Weather → Bedürfnisse → Sicheres Netz → konkreter nächster Schritt).
 * Deliberately a loose, non-diagnostic mapping: a need points toward a
 * "helps with" category and a bridge category, not a prescription.
 */
const NEED_TO_HELPS: Record<NeedDirection, HelpsWith[]> = {
  koerperliche_versorgung: ['krise', 'vorbeugung'],
  schlaf: ['vorbeugung', 'alltag'],
  bewegung: ['alltag'],
  sicherheit: ['krise', 'vorbeugung'],
  verbindung: ['alltag', 'entscheidung'],
  zugehoerigkeit: ['alltag', 'entscheidung'],
  autonomie: ['entscheidung', 'alltag'],
  orientierung: ['entscheidung', 'vorbeugung'],
  ruhe: ['krise', 'vorbeugung'],
  ausdruck: ['alltag', 'entscheidung'],
  wertschaetzung: ['entscheidung', 'vorbeugung'],
  freude: ['alltag'],
  sinn: ['entscheidung', 'vorbeugung'],
  selbstwirksamkeit: ['entscheidung', 'alltag'],
  koerperliche_unversehrtheit: ['krise', 'vorbeugung'],
};

const NEED_TO_BRIDGE_CATEGORY: Record<NeedDirection, BridgeCategory> = {
  koerperliche_versorgung: 'koerper_intra',
  schlaf: 'koerper_intra',
  bewegung: 'koerper_intra',
  sicherheit: 'koerper_intra',
  verbindung: 'menschen_inter',
  zugehoerigkeit: 'gemeinschaft_inter',
  autonomie: 'gedanken_werte_intra',
  orientierung: 'gedanken_werte_intra',
  ruhe: 'koerper_intra',
  ausdruck: 'gedanken_werte_intra',
  wertschaetzung: 'menschen_inter',
  freude: 'gefuehle_intra',
  sinn: 'gedanken_werte_intra',
  selbstwirksamkeit: 'gedanken_werte_intra',
  koerperliche_unversehrtheit: 'koerper_intra',
};

migrateBridgeCategoriesIfNeeded();
migrateBridgeAccessChannelsIfNeeded();

export function NeedsCompassPage() {
  const t = useT();
  const say = useCompanionSay();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories } = useNetworkCategories();
  const preselected = searchParams.get('need') as NeedDirection | null;
  const [need, setNeed] = useState<NeedDirection | null>(
    preselected && NEED_ORDER.includes(preselected) ? preselected : null,
  );
  const [showExplainer, setShowExplainer] = useState(false);
  const [showFullNeedsList, setShowFullNeedsList] = useState(false);
  const { settings } = useSettings();

  const matchingNetwork = useMemo(() => {
    if (!need) return [];
    const helps = NEED_TO_HELPS[need];
    return networkRepo.getAll().filter((e) => e.helpsWith.some((h) => helps.includes(h)));
  }, [need]);

  const matchingBridges = useMemo(() => {
    if (!need) return [];
    const gfkWords = NEED_DIRECTION_TO_GFK[need] ?? [];
    return bridgesRepo
      .getAll()
      .filter((b) => b.category === NEED_TO_BRIDGE_CATEGORY[need] || (b.linkedNeeds ?? []).some((n) => gfkWords.includes(n)));
  }, [need]);

  // Resources have no need-based tagging (their categories are about
  // content type — music, nature, etc. — not what they help with), so we
  // deliberately surface favorites here instead of inventing a new tagging
  // system just for this: still a real, honest connection to something the
  // person already marked as important to them.
  const favoriteResources = useMemo(() => resourcesRepo.getAll().filter((r) => r.favorite).slice(0, 3), []);

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="beduerfnisKompass" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.weather.needsPageTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-1">{t.accessWheel.compassSubtitle}</p>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-2 leading-relaxed">{t.weather.needsSimplifiedNote}</p>
        <button
          onClick={() => setShowExplainer((v) => !v)}
          className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] underline underline-offset-2 mb-6"
        >
          <Info size={14} />
          {t.accessWheel.compassExplainerCta}
        </button>

        {showExplainer && (
          <Card className="mb-6 animate-in">
            <div className="flex items-start gap-3 mb-3">
              <InlineCompanionNote />
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed flex-1">
                {t.accessWheel.compassExplainerWhat}
              </p>
            </div>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">
              {t.accessWheel.compassExplainerWhyHaveTitle}
            </p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
              {t.accessWheel.compassExplainerWhyHave}
            </p>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">
              {t.accessWheel.compassExplainerWhyTitle}
            </p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
              {t.accessWheel.compassExplainerWhy}
            </p>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">
              {t.accessWheel.compassExplainerStressTitle}
            </p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
              {t.accessWheel.compassExplainerStress}
            </p>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">
              {t.accessWheel.compassExplainerConnectionTitle}
            </p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
              {t.accessWheel.compassExplainerConnection}
            </p>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">
              {t.accessWheel.compassExplainerEveryoneTitle}
            </p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
              {t.accessWheel.compassExplainerEveryone}
            </p>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">
              {t.accessWheel.compassExplainerAllowedTitle}
            </p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
              {t.accessWheel.compassExplainerAllowed}
            </p>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">
              {t.accessWheel.compassExplainerPhrasesTitle}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-1">
              {t.accessWheel.compassExplainerPhrases.map((phrase) => (
                <span key={phrase} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)] italic">
                  {phrase}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-text-faint)] mb-3">{t.accessWheel.compassExplainerPhrasesSource}</p>
            <p className="text-[11px] text-[var(--color-text-faint)] leading-relaxed pt-3 border-t border-[var(--color-border)]">
              {t.accessWheel.compassSourceNote}
            </p>
          </Card>
        )}

        <div className="mb-2">
          <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
            {t.weather.needCategoryKoerperlich}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {NEED_ORDER.filter((n) => NEED_META[n].category === 'koerperlich').map((n) => (
              <button
                key={n}
                onClick={() => {
                  setNeed(n);
                  say(pickLine({ page: '/entdecken/beduerfnis-kompass', trigger: 'speichern' }));
                }}
                className={`chip-like ${need === n ? 'chip-like--active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1px solid var(--color-border)',
                  background: need === n ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: need === n ? 'var(--color-surface)' : 'var(--color-text-muted)',
                }}
              >
                <span>{NEED_META[n].icon}</span>
                {NEED_META[n].label(t)}
              </button>
            ))}
          </div>

          <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
            {t.weather.needCategoryPsychischSozial}
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {NEED_ORDER.filter((n) => NEED_META[n].category === 'psychisch_sozial').map((n) => (
              <button
                key={n}
                onClick={() => {
                  setNeed(n);
                  say(pickLine({ page: '/entdecken/beduerfnis-kompass', trigger: 'speichern' }));
                }}
                className={`chip-like ${need === n ? 'chip-like--active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1px solid var(--color-border)',
                  background: need === n ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: need === n ? 'var(--color-surface)' : 'var(--color-text-muted)',
                }}
              >
                <span>{NEED_META[n].icon}</span>
                {NEED_META[n].label(t)}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-6">{t.weather.needCategoryHint}</p>
        </div>

        {need && (
          <Card className="mb-6 animate-in">
            <p className="text-[15px] text-[var(--color-text)] font-medium mb-1.5">{NEED_META[need].label(t)}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{NEED_META[need].explanation(t)}</p>
            <p className="text-[12px] font-medium text-[var(--color-text-faint)] mb-1">{t.weather.needFeelingsLabel}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{NEED_META[need].feelings(t)}</p>
          </Card>
        )}

        {!need ? (
          <EmptyState title={t.weather.needSubtitle} />
        ) : (
          <div className="flex flex-col gap-6 animate-in">
            <div>
              <p className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)] mb-3">
                {t.network.title}
              </p>
              {matchingNetwork.length === 0 ? (
                <p className="text-[14px] text-[var(--color-text-muted)]">{t.accessWheel.noMatchNetwork}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {matchingNetwork.slice(0, 4).map((entry) => {
                    const category = categories.find((c) => c.id === entry.category) ?? categories[0];
                    const Icon = getIcon(entry.iconKey, category.iconKey);
                    return (
                      <Link key={entry.id} to={`/sicherheit/netzwerk?open=${entry.id}`}>
                        <Card interactive className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-surface)] flex-shrink-0"
                            style={{ background: category.color }}
                          >
                            <Icon size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[14px] text-[var(--color-text)] truncate">{entry.name}</p>
                            {entry.role && <p className="text-[12px] text-[var(--color-text-muted)] truncate">{entry.role}</p>}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
              <Link to="/sicherheit/netzwerk" className="text-[13px] text-[var(--color-primary)] mt-2 inline-block">
                {t.network.title} →
              </Link>
            </div>

            <div>
              <p className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)] mb-3">
                {t.bridges.title}
              </p>
              {matchingBridges.length === 0 ? (
                <p className="text-[14px] text-[var(--color-text-muted)]">{t.accessWheel.noMatchBridges}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {matchingBridges.slice(0, 3).map((bridge) => (
                    <Link key={bridge.id} to={`/bruecken/${bridge.id}`}>
                      <Card interactive className="flex items-center gap-3">
                        <PhotoBackground src={bridge.image} className="w-9 h-9 rounded-full bg-cover bg-center flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[14px] text-[var(--color-text)] truncate">{bridge.title}</p>
                          <p className="text-[12px] text-[var(--color-text-muted)]">
                            {BRIDGE_CATEGORY_META[bridge.category]?.label(t)}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {favoriteResources.length > 0 && (
              <div>
                <p className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)] mb-3">
                  {t.accessWheel.favoriteResources}
                </p>
                <div className="flex flex-col gap-2.5">
                  {favoriteResources.map((resource) => (
                    <Link key={resource.id} to={`/entdecken/ressourcen?open=${resource.id}`}>
                      <Card interactive className="flex items-center gap-3">
                        {resource.image ? (
                          <PhotoBackground src={resource.image} className="w-9 h-9 rounded-full bg-cover bg-center flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex-shrink-0 bg-[var(--color-surface-muted)]" />
                        )}
                        <p className="text-[14px] text-[var(--color-text)] truncate">{resource.title}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Priority 11 — the thirteen "Richtungen" above are this app's
         * own, action-linked simplification (each one maps to concrete
         * resources/bridges/contacts, which the fuller GFK list below
         * deliberately doesn't try to replicate). This section adds the
         * complete, more granular GFK/NVC-style needs vocabulary Zugang
         * itself uses (NEED_CATEGORY_GROUPS) as a reference — the exact
         * same data, not a second copy — for anyone who wants the fuller
         * picture rather than the thirteen broader directions above. */}
        <button
          onClick={() => setShowFullNeedsList((v) => !v)}
          className="flex items-center justify-between w-full text-left mt-2 mb-3 pt-5 border-t border-[var(--color-border)]"
        >
          <span className="text-[14px] text-[var(--color-text)]">{t.weather.fullNeedsListCta}</span>
          <ChevronDown size={16} className="text-[var(--color-text-faint)]" style={{ transform: showFullNeedsList ? 'rotate(180deg)' : undefined }} />
        </button>
        {showFullNeedsList && (
          <div className="animate-in">
            <p className="text-[12px] text-[var(--color-text-faint)] mb-4 leading-relaxed">{t.weather.fullNeedsListHint}</p>
            <div className="flex flex-col gap-4">
              {NEED_CATEGORY_GROUPS.map((group) => (
                <div key={group.id}>
                  <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                    {group.emoji} {settings.language === 'en' ? group.labelEn : group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(settings.language === 'en' ? group.itemsEn : group.items).map((item) => (
                      <span key={item} className="px-2.5 py-1 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <SourceNoteCard text={t.weather.needsSourceNote} sourceIds={['gfk-beduerfnisliste', 'emotionale-beduerfnisse']} />
          </div>
        )}
      </div>
    </div>
  );
}
