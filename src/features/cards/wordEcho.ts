import { zugangRepo } from '../zugang/zugangRepo';
import { safetyPlansRepo } from '../safetyPlan/safetyPlansRepo';

/**
 * „Das kennst du schon“: Zu jedem Wort zeigt die Wort-Karte, wo es in DEINEN Daten schon vorkommt – wie oft du es im Zugang
 * gewählt hast und ob es in deinem Sicherheitsplan steht. Nur Anzeige aus vorhandenen Daten; nichts wird extra gespeichert.
 */
export interface Echo { n: number; last?: string }
export interface EchoIndex {
  body: Map<string, Echo>;
  feelings: Map<string, Echo>;
  need: Map<string, Echo>;
  planText: string;
}

function bump(m: Map<string, Echo>, word: string, at: string) {
  const e = m.get(word) ?? { n: 0 };
  e.n += 1;
  if (!e.last || at > e.last) e.last = at;
  m.set(word, e);
}

export function buildEchoIndex(): EchoIndex {
  const idx: EchoIndex = { body: new Map(), feelings: new Map(), need: new Map(), planText: '' };
  try {
    for (const z of zugangRepo.getAll()) {
      (z.body ?? []).forEach((w) => bump(idx.body, w, z.createdAt));
      (z.feelings ?? []).forEach((w) => bump(idx.feelings, w, z.createdAt));
      (z.need ?? []).forEach((w) => bump(idx.need, w, z.createdAt));
    }
    idx.planText = safetyPlansRepo
      .getAll()
      .flatMap((p) => [...p.warningSignals, ...p.helpItems].filter((x) => !x.example).map((x) => x.text).concat(p.sections.flatMap((s) => s.items)))
      .join(' \n ')
      .toLowerCase();
  } catch {
    /* ohne Daten einfach keine Hinweise */
  }
  return idx;
}

export function echoLines(idx: EchoIndex, kind: 'koerper' | 'gefuehl' | 'beduerfnis' | 'wert' | 'zugang', word: string, lang: 'de' | 'en'): string | undefined {
  const map = kind === 'koerper' ? idx.body : kind === 'gefuehl' ? idx.feelings : kind === 'beduerfnis' ? idx.need : undefined;
  const parts: string[] = [];
  const e = map?.get(word);
  if (e) {
    const d = e.last ? new Date(e.last).toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'numeric' }) : '';
    parts.push(lang === 'en' ? `You picked this ${e.n}× in Access${d ? ` (last on ${d})` : ''}.` : `Im Zugang hast du das ${e.n}× gewählt${d ? ` (zuletzt am ${d})` : ''}.`);
  }
  const w = word.toLowerCase();
  if (w.length >= 4 && idx.planText.includes(w)) parts.push(lang === 'en' ? 'It appears in your safety plan.' : 'Es steht in deinem Sicherheitsplan.');
  return parts.length ? parts.join(' ') : undefined;
}
