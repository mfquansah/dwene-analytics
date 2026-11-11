import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'
import type { TrendPoint } from '../features/results/series'

/** Tiny decorative trend chart: treated vs comparison, no axes. */
export function MiniTrend({ series, height = 110 }: { series: TrendPoint[]; height?: number }) {
  return (
    <div role="img" aria-label="Treated and comparison group outcomes over time" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Line dataKey="comparison" stroke="var(--color-comparison)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line dataKey="treated" stroke="var(--color-treated)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
