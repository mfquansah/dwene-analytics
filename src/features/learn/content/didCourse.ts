import type { Lesson } from '../types'

const checkout = {
  labels: ['Before', 'After'],
  series: [
    { id: 'treated', label: 'Stores with new checkout', values: [100, 130], style: 'treated' as const },
    { id: 'comparison', label: 'Stores without it', values: [90, 110], style: 'comparison' as const },
  ],
  yDomain: [80, 140] as [number, number],
  yLabel: 'Avg weekly sales',
}

export const lesson1: Lesson = {
  lessonId: 'did-1',
  title: 'Did the intervention work?',
  durationMinutes: 5,
  objective: 'Explain why a simple before-and-after comparison can mislead when other things change over time.',
  scenario: 'A retail chain introduces a new checkout process in selected stores. Sales improve afterward. But did the change cause the improvement?',
  concepts: [
    { term: 'Correlation vs. causation', definition: 'Two things moving together does not mean one caused the other.' },
    { term: 'Confounding change over time', definition: 'Seasons, promotions and the economy can move outcomes whether or not an intervention happens.' },
  ],
  steps: [
    {
      id: 'intro', kind: 'read', title: 'The situation',
      body: [
        'A retailer rolled out a redesigned checkout at some of its stores. Average weekly sales at those stores were 100 before the rollout and 130 after.',
        'Your manager says: "Sales are up 30, so the new checkout is worth 30 a week per store." Before you agree, think about what that claim assumes.',
      ],
    },
    {
      id: 'predict', kind: 'choice', title: 'Think first',
      prompt: 'Does the 30-unit rise tell you the effect of the new checkout?',
      options: [
        { id: 'a', label: 'Yes. Sales rose by 30, so the checkout added 30.' },
        { id: 'b', label: 'Not necessarily. Other things may have changed over the same period.' },
        { id: 'c', label: 'No. The checkout had no effect.' },
      ],
      correct: 'b',
      hints: [
        'Think about what else can change between "before" and "after": seasons, promotions, the wider economy.',
        'Would sales have stayed exactly flat if the new checkout had never been introduced?',
      ],
      explanation: 'A before-and-after change mixes the effect of the intervention with everything else that changed over time. Option C goes too far: we simply cannot tell yet.',
    },
    {
      id: 'explore', kind: 'explore', title: 'Look at the other stores',
      prompt: 'Reveal each layer to see what happened elsewhere.',
      chart: checkout,
      layers: [
        { id: 'l1', label: 'Show stores with the new checkout', seriesIds: ['treated'], note: 'Sales at stores with the new checkout rose from 100 to 130 (+30).' },
        { id: 'l2', label: 'Show stores without the new checkout', seriesIds: ['comparison'], note: 'Stores that did NOT get the new checkout also grew, from 90 to 110 (+20). Something other than the checkout lifted sales.' },
      ],
    },
    {
      id: 'conclude', kind: 'choice', title: 'Draw a conclusion',
      prompt: 'Comparison stores rose by 20 with no new checkout. What is the most reasonable reading of the checkout effect?',
      options: [
        { id: 'a', label: 'The full 30, because those stores are different anyway.' },
        { id: 'b', label: 'Smaller than 30: part of the rise likely would have happened anyway.' },
        { id: 'c', label: 'Negative, because the comparison stores grew too.' },
      ],
      correct: 'b',
      hints: [
        'If sales were already rising by about 20 at stores without the checkout, how much of the 30 is left to credit to the checkout?',
        'This reasoning assumes the comparison stores are a fair stand-in for the treated stores. That is the idea the next lessons build on.',
      ],
      explanation: 'Part of the +30 probably reflects growth that was happening anyway. Using a comparison group to estimate that part is the heart of difference-in-differences.',
    },
  ],
  takeaway: 'A before-and-after change is not the effect of an intervention: it also contains whatever else changed over time. A comparison group helps separate the two.',
}

