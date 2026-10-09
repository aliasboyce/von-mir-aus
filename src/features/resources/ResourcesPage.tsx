import { useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../../state/SettingsContext';
import { shareOrCopy } from '../../services/shareOrCopy';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useSearchParams, useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Heart, Plus, Link as LinkIcon, Link2, GitBranch, Pencil, Trash2, Share2, Upload, Tag, RefreshCw, Compass } from 'lucide-react';
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
import { skillkettenRepo } from './skillkettenRepo';
import { skillkettenForZone } from './skillketteZone';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';
import { buildResourcePdf } from './resourcePdf';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import { HilfsmittelFormModal } from './HilfsmittelFormModal';
import { ResourcePrintView } from './ResourcePrintView';
import { RecentlyUsedRow } from '../../components/shared/RecentlyUsedRow';
import { createCustomCategoryStore } from '../../services/customCategories';
import { createId } from '../../services/storage/repository';
import type { Resource, ResourceCategory, ResourceCategoryGroup } from '../../data/types';
import { resourceFitsNeed } from '../../content/needResources';
import { skillModality, isCrisisZone } from '../../content/skillModality';
import { ZoneRoadmap } from './ZoneRoadmap';
import { NEED_META } from '../innerWeather/weatherMeta';
import type { NeedDirection } from '../../data/types';
import { HILFSMITTEL_MAIN, subtypesFor, customOrteSubStore, type SubType } from '../../content/hilfsmittelCategories';
import { EnergyLevelFilter, energyExactMatch } from '../../components/shared/EnergyLevelFilter';
import { EnergyLevelPicker } from '../../components/shared/EnergyLevelPicker';
import type { EnergyLevel } from '../../content/energyLevels';

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
  const skillkettenCount = skillkettenRepo.getAll().length;
  const { type: typeParam } = useParams<{ type?: string }>();
  const typeScope: 'hilfsmittel' | 'skills' | null = typeParam === 'skills' ? 'skills' : typeParam === 'hilfsmittel' ? 'hilfsmittel' : null;
  const [searchParams, setSearchParams] = useSearchParams();
  // "Ab dem Fruehwarnbereich soll die App zu den passenden Skills
  // verweisen"-Auftrag — a deep link like .../skills?category=stresstoleranz
  // lands with that category pre-selected, so a zone-specific link can
  // point straight at the right module instead of just the general
  // Skills page.
  const { settings } = useSettings();
  const [filter, setFilter] = useState<FilterValue>(() => new URLSearchParams(window.location.search).get('category') ?? 'all');
  // "Soll auch genau bei denen fuer diesen Bereich landen"-Auftrag —
  // a precise zone filter (e.g. ?zone=zone4) on top of the category
  // one. Inclusive, not exclusive: an item with no zoneIds set at all
  // still shows (most existing content before this feature), so nothing
  // existing silently disappears — only items explicitly tagged for a
  // DIFFERENT zone get filtered out.
  // Read live from the URL (not once on mount): "Alle Skills anzeigen" is a
  // link to the same page without ?zone=, which must clear the filter.
  const locSearch = useLocation().search;
  const zoneFilter = new URLSearchParams(locSearch).get('zone');
  // /...?need=<NeedDirection> — arriving from the check-in's need step
  const needFilter = new URLSearchParams(locSearch).get('need') as NeedDirection | null;
  // Hilfsmittel only: second chip row (Musik under Auditiv, Natur under Orte, ...)
  const [subFilter, setSubFilter] = useState<string | null>(null);
  const [addingSub, setAddingSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [, bumpSubs] = useState(0);
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | null>(null);
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
    if (needFilter) base = base.filter((r) => resourceFitsNeed(r, needFilter));
    if (zoneFilter) {
      base = base.filter((r) => {
        const zoneIds = r.skillDetails?.zoneIds ?? r.hilfsmittelDetails?.zoneIds;
        const tagged = !!zoneIds && zoneIds.length > 0;
        // Zustandsgerechtes Filtern: an item without any zone tag shows up under
        // "Alle" and in zones 1-4 only; in hoher Anspannung / Rueckzug (5, 6)
        // only what is explicitly tagged for that zone ...
        if (!(tagged ? zoneIds!.includes(zoneFilter) : !isCrisisZone(zoneFilter))) return false;
        // ... and there only body-led items, no thinking-led ones.
        if (isCrisisZone(zoneFilter)) {
          const isSkill = RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten';
          return isSkill ? skillModality(r) === 'koerper' : r.category !== 'kognitiv';
        }
        return true;
      });
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, typeScope, customCategories, zoneFilter, needFilter]);
  const filtered = useMemo(() => {
    const byCategory = filter === 'all' ? inTypeScope : inTypeScope.filter((r) => r.category === filter);
    const bySub = subFilter && typeScope === 'hilfsmittel' ? byCategory.filter((r) => r.subcategory === subFilter) : byCategory;
    const list = energyExactMatch(bySub, energyFilter);
    if (!zoneFilter) return list;
    // "Geordnet fuer den jeweiligen Anspannungsbereich" — items explicitly
    // tagged for this zone come first, untagged ones after them.
    const rank = (r: Resource) => ((r.skillDetails?.zoneIds ?? r.hilfsmittelDetails?.zoneIds)?.includes(zoneFilter) ? 0 : 1);
    return [...list].sort((a, b) => rank(a) - rank(b));
  }, [inTypeScope, filter, subFilter, typeScope, energyFilter, zoneFilter]);
  const zoneBand = zoneFilter ? AROUSAL_BANDS.find((b) => b.id === zoneFilter) : undefined;
  const zoneKetten = zoneFilter && typeScope === 'skills' ? skillkettenForZone(zoneFilter) : [];

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
    await shareOrCopy({ title: resource.title, url }, t.resources.shareLinkCopied);
  }

  // "Das PDF erstellen von Skills funktioniert nicht (braucht Safari, da
  // geht's auch nicht)"-Fund — no longer window.print(): builds a real
  // PDF file and hands it to the share sheet / download (see
  // services/pdf/pdfBuilder.ts + pdfShare.ts), which also works in the
  // iOS home-screen app where printing is blocked.
  async function exportResourcePdf(resource: Resource) {
    const needed = (resource.skillDetails?.relatedHilfsmittelIds ?? [])
      .map((id) => resourcesRepo.getById(id)?.title)
      .filter((x): x is string => !!x);
    const bytes = buildResourcePdf(resource, categoryLabel(resource.category), t, needed);
    await deliverPdf(bytes, safeFilename(resource.title, 'skill'), resource.title);
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
          {/* "Es sollte bei Skills eine Unterseite mit Skillketten geben"-
           * Auftrag — gespeicherte Ketten waren nirgends auffindbar; this
           * tile is the visible doorway to the Skillketten subpage, with a
           * live count so a freshly saved chain is noticeable right here. */}
          {typeScope === 'skills' && (
            <Link
              to="/entdecken/ressourcen/skillketten"
              className="flex items-center gap-3 p-3.5 mb-4 rounded-[var(--radius-lg)]"
              style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)' }}
            >
              <GitBranch size={20} className="text-[var(--color-primary)] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[var(--color-text)]">{t.resources.skillkettenTileTitle}</p>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  {skillkettenCount > 0 ? t.resources.skillkettenTileCount.replace('{n}', String(skillkettenCount)) : t.resources.skillkettenTileEmpty}
                </p>
              </div>
              <span className="text-[var(--color-primary)]" aria-hidden="true">→</span>
            </Link>
          )}
          {/* "Skills und Skillketten dann geordnet angezeigt fuer den
           * jeweiligen Anspannungsbereich"-Auftrag — the landing view of
           * the "zu den Skills" button: which zone this is, the chains
           * that fit it, then the skills (zone matches first). */}
          {needFilter && NEED_META[needFilter] && (
            <div className="rounded-[var(--radius-lg)] p-4 mb-4" style={{ background: 'var(--color-primary-soft)', border: '1.5px solid var(--color-primary)' }}>
              <p className="text-[13.5px] font-semibold text-[var(--color-text)] mb-2">
                {NEED_META[needFilter].icon} {t.resources.needBannerTitle.replace('{need}', NEED_META[needFilter].label(t))}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]">
                <Link
                  to={`/entdecken/ressourcen/${typeScope === 'skills' ? 'hilfsmittel' : 'skills'}?need=${needFilter}`}
                  className="text-[var(--color-primary)] underline underline-offset-2"
                >
                  {typeScope === 'skills' ? t.resources.needBannerAlsoHilfsmittel : t.resources.needBannerAlsoSkills}
                </Link>
                <Link to={`/entdecken/ressourcen/${typeScope ?? 'hilfsmittel'}`} className="text-[var(--color-text-muted)] underline underline-offset-2">
                  {t.resources.needBannerShowAll}
                </Link>
              </div>
            </div>
          )}

          {typeScope === 'skills' && zoneBand && <ZoneRoadmap zoneId={zoneFilter} explicitValue={new URLSearchParams(locSearch).get('v')} />}

          {typeScope === 'skills' && zoneBand && (
            <div className="rounded-[var(--radius-lg)] p-4 mb-4" style={{ background: `${zoneBand.color}18`, border: `1.5px solid ${zoneBand.color}` }}>
              <p className="text-[13px] font-semibold mb-0.5" style={{ color: zoneBand.color }}>
                {t.resources.zoneBannerTitle.replace('{zone}', t.polyvagal.arousalZones[zoneBand.labelKey as keyof typeof t.polyvagal.arousalZones].label)}
              </p>
              <p className="text-[12px] text-[var(--color-text-muted)] mb-2">{t.resources.zoneBannerHint}</p>
              {zoneKetten.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)]">{t.resources.skillkettenTileTitle}</p>
                  {zoneKetten.map((k) => (
                    <Link key={k.id} to={`/entdecken/ressourcen/skillketten/${k.id}`} className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)]" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      <GitBranch size={16} style={{ color: zoneBand.color }} />
                      <span className="text-[13.5px] text-[var(--color-text)] flex-1">{k.title}</span>
                      <span aria-hidden="true" style={{ color: zoneBand.color }}>→</span>
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/entdecken/ressourcen/skills" className="text-[12px] text-[var(--color-text-muted)] underline underline-offset-2">
                {t.resources.zoneBannerShowAll}
              </Link>
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
          {typeScope === 'hilfsmittel' && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {HILFSMITTEL_MAIN.map((c) => (
                  <Chip key={c} selected={filter === c} onClick={() => { setFilter(c); setSubFilter(null); setAddingSub(false); }}>
                    {resourceCategoryLabel(t, c)}
                  </Chip>
                ))}
                {customCategories.filter((c) => c.group === 'hilfsmittel').map((c) => (
                  <Chip key={c.id} selected={filter === c.id} onClick={() => { setFilter(c.id); setSubFilter(null); }} icon={<Tag size={13} />}>
                    {c.label}
                  </Chip>
                ))}
              </div>
              {/* second row: the sub-categories of the chosen category */}
              {filter !== 'all' && subtypesFor(filter).length > 0 && (
                <div className="mt-3 pl-3 animate-in" style={{ borderLeft: '2px solid var(--color-border)' }}>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{t.resources.subcategoriesLabel}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {subtypesFor(filter).map((s) => (
                      <Chip key={s.id} selected={subFilter === s.id} onClick={() => setSubFilter(subFilter === s.id ? null : s.id)}>
                        {settings.language === 'en' ? s.en : s.de}
                      </Chip>
                    ))}
                    {filter === 'orte' && !addingSub && (
                      <Chip onClick={() => setAddingSub(true)} icon={<Plus size={14} />}>
                        {t.resources.addOwnSubcategory}
                      </Chip>
                    )}
                    {filter === 'orte' && addingSub && (
                      <span className="flex items-center gap-1.5">
                        <input autoFocus className="input" style={{ width: 150 }} placeholder={t.resources.subcategoryPlaceholder} value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
                        <button
                          className="text-[13px] text-[var(--color-primary)] px-2"
                          onClick={() => {
                            const name = newSubName.trim();
                            if (!name) return;
                            const created: SubType = { id: `own_${Date.now().toString(36)}`, de: name, en: name };
                            customOrteSubStore.set([...customOrteSubStore.get(), created]);
                            setNewSubName('');
                            setAddingSub(false);
                            setSubFilter(created.id);
                            bumpSubs((n) => n + 1);
                          }}
                        >
                          {t.common.save}
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {typeScope !== 'hilfsmittel' && RESOURCE_CATEGORY_GROUP_ORDER.filter((g) => !typeScope || (typeScope === 'skills') === (g === 'faehigkeiten')).map((group) => {
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
            {typeScope === undefined &&
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

      <SkillFormModal key={`skill-${editing?.id ?? 'new'}`} open={skillModalOpen} resource={editing} onClose={() => { setSkillModalOpen(false); setEditing(null); }} onSave={saveSkill} />

      <HilfsmittelFormModal
        key={`hilfsmittel-${editing?.id ?? 'new'}`}
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
              <EnergyLevelPicker value={editing.energyLevel} onChange={(v) => setEditing({ ...editing, energyLevel: v })} />
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
