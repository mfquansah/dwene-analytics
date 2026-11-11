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

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<Field['key'], Field>

/** Form sections, in order. Keys refer to FIELDS. */
export const SECTIONS: Array<{ title: string; note?: string; chip?: string; keys: Field['key'][] }> = [
  { title: 'Design the study', keys: ['unitsPerGroup', 'periods', 'treatmentStart'] },
  { title: 'Set the true effect', note: 'The effect used to generate the simulated data. You will not see it while the experiment runs, just like in real life.', chip: 'Hidden until reveal', keys: ['effectSize', 'noise', 'baselineDifference', 'trendDifference'] },
  { title: 'Reproducibility', keys: ['seed'] },
]
