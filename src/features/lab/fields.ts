import type { SimParams } from '../../stats'

export interface Field {
  key: Exclude<keyof SimParams, 'commonTrend' | 'baselineLevel' | 'unitEffectSd'>
  label: string
  help: string
  step?: number
}

export const FIELDS: Field[] = [
  { key: 'unitsPerGroup', label: 'Units per group', help: 'Regions, stores or people in each of the treated and comparison groups.' },
  { key: 'periods', label: 'Total periods', help: 'Pre plus post periods (e.g. weeks).' },
  { key: 'treatmentStart', label: 'Treatment starts at period', help: 'First treated period (0-indexed). Earlier periods are "pre".' },
  { key: 'effectSize', label: 'True effect', help: 'The real effect on treated units. The analysis tries to recover it.', step: 0.1 },
  { key: 'noise', label: 'Noise (SD)', help: 'Random variation in each observation. More noise means wider confidence intervals.', step: 0.1 },
  { key: 'baselineDifference', label: 'Baseline difference', help: 'How much higher treated units start. A constant gap does not bias DiD.', step: 0.1 },
  { key: 'trendDifference', label: 'Trend difference', help: 'Extra growth per period for treated units. Anything but 0 breaks parallel trends and biases the estimate.', step: 0.05 },
  { key: 'seed', label: 'Seed', help: 'Same seed, same data. Change it to draw a new sample.' },
]
