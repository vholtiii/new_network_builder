import { describe, expect, it } from 'vitest'
import minimal from '../__fixtures__/minimal-project.json'
import { createDefaultProject } from './defaultProject'
import {
  applyHiddenStackPreset,
  getHiddenStackBounds,
  hiddenStackHasDense,
  validateWizardStep,
  type GuidedWizardContext,
} from './guidedWizard'
import { parseProjectFile } from './projectFile'

const emptyCtx = (): GuidedWizardContext => ({
  generatedRowCount: 0,
  cohortGenerateAck: false,
  hiddenStackPresetApplied: false,
  feasibilityReviewAck: false,
})

describe('guidedWizard', () => {
  it('getHiddenStackBounds finds contiguous embeddings after input', () => {
    const project = parseProjectFile(minimal)
    const b = getHiddenStackBounds(project.network.layers)
    expect(b).not.toBeNull()
    expect(b!.headEnd).toBe(1)
    expect(project.network.layers[b!.headEnd].type).toBe('embedding')
    expect(project.network.layers[b!.outIdx].type).toBe('output')
  })

  it('applyHiddenStackPreset preserves input embeddings and output', () => {
    const project = createDefaultProject()
    let n = 0
    const nextId = () => `nid-${n++}`
    const before = project.network.layers
    const out = applyHiddenStackPreset(before, 'small', nextId)
    expect(out[0].type).toBe('input')
    expect(out[out.length - 1].type).toBe('output')
    const embSite = out.filter((l) => l.type === 'embedding' && l.schemaColumnId === 'cohort_site')
    const embPhase = out.filter((l) => l.type === 'embedding' && l.schemaColumnId === 'tx_phase')
    expect(embSite.length).toBe(1)
    expect(embPhase.length).toBe(1)
    const denseCount = out.filter((l) => l.type === 'dense').length
    expect(denseCount).toBeGreaterThanOrEqual(2)
  })

  it('hiddenStackHasDense detects dense between embeddings and output', () => {
    expect(hiddenStackHasDense(parseProjectFile(minimal).network.layers)).toBe(true)
  })

  it('step 0 fails when title empty', () => {
    const project = parseProjectFile(minimal)
    project.network.metadata = { name: '   ' }
    const r = validateWizardStep(0, project, emptyCtx())
    expect(r.ok).toBe(false)
    expect(r.messages.some((m) => /architecture title/i.test(m))).toBe(true)
  })

  it('step 1 fails without cohort ack', () => {
    const project = parseProjectFile(minimal)
    project.network.metadata = { name: 'Test' }
    const r = validateWizardStep(1, project, { ...emptyCtx(), cohortGenerateAck: false })
    expect(r.ok).toBe(false)
  })

  it('step 1 passes with cohort ack', () => {
    const project = parseProjectFile(minimal)
    project.network.metadata = { name: 'Test' }
    const r = validateWizardStep(1, project, { ...emptyCtx(), cohortGenerateAck: true })
    expect(r.ok).toBe(true)
  })

  it('step 2 fails when categorical lacks embedding', () => {
    const project = parseProjectFile(minimal)
    project.network.layers = [
      { id: 'in', type: 'input', scalarColumnIds: ['age', 'lab'] },
      { id: 'h1', type: 'dense', units: 8 },
      { id: 'out', type: 'output', units: 1, activationFn: 'sigmoid' },
    ]
    const r = validateWizardStep(2, project, { ...emptyCtx(), cohortGenerateAck: true })
    expect(r.ok).toBe(false)
    expect(r.messages.some((m) => /embedding/i.test(m))).toBe(true)
  })

  it('step 3 passes when dense exists in hidden region', () => {
    const project = parseProjectFile(minimal)
    const r = validateWizardStep(3, project, {
      ...emptyCtx(),
      cohortGenerateAck: true,
      hiddenStackPresetApplied: false,
    })
    expect(r.ok).toBe(true)
  })

  it('step 3 fails without dense and without preset ack', () => {
    const project = parseProjectFile(minimal)
    project.network.layers = [
      { id: 'in', type: 'input', scalarColumnIds: ['age', 'lab'] },
      { id: 'emb', type: 'embedding', schemaColumnId: 'site', embeddingDim: 4 },
      { id: 'out', type: 'output', units: 1, activationFn: 'sigmoid' },
    ]
    const r = validateWizardStep(3, project, {
      ...emptyCtx(),
      cohortGenerateAck: true,
      hiddenStackPresetApplied: false,
    })
    expect(r.ok).toBe(false)
  })

  it('step 4 requires feasibility ack', () => {
    const project = parseProjectFile(minimal)
    const bad = validateWizardStep(4, project, {
      ...emptyCtx(),
      cohortGenerateAck: true,
      hiddenStackPresetApplied: false,
      feasibilityReviewAck: false,
    })
    expect(bad.ok).toBe(false)
    const good = validateWizardStep(4, project, {
      ...emptyCtx(),
      cohortGenerateAck: true,
      feasibilityReviewAck: true,
    })
    expect(good.ok).toBe(true)
  })
})
