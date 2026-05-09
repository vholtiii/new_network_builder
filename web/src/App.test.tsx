import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { useProjectStore } from './store/projectStore'

describe('App shell', () => {
  beforeEach(() => {
    localStorage.removeItem('bb-beginner-mode')
    useProjectStore.setState({
      beginnerMode: false,
      presentationMode: false,
      tab: 'builder',
    })
  })

  it('surfaces the synthetic-only disclaimer', () => {
    render(<App />)
    expect(screen.getByText(/Synthetic demonstration tool/i)).toBeInTheDocument()
  })

  it('toggles beginner explanations and shows feasibility intro copy', async () => {
    const user = userEvent.setup()
    render(<App />)
    const beginnerBtn = screen.getByRole('button', { name: /Beginner explanations/i })
    expect(beginnerBtn).toHaveAttribute('aria-pressed', 'false')
    await user.click(beginnerBtn)
    expect(beginnerBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/design-time sanity check/i)).toBeInTheDocument()
  })

  it('toggles presentation layout class on the shell', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const shell = container.querySelector('.app-shell')
    expect(shell).toBeTruthy()
    expect(shell!.classList.contains('presentation-mode')).toBe(false)
    await user.click(screen.getByRole('button', { name: /Presentation layout/i }))
    expect(shell!.classList.contains('presentation-mode')).toBe(true)
  })

  it('opens and closes the glossary dialog', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Open glossary/i }))
    expect(screen.getByRole('dialog', { name: /Glossary/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /Glossary/i })).not.toBeInTheDocument()
  })

  it('marks the active workspace tab with aria-current=page', () => {
    render(<App />)
    const builder = screen.getByRole('button', { name: /Model builder/i })
    const data = screen.getByRole('button', { name: /Cohort builder/i })
    expect(builder).toHaveAttribute('aria-current', 'page')
    expect(data).not.toHaveAttribute('aria-current')
  })

  it('groups scalar inputs under feature group headings', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Demographics', level: 5 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Labs', level: 5 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Features that feed the Input node', level: 4 })).toBeInTheDocument()
  })
})
