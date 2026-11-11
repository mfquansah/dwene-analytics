/** Seeded pseudo-random numbers so simulations are reproducible. */

export interface Rng {
  /** Uniform in [0, 1). */
  uniform(): number
  /** Standard normal draw. */
  normal(): number
}

/** mulberry32: small, fast, good enough for simulation. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const uniform = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  let spare: number | null = null
  const normal = () => {
    if (spare !== null) {
      const s = spare
      spare = null
      return s
    }
    // Box-Muller; guard against log(0).
    const u1 = Math.max(uniform(), Number.MIN_VALUE)
    const u2 = uniform()
    const r = Math.sqrt(-2 * Math.log(u1))
    spare = r * Math.sin(2 * Math.PI * u2)
    return r * Math.cos(2 * Math.PI * u2)
  }
  return { uniform, normal }
}
