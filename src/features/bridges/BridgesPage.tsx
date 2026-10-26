import { SearchButton } from '../../components/navigation/SearchButton';
import { useEffect, useMemo, useState } from 'react';
import { goBack } from '../../services/navigation';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { getUiLanguage } from '../../services/uiLanguage';
import { zl } from '../zugang/zugangEn';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Plus, Compass, FileDown, ChevronLeft, ChevronDown } from 'lucide-react';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { bridgesRepo, seedBridgesIfEmpty, patchKnownDemoContentIssues, migrateBridgeCategoriesIfNeeded, migrateBridgeAccessChannelsIfNeeded, addMissingDemoBridges } from './bridgesRepo';
import { bridgeMatchesValue, bridgeMatchesNeed, bridgeNeeds } from './bridgeValues';
import { manualPriorities } from '../wertekompass/wertekompassData';
import { CONNECTION_ITEMS_DE, NEED_CATEGORY_GROUPS } from '../zugang/zugangContent';
import { BridgeFormModal } from './BridgeFormModal';
import { AboutVonMirAusModal } from '../../components/shared/AboutVonMirAusModal';
import { BRIDGES_INFO_TEXT } from '../../content/aboutContent';
import { BridgeBuiltAnimation } from './BridgeBuiltAnimation';
import { BridgePrintView } from './BridgePrintView';
import { DiscoverBridgesModal } from './DiscoverBridgesModal';
import { PasteSharedButton } from '../../components/shared/PasteSharedModal';
import { RecentlyUsedRow } from '../../components/shared/RecentlyUsedRow';
import { BridgeHeroIllustration } from './BridgeHeroIllustration';
import { createId } from '../../services/storage/repository';
import { BridgeVsResourceInfo } from '../../components/shared/BridgeVsResourceInfo';
import { suggestedImage } from '../../services/suggestedImages';
import type { Bridge } from '../../data/types';
import { PhotoBackground } from '../../components/shared/PhotoBackground';

seedBridgesIfEmpty();
addMissingDemoBridges();
patchKnownDemoContentIssues();
migrateBridgeCategoriesIfNeeded();
migrateBridgeAccessChannelsIfNeeded();

function emptyBridge(value: string | null, need: string | null): Bridge {
  return {
    id: createId('bridge'),
    title: '',
    // the old grouping category is derived from the values on save; this is only the starting point
    category: 'gedanken_werte_intra',
    connectionTags: value ? [value] : [],
    linkedNeeds: need ? [need] : [],
    image: suggestedImage('', 'gedanken_werte_intra'),
    description: '',
    levels: [
      { level: 1, title: '', description: '' },
      { level: 2, title: '', description: '' },
    ],
    tip: '',
    favorite: false,
    isCustom: true,
  };
}

