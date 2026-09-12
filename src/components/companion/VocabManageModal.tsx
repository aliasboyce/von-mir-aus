import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { vocabCollectionsRepo, vocabCardsRepo, cardsForCollection } from './vocabRepo';
import type { VocabCollection, VocabCard } from '../../data/types';

interface VocabManageModalProps {
  open: boolean;
  onClose: () => void;
}

export function VocabManageModal({ open, onClose }: VocabManageModalProps) {
  const t = useT();
  const [, refresh] = useState(0);
  const [openCollectionId, setOpenCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [addingCollection, setAddingCollection] = useState(false);
  const [editingCard, setEditingCard] = useState<{ id?: string; front: string; back: string } | null>(null);

  const collections = vocabCollectionsRepo.getAll();
  const openCollection = collections.find((c) => c.id === openCollectionId) ?? null;

  function bump() {
    refresh((n) => n + 1);
  }

  function createCollection() {
    const name = newCollectionName.trim();
    if (!name) return;
    const col: VocabCollection = { id: createId('vocab-col'), name, createdAt: new Date().toISOString() };
    vocabCollectionsRepo.save(col);
    setNewCollectionName('');
    setAddingCollection(false);
    setOpenCollectionId(col.id);
    bump();
  }

  function renameCollection(col: VocabCollection) {
    const name = window.prompt(t.vocab.renamePrompt, col.name);
    if (!name || !name.trim()) return;
    vocabCollectionsRepo.save({ ...col, name: name.trim() });
    bump();
  }

  function deleteCollection(col: VocabCollection) {
    if (!window.confirm(t.vocab.confirmDeleteCollection)) return;
    cardsForCollection(col.id).forEach((c) => vocabCardsRepo.remove(c.id));
    vocabCollectionsRepo.remove(col.id);
    if (openCollectionId === col.id) setOpenCollectionId(null);
    bump();
  }

  function saveCard() {
    if (!editingCard || !openCollectionId || !editingCard.front.trim() || !editingCard.back.trim()) return;
    const card: VocabCard = {
      id: editingCard.id ?? createId('vocab-card'),
      collectionId: openCollectionId,
      front: editingCard.front.trim(),
      back: editingCard.back.trim(),
    };
    vocabCardsRepo.save(card);
    setEditingCard(null);
    bump();
  }

  function deleteCard(id: string) {
    vocabCardsRepo.remove(id);
    bump();
  }

  return (
    <Modal open={open} onClose={onClose} title={openCollection ? openCollection.name : t.vocab.manageTitle}>
      {!openCollection ? (
        <div className="flex flex-col gap-4">
          {addingCollection ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="input"
                placeholder={t.vocab.collectionNamePlaceholder}
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCollection()}
              />
              <Button size="sm" onClick={createCollection}>
                {t.common.save}
              </Button>
            </div>
          ) : (
            <Button fullWidth icon={<Plus size={16} />} onClick={() => setAddingCollection(true)}>
              {t.vocab.addCollection}
            </Button>
          )}

          {collections.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-faint)]">{t.vocab.noCollections}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {collections.map((col) => (
                <div key={col.id} className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                  <button onClick={() => setOpenCollectionId(col.id)} className="flex-1 text-left">
                    <p className="text-[14px] text-[var(--color-text)]">{col.name}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">
                      {t.vocab.cardCount.replace('{n}', String(cardsForCollection(col.id).length))}
                    </p>
                  </button>
                  <button onClick={() => renameCollection(col)} aria-label={t.common.edit} className="p-1.5 text-[var(--color-text-muted)]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteCollection(col)} aria-label={t.common.delete} className="p-1.5 text-[var(--color-danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button onClick={() => setOpenCollectionId(null)} className="flex items-center gap-1 text-[13px] text-[var(--color-primary)] -mt-2 w-fit">
            <ChevronLeft size={14} /> {t.vocab.allCollections}
          </button>

          <Button fullWidth icon={<Plus size={16} />} onClick={() => setEditingCard({ front: '', back: '' })}>
            {t.vocab.addCard}
          </Button>

          {cardsForCollection(openCollection.id).length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-faint)]">{t.vocab.noCards}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {cardsForCollection(openCollection.id).map((card) => (
                <div key={card.id} className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[var(--color-text)]">{card.front}</p>
                    <p className="text-[12px] text-[var(--color-text-muted)]">{card.back}</p>
                  </div>
                  <button onClick={() => setEditingCard(card)} aria-label={t.common.edit} className="p-1.5 text-[var(--color-text-muted)]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteCard(card.id)} aria-label={t.common.delete} className="p-1.5 text-[var(--color-danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingCard && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.vocab.frontLabel}</span>
            <input autoFocus className="input" value={editingCard.front} onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.vocab.backLabel}</span>
            <input className="input" value={editingCard.back} onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && saveCard()} />
          </label>
          <div className="flex gap-2">
            <Button fullWidth onClick={saveCard} disabled={!editingCard.front.trim() || !editingCard.back.trim()}>
              {t.common.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditingCard(null)}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
