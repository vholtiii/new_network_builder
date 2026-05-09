import { mergeScenarioWithTheme } from './clinicalThemes'
import type { ColumnGenProfile, GenerationSettings } from './projectFile'
import type { DatasetColumn, DatasetSchema } from './datasetSchema'
import { mulberry32, randomNormal } from './rng'

export type SyntheticRow = Record<string, string | number>

type SynthCtx = {
  resolved: ReturnType<typeof mergeScenarioWithTheme>
  phaseSchedule: string[] | null
  phaseColId: string | null
  columnProfiles: Record<string, ColumnGenProfile>
  rowIndex: number
}

function labsMultiplier(intensity: 'low' | 'neutral' | 'high'): number {
  switch (intensity) {
    case 'low':
      return 0.88
    case 'high':
      return 1.22
    default:
      return 1
  }
}

function pickCategoryUniform(rng: () => number, cats: string[]): string {
  return cats[Math.floor(rng() * cats.length)] ?? cats[0] ?? ''
}

function normalizePhaseWeights(cats: string[], weights: Record<string, number>): number[] {
  return cats.map((c) => Math.max(0, weights[c] ?? 1))
}

function pickWeightedCategory(rng: () => number, cats: string[], w: number[]): string {
  const sum = w.reduce((a, b) => a + b, 0) || 1
  let u = rng() * sum
  for (let i = 0; i < cats.length; i++) {
    u -= w[i]!
    if (u <= 0) return cats[i]!
  }
  return cats[cats.length - 1]!
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
}

function buildStratifiedSchedule(N: number, cats: string[], weights: number[], rng: () => number): string[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  const quotas = weights.map((w) => Math.max(0, Math.floor((N * w) / sum)))
  let used = quotas.reduce((a, b) => a + b, 0)
  let k = 0
  while (used < N && quotas.length > 0) {
    quotas[k % quotas.length]!++
    used++
    k++
  }
  const arr: string[] = []
  for (let i = 0; i < cats.length; i++) {
    const q = quotas[i] ?? 0
    for (let j = 0; j < q; j++) arr.push(cats[i]!)
  }
  shuffleInPlace(arr, rng)
  return arr
}

function isAgeColumn(col: DatasetColumn): boolean {
  if (col.syntheticRole === 'age') return true
  if (col.type !== 'numeric' || col.group !== 'demographics') return false
  const s = `${col.name} ${col.id}`.toLowerCase()
  return s.includes('age')
}

function isRelapseColumn(col: DatasetColumn): boolean {
  if (col.syntheticRole === 'relapse_or_recurrence') return true
  if (col.type !== 'binary') return false
  const s = `${col.name} ${col.id}`.toLowerCase()
  return s.includes('relapse')
}

function isSexColumn(col: DatasetColumn): boolean {
  if (col.syntheticRole === 'sex') return true
  if (col.type !== 'binary' || col.group !== 'demographics') return false
  const s = `${col.name} ${col.id}`.toLowerCase()
  return s.includes('sex')
}

function findTreatmentPhaseColumn(columns: DatasetColumn[]): DatasetColumn | undefined {
  const role = columns.find((c) => c.syntheticRole === 'treatment_phase')
  if (role && role.type === 'categorical') return role
  return columns.find((c) => c.group === 'treatment_phase' && c.type === 'categorical')
}

