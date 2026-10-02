import { useEffect, useMemo, useRef, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { Heart, Plus, Link as LinkIcon, Link2, Pencil, Trash2, Share2, Upload, Tag, RefreshCw, Compass } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';
import { PhotoBackground } from '../../components/shared/PhotoBackground';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ImageSuggestionCarousel } from '../../components/shared/ImageSuggestionCarousel';
import { AccessChannelPicker } from '../../components/shared/AccessChannelPicker';
import { TopBar } from '../../components/navigation/TopBar';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { DiscoverResourcesModal } from './DiscoverResourcesModal';
import { RESOURCES_BRIDGES_LINES } from '../../components/companion/companionLines';
import { useT } from '../../i18n';
import { resizeImageFile } from '../../services/imageResize';
import { ImageCropModal } from '../../components/shared/ImageCropModal';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { resourcesRepo, seedResourcesIfEmpty, migrateResourceAccessChannelsIfNeeded, addMissingDbtSkills, patchKnownSkillCategoryIssues, assignDefaultZoneIdsToSkills } from './resourcesRepo';
import { syncFavoriteResourceToNetwork, syncResourceEditToNetwork } from '../safetyNet/networkResourceSync';
import { RESOURCE_CATEGORY_ORDER, resourceCategoryLabel, RESOURCE_CATEGORY_GROUP_META, RESOURCE_CATEGORY_GROUP_ORDER, RESOURCE_CATEGORY_TO_GROUP, SKILL_CATEGORY_ZONE_COLOR } from './resourceMeta';
import { suggestedImage, suggestedImageOptions } from '../../services/suggestedImages';
import { ResourceDetailModal } from './ResourceDetailModal';
import { SkillFormModal } from './SkillFormModal';
import { HilfsmittelFormModal } from './HilfsmittelFormModal';
import { ResourcePrintView } from './ResourcePrintView';
import { RecentlyUsedRow } from '../../components/shared/RecentlyUsedRow';
import { createCustomCategoryStore } from '../../services/customCategories';
import { createId } from '../../services/storage/repository';
import type { Resource, ResourceCategory, ResourceCategoryGroup } from '../../data/types';
import { EnergyLevelFilter, energyExactMatch } from '../../components/shared/EnergyLevelFilter';

seedResourcesIfEmpty();
migrateResourceAccessChannelsIfNeeded();
addMissingDbtSkills();
patchKnownSkillCategoryIssues();
assignDefaultZoneIdsToSkills();

const customCategoryStore = createCustomCategoryStore('resource-custom-categories');

type FilterValue = 'all' | ResourceCategory;

/**
 * "Ressourcen-Unterteilung nochmal neu"-Auftrag — /entdecken/ressourcen
 * is now a hub (ResourcesHubPage) with three doorways: Hilfsmittel,
 * Skills, and Gespeicherte Quellen (moved here from its own top-level
 * spot). This same ResourcesPage component now serves BOTH sub-pages
 * — reusing every existing function (add/edit/tag/share/print)
 * unchanged — distinguished only by the :type route param. Skills
 * means the 'faehigkeiten' category group specifically (the one
 * genuinely practiced-technique group from the earlier category
 * work); Hilfsmittel is deliberately everything else (Hilfsmittel &
 * Anker, Orte, Aktivitäten, Menschen, Sonstiges, ungrouped customs) —
 * a broad catch-all so no existing resource ever becomes unreachable
 * while more subcategories are still to come, as agreed.
 */
