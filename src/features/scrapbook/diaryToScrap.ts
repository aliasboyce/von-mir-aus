import type { DiaryEntry } from '../../data/types';
import { richToPlain } from '../../services/richText';
import { PAGE_TEMPLATES, photoNodeFor } from './scrapTemplates';
import { addPage, bookById, dayKey, lastBookStore, newBook, scrapBooksRepo } from './scrapModel';

const imgRatio = (src: string) =>
  new Promise<number>((res) => {
    const im = new Image();
    im.onload = () => res(im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 1.33);
    im.onerror = () => res(1.33);
    im.src = src;
  });

/**
 * Aus einem Tagebucheintrag eine Scrapbook-Seite machen: Datum, Text auf einem Zettel und das Foto des Eintrags.
 * Der Eintrag selbst bleibt unverändert – die Seite ist eine Kopie zum Gestalten.
 */
export async function scrapPageFromDiary(entry: DiaryEntry, lang: 'de' | 'en'): Promise<{ bookId: string; pageId: string }> {
  const books = scrapBooksRepo.getAll();
  const book = bookById(lastBookStore.get()) ?? books.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
    ?? newBook(lang === 'en' ? 'My scrapbook' : 'Mein Scrapbook', { style: 'leinen', color: '#7a8f7a', emoji: '📖' });
  const d = new Date(entry.createdAt);
  const tpl = PAGE_TEMPLATES.find((t) => t.id === 'tag')!;
  const plain = richToPlain(entry.content).trim();
  const text = plain.length > 520 ? `${plain.slice(0, 520).trimEnd()} …` : plain;
  const nodes = tpl.decor(lang, d).map((n) => (n.shape === 'note' && n.variant === 'index' && text ? { ...n, text } : n));
  if (entry.photo) nodes.push(photoNodeFor(tpl.slots[0], { dataUrl: entry.photo, ar: await imgRatio(entry.photo) }));
  const page = addPage(book, { day: dayKey(d), nodes });
  lastBookStore.set(book.id);
  return { bookId: book.id, pageId: page.id };
}
