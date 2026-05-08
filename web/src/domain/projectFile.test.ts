import { describe, expect, it } from 'vitest'
import { parseProjectFile, safeParseProjectFile } from '../domain/projectFile'
import minimal from '../__fixtures__/minimal-project.json'

describe('project contracts', () => {
  it('accepts golden minimal project', () => {
    const parsed = parseProjectFile(minimal)
    expect(parsed.version).toBe(1)
    expect(parsed.network.layers[0].type).toBe('input')
  })

  it('rejects invalid payloads', () => {
    const bad = safeParseProjectFile({})
    expect(bad.success).toBe(false)
  })
})
