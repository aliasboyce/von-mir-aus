import { useEffect, useMemo, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { Link, useSearchParams } from 'react-router-dom';
import { Phone, Mail, Plus, Maximize2, Palette, FileDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { TopBar } from '../../components/navigation/TopBar';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { logActivity } from '../../services/activityLog';
import { RecentlyUsedRow } from '../../components/shared/RecentlyUsedRow';
import { networkRepo, seedNetworkIfEmpty } from './networkRepo';
import { resourcesRepo } from '../resources/resourcesRepo';
import { syncAllFavoriteResourcesToNetwork } from './networkResourceSync';
import { getIcon } from '../../components/icons/networkIcons';
import { NetworkGraph } from './NetworkGraph';
import { NetworkGraphFullscreen } from './NetworkGraphFullscreen';
import { NetworkLegend } from './NetworkLegend';
import { NetworkDetailModal } from './NetworkDetailModal';
import { categoryLabel } from './networkMeta';
import { NetworkPrintView } from './NetworkPrintView';
import { useSettings } from '../../state/SettingsContext';
import { NetworkEntryForm } from './NetworkEntryForm';
import { NetworkCategoryEditor } from './NetworkCategoryEditor';
import { CenterNodeEditModal } from './CenterNodeEditModal';
import { useNetworkCategories } from './useNetworkCategories';
import { createId } from '../../services/storage/repository';
import { centerNodeStore, DEFAULT_CENTER_NODE, type CenterNodeConfig } from './networkCategories';
import type { NetworkEntry } from '../../data/types';
import './network.css';

seedNetworkIfEmpty();

const IMPORTANT_CONTACTS_VISIBLE = 5;

function emptyEntry(): NetworkEntry {
  const now = new Date().toISOString();
  return {
    id: createId('net'),
    name: '',
    category: 'person',
    role: '',
    note: '',
    phone: '',
    email: '',
    helpsWith: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function SafetyNetPage() {
  const t = useT();
  const { settings } = useSettings();
  const [printingNetwork, setPrintingNetwork] = useState(false);

  useEffect(() => {
    const clear = () => setPrintingNetwork(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);
  const say = useCompanionSay();
  const { categories, persist: persistCategories, addCategory } = useNetworkCategories();
  const [entries, setEntries] = useState<NetworkEntry[]>(() => {
    syncAllFavoriteResourcesToNetwork(resourcesRepo.getAll());
    return networkRepo.getAll();
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<NetworkEntry>(emptyEntry());
  const [selected, setSelected] = useState<NetworkEntry | null>(null);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-link support: /sicherheit/netzwerk?open=<id> opens that entry's
  // detail modal directly — used by the safety plan's linked contacts.
  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId) return;
    const found = networkRepo.getById(openId);
    if (found) setSelected(found);
    searchParams.delete('open');
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [fullscreen, setFullscreen] = useState(false);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [centerNode, setCenterNode] = useState<CenterNodeConfig>(() => centerNodeStore.get() ?? DEFAULT_CENTER_NODE);
  const [centerEditorOpen, setCenterEditorOpen] = useState(false);

  function saveCenterNode(config: CenterNodeConfig) {
    centerNodeStore.set(config);
    setCenterNode(config);
  }

  const important = useMemo(
    () => entries.filter((e) => e.isImportantContact).slice(0, IMPORTANT_CONTACTS_VISIBLE),
    [entries],
  );
  const totalImportant = useMemo(() => entries.filter((e) => e.isImportantContact).length, [entries]);
  const personEntries = useMemo(() => entries.filter((e) => e.category === 'person'), [entries]);
  // Deliberately NOT its own stored data — always read live from
  // resourcesRepo, so marking/unmarking a favorite elsewhere in the app
  // is reflected here automatically, and unfavoriting a resource never
  // risks deleting the resource itself (there's nothing here to delete,
  // just a filtered view of data that already exists).
  // Favorited resources now auto-sync into real, editable network
  // entries (see networkResourceSync.ts) instead of a separate preview
  // list — this variable existed only for that removed list.

  function refresh() {
    setEntries(networkRepo.getAll());
  }

  function openNew() {
    setDraft(emptyEntry());
    setModalOpen(true);
  }

  function saveNew() {
    if (!draft.name.trim()) return;
    networkRepo.save({ ...draft, updatedAt: new Date().toISOString() });
    setModalOpen(false);
    refresh();
    say(pickLine({ page: '/sicherheit/netzwerk', trigger: 'speichern' }));
  }

  function handleMove(entry: NetworkEntry, position: { x: number; y: number }) {
    const updated = { ...entry, position, updatedAt: new Date().toISOString() };
    networkRepo.save(updated);
    refresh();
  }

  function startConnecting(fromId: string) {
    setSelected(null);
    setConnectingFromId(fromId);
  }

  function completeConnection(target: NetworkEntry) {
    if (!connectingFromId) return;
    const source = entries.find((e) => e.id === connectingFromId);
    if (!source) {
      setConnectingFromId(null);
      return;
    }
    const already = (source.linkedTo ?? []).includes(target.id);
    if (!already) {
      networkRepo.save({
        ...source,
        linkedTo: [...(source.linkedTo ?? []), target.id],
        updatedAt: new Date().toISOString(),
      });
      refresh();
      say(pickLine({ page: '/sicherheit/netzwerk', trigger: 'speichern' }));
    }
    setConnectingFromId(null);
  }

  function removeConnection(fromId: string, toId: string) {
    // The link might be stored on either side (A→B or B→A) depending on
    // which one started the connection — remove it from whichever side
    // actually has it, so this always works regardless of direction.
    const a = entries.find((e) => e.id === fromId);
    const b = entries.find((e) => e.id === toId);
    if (a?.linkedTo?.includes(toId)) {
      networkRepo.save({ ...a, linkedTo: a.linkedTo.filter((id) => id !== toId), updatedAt: new Date().toISOString() });
    } else if (b?.linkedTo?.includes(fromId)) {
      networkRepo.save({ ...b, linkedTo: b.linkedTo.filter((id) => id !== fromId), updatedAt: new Date().toISOString() });
    }
    refresh();
  }

  function handleSaveDetail(entry: NetworkEntry) {
    networkRepo.save({ ...entry, updatedAt: new Date().toISOString() });
    refresh();
    say(pickLine({ page: '/sicherheit/netzwerk', trigger: 'eintrag_bearbeiten' }));
  }

  function handleDelete(id: string): boolean {
    if (!window.confirm(t.network.confirmDelete)) return false;
    networkRepo.remove(id);
    refresh();
    say(pickLine({ page: '/sicherheit/netzwerk', trigger: 'loeschen' }));
    return true;
  }

  function handleSelectEntry(entry: NetworkEntry) {
    setSelected(entry);
    if (entry.category === 'person') {
      logActivity('contact', entry.name, entry.id);
      say(pickLine({ page: '/sicherheit/netzwerk', trigger: 'kontakt_auswahl' }));
    }
  }

  return (
    <div className="animate-in">
      <div className="no-print">
      <TopBar
        action={
          <div className="flex items-center gap-1">
            <HelpButton helpKey="sicherheitsnetz" />
            <button
              onClick={() => {
                setPrintingNetwork(true);
                setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
              }}
              aria-label={t.network.exportPdf}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
            >
              <FileDown size={17} />
            </button>
            <button
              onClick={() => setCategoryEditorOpen(true)}
              aria-label={t.network.manageCategories}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
            >
              <Palette size={18} />
            </button>
          </div>
        }
      />
      <div className="px-5 pb-6">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[24px]">{t.network.title}</h1>
      </div>
      <p className="text-[14px] text-[var(--color-text-muted)] mb-2">{t.network.subtitle}</p>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-5 leading-relaxed">{t.network.examplesHint}</p>

      <Button fullWidth icon={<Plus size={17} />} onClick={openNew} className="mb-4">
        {t.network.addNew}
      </Button>

      <RecentlyUsedRow type="contact" hrefFor={(id) => `/sicherheit/netzwerk?open=${id}`} />

      {connectingFromId && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] px-4 py-3 mb-4">
          <p className="text-[13px] text-[var(--color-text)]">{t.network.connectingHint}</p>
          <button onClick={() => setConnectingFromId(null)} className="text-[13px] text-[var(--color-primary)] flex-shrink-0">
            {t.common.cancel}
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyState title={t.network.empty} />
      ) : (
        <>
          <Card padding="none" className="mb-2 overflow-hidden relative">
            <NetworkGraph
              entries={entries}
              categories={categories}
              onSelect={handleSelectEntry}
              onMove={handleMove}
              centerNode={centerNode}
              onSelectCenter={() => setCenterEditorOpen(true)}
              connectingFromId={connectingFromId}
              onCompleteConnection={completeConnection}
              onCancelConnecting={() => setConnectingFromId(null)}
              onRemoveConnection={removeConnection}
            />
            <button
              onClick={() => setFullscreen(true)}
              aria-label={t.network.expand}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[var(--color-surface)]/90 backdrop-blur shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text-muted)]"
            >
              <Maximize2 size={16} />
            </button>
            <NetworkLegend categories={categories} />
          </Card>
          <p className="text-[12px] text-[var(--color-text-faint)] text-center mb-6">{t.network.dragHint}</p>

          {important.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] text-[var(--color-text-faint)]">{t.network.importantContacts}</p>
                {(totalImportant > IMPORTANT_CONTACTS_VISIBLE || personEntries.length > IMPORTANT_CONTACTS_VISIBLE) && (
                  <Link to="/sicherheit/kontakte" className="text-[13px] text-[var(--color-primary)]">
                    {t.network.showAllContacts}
                  </Link>
                )}
              </div>
              <div className="flex flex-col gap-3 mb-6">
                {important.map((entry) => (
                  <ImportantContactRow key={entry.id} entry={entry} categories={categories} onOpen={() => handleSelectEntry(entry)} />
                ))}
              </div>
            </>
          )}

          {entries.length > 0 && (
            <>
              <p className="text-[13px] text-[var(--color-text-faint)] mb-2">{t.network.allElementsTitle}</p>
              <div className="flex flex-col gap-2.5 mb-6">
                {entries
                  .filter((e) => !important.some((i) => i.id === e.id))
                  .map((entry) => (
                    <NetworkEntryListItem key={entry.id} entry={entry} categories={categories} onOpen={() => handleSelectEntry(entry)} />
                  ))}
              </div>
            </>
          )}
        </>
      )}
      </div>

      {fullscreen && (
        <NetworkGraphFullscreen
          entries={entries}
          categories={categories}
          centerNode={centerNode}
          onSelect={(e) => {
            setFullscreen(false);
            handleSelectEntry(e);
          }}
          onSelectCenter={() => {
            setFullscreen(false);
            setCenterEditorOpen(true);
          }}
          onMove={handleMove}
          onClose={() => setFullscreen(false)}
          connectingFromId={connectingFromId}
          onCompleteConnection={completeConnection}
          onCancelConnecting={() => setConnectingFromId(null)}
          onRemoveConnection={removeConnection}
        />
      )}

      <CenterNodeEditModal
        open={centerEditorOpen}
        config={centerNode}
        onClose={() => setCenterEditorOpen(false)}
        onSave={saveCenterNode}
      />

      <NetworkDetailModal
        entry={selected}
        entries={entries}
        categories={categories}
        onAddCategory={addCategory}
        onClose={() => setSelected(null)}
        onSave={handleSaveDetail}
        onDelete={handleDelete}
        onStartConnecting={startConnecting}
        onRemoveConnection={removeConnection}
      />

      </div>

      <NetworkCategoryEditor
        open={categoryEditorOpen}
        onClose={() => setCategoryEditorOpen(false)}
        categories={categories}
        onChangeCategories={persistCategories}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t.network.modalTitle} subtitle={t.network.modalSubtitle}>
        <NetworkEntryForm
          draft={draft}
          onChange={setDraft}
          categories={categories}
          onAddCategory={addCategory}
          allPersonEntries={personEntries}
          submitLabel={t.common.save}
          onSubmit={saveNew}
        />
      </Modal>

      {printingNetwork && (
        <NetworkPrintView
          entries={entries}
          categories={categories}
          centerNode={centerNode}
          labels={{
            title: t.network.exportTitle,
            subtitle: t.network.exportSubtitle,
            legendTitle: t.network.legendTitle,
            exportedOn: t.network.exportedOn,
          }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        />
      )}
    </div>
  );
}

/**
 * The comprehensive list under the visual network — every entry the
 * person has, not just important contacts or favorited resources.
 * Clicking opens the exact same NetworkDetailModal (via the shared
 * handleSelectEntry from the parent) that clicking a node in the graph
 * opens, so there is only ever one source of truth for "what does this
 * entry look like in detail" — the list is never a second, separately
 * maintained copy of that information.
 */
function NetworkEntryListItem({
  entry,
  categories,
  onOpen,
}: {
  entry: NetworkEntry;
  categories: ReturnType<typeof useNetworkCategories>['categories'];
  onOpen: () => void;
}) {
  const t = useT();
  const category = categories.find((c) => c.id === entry.category) ?? categories[0];
  const Icon = getIcon(entry.iconKey, category.iconKey);

  return (
    <button onClick={onOpen} className="text-left w-full">
      <Card interactive className="flex items-start gap-3">
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-surface)] flex-shrink-0 overflow-hidden mt-0.5"
          style={{ background: category.color }}
        >
          {entry.photoDataUrl ? (
            <img src={entry.photoDataUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon size={16} />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[14px] text-[var(--color-text)]">{entry.name}</p>
            <span className="text-[11px] text-[var(--color-text-faint)]">· {categoryLabel(t, category)}</span>
          </div>
          {entry.role && <p className="text-[12px] text-[var(--color-text-muted)]">{entry.role}</p>}
          {entry.description && <p className="text-[13px] text-[var(--color-text)] mt-1 line-clamp-2">{entry.description}</p>}
          {entry.note && <p className="text-[12px] text-[var(--color-text-muted)] italic mt-0.5 line-clamp-1">„{entry.note}“</p>}
          {(entry.phone || entry.email) && (
            <div className="flex items-center gap-2 mt-1.5">
              {entry.phone && <Phone size={12} className="text-[var(--color-text-faint)]" />}
              {entry.email && <Mail size={12} className="text-[var(--color-text-faint)]" />}
            </div>
          )}
        </div>
      </Card>
    </button>
  );
}

function ImportantContactRow({
  entry,
  categories,
  onOpen,
}: {
  entry: NetworkEntry;
  categories: ReturnType<typeof useNetworkCategories>['categories'];
  onOpen: () => void;
}) {
  const category = categories.find((c) => c.id === entry.category) ?? categories[0];
  const Icon = getIcon(entry.iconKey, category.iconKey);
  const t = useT();
  return (
    <Card className="flex items-center gap-3" padding="none" style={{ padding: 0 }}>
      <button type="button" onClick={onOpen} className="flex-1 flex items-center gap-3 text-left p-4 min-w-0">
      <span
        className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-surface)] flex-shrink-0 overflow-hidden"
        style={{ background: category.color }}
      >
        {entry.photoDataUrl ? (
          <img src={entry.photoDataUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon size={16} />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-[var(--color-text)] truncate">{entry.name}</p>
        {entry.role && <p className="text-[13px] text-[var(--color-text-muted)] truncate">{entry.role}</p>}
      </div>
      </button>
      {entry.phone && (
        <a href={`tel:${entry.phone}`} aria-label={t.network.call} className="p-2 mr-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Phone size={17} />
        </a>
      )}
      {entry.email && (
        <a href={`mailto:${entry.email}`} aria-label={t.network.emailAction} className="p-2 mr-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Mail size={17} />
        </a>
      )}
    </Card>
  );
}
