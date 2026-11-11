interface Props {
  estimate: number
  ci: [number, number]
  /** Shown only when defined (ground truth revealed). */
  truth?: number
}

const W = 520, H = 300, PAD = 28, AXIS_Y = 230

/** Horizontal point-and-interval plot: estimate with its 95% CI, a "no effect" line and optional truth line. */
export function EffectPlot({ estimate, ci, truth }: Props) {
  const vals = [estimate, ci[0], ci[1], 0, ...(truth === undefined ? [] : [truth])]
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const span = hi - lo || 1
  const min = lo - span * 0.12, max = hi + span * 0.12
  const x = (v: number) => PAD + ((v - min) / (max - min)) * (W - 2 * PAD)
  const step = niceStep((max - min) / 6)
  const ticks: number[] = []
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) ticks.push(Math.round(t / step) * step)
  const y = 140

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Estimated effect ${estimate.toFixed(2)}, 95% interval ${ci[0].toFixed(2)} to ${ci[1].toFixed(2)}${truth === undefined ? '' : `, true effect ${truth.toFixed(2)}`}`}>
      <rect x={x(ci[0])} y={y - 44} width={x(ci[1]) - x(ci[0])} height={88} rx={6} fill="var(--color-accent-wash)" />
      <line x1={x(0)} x2={x(0)} y1={44} y2={AXIS_Y} stroke="var(--color-text-muted)" strokeDasharray="3 3" />
      <text x={x(0)} y={32} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">No effect</text>
      {truth !== undefined && (
        <>
          <line x1={x(truth)} x2={x(truth)} y1={44} y2={AXIS_Y} stroke="var(--color-counterfactual)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={x(truth)} y={32} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-counterfactual)">True {truth.toFixed(2)}</text>
        </>
      )}
      <line x1={x(ci[0])} x2={x(ci[1])} y1={y} y2={y} stroke="var(--color-accent)" strokeWidth={2} />
      {ci.map((c) => <line key={c} x1={x(c)} x2={x(c)} y1={y - 9} y2={y + 9} stroke="var(--color-accent)" strokeWidth={2} />)}
      <circle cx={x(estimate)} cy={y} r={6} fill="var(--color-accent)" />
      <text x={x(estimate)} y={y - 16} textAnchor="middle" fontSize="12" fontWeight="650" fill="var(--color-text)" stroke="#fff" strokeWidth={4} paintOrder="stroke">{estimate.toFixed(2)}</text>
      <text x={x(ci[0])} y={y + 28} textAnchor="middle" fontSize="11" fill="var(--color-text-2)">{ci[0].toFixed(2)}</text>
      <text x={x(ci[1])} y={y + 28} textAnchor="middle" fontSize="11" fill="var(--color-text-2)">{ci[1].toFixed(2)}</text>
      <line x1={PAD} x2={W - PAD} y1={AXIS_Y} y2={AXIS_Y} stroke="var(--color-border-strong)" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={AXIS_Y} y2={AXIS_Y + 4} stroke="var(--color-border-strong)" />
          <text x={x(t)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="var(--color-text-muted)">{Number(t.toFixed(2))}</text>
        </g>
      ))}
    </svg>
  )
}

function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(raw))
  const f = raw / p
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p
}
