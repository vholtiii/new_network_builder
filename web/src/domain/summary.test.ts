import { describe, expect, it } from 'vitest'
import minimal from '../__fixtures__/minimal-project.json'
import { assessFeasibility } from '../domain/feasibility'
import { parseProjectFile } from '../domain/projectFile'
import { propagateShapes } from '../domain/shape'
import { buildImplementationSummary } from '../domain/summary'

describe('implementation summary', () => {
  it('includes feasibility headline', () => {
    const project = parseProjectFile(minimal)
    const shape = propagateShapes(project.network.layers, project.datasetSchema)
    const feasibility = assessFeasibility({
      layers: project.network.layers,
      shape,
      declarations: project.feasibilityDeclarations,
      dataset: project.datasetSchema,
      training: project.training,
    })
    const md = buildImplementationSummary(project, feasibility)
    expect(md).toContain('# BioBank NN Builder')
    expect(md).toContain('Feasibility headline')
  })
})
