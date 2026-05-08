import type { DatasetColumn, DatasetSchema } from './datasetSchema'
import { mulberry32, randomNormal } from './rng'

export type SyntheticRow = Record<string, string | number>

function pickCategory(rng: () => number, cats: string[]): string {
  return cats[Math.floor(rng() * cats.length)] ?? cats[0] ?? ''
}

function synthCell(column: DatasetColumn, rng: () => number): string | number {
  switch (column.type) {
    case 'numeric': {
      const base =
        column.group === 'labs'
          ? 25 + rng() * 35
          : column.group === 'demographics'
            ? 18 + rng() * 62
            : rng() * 10
      const jitter = randomNormal(rng) * 0.4
      return Number((base + jitter).toFixed(3))
    }
    case 'binary':
      return rng() > 0.55 ? 1 : 0
    case 'ordinal':
      return Math.min(4, Math.max(0, Math.round(rng() * 4)))
    case 'categorical':
      return pickCategory(rng, column.categories ?? ['A', 'B', 'C'])
    default:
      return 0
  }
}

export function generateSyntheticRows(dataset: DatasetSchema, rowCount: number, seed: number): SyntheticRow[] {
  const rng = mulberry32(seed)
  const rows: SyntheticRow[] = []

  for (let r = 0; r < rowCount; r++) {
    const row: SyntheticRow = {}
    for (const col of dataset.columns) {
      row[col.id] = synthCell(col, rng)
    }
    rows.push(row)
  }

  return rows
}
