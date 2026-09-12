import { createRepository, createId } from '../../services/storage/repository';

export interface LetterToSelf {
  id: string;
  text: string;
  createdAt: string;
  /** ISO datetime — when this letter becomes available to open. */
  scheduledFor: string;
  opened: boolean;
  openedAt?: string;
}

export const lettersRepo = createRepository<LetterToSelf>('letters-to-self');

export function addLetter(text: string, scheduledFor: string): LetterToSelf {
  const letter: LetterToSelf = { id: createId('letter'), text, createdAt: new Date().toISOString(), scheduledFor, opened: false };
  lettersRepo.save(letter);
  return letter;
}

export function markLetterOpened(id: string): void {
  const letter = lettersRepo.getAll().find((l) => l.id === id);
  if (letter) lettersRepo.save({ ...letter, opened: true, openedAt: new Date().toISOString() });
}

/** Letters whose scheduled time has arrived but haven't been opened yet
 * — what the companion surfaces on the home screen. Usually zero or
 * one, but returns all of them in case several came due at once. */
export function dueUnopenedLetters(): LetterToSelf[] {
  const now = Date.now();
  return lettersRepo.getAll().filter((l) => !l.opened && new Date(l.scheduledFor).getTime() <= now);
}

/** Letters still waiting for their moment — shown in the "Meine Briefe"
 * overview so a person can see what they've already written. */
export function pendingLetters(): LetterToSelf[] {
  const now = Date.now();
  return lettersRepo
    .getAll()
    .filter((l) => !l.opened && new Date(l.scheduledFor).getTime() > now)
    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
}

export function openedLetters(): LetterToSelf[] {
  return lettersRepo
    .getAll()
    .filter((l) => l.opened)
    .sort((a, b) => new Date(b.openedAt ?? b.createdAt).getTime() - new Date(a.openedAt ?? a.createdAt).getTime());
}
