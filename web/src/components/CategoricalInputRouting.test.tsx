import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultProject } from '../domain/defaultProject'
import { useProjectStore } from '../store/projectStore'
import { CategoricalInputRouting } from './CategoricalInputRouting'

describe('CategoricalInputRouting', () => {
  beforeEach(() => {
    localStorage.removeItem('bb-beginner-mode')
    useProjectStore.setState({
      project: createDefaultProject(),
      tab: 'builder',
      beginnerMode: false,
      presentationMode: false,
      selectedLayerId: null,
    })
  })

  it('offers add embedding when no embedding exists for a categorical column', async () => {
    const user = userEvent.setup()
    const base = createDefaultProject()
    useProjectStore.setState({
      project: {
        ...base,
        network: {
          ...base.network,
          layers: base.network.layers.filter((l) => l.type !== 'embedding'),
        },
      },
    })

    render(<CategoricalInputRouting dataset={base.datasetSchema} />)

    await user.click(screen.getByRole('button', { name: /Add embedding for Site/i }))

    expect(
      useProjectStore.getState().project.network.layers.some(
        (l) => l.type === 'embedding' && l.schemaColumnId === 'cohort_site',
      ),
    ).toBe(true)
  })
})
