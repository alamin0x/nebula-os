import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import BootScreen from './BootScreen'

describe('BootScreen', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
    mockOnComplete.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the boot screen with ASCII art', () => {
    render(<BootScreen onComplete={mockOnComplete} />)
    expect(screen.getByTestId('boot-screen')).toBeInTheDocument()
    expect(screen.getByLabelText('NEBULA OS')).toBeInTheDocument()
  })

  it('displays a progress bar starting at 0%', () => {
    render(<BootScreen onComplete={mockOnComplete} />)
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-valuenow', '0')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  it('advances progress bar over time', () => {
    render(<BootScreen onComplete={mockOnComplete} />)
    const progressBar = screen.getByRole('progressbar')

    // After 1.5 seconds, should be roughly 50%
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    const midProgress = Number(progressBar.getAttribute('aria-valuenow'))
    expect(midProgress).toBeGreaterThan(40)
    expect(midProgress).toBeLessThan(60)
  })

  it('displays boot messages sequentially with delays', () => {
    render(<BootScreen onComplete={mockOnComplete} />)

    // No messages initially
    expect(screen.queryByText('Initializing Nebula Core...')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading modules...')).not.toBeInTheDocument()
    expect(screen.queryByText('Access granted.')).not.toBeInTheDocument()

    // First message after 700ms
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByText('Initializing Nebula Core...')).toBeInTheDocument()
    expect(screen.queryByText('Loading modules...')).not.toBeInTheDocument()

    // Second message after another 700ms
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByText('Loading modules...')).toBeInTheDocument()
    expect(screen.queryByText('Access granted.')).not.toBeInTheDocument()

    // Third message after another 700ms
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByText('Access granted.')).toBeInTheDocument()
  })

  it('calls onComplete after boot duration plus glitch transition', () => {
    render(<BootScreen onComplete={mockOnComplete} />)

    // Not called before boot completes
    act(() => {
      vi.advanceTimersByTime(2900)
    })
    expect(mockOnComplete).not.toHaveBeenCalled()

    // After boot duration (3000ms) + glitch (400ms)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(mockOnComplete).toHaveBeenCalledTimes(1)
  })

  it('sets sessionStorage flag when boot completes', () => {
    render(<BootScreen onComplete={mockOnComplete} />)

    expect(sessionStorage.getItem('nebula-booted')).toBeNull()

    // Complete boot + glitch
    act(() => {
      vi.advanceTimersByTime(3500)
    })

    expect(sessionStorage.getItem('nebula-booted')).toBe('true')
  })

  it('progress bar reaches 100% at boot completion', () => {
    render(<BootScreen onComplete={mockOnComplete} />)
    const progressBar = screen.getByRole('progressbar')

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
  })
})