function legacyNumericBase(column: DatasetColumn, rng: () => number): number {
  const base =
    column.group === 'labs'
      ? 25 + rng() * 35
      : column.group === 'demographics'
        ? 18 + rng() * 62
        : rng() * 10
  return base + randomNormal(rng) * 0.4
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function synthCell(column: DatasetColumn, rng: () => number, ctx: SynthCtx): string | number {
  const prof = ctx.columnProfiles[column.id]

  if (ctx.phaseColId === column.id && ctx.phaseSchedule && ctx.phaseSchedule.length > ctx.rowIndex) {
    return ctx.phaseSchedule[ctx.rowIndex]!
  }

  if (column.type === 'categorical' && ctx.phaseColId === column.id && !ctx.phaseSchedule) {
    const cats = column.categories ?? ['A', 'B', 'C']
    const w = normalizePhaseWeights(cats, ctx.resolved.treatmentPhaseWeights)
    return pickWeightedCategory(rng, cats, w)
  }

  if (column.type === 'binary' && isSexColumn(column)) {
    const p = ctx.resolved.sexPositiveProbability
    return rng() < p ? 1 : 0
  }

  if (column.type === 'binary' && isRelapseColumn(column)) {
    return rng() < ctx.resolved.relapseProbability ? 1 : 0
  }

  if (column.type === 'numeric' && isAgeColumn(column)) {
    let lo = ctx.resolved.ageRange.min
    let hi = ctx.resolved.ageRange.max
    if (prof?.numericMin !== undefined) lo = prof.numericMin
    if (prof?.numericMax !== undefined) hi = prof.numericMax
    if (hi <= lo) hi = lo + 1
    const span = hi - lo
    const mode = prof?.numericMode ?? 'uniform'
    let v =
      mode === 'normal'
        ? lo + span * clamp(0.5 + randomNormal(rng) * 0.18, 0, 1)
        : lo + rng() * span
    v = clamp(v + randomNormal(rng) * span * 0.02, lo, hi)
    return Number(v.toFixed(3))
  }

  if (column.type === 'numeric' && column.group === 'labs') {
    const base = legacyNumericBase(column, rng)
    const m = labsMultiplier(ctx.resolved.labsIntensity)
    let v = base * m
    if (prof?.numericMin !== undefined) v = Math.max(prof.numericMin, v)
    if (prof?.numericMax !== undefined) v = Math.min(prof.numericMax, v)
    return Number(v.toFixed(3))
  }

  if (column.type === 'numeric') {
    let v = legacyNumericBase(column, rng)
    if (prof?.numericMin !== undefined) v = Math.max(prof.numericMin, v)
    if (prof?.numericMax !== undefined) v = Math.min(prof.numericMax, v)
    return Number(v.toFixed(3))
  }

  if (column.type === 'binary') {
    return rng() > 0.55 ? 1 : 0
  }

  if (column.type === 'ordinal') {
    return Math.min(4, Math.max(0, Math.round(rng() * 4)))
  }

  if (column.type === 'categorical') {
    return pickCategoryUniform(rng, column.categories ?? ['A', 'B', 'C'])
  }

  return 0
}

export function generateSyntheticRows(dataset: DatasetSchema, settings: GenerationSettings): SyntheticRow[] {
  const { rowCount, seed, cohortScenario, columnProfiles } = settings
  const themeId = cohortScenario?.activeThemeId ?? 'balanced_general'
  const resolved = mergeScenarioWithTheme(themeId, cohortScenario)

  const rng = mulberry32(seed >>> 0)
  const phaseCol = findTreatmentPhaseColumn(dataset.columns)
  const cats = phaseCol?.categories ?? []
  let phaseSchedule: string[] | null = null

  if (phaseCol && cats.length > 0 && resolved.mixStrictness === 'stratified') {
    const w = normalizePhaseWeights(cats, resolved.treatmentPhaseWeights)
    phaseSchedule = buildStratifiedSchedule(rowCount, cats, w, mulberry32((seed ^ 0x9e3779b9) >>> 0))
  }

  const rows: SyntheticRow[] = []
  const phaseColId = phaseCol?.id ?? null

  for (let r = 0; r < rowCount; r++) {
    const row: SyntheticRow = {}
    const ctx: SynthCtx = {
      resolved,
      phaseSchedule,
      phaseColId,
      columnProfiles: columnProfiles ?? {},
      rowIndex: r,
    }
    for (const col of dataset.columns) {
      row[col.id] = synthCell(col, rng, ctx)
    }
    rows.push(row)
  }

  return rows
}
