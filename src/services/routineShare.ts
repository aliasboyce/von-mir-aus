import type { Routine, RoutineCard } from '../features/routines/routinesRepo';
import { createId } from './storage/repository';

/**
 * Routinen verschicken: Eine Routine reist – wie Skills, Brücken und Karten – komplett im Link (kein Server).
 * Eine Helferin kann zum Beispiel für jemanden eine Routine bauen und sie schicken; die andere Person übernimmt sie
 * in ihrer App genau so (Schritte, Symbole, Farben, Zeiten, Energie-Stufen). Persönliches reist nie mit:
 * eigene Fotos/Videos, Medikamenten-Verknüpfungen, Garten- und Netz-Verknüpfungen und Verlauf bleiben beim Absender.
 */
export interface SharedRoutinePayload {
  kind: 'routine';
  title: string;
  emoji?: string;
  color?: string;
  from?: string;
  noSymbol?: boolean;
  cardsNoSymbol?: boolean;
  cards: { text: string; emoji?: string; color?: string; timerSec?: number; minEnergy?: 1 | 2 | 3; noSymbol?: boolean; mediaUrl?: string }[];
}

const str = (v: unknown, max: number): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
const color = (v: unknown): string | undefined => (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : undefined);

export function buildRoutinePayload(r: Routine, from?: string): SharedRoutinePayload {
  return {
    kind: 'routine',
    title: r.title,
    emoji: r.emoji,
    color: r.color,
    from: from || undefined,
    noSymbol: r.noSymbol || undefined,
    cardsNoSymbol: r.cardsNoSymbol || undefined,
    cards: r.cards.map((c) => ({
      text: c.text,
      emoji: c.emoji,
      color: c.color,
      timerSec: c.timerSec,
      minEnergy: c.minEnergy,
      noSymbol: c.noSymbol || undefined,
      mediaUrl: c.media?.url,
    })),
  };
}

export function routineShareUrl(r: Routine, from?: string): string {
  return `${window.location.origin}/entdecken/routinen/importieren?data=${encodeURIComponent(JSON.stringify(buildRoutinePayload(r, from)))}`;
}

/** Checks everything that arrives from outside; returns null if it is not a usable routine. */
export function sanitizeRoutinePayload(raw: unknown): SharedRoutinePayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const title = str(p.title, 200);
  if (!title || !Array.isArray(p.cards)) return null;
  const cards = p.cards
    .slice(0, 60)
    .map((c) => {
      const o = (c ?? {}) as Record<string, unknown>;
      const text = str(o.text, 600);
      if (!text) return null;
      const t = typeof o.timerSec === 'number' && o.timerSec > 0 && o.timerSec <= 6 * 3600 ? Math.round(o.timerSec) : undefined;
      const me: 1 | 2 | 3 | undefined = o.minEnergy === 1 ? 1 : o.minEnergy === 2 ? 2 : o.minEnergy === 3 ? 3 : undefined;
      const url = str(o.mediaUrl, 2000);
      return { text, emoji: str(o.emoji, 8), color: color(o.color), timerSec: t, minEnergy: me, noSymbol: o.noSymbol === true ? true : undefined, mediaUrl: url && /^https?:\/\//i.test(url) ? url : undefined };
    })
    .filter((c): c is NonNullable<typeof c> => !!c);
  if (cards.length === 0) return null;
  return { kind: 'routine', title, emoji: str(p.emoji, 8), color: color(p.color), from: str(p.from, 80), noSymbol: p.noSymbol === true ? true : undefined, cardsNoSymbol: p.cardsNoSymbol === true ? true : undefined, cards };
}

export function routineFromPayload(p: SharedRoutinePayload): Routine {
  const now = new Date().toISOString();
  const rColor = p.color ?? '#BFE3D0';
  return {
    id: createId('routine'),
    title: p.title,
    emoji: p.emoji || '🔁',
    color: rColor,
    noSymbol: p.noSymbol,
    cardsNoSymbol: p.cardsNoSymbol,
    cards: p.cards.map<RoutineCard>((c) => ({
      id: createId('rc'),
      text: c.text,
      emoji: c.emoji || '🔹',
      color: c.color ?? rColor,
      timerSec: c.timerSec,
      minEnergy: c.minEnergy,
      noSymbol: c.noSymbol,
      media: c.mediaUrl ? { url: c.mediaUrl } : undefined,
    })),
    createdAt: now,
    updatedAt: now,
  };
}
