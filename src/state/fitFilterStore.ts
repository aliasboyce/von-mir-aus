import { useSyncExternalStore } from 'react';
import { EMPTY_FIT_FILTER, type FitFilter } from '../content/fitCriteria';

/**
 * The "Was geht gerade?" filter is ONE shared state: what is set on the
 * Ressourcen start page is the same in the Skills list, the Hilfsmittel list
 * and the Zugang page. It is deliberately kept for the browser session only
 * (sessionStorage) — a filter from yesterday's hard moment must never hide
 * things today without being visible; every place that uses it also shows
 * that it is active and how to reset it.
 */
const KEY = 'innerpath:fit-filter-session';

function load(): FitFilter {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...EMPTY_FIT_FILTER, ...(JSON.parse(raw) as Partial<FitFilter>) };
  } catch {
    // no storage (private window, blocked) — start empty
  }
  return EMPTY_FIT_FILTER;
}

let state: FitFilter = load();
const listeners = new Set<() => void>();

function emit() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // keeping it in memory only is fine
  }
  listeners.forEach((l) => l());
}

export function getFitFilter(): FitFilter {
  return state;
}

export function setFitFilter(patch: Partial<FitFilter>) {
  state = { ...state, ...patch };
  emit();
}

export function resetFitFilter() {
  state = EMPTY_FIT_FILTER;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useFitFilter() {
  const filter = useSyncExternalStore(subscribe, getFitFilter, getFitFilter);
  return { filter, setFilter: setFitFilter, reset: resetFitFilter };
}
