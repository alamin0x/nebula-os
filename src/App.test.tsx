import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the boot screen when session flag is not set', () => {
    render(<App />)
    expect(screen.getByTestId('boot-screen')).toBeInTheDocument()
    expect(screen.getByLabelText('NEBULA OS')).toBeInTheDocument()
  })

  it('renders the desktop immediately when session flag is set', () => {
    sessionStorage.setItem('nebula-booted', 'true')
    render(<App />)
    expect(screen.getByTestId('desktop')).toBeInTheDocument()
    expect(screen.queryByTestId('boot-screen')).not.toBeInTheDocument()
  })

  it('shows a progress bar during boot', () => {
    render(<App />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
  })

  it('displays boot messages sequentially', async () => {
    render(<App />)

    // Initially no messages
    expect(screen.queryByText('Initializing Nebula Core...')).not.toBeInTheDocument()

    // After first message delay
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByText('Initializing Nebula Core...')).toBeInTheDocument()

    // After second message delay
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByText('Loading modules...')).toBeInTheDocument()

    // After third message delay
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByText('Access granted.')).toBeInTheDocument()
  })

  it('transitions to desktop after boot completes', () => {
    render(<App />)
    expect(screen.getByTestId('boot-screen')).toBeInTheDocument()

    // Advance past boot duration (3000ms) + glitch transition (400ms)
    act(() => {
      vi.advanceTimersByTime(3500)
    })

    expect(screen.getByTestId('desktop')).toBeInTheDocument()
    expect(screen.queryByTestId('boot-screen')).not.toBeInTheDocument()
  })

  it('sets sessionStorage flag after boot completes', () => {
    render(<App />)

    act(() => {
      vi.advanceTimersByTime(3500)
    })

    expect(sessionStorage.getItem('nebula-booted')).toBe('true')
  })
})
