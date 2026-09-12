import { createKeyValueStore } from '../../services/storage/keyValueStore';

export type ZugangSuggestionStep = 'body' | 'protection' | 'need' | 'obstacle' | 'connection' | 'feeling' | 'action' | 'care';

const store = createKeyValueStore<Record<ZugangSuggestionStep, string[]>>('zugang-custom-suggestions', {
  body: [],
  protection: [],
  need: [],
  obstacle: [],
  connection: [],
  feeling: [],
  action: [],
  care: [],
});

export function getCustomSuggestions(step: ZugangSuggestionStep): string[] {
  return (store.get() ?? {})[step] ?? [];
}

export function addCustomSuggestion(step: ZugangSuggestionStep, text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  const current = store.get() ?? { body: [], protection: [], need: [], obstacle: [], connection: [], feeling: [], action: [], care: [] };
  if (current[step].some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
  store.set({ ...current, [step]: [...current[step], trimmed] });
}

export function editCustomSuggestion(step: ZugangSuggestionStep, oldText: string, newText: string): void {
  const trimmed = newText.trim();
  if (!trimmed) return;
  const current = store.get() ?? { body: [], protection: [], need: [], obstacle: [], connection: [], feeling: [], action: [], care: [] };
  store.set({ ...current, [step]: current[step].map((s) => (s === oldText ? trimmed : s)) });
}

export function removeCustomSuggestion(step: ZugangSuggestionStep, text: string): void {
  const current = store.get() ?? { body: [], protection: [], need: [], obstacle: [], connection: [], feeling: [], action: [], care: [] };
  store.set({ ...current, [step]: current[step].filter((s) => s !== text) });
}
