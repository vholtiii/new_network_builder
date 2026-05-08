import { describe, expect, it } from 'vitest'
import minimal from '../__fixtures__/minimal-project.json'
import { parseProjectFile } from '../domain/projectFile'
import { propagateShapes } from '../domain/shape'

describe('shape engine', () => {
  it('propagates dims for fixture chain', () => {
    const project = parseProjectFile(minimal)
    const shape = propagateShapes(project.network.layers, project.datasetSchema)
    expect(shape.ok).toBe(true)
    if (!shape.ok) return
    expect(shape.outputDim).toBe(1)
    expect(shape.traces.find((t) => t.type === 'dense')?.outDim).toBe(8)
  })

  it('errors on embedding after dense', () => {
    const badLayers = [
      { id: 'in', type: 'input' as const, scalarColumnIds: ['age'] },
      { id: 'h', type: 'dense' as const, units: 4 },
      {
        id: 'emb',
        type: 'embedding' as const,
        schemaColumnId: 'site',
        embeddingDim: 3,
      },
      { id: 'out', type: 'output' as const, units: 1 },
    ]
    const shape = propagateShapes(badLayers, parseProjectFile(minimal).datasetSchema)
    expect(shape.ok).toBe(false)
  })
})
