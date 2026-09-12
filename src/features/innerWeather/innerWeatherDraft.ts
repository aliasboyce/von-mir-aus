import { createKeyValueStore } from '../../services/storage/keyValueStore';
import type { NeedDirection, WeatherCondition } from '../../data/types';

export interface InnerWeatherDraft {
  step: 'select' | 'reflect' | 'zone' | 'tension' | 'need' | 'done';
  condition: WeatherCondition | null;
  need: NeedDirection | null;
  checkInId: string | null;
  tensionValue: number;
  updatedAt: string;
}

/**
 * "Gesamtpruefung"-Auftrag brief — real bug found and fixed: the
 * multi-step check-in ("Wie ist dein inneres Wetter?" → "Wo bist du
 * gerade?" → Spannung → Bedürfnis) had no persistence at all. Tapping
 * the existing "Mehr zu den drei Zuständen" link mid-flow (or any
 * other navigation away) silently reset the whole flow back to step
 * one on return — exactly the concrete scenario the brief describes.
 * Same "recent draft resumes silently, older one is just dropped
 * rather than resurrected unprompted" principle as zugangDraft.ts —
 * a check-in is short enough that an old abandoned one isn't worth
 * asking about, unlike Zugang's longer, more effortful passes.
 */
export const RECENT_DRAFT_THRESHOLD_MS = 15 * 60 * 1000;

const store = createKeyValueStore<InnerWeatherDraft | null>('inner-weather-draft', null);

export function saveInnerWeatherDraft(draft: Omit<InnerWeatherDraft, 'updatedAt'>): void {
  store.set({ ...draft, updatedAt: new Date().toISOString() });
}

export function loadRecentInnerWeatherDraft(): InnerWeatherDraft | null {
  const d = store.get();
  if (!d) return null;
  const ts = Date.parse(d.updatedAt);
  if (Number.isNaN(ts) || Date.now() - ts >= RECENT_DRAFT_THRESHOLD_MS) return null;
  return d;
}

export function clearInnerWeatherDraft(): void {
  store.set(null);
}
