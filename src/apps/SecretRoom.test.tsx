import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SecretRoom from './SecretRoom';

describe('SecretRoom', () => {
  it('renders the ASCII art header', () => {
    render(<SecretRoom />);
    expect(screen.getByLabelText('Secret room ASCII art')).toBeInTheDocument();
  });

  it('renders the welcome text', () => {
    render(<SecretRoom />);
    expect(
      screen.getByText("You've discovered the hidden chamber of Nebula OS.")
    ).toBeInTheDocument();
  });

  it('renders the decode transmission button (interactive element)', () => {
    render(<SecretRoom />);
    const button = screen.getByRole('button', { name: /reveal a hidden message/i });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toContain('Decode Transmission');
  });

  it('reveals a hidden message when decode button is clicked', async () => {
    vi.useFakeTimers();
    render(<SecretRoom />);

    const button = screen.getByRole('button', { name: /reveal a hidden message/i });
    fireEvent.click(button);

    // Advance past the glitch animation delay (400ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // A message should now be visible (italic text from HIDDEN_MESSAGES)
    const messageEl = document.querySelector('p[class*="italic"]');
    expect(messageEl).not.toBeNull();
    expect(messageEl!.textContent).not.toBe('');

    vi.useRealTimers();
  });

  it('renders the star collector mini-game', () => {
    render(<SecretRoom />);
    expect(screen.getByLabelText('Star collector mini-game area')).toBeInTheDocument();
    expect(screen.getByText('★ Star Collector')).toBeInTheDocument();
  });

  it('allows collecting stars and updates the score', () => {
    render(<SecretRoom />);

    // Find a star button and click it
    const starButton = screen.getByLabelText('Collect star 1');
    fireEvent.click(starButton);

    // Score should update
    expect(screen.getByText(/1 \/ 7/)).toBeInTheDocument();
  });

  it('shows completion message when all stars are collected', () => {
    render(<SecretRoom />);

    // Click all 7 stars
    for (let i = 1; i <= 7; i++) {
      const star = screen.getByLabelText(`Collect star ${i}`);
      fireEvent.click(star);
    }

    expect(
      screen.getByText(/All stars collected! You are one with the nebula./i)
    ).toBeInTheDocument();
  });

  it('is exported as default for React.lazy compatibility', async () => {
    const module = await import('./SecretRoom');
    expect(module.default).toBeDefined();
    // React.memo wraps the component in an object with $$typeof, but React.lazy still works with it
    expect(typeof module.default === 'function' || typeof module.default === 'object').toBe(true);
  });

  it('renders credits section', () => {
    render(<SecretRoom />);
    expect(screen.getByText(/NEBULA OS v1.0.0 — SECRET CHAMBER/)).toBeInTheDocument();
  });
});
