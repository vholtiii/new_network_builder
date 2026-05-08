import { render, screen } from '@testing-library/react'
import { ResultsPanel } from './components/ResultsPanel'

describe('ResultsPanel', () => {
  it('labels mock outcomes as synthetic', () => {
    render(<ResultsPanel />)
    expect(screen.getByText(/Synthetic mock outputs/i)).toBeInTheDocument()
  })
})
