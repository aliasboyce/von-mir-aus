/**
 * Deterministic 0..1 "random" value derived from a string id. Used so that
 * each network node gets a stable animation phase / auto-layout jitter that
 * doesn't reshuffle on every re-render, without needing to persist it.
 */
export function seededRandom(id: string, salt = ''): number {
  const str = id + salt;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}
