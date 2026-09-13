import { createRepository, createId } from '../../services/storage/repository';

export interface DiaryTemplate {
  id: string;
  name: string;
  nameEn?: string;
  /** Each question becomes its own line (with room to answer
   * underneath) when the template is applied to a new entry. */
  questions: string[];
  questionsEn?: string[];
  isBuiltin?: boolean;
}

/**
 * Deliberately just one built-in template for now — per the brief,
 * more will be added later. The architecture (this array + the
 * repository below) needs no change to grow: new built-ins are just
 * new entries here, right alongside user-created ones in the same
 * picker.
 */
export const BUILTIN_DIARY_TEMPLATES: DiaryTemplate[] = [
  {
    id: 'builtin-abendlicher-rueckblick',
    name: 'Abendlicher Rückblick',
    nameEn: 'Evening review',
    questions: ['Was war heute gut?', 'Was war schwierig?', 'Was hat mir geholfen?', 'Was brauche ich morgen?'],
    questionsEn: ['What was good today?', 'What was difficult?', 'What helped me?', 'What do I need tomorrow?'],
    isBuiltin: true,
  },
  {
    // Vier-Schritte der Gewaltfreien Kommunikation (Beobachtung,
    // Gefuehl, Beduerfnis, Bitte) — dieselbe Struktur, die bereits
    // beim Gefuehlsrad und der Beduerfnis-Zuordnung in der App steckt.
    id: 'builtin-gfk-reflexion',
    name: 'GFK-Reflexion',
    nameEn: 'NVC reflection',
    questions: [
      'Was ist konkret passiert? (nur die Beobachtung, ohne Bewertung)',
      'Was habe ich dabei gefühlt?',
      'Welches Bedürfnis steckte vermutlich dahinter?',
      'Was würde mir jetzt helfen, oder worum möchte ich bitten?',
    ],
    questionsEn: [
      'What actually happened? (just the observation, no judgment)',
      'What did I feel?',
      'What need was probably underneath that?',
      'What would help me now, or what would I like to ask for?',
    ],
    isBuiltin: true,
  },
  {
    // An die bestehende Nervensystem-/Polyvagal-Seite angelehnt
    // (ventral/sympathisch/dorsal) — hilft, den Zusammenhang
    // zwischen Zustand und Alltag nachzuverfolgen.
    id: 'builtin-nervensystem-check',
    name: 'Nervensystem-Check',
    nameEn: 'Nervous system check',
    questions: [
      'In welchem Zustand war mein Nervensystem heute überwiegend? (sicher, mobilisiert, erstarrt)',
      'Was hat diesen Zustand ausgelöst oder begünstigt?',
      'Was hat geholfen, wieder zur Ruhe zu kommen — oder was könnte helfen?',
      'Was hat mein Nervensystem heute gebraucht?',
    ],
    questionsEn: [
      'What state was my nervous system mostly in today? (safe, mobilized, frozen)',
      'What triggered or contributed to that state?',
      'What helped me settle back down — or what might help?',
      "What did my nervous system need today?",
    ],
    isBuiltin: true,
  },
  {
    // Bewusst sanft und selbstmitfuehlend gehalten, fuer schwerere
    // Tage — passend zum Grundton der App: keine Leistungsfrage,
    // kleine Schritte zaehlen.
    id: 'builtin-kleine-schritte',
    name: 'Kleine Schritte',
    nameEn: 'Small steps',
    questions: [
      'Was habe ich heute geschafft, auch wenn es klein war?',
      'Wie bin ich heute mit mir selbst umgegangen?',
      'Was hätte ich gebraucht, das ich mir nicht geben konnte?',
      'Ein Satz an mich für morgen:',
    ],
    questionsEn: [
      'What did I manage today, even if it was small?',
      'How did I treat myself today?',
      "What did I need that I couldn't give myself?",
      'One sentence for myself for tomorrow:',
    ],
    isBuiltin: true,
  },
];

export const customDiaryTemplatesRepo = createRepository<DiaryTemplate>('diary-templates');

export function allDiaryTemplates(): DiaryTemplate[] {
  return [...BUILTIN_DIARY_TEMPLATES, ...customDiaryTemplatesRepo.getAll()];
}

export function addCustomDiaryTemplate(name: string, questions: string[]): DiaryTemplate {
  const template: DiaryTemplate = { id: createId('diary-template'), name, questions: questions.filter((q) => q.trim()) };
  customDiaryTemplatesRepo.save(template);
  return template;
}

export function updateCustomDiaryTemplate(id: string, name: string, questions: string[]): void {
  customDiaryTemplatesRepo.save({ id, name, questions: questions.filter((q) => q.trim()) });
}

export function removeCustomDiaryTemplate(id: string): void {
  customDiaryTemplatesRepo.remove(id);
}

/** Turns a template's questions into the starting text for a new entry
 * — each question on its own line with a blank line underneath to
 * answer into, rather than inventing a separate structured-fields data
 * model. Diary entries stay simple plain text throughout the app. */
export function applyTemplate(template: DiaryTemplate, isEn: boolean): string {
  const questions = isEn && template.questionsEn ? template.questionsEn : template.questions;
  return questions.map((q) => `${q}\n\n`).join('');
}
