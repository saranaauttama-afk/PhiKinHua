// Pure functional RNG (mulberry32) — no Math.random
// All ops are deterministic and state-threaded: functions return { rng, ... }

export type RNG = { s: number }; // 32-bit state

export function seedFromString(str: string): number {
  // Simple 32-bit hash (xorshift-like) — deterministic for a given string
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // Avoid zero
  return (h || 0x9e3779b9) >>> 0;
}

export function makeRng(seed: number): RNG {
  return { s: seed >>> 0 };
}

/** mulberry32 step: returns next float in [0,1) and advanced RNG */
export function next(rng: RNG): { rng: RNG; value: number } {
  let a = (rng.s + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const v = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { rng: { s: a }, value: v };
}

export function int(rng: RNG, min: number, max: number): { rng: RNG; value: number } {
  const { rng: r2, value } = next(rng);
  const span = max - min + 1;
  return { rng: r2, value: min + Math.floor(value * span) };
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
