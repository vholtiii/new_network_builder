import type { DatasetSchema } from './datasetSchema'
import type { TaskType } from './projectFile'
import type { SyntheticRow } from './synthetic'
import { mulberry32 } from './rng'

export type OutcomeRow = {
  rowIndex: number
  label?: number
  probability?: number
  prediction?: number
  lower?: number
  upper?: number
}

/** Controlled illustrative simulator — not neural-network inference */
export function simulateOutcomes(options: {
  rows: SyntheticRow[]
  schema: DatasetSchema
  taskType: TaskType
  seed: number
  multiclassCount?: number
}): OutcomeRow[] {
  const { rows, schema, taskType, seed, multiclassCount } = options
  const rng = mulberry32(seed ^ 0xc001feed)

  const numericPriority = schema.columns.filter((c) => c.type === 'numeric').slice(0, 4)

  const latentForRow = (row: SyntheticRow): number => {
    let z = 0
    for (let i = 0; i < numericPriority.length; i++) {
      const col = numericPriority[i]
      const raw = Number(row[col.id])
      const coef = 0.18 + i * 0.07 + rng() * 0.02
      if (!Number.isNaN(raw)) z += coef * raw
    }
    /* categorical modulation */
    for (const col of schema.columns) {
      if (col.type === 'binary') z += (Number(row[col.id]) === 1 ? 0.15 : -0.05) * (0.5 + rng())
    }
    return z + randomNoise(rng)
  }

  function randomNoise(rng: () => number): number {
    const u = rng()
    const v = rng()
    const gaussian = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(2 * Math.PI * v)
    return gaussian * 0.12
  }

  const logistic = (z: number) => 1 / (1 + Math.exp(-z))

  return rows.map((row, idx) => {
    const baseSeed = mulberry32(seed + idx)
    const z = latentForRow(row)

    if (taskType === 'binary_classification' || taskType === 'risk_score') {
      const p = logistic(z - (taskType === 'risk_score' ? 0.8 : 0.5))
      const band = 0.06 + baseSeed() * 0.04
      return {
        rowIndex: idx,
        label: p > 0.5 ? 1 : 0,
        probability: clamp01(p),
        lower: clamp01(p - band),
        upper: clamp01(p + band),
      }
    }

    if (taskType === 'multiclass_classification') {
      const k = Math.max(2, multiclassCount ?? 3)
      const logits = Array.from({ length: k }, () => logistic(z + rng() * 2))
      const sum = logits.reduce((a, b) => a + b, 0) || 1
      const probs = logits.map((l) => l / sum)
      const cls = probs.indexOf(Math.max(...probs))
      const band = 0.08 + baseSeed() * 0.05
      return {
        rowIndex: idx,
        label: cls,
        prediction: cls,
        probability: probs[cls],
        lower: clamp01(probs[cls] - band),
        upper: clamp01(probs[cls] + band),
      }
    }

    const y = z * 2.4 + 48 + randomNoise(rng) * 4
    const band = 3 + baseSeed() * 4
    return {
      rowIndex: idx,
      prediction: Number(y.toFixed(3)),
      lower: Number((y - band).toFixed(3)),
      upper: Number((y + band).toFixed(3)),
    }
  })
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, Number(x.toFixed(4))))
}
