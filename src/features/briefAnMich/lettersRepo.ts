import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { createRepository, createId } from '../../services/storage/repository';

export interface LetterToSelf {
  /** Same choice as DiaryEntry.inReview — the letter shows up in the review of the day it was written. */
  inReview?: boolean;
  id: string;
  text: string;
  createdAt: string;
  /** ISO datetime — when this letter becomes available to open. */
  scheduledFor: string;
  opened: boolean;
  openedAt?: string;
  /** Set for letters that came from another person (imported via link or file). */
  fromName?: string;
  /** id of the shared letter — protects against importing the same one twice. */
  externalId?: string;
}

export const lettersRepo = createRepository<LetterToSelf>('letters-to-self');

/** Token of a letter link that was opened but not yet put into the app (e.g. a new person opened the link
 * before finishing the first-launch screens) — so the letter is not lost on the way. */
export const pendingLetterStore = createKeyValueStore<string | null>('pending-letter-token', null);

export function addLetter(text: string, scheduledFor: string, inReview = false): LetterToSelf {
  const letter: LetterToSelf = { id: createId('letter'), text, createdAt: new Date().toISOString(), scheduledFor, opened: false, inReview };
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
