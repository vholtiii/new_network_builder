import { describe, expect, it } from 'vitest'
import minimal from '../__fixtures__/minimal-project.json'
import { parseCsvPaste, rowsToCsv } from '../domain/csv'
import { generateSyntheticRows, type SyntheticRow } from '../domain/synthetic'
import { parseProjectFile } from '../domain/projectFile'

describe('synthetic + csv', () => {
  it('is deterministic with seed', () => {
    const project = parseProjectFile(minimal)
    const a = generateSyntheticRows(project.datasetSchema, project.generationSettings)
    const b = generateSyntheticRows(project.datasetSchema, project.generationSettings)
    expect(a).toEqual(b)
  })

  it('roundtrips csv paste', () => {
    const project = parseProjectFile(minimal)
    const rows = generateSyntheticRows(project.datasetSchema, project.generationSettings)
    const csv = rowsToCsv(rows, project.datasetSchema)
    const parsed = parseCsvPaste(csv)
    expect(parsed.headers.length).toBe(project.datasetSchema.columns.length)
    expect(parsed.rows.length).toBe(project.generationSettings.rowCount)
  })

  it('respects age range from cohort scenario', () => {
    const project = parseProjectFile(minimal)
    const settings = {
      ...project.generationSettings,
      cohortScenario: {
        activeThemeId: 'young_adult' as const,
        ageRange: { min: 25, max: 35 },
      },
    }
    const rows = generateSyntheticRows(project.datasetSchema, settings)
    expect(rows.length).toBe(settings.rowCount)
    for (const row of rows) {
      const age = Number(row.age)
      expect(age).toBeGreaterThanOrEqual(25)
      expect(age).toBeLessThanOrEqual(35)
    }
  })

  it('binary sex column respects sexPositiveProbability', () => {
    const project = parseProjectFile(minimal)
    const schema = {
      ...project.datasetSchema,
      columns: [
        ...project.datasetSchema.columns,
        {
          id: 'sex',
          name: 'Sex',
          type: 'binary' as const,
          group: 'demographics' as const,
          syntheticRole: 'sex' as const,
        },
      ],
    }
    const hi = generateSyntheticRows(schema, {
      ...project.generationSettings,
      rowCount: 2000,
      cohortScenario: { sexPositiveProbability: 0.95 },
    })
    const lo = generateSyntheticRows(schema, {
      ...project.generationSettings,
      rowCount: 2000,
      cohortScenario: { sexPositiveProbability: 0.05 },
    })
    const mean = (rows: SyntheticRow[]) =>
      rows.reduce((s, r) => s + Number(r.sex), 0) / rows.length
    expect(mean(hi)).toBeGreaterThan(0.7)
    expect(mean(lo)).toBeLessThan(0.3)
  })

  it('stratified phase mix assigns only known categories', () => {
    const project = parseProjectFile(minimal)
    const schema = {
      ...project.datasetSchema,
      columns: [
        ...project.datasetSchema.columns,
        {
          id: 'phase',
          name: 'Phase',
          type: 'categorical' as const,
          group: 'treatment_phase' as const,
          categories: ['A', 'B'],
          syntheticRole: 'treatment_phase' as const,
        },
      ],
    }
    const settings = {
      ...project.generationSettings,
      rowCount: 200,
      cohortScenario: {
        activeThemeId: 'balanced_general',
        treatmentPhaseWeights: { A: 1, B: 3 },
        mixStrictness: 'stratified' as const,
      },
    }
    const rows = generateSyntheticRows(schema, settings)
    const phases = new Set(rows.map((r) => String(r.phase)))
    expect(phases.has('A')).toBe(true)
    expect(phases.has('B')).toBe(true)
    expect(phases.size).toBe(2)
  })
})
