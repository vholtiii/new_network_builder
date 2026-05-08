import { describe, expect, it } from 'vitest'
import type { DatasetSchema } from '../domain/datasetSchema'
import { buildInputLayerTooltip } from './inputTooltip'

describe('buildInputLayerTooltip', () => {
  const shortSchema: DatasetSchema = {
    columns: [
      { id: 'a', name: 'Alpha', type: 'numeric', group: 'demographics' },
      { id: 'c', name: 'Gamma', type: 'numeric', group: 'labs' },
    ],
  }

  const longSchema: DatasetSchema = {
    columns: [
      { id: 'a', name: 'Alpha', type: 'numeric', group: 'demographics' },
      {
        id: 'b',
        name: 'Beta long display name element one two three four five',
        type: 'numeric',
        group: 'labs',
      },
      {
        id: 'c',
        name: 'Gamma long display name element one two three four five six',
        type: 'numeric',
        group: 'labs',
      },
    ],
  }

  it('joins short lists without truncation', () => {
    expect(buildInputLayerTooltip(shortSchema, ['a'])).toBe('Alpha')
    expect(buildInputLayerTooltip(shortSchema, ['a', 'c'])).toBe('Alpha, Gamma')
  })

  it('truncates long joins with (+N more)', () => {
    const t = buildInputLayerTooltip(longSchema, ['a', 'b', 'c'])
    expect(t).toContain('(+')
    expect(t!.length).toBeLessThanOrEqual(120)
  })

  it('returns undefined when no ids or schema', () => {
    expect(buildInputLayerTooltip(undefined, ['a'])).toBeUndefined()
    expect(buildInputLayerTooltip(shortSchema, [])).toBeUndefined()
  })
})
