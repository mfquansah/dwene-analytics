import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { ChartSeries, ChartSpec } from './types'

const color: Record<ChartSeries['style'], string> = {
  treated: 'var(--color-treated)',
  comparison: 'var(--color-comparison)',
  counterfactual: 'var(--color-success)',
}

/** Renders only the series ids in `visible`, so a lesson can reveal a chart layer by layer. */
export function ExploreChart({ chart, visible }: { chart: ChartSpec; visible: Set<string> }) {
  const data = chart.labels.map((label, i) => {
    const row: Record<string, string | number | null> = { label }
    for (const s of chart.series) row[s.id] = s.values[i]
    return row
  })
  const shown = chart.series.filter((s) => visible.has(s.id))
  return (
    <div className="chart" role="img" aria-label={`Chart of ${chart.yLabel ?? 'outcome'}: ${shown.map((s) => s.label).join(', ') || 'nothing revealed yet'}`}>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="label" padding={{ left: 40, right: 40 }} />
          <YAxis domain={chart.yDomain ?? ['auto', 'auto']} width={44} label={chart.yLabel ? { value: chart.yLabel, angle: -90, position: 'insideLeft', fontSize: 11 } : undefined} />
          <Legend verticalAlign="top" height={28} />
          {shown.map((s) => (
            <Line key={s.id} name={s.label} dataKey={s.id} stroke={color[s.style]} strokeWidth={2.5}
              strokeDasharray={s.style === 'counterfactual' ? '6 4' : undefined} dot={{ r: 4 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
