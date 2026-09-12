import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, Archive } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { customDistractionCategoriesRepo, customDistractionItemsRepo, itemsForCategory } from './customDistractionRepo';
import { OWN_TEXT_SOURCE } from './companionContentManagement';
import type { CustomDistractionCategory, CustomDistractionItem } from '../../data/types';

interface CustomDistractionManageModalProps {
  open: boolean;
  onClose: () => void;
  /** When opened straight from "Eigene Kategorie erstellen" in the
   * category picker, jump directly into creating a new category rather
   * than showing the list first. */
  startCreating?: boolean;
}

export function CustomDistractionManageModal({ open, onClose, startCreating }: CustomDistractionManageModalProps) {
  const t = useT();
  const [, refresh] = useState(0);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(!!startCreating);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingItem, setEditingItem] = useState<{ id?: string; text: string; answer: string; source: string } | null>(null);
  const [showArchive, setShowArchive] = useState(false);

  const categories = customDistractionCategoriesRepo.getAll().filter((c) => !c.archived);
  const archivedCategories = customDistractionCategoriesRepo.getAll().filter((c) => c.archived);
  const openCategory = categories.find((c) => c.id === openCategoryId) ?? archivedCategories.find((c) => c.id === openCategoryId) ?? null;

  // Same "group once instead of re-filtering per row" fix as
  // DailyReview/DiaryPage — low-severity here since custom categories
  // are hand-created rather than automatically accumulating, but cheap
  // and consistent to do the same way.
  const itemCountByCategory = new Map<string, number>();
  customDistractionItemsRepo.getAll().forEach((i) => {
    itemCountByCategory.set(i.categoryId, (itemCountByCategory.get(i.categoryId) ?? 0) + 1);
  });

  function bump() {
    refresh((n) => n + 1);
  }

  function createCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const cat: CustomDistractionCategory = { id: createId('custom-cat'), name, createdAt: new Date().toISOString() };
    customDistractionCategoriesRepo.save(cat);
    setNewCategoryName('');
    setAddingCategory(false);
    setOpenCategoryId(cat.id);
    bump();
  }

  function renameCategory(cat: CustomDistractionCategory) {
    const name = window.prompt(t.customDistraction.renamePrompt, cat.name);
    if (!name || !name.trim()) return;
    customDistractionCategoriesRepo.save({ ...cat, name: name.trim() });
    bump();
  }

  function archiveCategory(cat: CustomDistractionCategory) {
    customDistractionCategoriesRepo.save({ ...cat, archived: true });
    if (openCategoryId === cat.id) setOpenCategoryId(null);
    bump();
  }

  function unarchiveCategory(cat: CustomDistractionCategory) {
    customDistractionCategoriesRepo.save({ ...cat, archived: false });
    bump();
  }

  function deleteCategory(cat: CustomDistractionCategory) {
    if (!window.confirm(t.customDistraction.confirmDeleteCategory)) return;
    itemsForCategory(cat.id).forEach((i) => customDistractionItemsRepo.remove(i.id));
    customDistractionCategoriesRepo.remove(cat.id);
    if (openCategoryId === cat.id) setOpenCategoryId(null);
    bump();
  }

  function saveItem() {
    if (!editingItem || !openCategoryId || !editingItem.text.trim() || !editingItem.source.trim()) return;
    const item: CustomDistractionItem = {
      id: editingItem.id ?? createId('custom-item'),
      categoryId: openCategoryId,
      text: editingItem.text.trim(),
      answer: editingItem.answer.trim() || undefined,
      source: editingItem.source.trim(),
    };
    customDistractionItemsRepo.save(item);
    setEditingItem(null);
    bump();
  }

  function deleteItem(id: string) {
    customDistractionItemsRepo.remove(id);
    bump();
  }

  return (
    <Modal open={open} onClose={onClose} title={openCategory ? openCategory.name : t.customDistraction.manageTitle}>
      {!openCategory ? (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-[var(--color-text-faint)]">{t.customDistraction.contentGuidance}</p>
          {addingCategory ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="input"
                placeholder={t.customDistraction.categoryNamePlaceholder}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCategory()}
              />
              <Button size="sm" onClick={createCategory}>
                {t.common.save}
              </Button>
            </div>
          ) : (
            <Button fullWidth icon={<Plus size={16} />} onClick={() => setAddingCategory(true)}>
              {t.customDistraction.addCategory}
            </Button>
          )}

          {categories.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-faint)]">{t.customDistraction.noCategories}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                  <button onClick={() => setOpenCategoryId(cat.id)} className="flex-1 text-left">
                    <p className="text-[14px] text-[var(--color-text)]">{cat.name}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">
                      {t.customDistraction.itemCount.replace('{n}', String(itemCountByCategory.get(cat.id) ?? 0))}
                    </p>
                  </button>
                  <button onClick={() => renameCategory(cat)} aria-label={t.common.edit} className="p-1.5 text-[var(--color-text-muted)]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => archiveCategory(cat)} aria-label={t.customDistraction.archiveCta} className="p-1.5 text-[var(--color-text-muted)]">
                    <Archive size={14} />
                  </button>
                  <button onClick={() => deleteCategory(cat)} aria-label={t.common.delete} className="p-1.5 text-[var(--color-danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {archivedCategories.length > 0 && (
            <button onClick={() => setShowArchive((v) => !v)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mt-2">
              <Archive size={14} />
              {showArchive ? t.customDistraction.hideArchive : t.customDistraction.showArchive.replace('{n}', String(archivedCategories.length))}
            </button>
          )}
          {showArchive && (
            <div className="flex flex-col gap-2 mt-2">
              {archivedCategories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 opacity-60">
                  <div className="flex-1">
                    <p className="text-[14px] text-[var(--color-text)]">{cat.name}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">
                      {t.customDistraction.itemCount.replace('{n}', String(itemCountByCategory.get(cat.id) ?? 0))}
                    </p>
                  </div>
                  <button onClick={() => unarchiveCategory(cat)} className="text-[12px] text-[var(--color-primary)] flex-shrink-0">
                    {t.customDistraction.restoreCta}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button onClick={() => setOpenCategoryId(null)} className="flex items-center gap-1 text-[13px] text-[var(--color-primary)] -mt-2 w-fit">
            <ChevronLeft size={14} /> {t.customDistraction.allCategories}
          </button>
          {openCategory.archived && (
            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]">
              <p className="text-[12px] text-[var(--color-text-faint)]">{t.customDistraction.categoryIsArchived}</p>
              <button onClick={() => unarchiveCategory(openCategory)} className="text-[12px] text-[var(--color-primary)] flex-shrink-0">
                {t.customDistraction.restoreCta}
              </button>
            </div>
          )}

          <Button fullWidth icon={<Plus size={16} />} onClick={() => setEditingItem({ text: '', answer: '', source: '' })}>
            {t.customDistraction.addItem}
          </Button>

          {itemsForCategory(openCategory.id).length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-faint)]">{t.customDistraction.noItems}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {itemsForCategory(openCategory.id).map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[var(--color-text)]">{item.text}</p>
                    {item.answer && <p className="text-[12px] text-[var(--color-text-muted)]">→ {item.answer}</p>}
                    <p className="text-[11px] text-[var(--color-text-faint)] italic">{item.source}</p>
                  </div>
                  <button
                    onClick={() => setEditingItem({ id: item.id, text: item.text, answer: item.answer ?? '', source: item.source })}
                    aria-label={t.common.edit}
                    className="p-1.5 text-[var(--color-text-muted)]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteItem(item.id)} aria-label={t.common.delete} className="p-1.5 text-[var(--color-danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingItem && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.customDistraction.textLabel}</span>
            <textarea
              autoFocus
              className="input"
              rows={2}
              value={editingItem.text}
              onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.customDistraction.answerLabel}</span>
            <input className="input" value={editingItem.answer} onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })} />
            <span className="text-[11px] text-[var(--color-text-faint)]">{t.customDistraction.answerHint}</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.customDistraction.sourceLabel}</span>
            <input
              className="input"
              placeholder={t.customDistraction.sourcePlaceholder}
              value={editingItem.source}
              onChange={(e) => setEditingItem({ ...editingItem, source: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setEditingItem({ ...editingItem, source: OWN_TEXT_SOURCE })}
              className="text-[12px] text-[var(--color-primary)] text-left"
            >
              {t.companionContent.markAsOwnText}
            </button>
          </label>
          <div className="flex gap-2">
            <Button fullWidth onClick={saveItem} disabled={!editingItem.text.trim() || !editingItem.source.trim()}>
              {t.common.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditingItem(null)}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