export function ResourcesPage() {
  const t = useT();
  const say = useCompanionSay();
  const navigate = useNavigate();
  const { type: typeParam } = useParams<{ type?: string }>();
  const typeScope: 'hilfsmittel' | 'skills' | null = typeParam === 'skills' ? 'skills' : typeParam === 'hilfsmittel' ? 'hilfsmittel' : null;
  const [searchParams, setSearchParams] = useSearchParams();
  // "Ab dem Fruehwarnbereich soll die App zu den passenden Skills
  // verweisen"-Auftrag — a deep link like .../skills?category=stresstoleranz
  // lands with that category pre-selected, so a zone-specific link can
  // point straight at the right module instead of just the general
  // Skills page.
  const [filter, setFilter] = useState<FilterValue>(() => new URLSearchParams(window.location.search).get('category') ?? 'all');
  // "Soll auch genau bei denen fuer diesen Bereich landen"-Auftrag —
  // a precise zone filter (e.g. ?zone=zone4) on top of the category
  // one. Inclusive, not exclusive: an item with no zoneIds set at all
  // still shows (most existing content before this feature), so nothing
  // existing silently disappears — only items explicitly tagged for a
  // DIFFERENT zone get filtered out.
  const [zoneFilter] = useState<string | null>(() => new URLSearchParams(window.location.search).get('zone'));
  const [energyFilter, setEnergyFilter] = useState<1 | 2 | 3 | null>(null);
  const [items, setItems] = useState<Resource[]>(() => resourcesRepo.getAll());
  const [editing, setEditing] = useState<Resource | null>(null);
  // "Das Hinzufuegen-Feld soll nur bei Skills immer so aufgebaut
  // werden"-Auftrag — a separate modal flag so the structured
  // SkillFormModal and the existing plain form never fight over the
  // same `editing`/`modalOpen` state; which one opens is decided once,
  // in openNew()/openEdit() below, based on typeScope.
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  // Same reasoning as skillModalOpen above — a separate flag for the
  // Hilfsmittel structured form.
  const [hilfsmittelModalOpen, setHilfsmittelModalOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imageSuggestions, setImageSuggestions] = useState<string[]>([]);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Resource | null>(null);
  const [printingResource, setPrintingResource] = useState<Resource | null>(null);

  useEffect(() => {
    const clear = () => setPrintingResource(null);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);
  const [customCategories, setCustomCategories] = useState(() => customCategoryStore.getAll());
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function categoryLabel(cat: ResourceCategory): string {
    const builtIn = RESOURCE_CATEGORY_ORDER.find((c) => c === cat);
    if (builtIn) return resourceCategoryLabel(t, builtIn);
    return customCategories.find((c) => c.id === cat)?.label ?? cat;
  }

  function addCategory(group?: ResourceCategoryGroup) {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = customCategoryStore.add(name, group);
    setCustomCategories(customCategoryStore.getAll());
    setFilter(created.id);
    setNewCategoryName('');
    setAddingCategory(false);
  }

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) return;
    const resource = resourcesRepo.getById(openId);
    if (resource) setViewing(resource);
    searchParams.delete('open');
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inTypeScope = useMemo(() => {
    let base = items;
    if (typeScope) {
      const customGroupById = new Map(customCategories.map((c) => [c.id, c.group]));
      base = base.filter((r) => {
        const group = RESOURCE_CATEGORY_TO_GROUP[r.category] ?? customGroupById.get(r.category);
        const isSkill = group === 'faehigkeiten';
        return typeScope === 'skills' ? isSkill : !isSkill;
      });
    }
    if (zoneFilter) {
      base = base.filter((r) => {
        const zoneIds = r.skillDetails?.zoneIds ?? r.hilfsmittelDetails?.zoneIds;
        return !zoneIds || zoneIds.length === 0 || zoneIds.includes(zoneFilter);
      });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, typeScope, customCategories, zoneFilter]);
  const filtered = useMemo(
    () => energyExactMatch(filter === 'all' ? inTypeScope : inTypeScope.filter((r) => r.category === filter), energyFilter),
    [inTypeScope, filter, energyFilter],
  );

  function refresh() {
    setItems(resourcesRepo.getAll());
  }

  function openNew() {
    if (typeScope === 'skills') {
      setEditing(null);
      setSkillModalOpen(true);
      return;
    }
    if (typeScope === 'hilfsmittel') {
      setEditing(null);
      setHilfsmittelModalOpen(true);
      return;
    }
    setEditing({
      id: createId('res'),
      title: '',
      category: 'sonstiges',
      description: '',
      link: '',
      note: '',
      tags: [],
      favorite: false,
      image: suggestedImage('', 'sonstiges'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setImageSuggestions(suggestedImageOptions('', 'sonstiges'));
    setModalOpen(true);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    resizeImageFile(file, 1200)
      .then((dataUrl) => setCropSrc(dataUrl))
      .catch(() => {
        // rare (corrupt file, no canvas support) — leave the image unchanged
      });
  }

  function openEdit(resource: Resource) {
    setViewing(null);
    if (typeScope === 'skills') {
      setEditing(resource);
      setSkillModalOpen(true);
      return;
    }
    if (typeScope === 'hilfsmittel') {
      setEditing(resource);
      setHilfsmittelModalOpen(true);
      return;
    }
    setEditing(resource);
    setImageSuggestions(suggestedImageOptions(resource.title, resource.category));
    setModalOpen(true);
  }

  function save() {
    if (!editing || !editing.title.trim()) return;
    const isNew = !resourcesRepo.getById(editing.id);
    const saved = { ...editing, updatedAt: new Date().toISOString() };
    resourcesRepo.save(saved);
    syncFavoriteResourceToNetwork(saved);
    syncResourceEditToNetwork(saved);
    setModalOpen(false);
    setEditing(null);
    refresh();
    say(pickLine({ page: '/entdecken/ressourcen', trigger: isNew ? 'speichern' : 'eintrag_bearbeiten' }), { joy: isNew });
  }

  function saveSkill(resource: Resource) {
    const isNew = !resourcesRepo.getById(resource.id);
    resourcesRepo.save(resource);
    syncFavoriteResourceToNetwork(resource);
    syncResourceEditToNetwork(resource);
    setSkillModalOpen(false);
    setEditing(null);
    refresh();
    say(pickLine({ page: '/entdecken/ressourcen', trigger: isNew ? 'speichern' : 'eintrag_bearbeiten' }), { joy: isNew });
  }

  function saveHilfsmittel(resource: Resource) {
    const isNew = !resourcesRepo.getById(resource.id);
    resourcesRepo.save(resource);
    syncFavoriteResourceToNetwork(resource);
    syncResourceEditToNetwork(resource);
    setHilfsmittelModalOpen(false);
    setEditing(null);
    refresh();
    say(pickLine({ page: '/entdecken/ressourcen', trigger: isNew ? 'speichern' : 'eintrag_bearbeiten' }), { joy: isNew });
  }

  function remove(id: string): boolean {
    if (!window.confirm(t.resources.confirmDelete)) return false;
    resourcesRepo.remove(id);
    refresh();
    return true;
  }

  function toggleFavorite(resource: Resource) {
    const updated = { ...resource, favorite: !resource.favorite };
    resourcesRepo.save(updated);
    syncFavoriteResourceToNetwork(updated);
    refresh();
    setViewing((v) => (v?.id === resource.id ? updated : v));
  }

  async function shareResourceLink(resource: Resource) {
    const payload = {
      title: resource.title,
      description: resource.description,
      categoryLabel: categoryLabel(resource.category),
      link: resource.link,
      tags: resource.tags,
    };
    const url = `${window.location.origin}/entdecken/ressourcen/importieren?data=${encodeURIComponent(JSON.stringify(payload))}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: resource.title, url });
      } catch {
        // person cancelled the share sheet — nothing to do
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert(t.resources.shareLinkCopied);
      } catch {
        // clipboard unavailable — silently ignore
      }
    }
  }

  function exportResourcePdf(resource: Resource) {
    // Same mechanism as the Safety Plan PDF: a .print-only block becomes
    // visible only inside the print stylesheet, then window.print() lets
    // the OS/browser's own print sheet save or share it as a PDF — this
    // already works cross-platform (including the mobile share sheet),
    // no separate PDF library needed.
    setPrintingResource(resource);
    setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
  }

  return (
    <div className="animate-in">
      <div className="no-print">
        <TopBar action={<HelpButton helpKey="ressourcen" />} />
        <div className="px-5 pb-6">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-[24px]">{typeScope === 'skills' ? t.resources.skillsTitle : typeScope === 'hilfsmittel' ? t.resources.hilfsmittelTitle : t.resources.title}</h1>
          </div>
          <p className="text-[14px] text-[var(--color-text-muted)] mb-1">
            {typeScope === 'skills' ? t.resources.skillsSubtitle : typeScope === 'hilfsmittel' ? t.resources.hilfsmittelSubtitle : t.resources.subtitle}
          </p>
          {typeScope === 'skills' && (
            <div className="rounded-[var(--radius-lg)] p-4 mb-4 mt-2" style={{ background: 'var(--color-surface-muted)' }}>
              {t.resources.skillsIntro.split('\n\n').map((para, i) => (
                <p key={i} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2 last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          )}
          {/* "Was unterscheidet Bruecken von Ressourcen / Was sind
           * Ressourcen genau muss raus, die Saetze passen da nicht
           * mehr"-Auftrag — both explainer links only make sense on
           * the general Ressourcen page, not once scoped to a
           * specific sub-type like Hilfsmittel or Skills. */}
          {!typeScope && (
            <button
              onClick={() => setShowInfo(true)}
              className="text-[12px] text-[var(--color-primary)] underline underline-offset-2 block mb-2"
            >
              {t.bridges.whatsTheDifference}
            </button>
          )}

        {!typeScope && (
          <button onClick={() => setShowDefinition((v) => !v)} className="text-[12px] text-[var(--color-primary)] mb-4 block">
            {showDefinition ? t.resources.hideDefinitionCta : t.resources.showDefinitionCta}
          </button>
        )}
        {!typeScope && showDefinition && (
          <div className="animate-in mb-5">
            <Card className="mb-3">
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.resources.definitionText}</p>
            </Card>
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{t.resources.internalExternalTitle}</p>
            <Card className="mb-2" style={{ borderLeft: '3px solid var(--color-primary)' }}>
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">{t.resources.internalTitle}</p>
              <ul className="flex flex-col gap-1">
                {t.resources.internalItems.map((item) => (
                  <li key={item} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {item}</li>
                ))}
              </ul>
            </Card>
            <Card className="mb-3" style={{ borderLeft: '3px solid var(--color-accent-clay)' }}>
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">{t.resources.externalTitle}</p>
              <ul className="flex flex-col gap-1">
                {t.resources.externalItems.map((item) => (
                  <li key={item} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {item}</li>
                ))}
              </ul>
            </Card>
            <Card className="mb-3" style={{ background: 'var(--color-primary-soft)' }}>
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">{t.resources.therapyRoleTitle}</p>
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.resources.therapyRoleText}</p>
            </Card>
            <SourceNoteCard text={t.resources.definitionSource} sourceIds={['gabler-ressourcen', 'socialnet-ressourcen']} />
          </div>
        )}

        {/* "+ neue Ressource / Ressourcen entdecken aendern bzw raus
         * auf der Skills-Seite"-Auftrag — on Skills specifically: the
         * add button reads "+ neuer Skill", a second button opens the
         * existing Bruecken flow as "+ neue Skillskette" (a skill
         * chain IS structurally a Bruecke — a sequence of steps —
         * reusing that proven creation UI rather than building a
         * second, parallel one), and "Ressourcen entdecken" (an
         * external-search prompt that doesn't fit Skills) is hidden. */}
        {typeScope === 'skills' ? (
          <div className="flex gap-2 mb-2">
            <Button fullWidth icon={<Plus size={17} />} onClick={openNew}>
              {t.resources.addNewSkillCta}
            </Button>
            <Button fullWidth variant="secondary" icon={<Link2 size={17} />} onClick={() => navigate('/entdecken/ressourcen/skillketten/neu')}>
              {t.resources.addNewSkillChainCta}
            </Button>
          </div>
        ) : (
          <Button fullWidth icon={<Plus size={17} />} onClick={openNew} className="mb-2">
            {typeScope === 'hilfsmittel' ? t.resources.hilfsmittelFormTitleNew : t.resources.addNew}
          </Button>
        )}
        {!typeScope && <p className="text-[12px] text-[var(--color-text-faint)] italic mb-4 leading-relaxed">{t.resources.thoughtStarterHint}</p>}

        {typeScope !== 'skills' && (
          <button
            onClick={() => setDiscoverOpen(true)}
            className="flex items-center gap-2 text-[13px] text-[var(--color-primary)] mb-5"
          >
            <Compass size={15} />
            {t.resources.discoverCta}
          </button>
        )}

        <RecentlyUsedRow type="resource" hrefFor={(id) => `/entdecken/ressourcen?open=${id}`} />

        {/* "Ressourcen in Unterkategorien aufteilen"-Auftrag — from one
         * long horizontal-scroll chip row to short, labelled rows per
         * group, so the grouping is actually visible while browsing,
         * not just a filter value with no explanation. 'sonstiges' and
         * ungrouped custom categories (including 'menschen' — people
         * stay in das Netzwerk, not a second place here) get their own
         * final, unlabelled-as-a-group row instead of a "Sonstiges"
         * heading that would just repeat the chip's own label. */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-2 mb-3">
            <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
              {t.common.all}
            </Chip>
          </div>
          {RESOURCE_CATEGORY_GROUP_ORDER.filter((g) => !typeScope || (typeScope === 'skills') === (g === 'faehigkeiten')).map((group) => {
            const meta = RESOURCE_CATEGORY_GROUP_META[group];
            const builtIns = RESOURCE_CATEGORY_ORDER.filter((c) => RESOURCE_CATEGORY_TO_GROUP[c] === group);
            const customs = customCategories.filter((c) => c.group === group);
            if (builtIns.length === 0 && customs.length === 0) return null;
            return (
              <div key={group} className="mb-3">
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5 flex items-center gap-1.5">
                  <meta.icon size={12} />
                  {typeScope === 'skills' ? t.resources.dbtGroupLabel : meta.label(t)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {builtIns.map((c) => {
                    const zoneColor = SKILL_CATEGORY_ZONE_COLOR[c];
                    return (
                      <Chip
                        key={c}
                        selected={filter === c}
                        onClick={() => setFilter(c)}
                        style={
                          zoneColor
                            ? filter === c
                              ? { background: zoneColor, borderColor: zoneColor, color: '#fff' }
                              : { borderColor: zoneColor, color: zoneColor }
                            : undefined
                        }
                      >
                        {resourceCategoryLabel(t, c)}
                      </Chip>
                    );
                  })}
                  {customs.map((c) => (
                    <Chip key={c.id} selected={filter === c.id} onClick={() => setFilter(c.id)} icon={<Tag size={13} />}>
                      {c.label}
                    </Chip>
                  ))}
                </div>
              </div>
            );
          })}
          {/* "Meine Skills fuer die ganz selbst erfundenen, zusaetzliche
           * Kategorien moeglich falls man Skills aus anderen
           * Therapieansaetzen speichert"-Auftrag — on the Skills page,
           * the built-in catch-all categories (sonstiges/menschen)
           * stay hidden (not skill-related), but the person's own
           * custom categories get their own labelled section instead
           * of just appearing unlabelled. */}
          {typeScope === 'skills' && customCategories.some((c) => !c.group) && (
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5 mt-1">{t.resources.myOwnSkillsLabel}</p>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            {typeScope !== 'skills' &&
              RESOURCE_CATEGORY_ORDER.filter((c) => !RESOURCE_CATEGORY_TO_GROUP[c]).map((c) => (
                <Chip key={c} selected={filter === c} onClick={() => setFilter(c)}>
                  {resourceCategoryLabel(t, c)}
                </Chip>
              ))}
            {customCategories
              .filter((c) => !c.group)
              .map((c) => (
                <Chip key={c.id} selected={filter === c.id} onClick={() => setFilter(c.id)} icon={<Tag size={13} />}>
                  {c.label}
                </Chip>
              ))}
            {!addingCategory ? (
              <Chip onClick={() => setAddingCategory(true)} icon={<Plus size={14} />}>
                {t.bridges.newCategory}
              </Chip>
            ) : (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    className="input"
                    style={{ width: 160 }}
                    placeholder={t.bridges.newCategoryPlaceholder}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                {newCategoryName.trim() && (
                  <div className="flex flex-col gap-1.5 animate-in">
                    <p className="text-[12px] text-[var(--color-text-faint)]">{t.resources.newCategoryGroupLabel}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {RESOURCE_CATEGORY_GROUP_ORDER.filter((g) => !typeScope || (typeScope === 'skills') === (g === 'faehigkeiten')).map((group) => {
                        const meta = RESOURCE_CATEGORY_GROUP_META[group];
                        return (
                          <Chip key={group} onClick={() => addCategory(group)} icon={<meta.icon size={13} />}>
                            {meta.label(t)}
                          </Chip>
                        );
                      })}
                      <Chip onClick={() => addCategory(undefined)}>{t.resources.newCategoryGroupSkip}</Chip>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <EnergyLevelFilter value={energyFilter} onChange={setEnergyFilter} />

        {filtered.length === 0 ? (
          <EmptyState title={t.resources.empty} />
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {filtered.map((resource) => (
              <Card
                key={resource.id}
                padding="none"
                interactive
                className="overflow-hidden flex flex-col"
                onClick={() => {
                  setViewing(resource);
                  say(pickLine({ page: '/entdecken/ressourcen', trigger: 'ressource_auswahl' }));
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setViewing(resource);
                  }
                }}
              >
                {resource.image ? (
                  <PhotoBackground src={resource.image} className="h-24 bg-cover bg-center bg-[var(--color-surface-muted)]" />
                ) : (
                  <div className="h-24 bg-[var(--color-surface-muted)]" />
                )}
                <div className="p-3 flex-1 flex flex-col">
                  <p
                    className="text-[11px] uppercase tracking-wide mb-1"
                    style={{ color: SKILL_CATEGORY_ZONE_COLOR[resource.category] ?? 'var(--color-text-faint)' }}
                  >
                    {categoryLabel(resource.category)}
                  </p>
                  <p className="text-[14px] text-[var(--color-text)] mb-1">{resource.title}</p>
                  {resource.description && (
                    <p className="text-[12px] text-[var(--color-text-muted)] line-clamp-2 mb-2">
                      {resource.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(resource);
                        }}
                        aria-pressed={resource.favorite}
                        aria-label={t.common.favorite}
                        className="p-1.5 -ml-1.5 rounded-full text-[var(--color-accent-clay)] hover:bg-[var(--color-surface-muted)]"
                      >
                        <Heart size={15} className={resource.favorite ? 'fill-current' : ''} />
                      </button>
                      {resource.link && (
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={t.resources.linkLabel}
                          className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                        >
                          <LinkIcon size={14} />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareResourceLink(resource);
                        }}
                        aria-label={t.resources.shareLink}
                        className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                      >
                        <Share2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(resource);
                        }}
                        aria-label={t.common.edit}
                        className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(resource.id);
                        }}
                        aria-label={t.common.delete}
                        className="p-1.5 rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      <ResourceDetailModal
        resource={viewing}
        categoryLabel={categoryLabel}
        onClose={() => setViewing(null)}
        onEdit={openEdit}
        onDelete={remove}
        onToggleFavorite={toggleFavorite}
        onShareLink={shareResourceLink}
        onExportPdf={exportResourcePdf}
      />

      <ResourcePrintView resource={printingResource} categoryLabel={categoryLabel} />

      <SkillFormModal key={editing?.id ?? 'new'} open={skillModalOpen} resource={editing} onClose={() => { setSkillModalOpen(false); setEditing(null); }} onSave={saveSkill} />

      <HilfsmittelFormModal
        key={editing?.id ?? 'new'}
        open={hilfsmittelModalOpen}
        resource={editing}
        onClose={() => {
          setHilfsmittelModalOpen(false);
          setEditing(null);
        }}
        onSave={saveHilfsmittel}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t.resources.addNew}>
        {editing && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <Field label={t.resources.titleLabel}>
              <input
                autoFocus
                className="input"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
              />
            </Field>
            <Field label={`${t.resources.categoryLabel} — Bild`}>
              <div className="flex flex-col gap-2">
                <ImageSuggestionCarousel
                  images={imageSuggestions}
                  selected={editing.image}
                  onSelect={(url) => setEditing({ ...editing, image: url })}
                  ariaLabel={t.resources.pickThisImage}
                  trailingContent={
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, image: '' })}
                      className="w-16 h-16 rounded-[var(--radius-md)] flex-shrink-0 flex items-center justify-center text-[11px] text-[var(--color-text-faint)] border border-dashed border-[var(--color-border)]"
                    >
                      {t.resources.noImage}
                    </button>
                  }
                />
                <button
                  onClick={() => setImageSuggestions(suggestedImageOptions(editing.title, editing.category))}
                  type="button"
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
                >
                  <RefreshCw size={13} /> {t.resources.moreSuggestions}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
                >
                  <Upload size={14} /> {t.resources.uploadOwnImage}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </Field>
            <Field label={t.energy.fieldLabel}>
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.energy.fieldHint}</p>
              <div className="flex gap-1.5">
                {([1, 2, 3] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEditing({ ...editing, energyLevel: editing.energyLevel === level ? undefined : level })}
                    className="flex-1 py-2 rounded-[var(--radius-md)] border text-[15px]"
                    style={{
                      borderColor: editing.energyLevel === level ? 'var(--color-primary)' : 'var(--color-border)',
                      background: editing.energyLevel === level ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                    }}
                  >
                    {'🔋'.repeat(level)}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t.resources.categoryLabel}>
              <select
                className="input"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as ResourceCategory })}
              >
                {RESOURCE_CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {resourceCategoryLabel(t, c)}
                  </option>
                ))}
                {customCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.resources.descriptionLabel}>
              <textarea
                className="input"
                rows={2}
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </Field>
            <Field label={`${t.resources.linkLabel} ${t.common.optional}`}>
              <input
                className="input"
                type="url"
                placeholder={t.resources.linkPlaceholder}
                value={editing.link ?? ''}
                onChange={(e) => setEditing({ ...editing, link: e.target.value })}
              />
            </Field>
            <Field label={`${t.resources.noteLabel} ${t.common.optional}`}>
              <textarea
                className="input"
                rows={2}
                value={editing.note ?? ''}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              />
            </Field>

            <AccessChannelPicker
              selected={editing.accessChannels ?? []}
              onChange={(ids) => setEditing({ ...editing, accessChannels: ids })}
            />

            <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{t.resources.favoriteToNetworkHint}</p>

            <Button type="submit" fullWidth>
              {t.common.save}
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={showInfo} onClose={() => setShowInfo(false)} title={t.bridges.whatsTheDifference}>
        <div className="flex items-start gap-3">
          <InlineCompanionNote />
          <p className="text-[14px] text-[var(--color-text)] flex-1">{RESOURCES_BRIDGES_LINES.distinction}</p>
        </div>
      </Modal>

      <DiscoverResourcesModal
        open={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
        onAdopted={refresh}
      />
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={(cropped) => {
            setEditing((prev) => (prev ? { ...prev, image: cropped } : prev));
            setCropSrc(null);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}
