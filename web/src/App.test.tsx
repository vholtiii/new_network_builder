import { render, screen } from '@testing-library/react'
import App from './App'

describe('App shell', () => {
  it('surfaces the synthetic-only disclaimer', () => {
    render(<App />)
    expect(screen.getByText(/Synthetic demonstration tool/i)).toBeInTheDocument()
  })
})
