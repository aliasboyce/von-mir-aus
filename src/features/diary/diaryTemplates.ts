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
