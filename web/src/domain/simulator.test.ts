import { describe, expect, it } from 'vitest'
import minimal from '../__fixtures__/minimal-project.json'
import { parseProjectFile } from '../domain/projectFile'
import { generateSyntheticRows } from '../domain/synthetic'
import { simulateOutcomes } from '../domain/simulator'

describe('mock outcome simulator', () => {
  it('is reproducible for identical inputs', () => {
    const project = parseProjectFile(minimal)
    const rows = generateSyntheticRows(project.datasetSchema, 30, 123)
    const run = () =>
      simulateOutcomes({
        rows,
        schema: project.datasetSchema,
        taskType: project.feasibilityDeclarations.taskType,
        seed: 777,
      })
    expect(run()).toEqual(run())
  })
})
