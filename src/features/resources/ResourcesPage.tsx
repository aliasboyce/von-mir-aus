import { useEffect, useMemo, useRef, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { useSearchParams } from 'react-router-dom';
import { Heart, Plus, Link as LinkIcon, Pencil, Trash2, Share2, Upload, Tag, RefreshCw, Compass } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';
import { PhotoBackground } from '../../components/shared/PhotoBackground';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ImageSuggestionCarousel } from '../../components/shared/ImageSuggestionCarousel';
import { SensoryModalityPicker } from '../../components/shared/SensoryModalityPicker';
import { TopBar } from '../../components/navigation/TopBar';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { DiscoverResourcesModal } from './DiscoverResourcesModal';
import { RESOURCES_BRIDGES_LINES } from '../../components/companion/companionLines';
import { useT } from '../../i18n';
import { resizeImageFile } from '../../services/imageResize';
import { ImageCropModal } from '../../components/shared/ImageCropModal';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { resourcesRepo, seedResourcesIfEmpty } from './resourcesRepo';
import { syncFavoriteResourceToNetwork, syncResourceEditToNetwork } from '../safetyNet/networkResourceSync';
import { RESOURCE_CATEGORY_ORDER, resourceCategoryLabel } from './resourceMeta';
import { suggestedImage, suggestedImageOptions } from '../../services/suggestedImages';
import { ResourceDetailModal } from './ResourceDetailModal';
import { ResourcePrintView } from './ResourcePrintView';
import { RecentlyUsedRow } from '../../components/shared/RecentlyUsedRow';
import { createCustomCategoryStore } from '../../services/customCategories';
import { createId } from '../../services/storage/repository';
import type { Resource, ResourceCategory } from '../../data/types';
import { EnergyLevelFilter, energyExactMatch } from '../../components/shared/EnergyLevelFilter';

seedResourcesIfEmpty();

const customCategoryStore = createCustomCategoryStore('resource-custom-categories');

type FilterValue = 'all' | ResourceCategory;

export function ResourcesPage() {
  const t = useT();
  const say = useCompanionSay();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [energyFilter, setEnergyFilter] = useState<1 | 2 | 3 | null>(null);
  const [items, setItems] = useState<Resource[]>(() => resourcesRepo.getAll());
  const [editing, setEditing] = useState<Resource | null>(null);
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

  function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const created = customCategoryStore.add(name);
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

  const filtered = useMemo(
    () => energyExactMatch(filter === 'all' ? items : items.filter((r) => r.category === filter), energyFilter),
    [items, filter, energyFilter],
  );

  function refresh() {
    setItems(resourcesRepo.getAll());
  }

  function openNew() {
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

  async function shareResource(resource: Resource) {
    const text = [resource.title, resource.description, resource.link].filter(Boolean).join('\n');
    if (navigator.share) {
      try {
        await navigator.share({ title: resource.title, text, url: resource.link });
      } catch {
        // person cancelled the share sheet — nothing to do
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert(t.resources.shareCopied);
      } catch {
        // clipboard unavailable — silently ignore, sharing is a nice-to-have
      }
    }
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
            <h1 className="text-[24px]">{t.resources.title}</h1>
          </div>
          <p className="text-[14px] text-[var(--color-text-muted)] mb-1">{t.resources.subtitle}</p>
          <button
            onClick={() => setShowInfo(true)}
            className="text-[12px] text-[var(--color-primary)] underline underline-offset-2 block mb-2"
          >
            {t.bridges.whatsTheDifference}
          </button>

        <button onClick={() => setShowDefinition((v) => !v)} className="text-[12px] text-[var(--color-primary)] mb-4 block">
          {showDefinition ? t.resources.hideDefinitionCta : t.resources.showDefinitionCta}
        </button>
        {showDefinition && (
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

        <Button fullWidth icon={<Plus size={17} />} onClick={openNew} className="mb-2">
          {t.resources.addNew}
        </Button>
        <p className="text-[12px] text-[var(--color-text-faint)] italic mb-4 leading-relaxed">{t.resources.thoughtStarterHint}</p>

        <button
          onClick={() => setDiscoverOpen(true)}
          className="flex items-center gap-2 text-[13px] text-[var(--color-primary)] mb-5"
        >
          <Compass size={15} />
          {t.resources.discoverCta}
        </button>

        <RecentlyUsedRow type="resource" hrefFor={(id) => `/entdecken/ressourcen?open=${id}`} />

        <div className="chip-row no-scrollbar mb-5 -mx-5 px-5">
          <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
            {t.common.all}
          </Chip>
          {RESOURCE_CATEGORY_ORDER.map((c) => (
            <Chip key={c} selected={filter === c} onClick={() => setFilter(c)}>
              {resourceCategoryLabel(t, c)}
            </Chip>
          ))}
          {customCategories.map((c) => (
            <Chip key={c.id} selected={filter === c.id} onClick={() => setFilter(c.id)} icon={<Tag size={13} />}>
              {c.label}
            </Chip>
          ))}
          {!addingCategory ? (
            <Chip onClick={() => setAddingCategory(true)} icon={<Plus size={14} />}>
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
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">
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
                          shareResource(resource);
                        }}
                        aria-label={t.resources.share}
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
        onShare={shareResource}
        onShareLink={shareResourceLink}
        onExportPdf={exportResourcePdf}
      />

      <ResourcePrintView resource={printingResource} categoryLabel={categoryLabel} />

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

            <SensoryModalityPicker
              selected={editing.sensoryModalities ?? []}
              onChange={(ids) => setEditing({ ...editing, sensoryModalities: ids })}
            />

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