export const lesson2: Lesson = {
  lessonId: 'did-2',
  title: 'The DiD framework',
  durationMinutes: 7,
  objective: 'Identify the treatment group, comparison group, pre and post periods, and the counterfactual in a study.',
  scenario: 'In week 10, 40 stores switch to a new operating model. 60 similar stores continue as usual. Sales per store are tracked weekly for 20 weeks.',
  concepts: [
    { term: 'Treatment group', definition: 'Units that receive the intervention.' },
    { term: 'Comparison group', definition: 'Units that do not, used to show what happens without it.' },
    { term: 'Pre / post periods', definition: 'Time before and after the intervention begins.' },
    { term: 'Counterfactual', definition: 'What would have happened to the treatment group without the intervention. It is never observed directly.' },
  ],
  steps: [
    {
      id: 'intro', kind: 'read', title: 'Four building blocks',
      body: [
        'Difference-in-differences needs four things: a treatment group, a comparison group, a time before and after the intervention, and an outcome you measure in both groups.',
        'Scenario: in week 10, 40 stores switch to a new operating model. 60 similar stores continue as usual. You track weekly sales per store for 20 weeks.',
      ],
    },
    {
      id: 'group', kind: 'choice', title: 'Spot the groups',
      prompt: 'Which stores form the treatment group?',
      options: [
        { id: 'a', label: 'The 40 stores that switched in week 10.' },
        { id: 'b', label: 'The 60 stores that continued as usual.' },
        { id: 'c', label: 'All 100 stores.' },
      ],
      correct: 'a',
      hints: ['The treatment group is the group that received the intervention.'],
      explanation: 'The 40 switching stores are treated. The other 60 are the comparison group.',
    },
    {
      id: 'period', kind: 'choice', title: 'Spot the periods',
      prompt: 'Sales in week 4 belong to which period?',
      options: [
        { id: 'a', label: 'The pre period (before week 10).' },
        { id: 'b', label: 'The post period (from week 10).' },
        { id: 'c', label: 'Neither: only the treated stores have periods.' },
      ],
      correct: 'a',
      hints: ['Compare week 4 with the intervention date, week 10.', 'Both groups share the same pre and post periods.'],
      explanation: 'Week 4 comes before the week-10 start, so it is pre-period for every store. Both groups have pre and post data.',
    },
    {
      id: 'counterfactual-view', kind: 'explore', title: 'The invisible line',
      prompt: 'Reveal each layer.',
      chart: {
        labels: ['Before', 'After'],
        series: [
          { id: 'treated', label: 'Treated stores (observed)', values: [100, 130], style: 'treated' },
          { id: 'comparison', label: 'Comparison stores (observed)', values: [90, 110], style: 'comparison' },
          { id: 'cf', label: 'Treated stores without treatment (counterfactual)', values: [100, 120], style: 'counterfactual' },
        ],
        yDomain: [80, 140], yLabel: 'Avg weekly sales',
      },
      layers: [
        { id: 'obs', label: 'Show what we observe', seriesIds: ['treated', 'comparison'], note: 'Treated stores rose by 30, comparison stores by 20.' },
        { id: 'cf', label: 'Show the counterfactual', seriesIds: ['cf'], note: 'The dashed line is what treated stores would have done without the new model. We never observe it. DiD builds it by assuming treated stores would have changed as much as the comparison stores did (+20, so 100 to 120).' },
      ],
    },
    {
      id: 'counterfactual', kind: 'choice', title: 'Name the counterfactual',
      prompt: 'What is the counterfactual for the treated stores?',
      options: [
        { id: 'a', label: 'Their actual sales after switching.' },
        { id: 'b', label: 'What their sales would have been had they not switched.' },
        { id: 'c', label: 'The comparison stores’ sales after week 10.' },
      ],
      correct: 'b',
      hints: ['"Counter" to the facts: the thing that did not happen.', 'It describes the treated stores in a world without the intervention.'],
      explanation: 'The counterfactual is a what-if that can never be observed. The comparison group is used to estimate it, not to be it.',
    },
  ],
  takeaway: 'DiD compares treated and comparison groups before and after an intervention. The comparison group is used to estimate the counterfactual, which is never observed.',
}

