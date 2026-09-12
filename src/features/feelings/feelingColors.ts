const KEY = 'innerpath:feeling-colors';

function readAll(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getCustomColors(): Record<string, string> {
  return readAll();
}

export function setCustomColor(groupId: string, color: string) {
  const all = readAll();
  all[groupId] = color;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore quota/private-mode errors, matches storageAdapter pattern
  }
}

export function resetCustomColor(groupId: string) {
  const all = readAll();
  delete all[groupId];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function colorForGroup(groupId: string, defaultColor: string): string {
  const all = readAll();
  return all[groupId] ?? defaultColor;
}
