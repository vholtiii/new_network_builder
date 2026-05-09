import type { DatasetSchema } from './datasetSchema'
import { mergeScenarioWithTheme } from './clinicalThemes'
import type { Layer } from './networkGraph'
import type { FeasibilityDeclarations, ProjectFile } from './projectFile'
import type { FeasibilityReport } from './feasibility'
import { estimateParameterCount, propagateShapes } from './shape'

export function buildCohortSlideBullets(project: ProjectFile): string {
  const gs = project.generationSettings
  const cs = gs.cohortScenario
  const tid = cs?.activeThemeId ?? 'balanced_general'
  const lines: string[] = []
  lines.push('## Cohort story (slides)')
  lines.push(`- Synthetic patients: **${gs.rowCount}**`)
  lines.push(`- Seed: ${gs.seed} (same seed → same demo rows)`)
  lines.push(`- Clinical theme: ${tid.replace(/_/g, ' ')}`)
  const cols = project.datasetSchema.columns
  const slotDefs: [string, (c: (typeof cols)[number]) => boolean][] = [
    ['Age', (c) => c.syntheticRole === 'age' || c.id === 'age'],
    ['Sex', (c) => c.syntheticRole === 'sex' || c.id === 'sex'],
    ['Site / center', (c) => c.syntheticRole === 'site_or_center' || c.id === 'cohort_site'],
    ['Treatment phase', (c) => c.syntheticRole === 'treatment_phase' || c.id === 'tx_phase'],
    ['Relapse flag', (c) => c.syntheticRole === 'relapse_or_recurrence' || c.id === 'relapse_flag'],
  ]
  for (const [label, pred] of slotDefs) {
    const c = cols.find(pred)
    if (c) lines.push(`- ${label}: ${c.name} (${c.type})`)
  }
  if (cs?.ageRange) lines.push(`- Age band: ${cs.ageRange.min}–${cs.ageRange.max}`)
  if (cs?.relapseProbability !== undefined) lines.push(`- Relapse probability (scenario): ${cs.relapseProbability}`)
  const merged = mergeScenarioWithTheme(tid, cs)
  if (cols.some((c) => c.type === 'binary' && c.syntheticRole === 'sex')) {
    lines.push(`- Sex = 1 probability (binary): ${merged.sexPositiveProbability}`)
  }
  lines.push('')
  lines.push('_Demo-only cohort description — not real patient data._')
  return lines.join('\n')
}

export function buildImplementationSummary(project: ProjectFile, feasibility: FeasibilityReport): string {
  const lines: string[] = []
  lines.push('# BioBank NN Builder — implementation summary')
  lines.push('')
  lines.push('## Synthetic demonstration artifact')
  lines.push(
    'This summary describes a **hypothetical** architecture for teaching and design review. It is **not** a trained clinical model.',
  )
  lines.push('')
  lines.push(`## Model metadata`)
  lines.push(`- Name: ${project.network.metadata?.name ?? 'Untitled architecture'}`)
  lines.push(`- Notes: ${project.network.metadata?.notes ?? '—'}`)
  lines.push('')
  lines.push(`## Declared cohort assumptions`)
  lines.push(formatDeclarations(project.feasibilityDeclarations))
  lines.push('')
  lines.push(buildCohortSlideBullets(project))
  lines.push('')
  lines.push(`## Dataset schema overview`)
  lines.push(formatDataset(project.datasetSchema))
  lines.push('')
  lines.push(`## Layer stack`)
  lines.push(formatLayers(project.network.layers))
  lines.push('')
  lines.push(`## Complexity`)
  lines.push(formatComplexity(project.network.layers, project.datasetSchema))
  lines.push('')
  lines.push(`## Feasibility headline`)
  lines.push(`- Score: ${feasibility.score}/100 (${feasibility.tier})`)
  lines.push(`- Summary:`)
  feasibility.summary.split('\n').forEach((s) => lines.push(`  ${s}`))
  lines.push('')
  if (feasibility.warnings.length) {
    lines.push(`### Warnings`)
    feasibility.warnings.forEach((w) => lines.push(`- ${w}`))
    lines.push('')
  }
  if (feasibility.recommendedFixes.length) {
    lines.push(`### Recommended fixes`)
    feasibility.recommendedFixes.forEach((w) => lines.push(`- ${w}`))
  }
  return lines.join('\n')
}

function formatDeclarations(d: FeasibilityDeclarations): string {
  const bits = [
    `- Samples (declared): ${d.sampleSize}`,
    `- Task: ${d.taskType}`,
    `- Feature count hint: ${d.featureCount ?? 'schema-derived'}`,
    `- Interpretability priority: ${d.interpretabilityPriority ?? 'not specified'}`,
    `- External validation planned: ${d.externalValidationPlanned ?? 'not specified'}`,
  ]
  return bits.join('\n')
}

function formatDataset(schema: DatasetSchema): string {
  const cols = schema.columns
    .map((c) => `- ${c.name} (${c.id}) — ${c.type} — group ${c.group}`)
    .join('\n')
  return `${cols}\n\n_Declared columns: ${schema.columns.length}_`
}

function formatLayers(layers: Layer[]): string {
  return layers
    .map((layer, idx) => {
      switch (layer.type) {
        case 'input':
          return `${idx + 1}. Input — scalar columns: ${layer.scalarColumnIds.join(', ')}`
        case 'embedding':
          return `${idx + 1}. Embedding — ${layer.schemaColumnId} → dim ${layer.embeddingDim}`
        case 'dense':
          return `${idx + 1}. Dense — units ${layer.units}`
        case 'dropout':
          return `${idx + 1}. Dropout — rate ${layer.rate}`
        case 'batch_norm':
          return `${idx + 1}. Batch normalization`
        case 'activation':
          return `${idx + 1}. Activation — ${layer.fn}`
        case 'output':
          return `${idx + 1}. Output — units ${layer.units}${layer.activationFn ? ` (${layer.activationFn})` : ''}`
        default:
          return `${idx + 1}. Unknown layer`
      }
    })
    .join('\n')
}

function formatComplexity(layers: Layer[], dataset: DatasetSchema): string {
  const shape = propagateShapes(layers, dataset)
  if (!shape.ok) return `Shape invalid — ${shape.errors.length} blocking errors`
  const params = estimateParameterCount(layers, shape.traces)
  return [`- Estimated trainable parameters (rough): ${params}`, `- Output dimension: ${shape.outputDim}`].join('\n')
}