export const lesson3: Lesson = {
  lessonId: 'did-3',
  title: 'Calculate the treatment effect',
  durationMinutes: 8,
  objective: 'Calculate and interpret a difference-in-differences estimate from group averages.',
  scenario: 'A retailer rolled out a redesigned checkout at selected stores. You have average weekly sales for stores that adopted it and stores that did not.',
  concepts: [
    { term: 'DiD estimate', definition: '(Treatment after − treatment before) − (comparison after − comparison before).' },
    { term: 'Identifying assumption', definition: 'The estimate is the effect only if treated stores would have changed as much as comparison stores without the intervention.' },
  ],
  steps: [
    {
      id: 'data', kind: 'read', title: 'The data',
      body: ['Did the new checkout increase sales? Here are average weekly sales before and after the rollout.'],
      table: { columns: ['Group', 'Before', 'After'], rows: [['Treatment', 100, 130], ['Comparison', 90, 110]] },
      chart: checkout,
    },
    {
      id: 'did', kind: 'numeric', title: 'Calculate it',
      prompt: 'What is the difference-in-differences estimate of the effect on weekly sales?',
      correct: 10, tolerance: 0.001, unit: 'units of weekly sales',
      table: { columns: ['Group', 'Before', 'After'], rows: [['Treatment', 100, 130], ['Comparison', 90, 110]] },
      hints: [
        'Start by finding how much each group changed from Before to After.',
        'Treatment changed by 130 − 100 = 30. Comparison changed by 110 − 90 = 20.',
        'Now subtract: the treatment group’s change minus the comparison group’s change.',
      ],
      explanation: 'Treatment rose by 30 and comparison by 20. The difference in those changes is 30 − 20 = +10. The estimated effect is 10 units of weekly sales, assuming the design’s identifying assumption holds.',
    },
    {
      id: 'meaning', kind: 'choice', title: 'Interpret it',
      prompt: 'What does the comparison group’s +20 stand in for?',
      options: [
        { id: 'a', label: 'The effect of the new checkout.' },
        { id: 'b', label: 'The change we would expect at treated stores without the new checkout, if trends are parallel.' },
        { id: 'c', label: 'Random noise that should be ignored.' },
      ],
      correct: 'b',
      hints: ['Comparison stores did not get the new checkout.', 'Their change shows what happens to stores like these over the same weeks without the intervention.'],
      explanation: 'The +20 estimates the change treated stores would have seen anyway. Subtracting it removes that shared change, leaving the part we attribute to the checkout.',
    },
    {
      id: 'apply', kind: 'numeric', title: 'Try one yourself',
      prompt: 'Region A launched a loyalty programme; Region B did not. Calculate the DiD estimate of average monthly spend.',
      correct: 4, tolerance: 0.001, unit: 'units of monthly spend',
      table: { columns: ['Group', 'Before', 'After'], rows: [['Region A (treated)', 50, 58], ['Region B (comparison)', 60, 64]] },
      hints: ['Find each region’s change first.', 'Region A changed by 8. Region B changed by 4.'],
      explanation: 'Region A rose by 58 − 50 = 8 and Region B by 64 − 60 = 4, so the DiD estimate is 8 − 4 = +4. Note that Region B started higher: the starting gap does not matter, only the changes do.',
    },
  ],
  takeaway: 'DiD = the treatment group’s change minus the comparison group’s change. The starting levels can differ; what matters is that the comparison group’s change is a good stand-in for what treated units would have done anyway.',
}

