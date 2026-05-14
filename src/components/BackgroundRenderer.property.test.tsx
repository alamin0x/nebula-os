import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import BackgroundRenderer from './BackgroundRenderer';

// Feature: nebula-os, Property 3: Particle count invariant
// **Validates: Requirements 3.3**

// Mock canvas context to track draw calls (each arc call = one particle drawn)
let arcCallCount = 0;
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(() => { arcCallCount++; }),
  fill: vi.fn(),
  fillStyle: '',
};

describe('Property 3: Particle count invariant', () => {
  let rafCallbacks: Array<FrameRequestCallback>;
  let rafId: number;

  beforeEach(() => {
    arcCallCount = 0;
    rafCallbacks = [];
    rafId = 0;

    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);

    // Collect requestAnimationFrame callbacks so we can invoke them manually
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('never draws more than 50 particles per animation frame regardless of frame count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }), // number of animation frames to simulate
        (frameCount) => {
          arcCallCount = 0;
          rafCallbacks = [];
          rafId = 0;

          const { unmount } = render(<BackgroundRenderer />);

          // Simulate multiple animation frames
          for (let i = 0; i < frameCount; i++) {
            arcCallCount = 0; // Reset per-frame count
            const cb = rafCallbacks[rafCallbacks.length - 1];
            if (cb) {
              act(() => {
                cb(performance.now() + i * 16);
              });
            }
            // After each frame, the number of arc calls (particles drawn) must be <= 50
            expect(arcCallCount).toBeLessThanOrEqual(50);
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('never renders more than 50 particle-related DOM elements regardless of re-renders', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // number of re-renders to simulate
        (rerenderCount) => {
          const { rerender, unmount } = render(<BackgroundRenderer />);

          for (let i = 0; i < rerenderCount; i++) {
            rerender(<BackgroundRenderer />);
          }

          const container = screen.getByTestId('background-renderer');

          // Count all child elements in the background renderer
          // Should have exactly 3 blobs + 1 canvas = 4 elements max
          // The canvas handles all particles internally, so DOM particle count is 0
          // Total DOM children should never indicate more than 50 particle elements
          const allElements = container.querySelectorAll('*');

          // Blobs are the only non-canvas DOM elements; canvas holds all particles
          // The invariant: no more than 50 particle DOM elements
          // Since particles are canvas-drawn, DOM elements = 3 blobs + 1 canvas
          const blobElements = container.querySelectorAll('[data-testid^="blob-"]');
          const canvasElements = container.querySelectorAll('canvas');

          // Blobs are fixed at 3, canvas at 1
          expect(blobElements.length).toBe(3);
          expect(canvasElements.length).toBe(1);

          // Total non-blob, non-canvas elements that could be particles = 0
          // This ensures no particle DOM elements leak into the DOM
          const particleDomElements = allElements.length - blobElements.length - canvasElements.length;
          expect(particleDomElements).toBeLessThanOrEqual(50);

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('particle count stays bounded after visibility pause/resume cycles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // number of pause/resume cycles
        fc.integer({ min: 1, max: 10 }), // frames between cycles
        (cycles, framesBetween) => {
          arcCallCount = 0;
          rafCallbacks = [];
          rafId = 0;

          const { unmount } = render(<BackgroundRenderer />);

          for (let cycle = 0; cycle < cycles; cycle++) {
            // Pause
            act(() => {
              Object.defineProperty(document, 'visibilityState', {
                value: 'hidden',
                writable: true,
                configurable: true,
              });
              document.dispatchEvent(new Event('visibilitychange'));
            });

            // Resume
            act(() => {
              Object.defineProperty(document, 'visibilityState', {
                value: 'visible',
                writable: true,
                configurable: true,
              });
              document.dispatchEvent(new Event('visibilitychange'));
            });

            // Run some frames after resume
            for (let f = 0; f < framesBetween; f++) {
              arcCallCount = 0;
              const cb = rafCallbacks[rafCallbacks.length - 1];
              if (cb) {
                act(() => {
                  cb(performance.now() + (cycle * framesBetween + f) * 16);
                });
              }
              // Particle draw count must never exceed 50
              expect(arcCallCount).toBeLessThanOrEqual(50);
            }
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
