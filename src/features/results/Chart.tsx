import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from './series'

export function TrendChart({ series, treatmentStart, revealTruth }: { series: TrendPoint[]; treatmentStart: number; revealTruth: boolean }) {
  return (
    <div className="chart" role="img" aria-label="Average outcome over time for treated and comparison groups">
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={series} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="period" type="number" domain={[0, series.length - 1]} ticks={series.map((p) => p.period)} label={{ value: 'Period', position: 'insideBottom', offset: -2 }} />
          <YAxis domain={['auto', 'auto']} tickFormatter={(v: number) => v.toFixed(1)} width={44} />
          <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : String(v))} labelFormatter={(l) => `Period ${l}`} />
          <Legend verticalAlign="top" height={28} />
          <ReferenceLine x={treatmentStart - 0.5} stroke="var(--color-text-muted)" strokeDasharray="4 4" label={{ value: 'Treatment starts', position: 'insideTopLeft', fontSize: 11 }} />
          <Line name="Treated" dataKey="treated" stroke="var(--color-treated)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          <Line name="Comparison" dataKey="comparison" stroke="var(--color-comparison)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
          <Line name="Estimated counterfactual" dataKey="estimatedCounterfactual" stroke="var(--color-treated)" strokeDasharray="6 4" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          {revealTruth && <Line name="True counterfactual" dataKey="trueCounterfactual" stroke="var(--color-success)" strokeDasharray="2 3" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
