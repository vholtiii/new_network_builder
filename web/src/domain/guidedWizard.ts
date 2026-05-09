import type { DatasetSchema } from './datasetSchema'
import type { Layer } from './networkGraph'
import type { ProjectFile } from './projectFile'

export const WIZARD_STEP_COUNT = 5 as const

export type WizardStepIndex = 0 | 1 | 2 | 3 | 4

export type HiddenStackPresetId = 'small' | 'medium' | 'tiny'

export type GuidedWizardContext = {
  generatedRowCount: number
  cohortGenerateAck: boolean
  hiddenStackPresetApplied: boolean
  feasibilityReviewAck: boolean
}

/** Tab to show for each wizard step index (0-based). */
export function wizardStepTab(step: WizardStepIndex): 'data' | 'builder' | 'present' {
  if (step <= 1) return 'data'
  if (step <= 3) return 'builder'
  return 'present'
}

export const WIZARD_STEP_LABELS = [
  'Study & schema',
  'Generate cohort rows',
  'Wire inputs',
  'Hidden layers',
  'Review & export',
] as const

/** End index of contiguous embeddings immediately after input; output index. */
export function getHiddenStackBounds(layers: Layer[]): { headEnd: number; outIdx: number } | null {
  const inIdx = layers.findIndex((l) => l.type === 'input')
  const outIdx = layers.findIndex((l) => l.type === 'output')
  if (inIdx === -1 || outIdx === -1 || outIdx <= inIdx) return null
  let embEnd = inIdx
  for (let i = inIdx + 1; i < outIdx; i++) {
    if (layers[i].type === 'embedding') embEnd = i
    else break
  }
  return { headEnd: embEnd, outIdx }
}

export function hiddenStackHasDense(layers: Layer[]): boolean {
  const b = getHiddenStackBounds(layers)
  if (!b) return false
  for (let i = b.headEnd + 1; i < b.outIdx; i++) {
    if (layers[i].type === 'dense') return true
  }
  return false
}

function buildStage(
  units: number,
  dropoutRate: number,
  isLast: boolean,
  newId: () => string,
): Layer[] {
  const dense: Layer = { id: newId(), type: 'dense', units }
  const relu: Layer = { id: newId(), type: 'activation', fn: 'relu' }
  if (isLast) return [dense, relu]
  return [
    dense,
    { id: newId(), type: 'batch_norm' },
    relu,
    { id: newId(), type: 'dropout', rate: dropoutRate },
  ]
}

/** Replace layers between embedding block and output; preserves input, embeddings, output. */
export function applyHiddenStackPreset(
  layers: Layer[],
  presetId: HiddenStackPresetId,
  newId: () => string,
): Layer[] {
  const b = getHiddenStackBounds(layers)
  if (!b) return layers
  const { headEnd, outIdx } = b
  const head = layers.slice(0, headEnd + 1)
  const tail = layers.slice(outIdx)
  let hidden: Layer[] = []
  switch (presetId) {
    case 'tiny':
      hidden = [...buildStage(16, 0.2, true, newId)]
      break
    case 'small':
      hidden = [...buildStage(32, 0.2, false, newId), ...buildStage(16, 0.2, true, newId)]
      break
    case 'medium':
      hidden = [
        ...buildStage(64, 0.25, false, newId),
        ...buildStage(32, 0.2, false, newId),
        ...buildStage(16, 0.2, true, newId),
      ]
      break
    default:
      return layers
  }
  return [...head, ...hidden, ...tail]
}

function categoricalsMissingEmbeddings(schema: DatasetSchema, layers: Layer[]): string[] {
  const cats = schema.columns.filter((c) => c.type === 'categorical')
  const missing: string[] = []
  for (const c of cats) {
    const ok = layers.some((l) => l.type === 'embedding' && l.schemaColumnId === c.id)
    if (!ok) missing.push(c.name || c.id)
  }
  return missing
}

function invalidScalarInputs(schema: DatasetSchema, layers: Layer[]): string[] {
  const inp = layers.find((l): l is Extract<Layer, { type: 'input' }> => l.type === 'input')
  if (!inp) return ['Missing Input layer']
  if (inp.scalarColumnIds.length === 0) return ['Select at least one scalar column on the Input layer']
  const problems: string[] = []
  for (const id of inp.scalarColumnIds) {
    const col = schema.columns.find((c) => c.id === id)
    if (!col) {
      problems.push(`Unknown column id on Input: ${id}`)
      continue
    }
    if (col.type !== 'numeric' && col.type !== 'binary' && col.type !== 'ordinal') {
      problems.push(`${col.name} is ${col.type}; scalars must be numeric, binary, or ordinal`)
    }
  }
  return problems
}

export function validateWizardStep(
  step: WizardStepIndex,
  project: ProjectFile,
  ctx: GuidedWizardContext,
): { ok: boolean; messages: string[] } {
  const messages: string[] = []
  const gs = project.generationSettings
  const schema = project.datasetSchema
  const layers = project.network.layers

  switch (step) {
    case 0: {
      const title = project.network.metadata?.name?.trim() ?? ''
      if (!title) messages.push('Enter an architecture title')
      if (gs.rowCount < 1) messages.push('Patient count must be at least 1')
      if (schema.columns.length < 1) messages.push('Add at least one dataset column (Dataset schema)')
      break
    }
    case 1: {
      if (!ctx.cohortGenerateAck) {
        messages.push(
          'Generate synthetic cohort rows (Cohort scenario “Generate”, Synthetic cohort generator “Generate / refresh”, CSV paste, or turn on Live preview)',
        )
      }
      break
    }
    case 2: {
      messages.push(...invalidScalarInputs(schema, layers))
      const embMiss = categoricalsMissingEmbeddings(schema, layers)
      if (embMiss.length)
        messages.push(`Add an embedding for categorical columns: ${embMiss.join(', ')}`)
      break
    }
    case 3: {
      if (!ctx.hiddenStackPresetApplied && !hiddenStackHasDense(layers)) {
        messages.push('Apply a hidden-layer preset (below) or add at least one Dense layer before the output')
      }
      break
    }
    case 4: {
      if (!ctx.feasibilityReviewAck)
        messages.push('Confirm you reviewed feasibility findings on the Model builder tab')
      break
    }
    default:
      break
  }

  return { ok: messages.length === 0, messages }
}