export const lesson4: Lesson = {
  lessonId: 'did-4',
  title: 'The parallel trends assumption',
  durationMinutes: 9,
  objective: 'Explain why DiD needs the comparison group’s trend to match the treated group’s untreated trend, and what happens when it does not.',
  scenario: 'You will run simulated studies where you control whether treated and comparison units would have moved in parallel, and the true effect is known.',
  concepts: [
    { term: 'Parallel trends', definition: 'Without the intervention, treated and comparison groups would have changed by the same amount over time.' },
    { term: 'Pre-trend check', definition: 'Comparing trends before treatment. Similar pre-trends make the assumption more plausible but do not prove it.' },
  ],
  sandboxPreset: { unitsPerGroup: 30, periods: 10, treatmentStart: 5, effectSize: 5, noise: 1, baselineDifference: 4, trendDifference: 0.3 },
  steps: [
    {
      id: 'intro', kind: 'read', title: 'Why the assumption matters',
      body: [
        'DiD uses the comparison group’s change as the stand-in for what would have happened to treated units anyway. That only works if the two groups would have changed by the same amount without the intervention.',
        'A starting gap between groups is fine. A difference in how fast they are growing is not.',
      ],
    },
    {
      id: 'sim', kind: 'simulation', title: 'Break it and see',
      prompt: 'In this simulation the true effect is 5. Move the slider from 0 (parallel trends) to a positive value (treated units would have grown faster anyway). Try both.',
      params: { unitsPerGroup: 30, periods: 10, treatmentStart: 5, effectSize: 5, noise: 1, baselineDifference: 4, trendDifference: 0, seed: 7 },
      adjustable: [{ key: 'trendDifference', label: 'Extra growth per period for treated units', min: 0, max: 1, step: 0.1, help: '0 means parallel trends hold.' }],
      requires: [
        { param: 'trendDifference', op: 'eq', value: 0, label: 'Try parallel trends (slider at 0)' },
        { param: 'trendDifference', op: 'ne', value: 0, label: 'Try a non-zero trend difference' },
      ],
      explanation: 'With a non-zero trend difference, treated units were already pulling away, and DiD credits that growth to the intervention, so the estimate moves away from the true effect of 5. The green dotted line shows the true counterfactual, which you can only see because this is a simulation.',
    },
    {
      id: 'pretrend', kind: 'choice', title: 'What can you check?',
      prompt: 'Before treatment, the two groups’ trends look parallel. Does that prove the assumption holds?',
      options: [
        { id: 'a', label: 'Yes. Parallel pre-trends prove parallel trends afterward.' },
        { id: 'b', label: 'No. It makes the assumption more plausible, but the assumption is about the untreated post period, which we cannot observe.' },
        { id: 'c', label: 'Yes, as long as the result is statistically significant.' },
      ],
      correct: 'b',
      hints: ['Think about which period the assumption is really about.', 'The assumption concerns what would have happened to treated units after the intervention, without it.'],
      explanation: 'Similar pre-trends support plausibility only. Something could still change for one group right when the intervention starts. Diagnostics never prove causality.',
    },
    {
      id: 'bias', kind: 'choice', title: 'What did you see?',
      prompt: 'As you raised the trend difference above 0, what happened to the DiD estimate?',
      options: [
        { id: 'a', label: 'It stayed near the true effect.' },
        { id: 'b', label: 'It moved further from the true effect (biased upward).' },
        { id: 'c', label: 'It became more precise.' },
      ],
      correct: 'b',
      hints: ['Compare the estimate with the true effect of 5 on the simulation.'],
      explanation: 'Extra growth in the treated group gets mistaken for treatment effect, so the estimate is biased upward. The bias does not shrink with more data.',
    },
  ],
  takeaway: 'DiD is only as credible as the comparison group’s trend is a stand-in for the treated group’s untreated trend. Similar pre-trends support this but do not prove it.',
}

