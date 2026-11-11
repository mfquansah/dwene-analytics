import type { Lesson } from '../types'

/** Study used twice: first with the truth hidden, then revealed. Keep these in sync (see content tests). */
const bikeStudy = { unitsPerGroup: 25, periods: 12, treatmentStart: 6, effectSize: 3, noise: 1.2, baselineDifference: -4, trendDifference: 0.5, seed: 11 }

export const DID_CHALLENGE: Lesson = {
  lessonId: 'did-challenge',
  mode: 'challenge',
  title: 'Final challenge: three new cases',
  durationMinutes: 10,
  objective: 'Apply difference-in-differences to situations you have not seen, with no hints.',
  scenario: 'You are the analyst. Three new cases, three decisions. Work them out on your own.',
  concepts: [
    { term: 'Compute', definition: 'DiD = treated change minus comparison change. A constant starting gap does not matter.' },
    { term: 'Diagnose', definition: 'A flagged pre-trend check means the estimate may be biased, however narrow its interval.' },
    { term: 'Communicate', definition: 'Report the estimate, its uncertainty and the assumption it rests on.' },
  ],
  steps: [
    {
      id: 'intro', kind: 'read', title: 'How this works',
      body: [
        'This challenge has no hints. If you miss an answer you can try again, and after two misses you can look at the answer.',
        'You are scored on how many questions you get right on the first attempt. At the end you will see which lessons to revisit.',
      ],
    },
    {
      id: 'a-calc', kind: 'numeric', title: 'Case A: the transit pass',
      prompt: 'City A introduced a discounted transit pass. City B did not. Average monthly rides per resident are below. What is the DiD estimate of the pass’s effect?',
      correct: 6, tolerance: 0.001, unit: 'rides per resident',
      table: { columns: ['Group', 'Before', 'After'], rows: [['City A (pass)', 42, 51], ['City B (no pass)', 55, 58]] },
      hints: [], reviewLessonId: 'did-3',
      explanation: 'City A rose by 51 − 42 = 9 and City B by 58 − 55 = 3, so the estimate is 9 − 3 = +6.',
    },
    {
      id: 'a-gap', kind: 'choice', title: 'Case A: the starting gap',
      prompt: 'City A started lower than City B (42 vs 55). Does that gap invalidate the DiD comparison?',
      options: [
        { id: 'a', label: 'Yes. Treated and comparison groups must start at the same level.' },
        { id: 'b', label: 'No. DiD compares changes, so a constant gap is fine. What matters is whether the two would have trended in parallel.' },
        { id: 'c', label: 'Yes, unless you subtract the gap from the estimate afterwards.' },
      ],
      correct: 'b', hints: [], reviewLessonId: 'did-4',
      explanation: 'DiD differences out any constant gap between groups. The assumption that matters is parallel trends, not equal starting levels.',
    },
    {
      id: 'b-study', kind: 'study', title: 'Case B: protected bike lanes',
      body: [
        'A city built protected bike lanes in 25 districts at period 6. 25 other districts got none. The outcome is weekly bike trips per 100 residents, and you have 12 periods of data.',
        'This is what the analysis produced. You are not told the true effect.',
      ],
      params: bikeStudy, revealTruth: false,
    },
    {
      id: 'b-trust', kind: 'choice', title: 'Case B: can you trust it?',
      prompt: 'The estimate is about +6.0 with a very narrow confidence interval, but the pre-trend check flags a difference. What is the best response?',
      options: [
        { id: 'a', label: 'Report +6.0 as the lanes’ effect: the narrow interval shows it is reliable.' },
        { id: 'b', label: 'Do not report it as the lanes’ effect. Treated districts were already diverging before the lanes, so the estimate is probably biased.' },
        { id: 'c', label: 'Ignore the check, because the p-value for the estimate is tiny.' },
      ],
      correct: 'b', hints: [], reviewLessonId: 'did-4',
      explanation: 'The check found treated districts already trending differently before treatment, which undermines the parallel-trends assumption. Treat the number with strong caution.',
    },
    {
      id: 'b-why', kind: 'choice', title: 'Case B: precision is not accuracy',
      prompt: 'Why does a narrow confidence interval not fix this problem?',
      options: [
        { id: 'a', label: 'It does: with enough data, bias disappears.' },
        { id: 'b', label: 'The interval reflects random sampling error only. It says nothing about bias from a violated assumption.' },
        { id: 'c', label: 'Narrow intervals only occur with very small samples.' },
      ],
      correct: 'b', hints: [], reviewLessonId: 'did-5',
      explanation: 'More data makes an estimate more precise, not unbiased. A biased estimate with a tight interval is precisely wrong.',
    },
    {
      id: 'b-reveal', kind: 'study', title: 'Case B: the reveal',
      body: ['Here is the same study with the truth revealed. Compare the true effect with the estimate and the interval.'],
      params: bikeStudy, revealTruth: true,
    },
    {
      id: 'c-report', kind: 'read', title: 'Case C: write it up',
      body: ['A different DiD analysis of a store programme reports the figures below. The pre-trend check found no evidence against parallel trends.'],
      table: { columns: ['Measure', 'Value'], rows: [['DiD estimate (weekly sales)', '+2.0'], ['95% confidence interval', '−0.5 to +4.5'], ['p-value', '0.12']] },
    },
    {
      id: 'c-write', kind: 'choice', title: 'Case C: the summary',
      prompt: 'Which sentence is the best summary for a decision-maker?',
      options: [
        { id: 'a', label: 'The programme raised sales by 2 (p = 0.12).' },
        { id: 'b', label: 'We estimate +2.0 (95% CI −0.5 to +4.5). The data are consistent with no effect or a moderate gain, so the evidence is inconclusive. This assumes treated and comparison stores would have trended in parallel.' },
        { id: 'c', label: 'The programme failed, because the result is not statistically significant.' },
      ],
      correct: 'b', hints: [], reviewLessonId: 'did-5',
      explanation: 'A good summary gives the estimate with its uncertainty, says what the data can and cannot rule out, and names the assumption. Not significant does not mean no effect.',
    },
    {
      id: 'c-design', kind: 'choice', title: 'Case C: a better design',
      prompt: 'For the next study, a pricing change in one region, which comparison group would be most credible?',
      options: [
        { id: 'a', label: 'A region similar in size, whose pre-period trend closely matched the treated region’s.' },
        { id: 'b', label: 'The fastest-growing region, so any effect looks bigger.' },
        { id: 'c', label: 'All other regions pooled together, whatever their trends were.' },
      ],
      correct: 'a', hints: [], reviewLessonId: 'did-2',
      explanation: 'A comparison group is a stand-in for the treated group’s untreated path, so it should have moved like the treated group before treatment. Picking a group to make the effect look bigger is the opposite of that.',
    },
  ],
  takeaway: 'Compute carefully, diagnose before you trust, and report the estimate with its uncertainty and its assumptions. A precise number from a broken comparison is still wrong.',
}
