import { describe, expect, it } from 'vitest'
import minimal from '../__fixtures__/minimal-project.json'
import { assessFeasibility } from '../domain/feasibility'
import { parseProjectFile } from '../domain/projectFile'
import { propagateShapes } from '../domain/shape'

describe('feasibility', () => {
  it('matches stable snapshot for fixture project', () => {
    const project = parseProjectFile(minimal)
    const shape = propagateShapes(project.network.layers, project.datasetSchema)
    const report = assessFeasibility({
      layers: project.network.layers,
      shape,
      declarations: project.feasibilityDeclarations,
      dataset: project.datasetSchema,
      training: project.training,
    })
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(100)
    expect(report.tier).toMatch(/Risk$/)
    expect(report.summary).toContain('Feasibility Score')
    expect(report.recommendedFixes.length).toBeGreaterThan(0)
  })
})
