import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HackSequence from './HackSequence';

describe('HackSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the hack sequence overlay', () => {
    const onComplete = vi.fn();
    render(<HackSequence onComplete={onComplete} />);

    expect(screen.getByTestId('hack-sequence')).toBeInTheDocument();
  });

  it('displays the header text', () => {
    const onComplete = vi.fn();
    render(<HackSequence onComplete={onComplete} />);

    expect(screen.getByText('NEBULA INTRUSION FRAMEWORK v3.7.1')).toBeInTheDocument();
  });

  it('dismisses on click', () => {
    const onComplete = vi.fn();
    render(<HackSequence onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('hack-sequence'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('dismisses on keypress', () => {
    const onComplete = vi.fn();
    render(<HackSequence onComplete={onComplete} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('has correct z-index for overlay layer', () => {
    const onComplete = vi.fn();
    render(<HackSequence onComplete={onComplete} />);

    const overlay = screen.getByTestId('hack-sequence');
    expect(overlay.style.zIndex).toBe('1000');
  });

  it('has accessible role and label', () => {
    const onComplete = vi.fn();
    render(<HackSequence onComplete={onComplete} />);

    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveAttribute('aria-label', 'Hack sequence animation');
  });

  it('triggers hack sequence from terminal store', async () => {
    // Test integration: executing "hack" command sets hackActive to true
    const { useTerminalStore } = await import('../stores/terminalStore');

    // Reset store state
    useTerminalStore.setState({ history: [], currentPath: [], hackActive: false });

    const store = useTerminalStore.getState();
    store.executeCommand('hack');

    expect(useTerminalStore.getState().hackActive).toBe(true);
  });

  it('setHackActive(false) deactivates the hack sequence', async () => {
    const { useTerminalStore } = await import('../stores/terminalStore');

    useTerminalStore.setState({ hackActive: true });
    useTerminalStore.getState().setHackActive(false);

    expect(useTerminalStore.getState().hackActive).toBe(false);
  });
});
