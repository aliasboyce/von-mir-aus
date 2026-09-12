import { useEffect, useMemo, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Plus, Tag, Compass, FileDown, ChevronLeft } from 'lucide-react';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { bridgesRepo, seedBridgesIfEmpty, patchKnownDemoContentIssues, migrateBridgeCategoriesIfNeeded } from './bridgesRepo';
import { BRIDGE_CATEGORY_META, BRIDGE_CATEGORY_ORDER } from './bridgeMeta';
import { BridgeFormModal } from './BridgeFormModal';
import { BridgeBuiltAnimation } from './BridgeBuiltAnimation';
import { BridgePrintView } from './BridgePrintView';
import { DiscoverBridgesModal } from './DiscoverBridgesModal';
import { RecentlyUsedRow } from '../../components/shared/RecentlyUsedRow';
import { BridgeHeroIllustration } from './BridgeHeroIllustration';
import { createCustomCategoryStore } from '../../services/customCategories';
import { createId } from '../../services/storage/repository';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { RESOURCES_BRIDGES_LINES } from '../../components/companion/companionLines';
import { suggestedImage } from '../../services/suggestedImages';
import type { Bridge, BridgeCategory } from '../../data/types';
import { PhotoBackground } from '../../components/shared/PhotoBackground';

seedBridgesIfEmpty();
patchKnownDemoContentIssues();
migrateBridgeCategoriesIfNeeded();

const customCategoryStore = createCustomCategoryStore('bridge-custom-categories');

function emptyBridge(category: BridgeCategory): Bridge {
  return {
    id: createId('bridge'),
    title: '',
    category,
    image: suggestedImage('', category),
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
  const say = useCompanionSay();
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<BridgeCategory>('koerper_intra');
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
  const [customCategories, setCustomCategories] = useState(() => customCategoryStore.getAll());
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState<Bridge | null>(null);
  const [justBuilt, setJustBuilt] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);

  const filtered = useMemo(() => bridges.filter((b) => b.category === category), [bridges, category]);

  function categoryLabel(cat: BridgeCategory): string {
    if (BRIDGE_CATEGORY_META[cat]) return BRIDGE_CATEGORY_META[cat].label(t);
    return customCategories.find((c) => c.id === cat)?.label ?? cat;
  }

  function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = customCategoryStore.add(name);
    setCustomCategories(customCategoryStore.getAll());
    setCategory(created.id);
    setNewCategoryName('');
    setAddingCategory(false);
  }

  function openNew() {
    setCreating(emptyBridge(category));
  }

  function saveNew(bridge: Bridge) {
    bridgesRepo.save(bridge);
    setBridges(bridgesRepo.getAll());
    setCreating(null);
    setJustBuilt(bridge.title);
    say(pickLine({ page: '/bruecken', trigger: 'speichern' }), { joy: true });
  }

  const allCategoryChips = [
    ...BRIDGE_CATEGORY_ORDER.map((c) => ({ id: c, label: categoryLabel(c), icon: BRIDGE_CATEGORY_META[c].icon })),
    ...customCategories.map((c) => ({ id: c.id, label: c.label, icon: Tag })),
  ];

  return (
    <div className="animate-in">
      <div className="no-print">
      <div className="px-5 pt-6 pb-6">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          {location.key !== 'default' && (
            <button onClick={() => navigate(-1)} aria-label={t.common.back} className="w-8 h-8 -ml-1.5 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)] flex-shrink-0">
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 className="text-[24px]">{t.bridges.title}</h1>
        </div>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setShowInfo(true)}
            className="text-[12px] text-[var(--color-primary)] underline underline-offset-2"
          >
            {t.bridges.whatsTheDifference}
          </button>
        </div>
      </div>
      <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{t.bridges.subtitle}</p>

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

      <RecentlyUsedRow type="bridge" hrefFor={(id) => `/bruecken/${id}`} />

      <div className="chip-row no-scrollbar mb-5 -mx-5 px-5">
        {allCategoryChips.map(({ id, label, icon: Icon }) => (
          <Chip key={id} selected={category === id} onClick={() => setCategory(id)} icon={<Icon size={15} />}>
            {label}
          </Chip>
        ))}
        {!addingCategory ? (
          <Chip onClick={() => setAddingCategory(true)} icon={<Plus size={15} />}>
            {t.bridges.newCategory}
          </Chip>
        ) : (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input
              autoFocus
              className="input"
              style={{ width: 140 }}
              placeholder={t.bridges.newCategoryPlaceholder}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
            <button onClick={addCategory} className="p-2 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex-shrink-0">
              <Plus size={15} />
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t.bridges.empty} />
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
                  {t.bridges.level} {bridge.levels.length}
                </p>
                {bridge.connectionTags && bridge.connectionTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {bridge.connectionTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                        {tag}
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
        <div className="flex items-start gap-3">
          <InlineCompanionNote />
          <p className="text-[14px] text-[var(--color-text)] flex-1">{RESOURCES_BRIDGES_LINES.distinction}</p>
        </div>
      </Modal>

      <BridgeFormModal open={!!creating} bridge={creating} onClose={() => setCreating(null)} onSave={saveNew} title={t.bridges.newBridge} />
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
        categoryLabel={(catId) => BRIDGE_CATEGORY_META[catId as keyof typeof BRIDGE_CATEGORY_META]?.label(t) ?? catId}
        title={t.bridges.exportAllTitle}
      />
    </div>
  );
}
