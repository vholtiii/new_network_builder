import { describe, expect, it } from 'vitest'
import minimal from '../__fixtures__/minimal-project.json'
import { parseCsvPaste, rowsToCsv } from '../domain/csv'
import { generateSyntheticRows } from '../domain/synthetic'
import { parseProjectFile } from '../domain/projectFile'

describe('synthetic + csv', () => {
  it('is deterministic with seed', () => {
    const project = parseProjectFile(minimal)
    const a = generateSyntheticRows(project.datasetSchema, 25, 99)
    const b = generateSyntheticRows(project.datasetSchema, 25, 99)
    expect(a).toEqual(b)
  })

  it('roundtrips csv paste', () => {
    const project = parseProjectFile(minimal)
    const rows = generateSyntheticRows(project.datasetSchema, 5, 3)
    const csv = rowsToCsv(rows, project.datasetSchema)
    const parsed = parseCsvPaste(csv)
    expect(parsed.headers.length).toBe(project.datasetSchema.columns.length)
    expect(parsed.rows.length).toBe(5)
  })
})
