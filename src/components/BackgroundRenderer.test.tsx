import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BackgroundRenderer from './BackgroundRenderer';

// Mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillStyle: '',
};

beforeEach(() => {
  // Mock canvas getContext
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);

  // Mock requestAnimationFrame
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    return setTimeout(cb, 16) as unknown as number;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    clearTimeout(id);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BackgroundRenderer', () => {
  it('renders the background container with correct attributes', () => {
    render(<BackgroundRenderer />);
    const container = screen.getByTestId('background-renderer');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('aria-hidden', 'true');
    expect(container.style.pointerEvents).toBe('none');
    expect(container.style.zIndex).toBe('0');
  });

  it('renders exactly 3 blob elements', () => {
    render(<BackgroundRenderer />);
    const blob0 = screen.getByTestId('blob-0');
    const blob1 = screen.getByTestId('blob-1');
    const blob2 = screen.getByTestId('blob-2');
    expect(blob0).toBeInTheDocument();
    expect(blob1).toBeInTheDocument();
    expect(blob2).toBeInTheDocument();
  });

  it('renders a particle canvas', () => {
    render(<BackgroundRenderer />);
    const canvas = screen.getByTestId('particle-canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('pauses animations on visibility hidden', () => {
    render(<BackgroundRenderer />);

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    const blob0 = screen.getByTestId('blob-0');
    expect(blob0.style.animationPlayState).toBe('paused');
  });

  it('resumes animations on visibility visible', () => {
    render(<BackgroundRenderer />);

    // First pause
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Then resume
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    const blob0 = screen.getByTestId('blob-0');
    expect(blob0.style.animationPlayState).toBe('running');
  });

  it('blob elements have pointer-events none via parent container', () => {
    render(<BackgroundRenderer />);
    const container = screen.getByTestId('background-renderer');
    expect(container.style.pointerEvents).toBe('none');
  });

  it('cleans up animation frame and event listeners on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const removeEventSpy = vi.spyOn(document, 'removeEventListener');
    const removeWindowEventSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<BackgroundRenderer />);
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
    expect(removeEventSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeWindowEventSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
