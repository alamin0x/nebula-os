import { describe, it, expect } from 'vitest';
import { clampPosition } from './clampPosition';

describe('clampPosition', () => {
  const viewport = { width: 1920, height: 1080 };
  const windowSize = { width: 400, height: 300 };

  it('returns position unchanged when fully within viewport', () => {
    const pos = { x: 100, y: 100 };
    expect(clampPosition(pos, windowSize, viewport)).toEqual({ x: 100, y: 100 });
  });

  it('clamps position when window is dragged too far left', () => {
    const pos = { x: -500, y: 100 };
    const result = clampPosition(pos, windowSize, viewport);
    // minX = -(400 - 50) = -350
    expect(result.x).toBe(-350);
    expect(result.y).toBe(100);
  });

  it('clamps position when window is dragged too far right', () => {
    const pos = { x: 2000, y: 100 };
    const result = clampPosition(pos, windowSize, viewport);
    // maxX = 1920 - 50 = 1870
    expect(result.x).toBe(1870);
    expect(result.y).toBe(100);
  });

  it('clamps position when window is dragged above viewport', () => {
    const pos = { x: 100, y: -50 };
    const result = clampPosition(pos, windowSize, viewport);
    expect(result.y).toBe(0);
  });

  it('clamps position when window is dragged below viewport', () => {
    const pos = { x: 100, y: 1200 };
    const result = clampPosition(pos, windowSize, viewport);
    // maxY = 1080 - 50 = 1030
    expect(result.y).toBe(1030);
  });

  it('ensures at least 50px of title bar is visible in all directions', () => {
    const pos = { x: -9999, y: -9999 };
    const result = clampPosition(pos, windowSize, viewport);
    // At minX, the right edge of window is at minX + width = -350 + 400 = 50px visible
    expect(result.x + windowSize.width).toBeGreaterThanOrEqual(50);
    expect(result.y).toBeGreaterThanOrEqual(0);
  });
});
