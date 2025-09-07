// Pure functional RNG (mulberry32) — no Math.random

export type RNG = { s: number }; // 32-bit state

export function seedFromString(str: string): number {
  // Simple 32-bit hash (FNV-1a style) — deterministic for a given string
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // Avoid zero
  return (h || 0x9e3779b9) >>> 0;
}

export function makeRng(seed: number | string): RNG {
  const s = typeof seed === 'string' ? seedFromString(seed) : (seed >>> 0);
  return { s };
}

// mulberry32 step → returns a float in [0,1)
export function next(rng: RNG): { rng: RNG; value: number } {
  let t = (rng.s + 0x6D2B79F5) >>> 0;
  let x = t;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  const v = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return { rng: { s: t >>> 0 }, value: v };
}

export function int(rng: RNG, min: number, max: number): { rng: RNG; value: number } {
  if (max < min) max = min;
  const span = (max - min + 1) >>> 0;
  const n = next(rng);
  return { rng: n.rng, value: min + Math.floor(n.value * span) };
}

export function shuffle<T>(rng: RNG, arr: T[]): { rng: RNG; array: T[] } {
  let r = rng;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const jOut = int(r, 0, i);
    r = jOut.rng;
    const j = jOut.value;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return { rng: r, array: a };
}
