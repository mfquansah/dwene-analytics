import { tQuantile, tTwoSidedP } from './distributions'

export interface Coefficient {
  estimate: number
  se: number
  t: number
  p: number
  ci95: [number, number]
}

export interface OlsResult {
  coefficients: Coefficient[]
  /** Degrees of freedom used for inference: clusters - 1. */
  df: number
  nObs: number
  nClusters: number
}

/** Invert a small square matrix by Gauss-Jordan elimination with partial pivoting. */
export function invert(m: number[][]): number[][] {
  const n = m.length
  const a = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r
    if (Math.abs(a[pivot][col]) < 1e-12) throw new Error('Matrix is singular: design has collinear columns')
    ;[a[col], a[pivot]] = [a[pivot], a[col]]
    const div = a[col][col]
    for (let j = 0; j < 2 * n; j++) a[col][j] /= div
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = a[r][col]
      if (f !== 0) for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[col][j]
    }
  }
  return a.map((row) => row.slice(n))
}

/**
 * OLS with cluster-robust (CR1) standard errors, matching Stata's `vce(cluster)` and
 * statsmodels' `cov_type='cluster'` with its default small-sample correction
 * G/(G-1) * (N-1)/(N-k). Inference uses a t distribution with G-1 degrees of freedom.
 */
export function olsClustered(x: number[][], y: number[], clusters: number[]): OlsResult {
  const nObs = y.length
  const k = x[0].length
  const xtx = Array.from({ length: k }, () => new Array<number>(k).fill(0))
  const xty = new Array<number>(k).fill(0)
  for (let i = 0; i < nObs; i++) {
    for (let a = 0; a < k; a++) {
      xty[a] += x[i][a] * y[i]
      for (let b = 0; b < k; b++) xtx[a][b] += x[i][a] * x[i][b]
    }
  }
  const bread = invert(xtx)
  const beta = bread.map((row) => row.reduce((s, v, j) => s + v * xty[j], 0))

  // Per-cluster score sums: s_g = sum_i x_i * e_i
  const scores = new Map<number, number[]>()
  for (let i = 0; i < nObs; i++) {
    const e = y[i] - x[i].reduce((s, v, j) => s + v * beta[j], 0)
    let s = scores.get(clusters[i])
    if (!s) scores.set(clusters[i], (s = new Array<number>(k).fill(0)))
    for (let a = 0; a < k; a++) s[a] += x[i][a] * e
  }
  const g = scores.size
  if (g < 2) throw new Error('Need at least 2 clusters for cluster-robust standard errors')
  const meat = Array.from({ length: k }, () => new Array<number>(k).fill(0))
  for (const s of scores.values())
    for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) meat[a][b] += s[a] * s[b]
  const correction = (g / (g - 1)) * ((nObs - 1) / (nObs - k))

  const df = g - 1
  const crit = tQuantile(0.975, df)
  const coefficients = beta.map((estimate, a) => {
    let v = 0
    for (let b = 0; b < k; b++) for (let c = 0; c < k; c++) v += bread[a][b] * meat[b][c] * bread[c][a]
    const se = Math.sqrt(correction * v)
    const t = estimate / se
    return {
      estimate,
      se,
      t,
      p: tTwoSidedP(t, df),
      ci95: [estimate - crit * se, estimate + crit * se] as [number, number],
    }
  })
  return { coefficients, df, nObs, nClusters: g }
}
