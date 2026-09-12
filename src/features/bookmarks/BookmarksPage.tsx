import { useEffect, useMemo, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { Plus, Bookmark as BookmarkIcon, ExternalLink, Trash2, Pencil, Settings2, X, Check, Link2, FileDown } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { bookmarksRepo, bookmarkCategoriesStore, seedDefaultSources } from './bookmarksRepo';
import { BookmarksPrintView } from './BookmarksPrintView';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import type { Bookmark } from '../../data/types';

type FilterValue = 'all' | string;

function emptyBookmark(categoryId: string): Bookmark {
  const now = new Date().toISOString();
  return { id: createId('bm'), url: '', title: '', note: '', categoryId, createdAt: now, updatedAt: now };
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

seedDefaultSources();

export function BookmarksPage() {
  const t = useT();
  const { settings } = useSettings();
  const [printingPdf, setPrintingPdf] = useState(false);

  useEffect(() => {
    const clear = () => setPrintingPdf(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);
  const say = useCompanionSay();
  const [items, setItems] = useState<Bookmark[]>(() => bookmarksRepo.getAll());
  const [categories, setCategories] = useState(() => bookmarkCategoriesStore.getAll());
  const [filter, setFilter] = useState<FilterValue>('all');
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((b) => b.categoryId === filter)),
    [items, filter],
  );

  function categoryLabel(id: string): string {
    return categories.find((c) => c.id === id)?.label ?? t.bookmarks.uncategorized;
  }

  function refresh() {
    setItems(bookmarksRepo.getAll());
  }

  function refreshCategories() {
    setCategories(bookmarkCategoriesStore.getAll());
  }

  function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    bookmarkCategoriesStore.add(name);
    refreshCategories();
    setNewCategoryName('');
    setAddingCategory(false);
  }

  function startRename(id: string, current: string) {
    setRenamingId(id);
    setRenameValue(current);
  }

  function commitRename() {
    if (!renamingId || !renameValue.trim()) return;
    bookmarkCategoriesStore.rename(renamingId, renameValue.trim());
    refreshCategories();
    setRenamingId(null);
  }

  function removeCategory(id: string) {
    bookmarkCategoriesStore.remove(id);
    refreshCategories();
    if (filter === id) setFilter('all');
  }

  function openNew() {
    const targetCategory = filter !== 'all' ? filter : categories[0]?.id ?? '';
    setEditing(emptyBookmark(targetCategory));
  }

  function save() {
    if (!editing || !editing.title.trim() || !editing.url.trim()) return;
    bookmarksRepo.save({ ...editing, updatedAt: new Date().toISOString() });
    setEditing(null);
    refresh();
    say(pickLine({ page: '/entdecken/lesezeichen', trigger: 'speichern' }));
  }

  async function shareBookmarkLink(bm: Bookmark) {
    const payload = {
      title: bm.title,
      url: bm.url,
      note: bm.note,
      categoryLabel: categoryLabel(bm.categoryId),
    };
    const url = `${window.location.origin}/entdecken/lesezeichen/importieren?data=${encodeURIComponent(JSON.stringify(payload))}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: bm.title, url });
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

  function remove(id: string) {
    if (!window.confirm(t.bookmarks.confirmDelete)) return;
    bookmarksRepo.remove(id);
    refresh();
  }

  return (
    <div className="animate-in">
      <div className="no-print">
      <TopBar
        action={
          <div className="flex items-center gap-1">
            <HelpButton helpKey="lesezeichen" />
            <button
              onClick={() => {
                setPrintingPdf(true);
                setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
              }}
              aria-label={t.bookmarks.exportPdf}
              className="p-2 text-[var(--color-text-muted)]"
            >
              <FileDown size={17} />
            </button>
            <button
              onClick={() => setManagingCategories(true)}
              aria-label={t.bookmarks.manageCategories}
              className="p-2 text-[var(--color-text-muted)]"
            >
              <Settings2 size={17} />
            </button>
          </div>
        }
      />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.bookmarks.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{t.bookmarks.subtitle}</p>

        <Button fullWidth icon={<Plus size={17} />} onClick={openNew} className="mb-4">
          {t.bookmarks.addNew}
        </Button>

        <div className="chip-row no-scrollbar mb-5 -mx-5 px-5">
          <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
            {t.common.all}
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} selected={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title={t.bookmarks.empty} />
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            {filtered.map((bm) => (
              <Card key={bm.id} className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                  <BookmarkIcon size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] text-[var(--color-text)] truncate">{bm.title}</p>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] text-[var(--color-primary)] truncate"
                  >
                    {hostnameOf(bm.url)} <ExternalLink size={11} />
                  </a>
                  {bm.note && <p className="text-[13px] text-[var(--color-text-muted)] mt-1">{bm.note}</p>}
                  <p className="text-[11px] text-[var(--color-text-faint)] mt-1">
                    {categoryLabel(bm.categoryId)} · {new Date(bm.createdAt).toLocaleDateString()}{' '}
                    {new Date(bm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => shareBookmarkLink(bm)}
                    aria-label={t.resources.shareLink}
                    className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <Link2 size={14} />
                  </button>
                  <button
                    onClick={() => setEditing(bm)}
                    aria-label={t.common.edit}
                    className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(bm.id)}
                    aria-label={t.common.delete}
                    className="p-1.5 rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={t.bookmarks.addNew}>
        {editing && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bookmarks.urlLabel}</span>
              <input
                autoFocus
                type="url"
                className="input"
                placeholder="https://…"
                value={editing.url}
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bookmarks.titleLabel}</span>
              <input
                className="input"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.resources.categoryLabel}</span>
              <select
                className="input"
                value={editing.categoryId}
                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">
                {`${t.resources.noteLabel} ${t.common.optional}`}
              </span>
              <textarea
                className="input"
                rows={2}
                value={editing.note ?? ''}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              />
            </label>
            <Button type="submit" fullWidth>
              {t.common.save}
            </Button>
          </form>
        )}
      </Modal>

      <Modal open={managingCategories} onClose={() => setManagingCategories(false)} title={t.bookmarks.manageCategories}>
        <div className="flex flex-col gap-2 mb-4">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              {renamingId === c.id ? (
                <>
                  <input
                    autoFocus
                    className="input flex-1"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                  />
                  <button onClick={commitRename} className="p-2 text-[var(--color-primary)]" aria-label={t.common.save}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => setRenamingId(null)} className="p-2 text-[var(--color-text-faint)]" aria-label={t.common.cancel}>
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[14px] text-[var(--color-text)]">{c.label}</span>
                  <button
                    onClick={() => startRename(c.id, c.label)}
                    aria-label={t.common.edit}
                    className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => removeCategory(c.id)}
                    aria-label={t.common.delete}
                    className="p-1.5 rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        {!addingCategory ? (
          <button onClick={() => setAddingCategory(true)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]">
            <Plus size={14} /> {t.bookmarks.newCategory}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="input flex-1"
              placeholder={t.bookmarks.newCategoryPlaceholder}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
            />
            <button onClick={addCategory} className="p-2 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Plus size={15} />
            </button>
          </div>
        )}
      </Modal>

      {printingPdf && (
        <BookmarksPrintView
          bookmarks={filtered}
          categoryLabel={categoryLabel}
          labels={{
            title: t.bookmarks.title,
            linkLabel: t.bookmarks.linkLabel,
            noteLabel: t.bookmarks.noteLabel,
            savedOn: t.bookmarks.savedOn,
          }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        />
      )}
    </div>
  );
}
