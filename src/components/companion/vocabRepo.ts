import { createRepository } from '../../services/storage/repository';
import type { VocabCollection, VocabCard } from '../../data/types';

export const vocabCollectionsRepo = createRepository<VocabCollection>('vocab-collections');
export const vocabCardsRepo = createRepository<VocabCard>('vocab-cards');

export function cardsForCollection(collectionId: string): VocabCard[] {
  return vocabCardsRepo.getAll().filter((c) => c.collectionId === collectionId);
}