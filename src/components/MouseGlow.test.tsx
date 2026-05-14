import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MouseGlow } from './MouseGlow';

describe('MouseGlow', () => {
  beforeEach(() => {
    // Reset theme store state by clearing localStorage
    localStorage.clear();
  });

  it('renders a glow element with pointer-events-none', () => {
    const { container } = render(<MouseGlow />);
    const glow = container.firstElementChild as HTMLElement;
    expect(glow).toBeInTheDocument();
    expect(glow).toHaveClass('pointer-events-none');
  });

  it('has aria-hidden attribute for accessibility', () => {
    const { container } = render(<MouseGlow />);
    const glow = container.firstElementChild as HTMLElement;
    expect(glow).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses radial gradient with theme accent color', () => {
    const { container } = render(<MouseGlow />);
    const glow = container.firstElementChild as HTMLElement;
    // Default theme is cyberpunk with accent #EC4899
    // jsdom converts hex+alpha to rgba, so check for the rgba equivalent
    expect(glow.style.background).toContain('radial-gradient');
    expect(glow.style.background).toMatch(/rgba\(236,\s*72,\s*153/);
  });

  it('has opacity no greater than 15%', () => {
    const { container } = render(<MouseGlow />);
    const glow = container.firstElementChild as HTMLElement;
    const opacity = parseFloat(glow.style.opacity);
    expect(opacity).toBeLessThanOrEqual(0.15);
  });

  it('has radius no larger than 300px (600px diameter)', () => {
    const { container } = render(<MouseGlow />);
    const glow = container.firstElementChild as HTMLElement;
    const width = parseInt(glow.style.width);
    const height = parseInt(glow.style.height);
    expect(width).toBeLessThanOrEqual(600);
    expect(height).toBeLessThanOrEqual(600);
  });

  it('updates transform on mousemove', () => {
    const { container } = render(<MouseGlow />);
    const glow = container.firstElementChild as HTMLElement;

    act(() => {
      fireEvent(
        window,
        new MouseEvent('mousemove', {
          clientX: 200,
          clientY: 300,
        })
      );
    });

    expect(glow.style.transform).toBe('translate(200px, 300px)');
  });

  it('updates transform on subsequent mousemove events', () => {
    const { container } = render(<MouseGlow />);
    const glow = container.firstElementChild as HTMLElement;

    act(() => {
      fireEvent(
        window,
        new MouseEvent('mousemove', { clientX: 100, clientY: 150 })
      );
    });
    expect(glow.style.transform).toBe('translate(100px, 150px)');

    act(() => {
      fireEvent(
        window,
        new MouseEvent('mousemove', { clientX: 500, clientY: 400 })
      );
    });
    expect(glow.style.transform).toBe('translate(500px, 400px)');
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = render(<MouseGlow />);
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    removeSpy.mockRestore();
  });
});
