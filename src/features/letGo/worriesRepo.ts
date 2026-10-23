import { createRepository, createId } from '../../services/storage/repository';

export interface Worry {
  id: string;
  text: string;
  createdAt: string;
}

// Storage key deliberately left as-is from the feature's original name
// (Sorgenfresser) even though the feature itself has been renamed — an
// already-saved entry should not silently vanish just because the
// feature got a better name.
export const worriesRepo = createRepository<Worry>('sorgenfresser-worries');

export function addWorry(text: string): Worry {
  const worry: Worry = { id: createId('worry'), text, createdAt: new Date().toISOString() };
  worriesRepo.save(worry);
  return worry;
}
