import { createKeyValueStore } from '../../services/storage/keyValueStore';
import type { WarningTier } from '../../data/types';

export interface TierColorSet {
  color: string;
  soft: string;
}

const DEFAULT_TIER_COLORS: Record<WarningTier, TierColorSet> = {
  gelb: { color: '#D9A441', soft: '#FBF0D9' },
  orange: { color: '#D9791F', soft: '#FBE4CE' },
  rot: { color: '#C13F35', soft: '#F8DAD7' },
};

const store = createKeyValueStore<Record<WarningTier, TierColorSet>>('safety-plan-tier-colors', DEFAULT_TIER_COLORS);

/** Derives a readable soft background tint from any hex color the person
 * picks, so custom tier colors keep good text contrast automatically. */
function deriveSoft(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#F1ECE0';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lighten = (c: number) => Math.round(c + (255 - c) * 0.82);
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(lighten(r))}${toHex(lighten(g))}${toHex(lighten(b))}`;
}

export const tierColorsStore = {
  getAll(): Record<WarningTier, TierColorSet> {
    return store.get();
  },
  setColor(tier: WarningTier, color: string): void {
    const all = store.get();
    store.set({ ...all, [tier]: { color, soft: deriveSoft(color) } });
  },
  reset(): void {
    store.set(DEFAULT_TIER_COLORS);
  },
};

export { DEFAULT_TIER_COLORS };
