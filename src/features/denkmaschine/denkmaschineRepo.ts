import { createRepository, createId } from '../../services/storage/repository';
import { zugangRepo } from '../zugang/zugangRepo';

/**
 * Priority 9 — architecture and connection prepared now, a full
 * reframing/CBT-style toolkit deliberately NOT built yet (per the
 * brief). What exists:
 *   1. Obstacle-thoughts already selected during Zugang passes
 *      (ZugangEntry.obstacle[]) are aggregated here, not re-stored —
 *      the same principle as the Wertekompass.
 *   2. A person can also note a thought standing on its own, outside
 *      a full Zugang pass, in this small dedicated repo.
 *   3. Each note optionally carries a short, self-written reflection —
 *      one open field, not a structured multi-step reframing form.
 *      Future evidence-based techniques (ACT defusion phrasing, DBT
 *      opposite action, structured CBT reframing, etc.) can be added
 *      later as additional optional fields without breaking this.
 */
export interface GlaubenssatzNote {
  id: string;
  text: string;
  createdAt: string;
  /** A person's own short reflection on the thought — deliberately one
   * open field rather than a prescriptive multi-step worksheet. */
  reflection?: string;
  /** A believable, self-compassionate middle-ground reformulation —
   * deliberately NOT a "positive thinking" opposite (see Section 9 of
   * the "Verknüpfung, Inhalt & visuelle Ausbaustufe" brief: not
   * "I can do anything and everything is fine", but something more
   * like "I'm allowed to need support and still be self-determined"). */
  reframe?: string;
}

export const denkmaschineRepo = createRepository<GlaubenssatzNote>('glaubenssaetze');

export function addGlaubenssatzNote(text: string): GlaubenssatzNote {
  const note: GlaubenssatzNote = { id: createId('glaubenssatz'), text, createdAt: new Date().toISOString() };
  denkmaschineRepo.save(note);
  return note;
}

/** Every distinct obstacle-thought that has come up across saved Zugang
 * passes, most-frequent first — read directly from ZugangEntry.obstacle,
 * never copied into a second store. */
export function obstaclesFromZugangHistory(): { text: string; count: number }[] {
  const counts = new Map<string, number>();
  zugangRepo.getAll().forEach((entry) => {
    entry.obstacle?.forEach((o) => counts.set(o, (counts.get(o) ?? 0) + 1));
  });
  return Array.from(counts.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count);
}
