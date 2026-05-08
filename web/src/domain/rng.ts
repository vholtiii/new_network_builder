/** Mulberry32 PRNG — deterministic per seed */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomNormal(rng: () => number): number {
  const u = rng()
  const v = rng()
  return Math.sqrt(-2 * Math.log(u + 1e-12)) * Math.cos(2 * Math.PI * v)
}
