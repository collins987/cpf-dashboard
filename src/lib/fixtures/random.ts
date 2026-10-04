/**
 * A tiny seeded PRNG (mulberry32) so local fixture data is deterministic —
 * the same values on every run, which matters for a reproducible dev build.
 * Not for production data generation; that's data/seed.py (Python/pandas).
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function uuid(rand: () => number): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(rand() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function randomInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randomFloat(rand: () => number, min: number, max: number): number {
  return rand() * (max - min) + min;
}

export function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}