export const lesson5: Lesson = {
  lessonId: 'did-5',
  title: 'Interpret and communicate results',
  durationMinutes: 8,
  objective: 'Explain an estimated effect with its uncertainty and limitations, and distinguish effect size from statistical significance.',
  scenario: 'You are handed DiD reports from a retail rollout and must decide what each one justifies saying.',
  concepts: [
    { term: 'Confidence interval', definition: 'A range of effect sizes consistent with the data. A wide interval means high uncertainty.' },
    { term: 'Effect size vs. significance', definition: 'A result can be statistically significant but tiny, or large but uncertain.' },
    { term: 'Alternative explanations', definition: 'Other changes that hit only the treated group at the same time can masquerade as an effect.' },
  ],
  steps: [
    {
      id: 'report-a', kind: 'read', title: 'Report A',
      body: ['A DiD analysis of a store programme reports the following. The pre-period check found no evidence against parallel trends.'],
      table: { columns: ['Measure', 'Value'], rows: [['DiD estimate (weekly sales)', '+4.0'], ['95% confidence interval', '−1.2 to +9.2'], ['p-value', '0.13']] },
    },
    {
      id: 'conclusion-a', kind: 'choice', title: 'What is justified?',
      prompt: 'Which conclusion does Report A support?',
      options: [
        { id: 'a', label: 'The programme raised weekly sales by exactly 4.' },
        { id: 'b', label: 'The data are consistent with anything from a small decrease to a large increase, so the evidence is inconclusive.' },
        { id: 'c', label: 'The programme does not work.' },
      ],
      correct: 'b',
      hints: ['Look at the confidence interval: does it include 0?', 'A result that is not significant is not proof of no effect. It means the data cannot rule out zero or a sizeable effect.'],
      explanation: 'The interval runs from −1.2 to +9.2, so a small decrease, no effect, and a large increase are all consistent with the data. 4.0 is a best guess, not a certainty, and “inconclusive” is not “no effect”.',
    },
    {
      id: 'report-b', kind: 'read', title: 'Report B',
      body: ['A second analysis, on a much larger sample. Average weekly sales per store are about 500.'],
      table: { columns: ['Measure', 'Value'], rows: [['DiD estimate (weekly sales)', '+0.2'], ['95% confidence interval', '+0.1 to +0.3'], ['p-value', '< 0.001']] },
    },
    {
      id: 'conclusion-b', kind: 'choice', title: 'Size vs. significance',
      prompt: 'How should Report B be described?',
      options: [
        { id: 'a', label: 'A large effect, because the p-value is so small.' },
        { id: 'b', label: 'Statistically significant but small (about 0.04% of 500). Whether it matters depends on cost and context.' },
        { id: 'c', label: 'Not meaningful, because it is statistically significant.' },
      ],
      correct: 'b',
      hints: ['The p-value says how surprising the data would be if the effect were zero. It does not say how big the effect is.', 'Compare +0.2 with average sales of about 500.'],
      explanation: 'With enough data, even tiny effects are statistically significant. The effect size and interval tell you whether it is worth caring about.',
    },
    {
      id: 'threat', kind: 'choice', title: 'What else could explain it?',
      prompt: 'A competitor opened next to several treated stores during the same week as the rollout. What does this threaten?',
      options: [
        { id: 'a', label: 'Nothing. DiD controls for everything that changes over time.' },
        { id: 'b', label: 'Something other than the programme changed only for treated stores at the same time, so the estimate may not be the programme’s effect.' },
        { id: 'c', label: 'Only the width of the confidence interval.' },
      ],
      correct: 'b',
      hints: ['DiD removes changes that affect both groups equally. Does this change affect both groups equally?', 'Think about what a pre-period check can and cannot see.'],
      explanation: 'DiD removes changes shared by both groups, not changes that hit one group only. A pre-period check cannot catch something that starts at the same moment as the intervention. Good reports name threats like this.',
    },
  ],
  takeaway: 'Report the estimate, its uncertainty, and the assumptions behind it. Significance is not importance, and a design cannot rule out other changes that affect only one group.',
}

export const DID_COURSE: Lesson[] = [lesson1, lesson2, lesson3, lesson4, lesson5]
