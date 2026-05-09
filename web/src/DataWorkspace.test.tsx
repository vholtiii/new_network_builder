import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DataWorkspace } from './components/DataWorkspace'
import { createDefaultProject } from './domain/defaultProject'
import { useProjectStore } from './store/projectStore'

describe('DataWorkspace cohort sync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useProjectStore.setState({
      project: createDefaultProject(),
      generatedRows: [],
      cohortGenerateAck: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('regenerates rows when rowCount changes with live preview off', async () => {
    render(<DataWorkspace />)
    await vi.runAllTimersAsync()
    expect(useProjectStore.getState().generatedRows.length).toBe(100)

    useProjectStore.getState().updateGeneration({ rowCount: 7 })
    await vi.advanceTimersByTimeAsync(400)
    expect(useProjectStore.getState().generatedRows.length).toBe(7)
    expect(useProjectStore.getState().cohortGenerateAck).toBe(false)
  })

  it('sets cohortGenerateAck when live preview runs debounced refresh', async () => {
    useProjectStore.getState().updateGeneration({ livePreview: true })
    render(<DataWorkspace />)
    await vi.runAllTimersAsync()
    expect(useProjectStore.getState().cohortGenerateAck).toBe(true)
  })
})