export function BridgesPage() {
  const t = useT();
  const isEnUi = getUiLanguage() === 'en';
  const say = useCompanionSay();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // "Anhand davon … später richtig gefiltert und angezeigt, wenn man auswählt, in Richtung
  // welchem Bedürfnis, welchem Wert man sich wieder mehr bewegen möchte." — ?wert= / ?beduerfnis=
  // lets other pages (Wertekompass, Bedürfnis-Kompass) open the list already filtered.
  const value = searchParams.get('wert');
  const need = searchParams.get('beduerfnis');
  function setFilter(key: 'wert' | 'beduerfnis', v: string | null) {
    const next = new URLSearchParams(searchParams);
    if (v) next.set(key, v);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }
  const [infoOpen, setInfoOpen] = useState(false);
  const [bridges, setBridges] = useState<Bridge[]>(() => bridgesRepo.getAll());
  const [printingAllBridges, setPrintingAllBridges] = useState(false);

  useEffect(() => {
    const clear = () => setPrintingAllBridges(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  function exportAllBridgesPdf() {
    setPrintingAllBridges(true);
    setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
  }
  const [creating, setCreating] = useState<Bridge | null>(null);
  const [justBuilt, setJustBuilt] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);

  const filtered = useMemo(
    () => bridges.filter((br) => (!value || bridgeMatchesValue(br, value)) && (!need || bridgeMatchesNeed(br, need))),
    [bridges, value, need],
  );

  // values to filter by: the person's own priorities first, then everything bridges already lead to
  const valueChips = useMemo(() => {
    const used = new Map<string, number>();
    bridges.forEach((br) => (br.connectionTags ?? []).forEach((v) => used.set(v, (used.get(v) ?? 0) + 1)));
    const prio = manualPriorities().filter((v) => CONNECTION_ITEMS_DE.includes(v));
    const rest = Array.from(used.keys()).filter((v) => !prio.includes(v)).sort((a, b2) => (used.get(b2) ?? 0) - (used.get(a) ?? 0));
    return [...prio, ...rest].map((v) => ({ value: v, count: used.get(v) ?? 0 }));
  }, [bridges]);

  const needGroups = useMemo(() => {
    const all = new Set(bridges.flatMap((br) => bridgeNeeds(br)));
    return NEED_CATEGORY_GROUPS.map((g) => ({ ...g, items: g.items.filter((n) => all.has(n)) })).filter((g) => g.items.length > 0);
  }, [bridges]);

  function openNew() {
    setCreating(emptyBridge(value, need));
  }

  function saveNew(bridge: Bridge) {
    bridgesRepo.save(bridge);
    setBridges(bridgesRepo.getAll());
    setCreating(null);
    setJustBuilt(bridge.title);
    say(pickLine({ page: '/bruecken', trigger: 'speichern' }), { joy: true });
  }

  return (
    <div className="animate-in">
      <div className="no-print">
      <div className="px-5 pt-6 pb-6">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          {location.key !== 'default' && (
            <button onClick={() => goBack(navigate)} aria-label={t.common.back} className="w-8 h-8 -ml-1.5 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)] flex-shrink-0">
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 className="text-[24px]">{t.bridges.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <SearchButton />
          <HelpButton helpKey="bruecken" />
          {bridges.length > 0 && (
            <button
              onClick={exportAllBridgesPdf}
              aria-label={t.bridges.exportAllPdf}
              className="text-[var(--color-text-muted)]"
            >
              <FileDown size={17} />
            </button>
          )}
        </div>
      </div>
      <p className="text-[15px] text-[var(--color-text)] mb-3">{t.bridges.subtitle}</p>
      <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed mb-4">{t.bridges.concept}</p>
      <div className="flex flex-col items-start gap-2.5 mb-6">
        <button onClick={() => setShowInfo(true)} className="text-[13px] text-[var(--color-primary)] underline underline-offset-2 text-left">
          {t.bridges.whatsTheDifference}
        </button>
        <button onClick={() => setInfoOpen(true)} className="text-[13px] text-[var(--color-primary)] underline underline-offset-2 text-left">
          {t.bridges.infoAbout}
        </button>
      </div>

      <div className="mb-5">
        <BridgeHeroIllustration />
      </div>

      <Button fullWidth icon={<Plus size={17} />} onClick={openNew} className="mb-4">
        {t.bridges.newBridge}
      </Button>

      <button
        onClick={() => setDiscoverOpen(true)}
        className="flex items-center gap-2 text-[13px] text-[var(--color-primary)] mb-5"
      >
        <Compass size={15} />
        {t.bridges.discoverCta}
      </button>

      <PasteSharedButton className="mb-5" />

      <RecentlyUsedRow type="bridge" hrefFor={(id) => `/bruecken/${id}`} />

      <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.bridges.filterValueTitle}</p>
      <div className="chip-row no-scrollbar mb-3 -mx-5 px-5">
        <Chip selected={!value} onClick={() => setFilter('wert', null)}>
          {t.bridges.filterAll}
        </Chip>
        {valueChips.map((vc) => (
          <Chip key={vc.value} selected={value === vc.value} onClick={() => setFilter('wert', value === vc.value ? null : vc.value)}>
            {zl(vc.value)}
            {vc.count > 0 && <span className="opacity-60"> · {vc.count}</span>}
          </Chip>
        ))}
      </div>
      {needGroups.length > 0 && (
        <details className="group mb-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3.5 py-2.5" open={!!need}>
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-[13px] text-[var(--color-text)]">
            <span>
              {t.bridges.filterNeedTitle}
              {need && <span className="text-[var(--color-primary)]"> · {zl(need)}</span>}
            </span>
            <ChevronDown size={16} className="text-[var(--color-text-faint)] transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {needGroups.map((g) => (
              <div key={g.id}>
                <p className="text-[11.5px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">
                  {g.emoji} {isEnUi ? g.labelEn : g.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((n) => (
                    <Chip key={n} selected={need === n} onClick={() => setFilter('beduerfnis', need === n ? null : n)}>
                      {zl(n)}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
            {need && (
              <button type="button" onClick={() => setFilter('beduerfnis', null)} className="text-[12.5px] text-[var(--color-primary)] self-start">
                {t.bridges.filterClear}
              </button>
            )}
          </div>
        </details>
      )}

      {filtered.length === 0 ? (
        <div className="mb-4">
          <EmptyState title={value || need ? t.bridges.emptyFiltered : t.bridges.empty} />
          {(value || need) && (
            <Button fullWidth variant="secondary" icon={<Plus size={16} />} onClick={openNew} className="mt-3">
              {t.bridges.newBridgeFor.replace('{what}', [value, need].filter(Boolean).join(' · '))}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {filtered.map((bridge, i) => (
            <Link
              key={bridge.id}
              to={`/bruecken/${bridge.id}`}
              className="block rounded-[var(--radius-lg)] overflow-hidden animate-in"
              style={{
                boxShadow: 'var(--shadow-md)',
                background: 'var(--color-surface)',
                animationDelay: `${Math.min(i, 8) * 45}ms`,
              }}
            >
              <PhotoBackground
                src={bridge.image}
                className="w-full bg-cover bg-center relative"
                style={{ aspectRatio: '4 / 3' }}
              >
                {bridge.favorite && (
                  <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[rgba(255,255,255,0.85)] flex items-center justify-center">
                    <Heart size={14} className="text-[var(--color-accent-clay)] fill-current" />
                  </span>
                )}
              </PhotoBackground>
              <div className="p-3">
                <p className="text-[14px] text-[var(--color-text)] leading-snug mb-1 line-clamp-2">{bridge.title}</p>
                <p className="text-[11px] text-[var(--color-text-faint)]">
                  {bridge.levels.length} {bridge.levels.length === 1 ? t.bridges.stepOne : t.bridges.stepMany}
                </p>
                {bridge.connectionTags && bridge.connectionTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {bridge.connectionTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                        {zl(tag)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
      </div>

      <Modal open={showInfo} onClose={() => setShowInfo(false)} title={t.bridges.whatsTheDifference}>
        <BridgeVsResourceInfo />
      </Modal>

      <BridgeFormModal open={!!creating} bridge={creating} onClose={() => setCreating(null)} onSave={saveNew} title={t.bridges.newBridge} />

      {infoOpen && <AboutVonMirAusModal text={BRIDGES_INFO_TEXT} onClose={() => setInfoOpen(false)} />}
      {justBuilt && <BridgeBuiltAnimation title={justBuilt} onDone={() => setJustBuilt(null)} />}

      <DiscoverBridgesModal
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        onAdopted={() => {
          setBridges(bridgesRepo.getAll());
          say(pickLine({ page: '/bruecken', trigger: 'speichern' }));
        }}
      />

      <BridgePrintView
        bridges={printingAllBridges ? bridges : []}
        title={t.bridges.exportAllTitle}
      />
    </div>
  );
}
