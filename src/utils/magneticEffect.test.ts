import { describe, it, expect } from 'vitest';
import { magneticEffect } from './magneticEffect';

describe('magneticEffect', () => {
  it('returns zero offset when cursor is exactly at icon center', () => {
    const result = magneticEffect({ x: 100, y: 100 }, { x: 100, y: 100 });
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('returns zero offset when cursor is more than 80px away', () => {
    const result = magneticEffect({ x: 200, y: 100 }, { x: 100, y: 100 });
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('returns non-zero offset when cursor is within 80px', () => {
    const result = magneticEffect({ x: 140, y: 100 }, { x: 100, y: 100 });
    expect(result.x).toBeGreaterThan(0);
    expect(result.y).toBe(0);
  });

  it('offset is directed toward the cursor', () => {
    // Cursor is to the right of icon
    const result = magneticEffect({ x: 150, y: 100 }, { x: 100, y: 100 });
    expect(result.x).toBeGreaterThan(0);

    // Cursor is to the left of icon
    const result2 = magneticEffect({ x: 50, y: 100 }, { x: 100, y: 100 });
    expect(result2.x).toBeLessThan(0);
  });

  it('offset magnitude never exceeds 6px', () => {
    // Very close cursor (1px away)
    const result = magneticEffect({ x: 101, y: 100 }, { x: 100, y: 100 });
    const magnitude = Math.sqrt(result.x * result.x + result.y * result.y);
    expect(magnitude).toBeLessThanOrEqual(6);
  });

  it('offset magnitude increases as cursor gets closer', () => {
    const icon = { x: 100, y: 100 };
    const far = magneticEffect({ x: 170, y: 100 }, icon);
    const close = magneticEffect({ x: 120, y: 100 }, icon);

    const farMag = Math.sqrt(far.x * far.x + far.y * far.y);
    const closeMag = Math.sqrt(close.x * close.x + close.y * close.y);

    expect(closeMag).toBeGreaterThan(farMag);
  });

  it('handles diagonal cursor positions', () => {
    const result = magneticEffect({ x: 130, y: 130 }, { x: 100, y: 100 });
    expect(result.x).toBeGreaterThan(0);
    expect(result.y).toBeGreaterThan(0);
  });

  it('returns zero offset at exactly 80px boundary', () => {
    // 80px to the right
    const result = magneticEffect({ x: 180, y: 100 }, { x: 100, y: 100 });
    expect(result).toEqual({ x: 0, y: 0 });
  });
});
