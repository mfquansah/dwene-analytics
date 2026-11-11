/** Student-t distribution helpers (no dependencies). */

function logGamma(x: number): number {
  // Lanczos approximation (g=7, n=9).
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  x -= 1
  let a = c[0]
  const t = x + 7.5
  for (let i = 1; i < 9; i++) a += c[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

/** Continued fraction for the incomplete beta function (modified Lentz). */
function betaCf(x: number, a: number, b: number): number {
  const tiny = 1e-300
  let c = 1
  let d = 1 - ((a + b) * x) / (a + 1)
  if (Math.abs(d) < tiny) d = tiny
  d = 1 / d
  let h = d
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-14) break
  }
  return h
}

/** Regularized incomplete beta function I_x(a, b). */
export function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  )
  return x < (a + 1) / (a + b + 2)
    ? (front * betaCf(x, a, b)) / a
    : 1 - (front * betaCf(1 - x, b, a)) / b
}

/** CDF of Student's t with `df` degrees of freedom. */
export function tCdf(t: number, df: number): number {
  const x = df / (df + t * t)
  const tail = 0.5 * incompleteBeta(x, df / 2, 0.5)
  return t > 0 ? 1 - tail : tail
}

/** Two-sided p-value for a t statistic. */
export function tTwoSidedP(t: number, df: number): number {
  return Math.min(1, 2 * (1 - tCdf(Math.abs(t), df)))
}

/** Quantile (inverse CDF) of Student's t, by bisection. p must be in (0, 1). */
export function tQuantile(p: number, df: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError('p must be in (0, 1)')
  if (p === 0.5) return 0
  if (p < 0.5) return -tQuantile(1 - p, df)
  let lo = 0
  let hi = 1
  while (tCdf(hi, df) < p) hi *= 2
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2
    if (tCdf(mid, df) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
