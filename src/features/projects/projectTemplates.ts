import { newBlock, type ProjectBlock, type TextBlock } from './projectModel';

export type TemplateId = 'empty' | 'solo' | 'together' | 'full';

const txt = (title: string, hint: string): ProjectBlock => newBlock('text', title, { hint } as Partial<TextBlock>);

/** Startbausteine – alles davon lässt sich ändern, löschen oder ergänzen */
export function templateBlocks(id: TemplateId, lang: 'de' | 'en'): ProjectBlock[] {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const goals = txt(L('Ziele', 'Goals'), L('Was soll am Ende stehen? Woran merkst du, dass es gelungen ist?', 'What should be there in the end? How will you notice that it worked?'));
  const notThis = txt(L('Was gehört NICHT dazu', 'What is NOT part of it'), L('Das verhindert Missverständnisse.', 'This prevents misunderstandings.'));
  const rules = txt(L('Regeln für die Zusammenarbeit', 'Rules for working together'), L('z. B. „Wir antworten innerhalb von 24 Stunden“, „Änderungen werden vorher abgesprochen“.', 'e.g. "We answer within 24 hours", "Changes are agreed beforehand".'));
  const comm = txt(L('Kommunikation & Treffen', 'Communication & meetings'), L('Wie sprechen wir uns ab (WhatsApp, Discord, Treffen)? Wie oft? 3–5 Stichpunkte reichen.', 'How do we keep in touch (WhatsApp, Discord, meetings)? How often? 3–5 key points are enough.'));
  const notes = txt(L('Notizen', 'Notes'), L('Alles, was du festhalten möchtest.', 'Anything you want to keep.'));
  const tasks = newBlock('tasks', L('Aufgaben', 'Tasks'));
  const time = newBlock('timeline', L('Zeitplan', 'Timeline'));
  const team = newBlock('team', L('Team & Rollen', 'Team & roles'));
  const budget = newBlock('budget', L('Finanzplan', 'Budget'));
  const material = newBlock('checklist', L('Materialliste', 'Material list'));
  const risks = newBlock('risks', L('Risiken & Plan B', 'Risks & plan B'));
  const decisions = newBlock('decisions', L('Entscheidungen & Absprachen', 'Decisions & agreements'));
  const questions = newBlock('checklist', L('Offene Fragen', 'Open questions'));
  const images = newBlock('images', L('Anhänge (Bilder, Skizzen)', 'Attachments (pictures, sketches)'));
  const links = newBlock('links', L('Verknüpfungen', 'Connections'));
  switch (id) {
    case 'empty':
      return [goals];
    case 'solo':
      return [goals, tasks, time, notes];
    case 'together':
      return [goals, notThis, team, tasks, time, budget, decisions, risks, comm, questions];
    case 'full':
      return [
        txt(L('Projektidee & Ziele', 'Project idea & goals'), L('Was wollen wir machen? Warum? Was soll am Ende stehen?', 'What do we want to do? Why? What should be there in the end?')),
        notThis, team, tasks, time, budget, material, risks, decisions, rules, comm, questions, notes, images, links,
      ];
  }
}
