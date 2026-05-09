import { describe, expect, it } from 'vitest'
import { createDefaultProject } from './defaultProject'
import { renameDatasetColumnInProject } from './datasetSchemaRename'

describe('renameDatasetColumnInProject', () => {
  it('returns duplicate when new id collides', () => {
    const p = createDefaultProject()
    const r = renameDatasetColumnInProject(p, 'age', 'sex')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('duplicate')
  })

  it('remaps input scalars, embeddings, and columnProfiles keys', () => {
    const p = createDefaultProject()
    p.generationSettings.columnProfiles = {
      lab_alt: { numericMin: 1, numericMax: 99 },
    }
    const r = renameDatasetColumnInProject(p, 'lab_alt', 'alt_units')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.project.datasetSchema.columns.some((c) => c.id === 'alt_units')).toBe(true)
    expect(r.project.datasetSchema.columns.some((c) => c.id === 'lab_alt')).toBe(false)

    const inp = r.project.network.layers.find((l) => l.type === 'input')
    expect(inp?.type === 'input' && inp.scalarColumnIds.includes('alt_units')).toBe(true)
    expect(inp?.type === 'input' && inp.scalarColumnIds.includes('lab_alt')).toBe(false)

    expect(r.project.generationSettings.columnProfiles?.alt_units).toEqual({
      numericMin: 1,
      numericMax: 99,
    })
    expect(r.project.generationSettings.columnProfiles?.lab_alt).toBeUndefined()
  })

  it('no-ops with unchanged id', () => {
    const p = createDefaultProject()
    const r = renameDatasetColumnInProject(p, 'age', 'age')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.project).toBe(p)
  })
})
