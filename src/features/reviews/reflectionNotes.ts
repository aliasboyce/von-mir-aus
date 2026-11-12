import { createRepository, createId } from '../../services/storage/repository';

/**
 * Antworten auf „Fragen zum Nachdenken“ (Wesen → Ablenkung), die die Person
 * ausdrücklich im Rückblick speichern wollte. Nur dann – nichts wird mitgeschrieben.
 */
export interface ReflectionNote {
  id: string;
  createdAt: string;
  question: string;
  questionEn?: string;
  answer: string;
}

export const reflectionNotesRepo = createRepository<ReflectionNote>('reflection-notes');

export function saveReflectionNote(question: string, questionEn: string | undefined, answer: string): ReflectionNote {
  return reflectionNotesRepo.save({ id: createId('refl'), createdAt: new Date().toISOString(), question, questionEn, answer: answer.trim() });
}

export function reflectionNotesSince(days: number): ReflectionNote[] {
  const since = Date.now() - days * 86400000;
  return reflectionNotesRepo
    .getAll()
    .filter((n) => new Date(n.createdAt).getTime() >= since)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
