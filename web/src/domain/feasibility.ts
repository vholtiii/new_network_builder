import type { DatasetSchema } from './datasetSchema'
import type { Layer } from './networkGraph'
import type { FeasibilityDeclarations, ProjectFile } from './projectFile'
import type { ShapeResult } from './shape'
import { estimateParameterCount } from './shape'

type TrainingStub = NonNullable<ProjectFile['training']>

export type RiskTier = 'Low Risk' | 'Medium Risk' | 'High Risk'

export type FeasibilityReport = {
  score: number
  tier: RiskTier
  warnings: string[]
  recommendedFixes: string[]
  summary: string
}

function effectiveFeatureCount(dataset: DatasetSchema | undefined, declared?: number): number {
  if (declared && declared > 0) return declared
  return dataset?.columns.length ?? 1
}

export function assessFeasibility(options: {
  layers: Layer[]
  shape: ShapeResult
  declarations: FeasibilityDeclarations
  dataset?: DatasetSchema
  training?: TrainingStub
}): FeasibilityReport {
  const warnings: string[] = []
  const fixes: string[] = []
  let penalty = 0

  const { layers, shape, declarations, dataset, training } = options
  const { sampleSize: n, taskType } = declarations
  const p = effectiveFeatureCount(dataset, declarations.featureCount)

  if (!shape.ok) {
    shape.errors.forEach((e) => warnings.push(`[${e.layerId}] ${e.message}`))
    penalty += 50
    fixes.push('Fix layer ordering and dimensions so tensors flow from Input to Output.')
    return finalizeReport(penalty, warnings, fixes)
  }

  const traces = shape.traces
  const params = estimateParameterCount(layers, traces)
  const outputLayer = layers[layers.length - 1]

  if (outputLayer.type !== 'output') {
    warnings.push('Last layer is not an Output head.')
    penalty += 40
  } else {
    const units = outputLayer.units
    const act = outputLayer.activationFn

    if (taskType === 'binary_classification' || taskType === 'risk_score') {
      if (units !== 1) {
        warnings.push(`${taskType} expects a single output unit; found ${units}.`)
        penalty += 25
        fixes.push('Use exactly one output unit with sigmoid-style calibration for binary or risk-style heads.')
      }
      if (act === 'softmax') {
        warnings.push('Softmax on a single-unit binary/risk head is invalid.')
        penalty += 20
        fixes.push('Replace softmax with sigmoid (or none + calibrated logits) for binary/risk outputs.')
      }
    }

    if (taskType === 'multiclass_classification') {
      const k = declarations.multiclassCount ?? units
      if (units < 2) {
        warnings.push('Multiclass classification expects at least two output units.')
        penalty += 25
      }
      if (units !== k && declarations.multiclassCount) {
        warnings.push(`Output units (${units}) do not match declared class count (${k}).`)
        penalty += 15
      }
      if (act && act !== 'softmax' && act !== 'relu') {
        warnings.push('Multiclass heads commonly use softmax on the final logits.')
        penalty += 5
      }
    }

    if (taskType === 'regression') {
      if (units !== 1) {
        warnings.push('Regression typically uses a single continuous output unit.')
        penalty += 15
      }
      if (act === 'softmax') {
        warnings.push('Softmax is inappropriate for a regression output.')
        penalty += 20
        fixes.push('Remove softmax from the regression output head.')
      }
    }
  }

  const denseLayers = layers.filter((l) => l.type === 'dense')
  const depth = denseLayers.length
  if (depth > 6) {
    warnings.push('Depth is high for tabular biomedical models; consider shallower networks.')
    penalty += 10
    fixes.push('Reduce the number of dense blocks unless you have strong regularization and ample data.')
  }

  const maxWidth = Math.max(
    0,
    ...layers.map((l) => (l.type === 'dense' || l.type === 'output' ? l.units : 0)),
  )
  if (maxWidth > 2048) {
    warnings.push('Very wide layers increase overfitting risk for typical cohort sizes.')
    penalty += 12
    fixes.push('Reduce hidden layer width or add stronger regularization.')
  }

  const ratio = params / Math.max(1, n)
  if (ratio > 10) {
    warnings.push(`Estimated parameters (${params}) are large relative to sample size (${n}).`)
    penalty += 25
    fixes.push('Shrink architecture, add dropout/weight decay, or collect more samples.')
  } else if (ratio > 2) {
    warnings.push(`Parameter-to-sample ratio (${ratio.toFixed(1)}) may invite overfitting.`)
    penalty += 12
    fixes.push('Consider dropout and cross-validation before interpreting metrics.')
  }

  const hasDropout = layers.some((l) => l.type === 'dropout')
  if (!hasDropout && ratio > 1 && n < 2000) {
    warnings.push('No dropout layers detected while capacity is meaningful vs cohort size.')
    penalty += 8
    fixes.push('Insert dropout after large dense layers or increase explicit regularization.')
  }

  if ((training?.weightDecay ?? 0) <= 0 && ratio > 1.5) {
    warnings.push('Training stub lacks weight decay; consider explicit L2 penalty.')
    penalty += 5
    fixes.push('Add weight decay in your training configuration.')
  }

  if (p > n / 2 && n < 500) {
    warnings.push(`Feature count (${p}) is high versus samples (${n}); consider feature selection.`)
    penalty += 12
    fixes.push('Use domain-informed feature selection or dimensionality reduction before modeling.')
  }

  if (declarations.interpretabilityPriority === 'high' && (depth > 3 || maxWidth > 512)) {
    warnings.push('Model complexity may conflict with stated interpretability priorities.')
    penalty += 8
    fixes.push('Prefer smaller networks or inherently interpretable baselines for stakeholder review.')
  }

  if (!declarations.externalValidationPlanned && n < 500) {
    warnings.push('Small cohort without planned external validation weakens scientific plausibility.')
    penalty += 7
    fixes.push('Plan external validation or multi-site replication before clinical claims.')
  }

  fixes.push('Use rigorous cross-validation; outcomes from this tool are synthetic demonstrations only.')

  return finalizeReport(penalty, warnings, fixes)
}

function finalizeReport(penalty: number, warnings: string[], fixes: string[]): FeasibilityReport {
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)))
  let tier: RiskTier = 'Low Risk'
  if (score < 70 && score >= 40) tier = 'Medium Risk'
  if (score < 40) tier = 'High Risk'

  const summaryParts = [
    `Feasibility Score: ${score}/100`,
    `Risk Tier: ${tier}`,
    warnings.length ? `Primary concerns: ${warnings.slice(0, 3).join(' · ')}` : 'No blocking feasibility warnings detected.',
  ]

  const uniqFixes = Array.from(new Set(fixes))

  return {
    score,
    tier,
    warnings,
    recommendedFixes: uniqFixes,
    summary: summaryParts.join('\n'),
  }
}