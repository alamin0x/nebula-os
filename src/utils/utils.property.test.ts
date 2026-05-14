import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatClock, formatDate } from './formatTime';
import { clampPosition } from './clampPosition';
import { extractTitle } from './extractTitle';
import { CircularBuffer } from './circularBuffer';
import { magneticEffect } from './magneticEffect';

// Feature: nebula-os, Property 1: Clock formatting produces valid time strings
// **Validates: Requirements 2.1, 8.3**
describe('Property 1: Clock formatting produces valid time strings', () => {
  // Generate valid dates using integer timestamps to avoid NaN dates
  const validDateArb = fc.integer({ min: 0, max: 4133980800000 }).map((ts) => new Date(ts));

  it('formatClock produces a valid HH:MM:SS string for any Date', () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const result = formatClock(date);

        // Must match HH:MM:SS pattern
        const match = result.match(/^(\d{2}):(\d{2}):(\d{2})$/);
        expect(match).not.toBeNull();

        const hours = parseInt(match![1], 10);
        const minutes = parseInt(match![2], 10);
        const seconds = parseInt(match![3], 10);

        // HH is 00-23, MM is 00-59, SS is 00-59
        expect(hours).toBeGreaterThanOrEqual(0);
        expect(hours).toBeLessThanOrEqual(23);
        expect(minutes).toBeGreaterThanOrEqual(0);
        expect(minutes).toBeLessThanOrEqual(59);
        expect(seconds).toBeGreaterThanOrEqual(0);
        expect(seconds).toBeLessThanOrEqual(59);
      }),
      { numRuns: 100 },
    );
  });

  it('formatDate produces a valid "weekday, month day" string for any Date', () => {
    const weekdays = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday',
      'Thursday', 'Friday', 'Saturday',
    ];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    fc.assert(
      fc.property(validDateArb, (date) => {
        const result = formatDate(date);

        // Must match "weekday, month day" pattern
        const match = result.match(/^(\w+), (\w+) (\d+)$/);
        expect(match).not.toBeNull();

        const weekday = match![1];
        const month = match![2];
        const day = parseInt(match![3], 10);

        expect(weekdays).toContain(weekday);
        expect(months).toContain(month);
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(31);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Property 8: Window position constraint keeps title bar visible
// **Validates: Requirements 4.9**
describe('Property 8: Window position constraint keeps title bar visible', () => {
  it('clamped position always keeps at least 50px of title bar within viewport', () => {
    const positionArb = fc.record({
      x: fc.integer({ min: -10000, max: 10000 }),
      y: fc.integer({ min: -10000, max: 10000 }),
    });
    const sizeArb = fc.record({
      width: fc.integer({ min: 200, max: 3000 }),
      height: fc.integer({ min: 150, max: 2000 }),
    });
    const viewportArb = fc.record({
      width: fc.integer({ min: 320, max: 3840 }),
      height: fc.integer({ min: 240, max: 2160 }),
    });

    fc.assert(
      fc.property(positionArb, sizeArb, viewportArb, (position, windowSize, viewport) => {
        const clamped = clampPosition(position, windowSize, viewport);

        // At least 50px of the window's width is visible horizontally
        // The right edge of the window (clamped.x + windowSize.width) must be >= 50
        expect(clamped.x + windowSize.width).toBeGreaterThanOrEqual(50);
        // The left edge must be at most viewport.width - 50
        expect(clamped.x).toBeLessThanOrEqual(viewport.width - 50);

        // Title bar stays visible vertically
        // Top edge is at least 0
        expect(clamped.y).toBeGreaterThanOrEqual(0);
        // Top edge is at most viewport.height - 50
        expect(clamped.y).toBeLessThanOrEqual(viewport.height - 50);
      }),
      { numRuns: 100 },
    );
  });

  it('positions already within bounds are unchanged', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 200, max: 1000 }),
          height: fc.integer({ min: 150, max: 800 }),
        }),
        fc.record({
          width: fc.integer({ min: 1024, max: 3840 }),
          height: fc.integer({ min: 768, max: 2160 }),
        }),
        (windowSize, viewport) => {
          // Generate a position that's well within bounds
          const safeX = Math.floor(viewport.width / 4);
          const safeY = Math.floor(viewport.height / 4);
          const position = { x: safeX, y: safeY };

          const clamped = clampPosition(position, windowSize, viewport);
          expect(clamped.x).toBe(position.x);
          expect(clamped.y).toBe(position.y);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Property 10: Note title extraction
// **Validates: Requirements 5.5**
describe('Property 10: Note title extraction', () => {
  it('extracted title is at most 50 characters', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 1000 }), (content) => {
        const title = extractTitle(content);
        expect(title.length).toBeLessThanOrEqual(50);
      }),
      { numRuns: 100 },
    );
  });

  it('extracted title equals first 50 chars of first line (or full first line if shorter)', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 1000 }), (content) => {
        const title = extractTitle(content);
        const firstLine = content.split('\n')[0];
        const expected = firstLine.slice(0, 50);
        expect(title).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('returns empty string for empty content', () => {
    expect(extractTitle('')).toBe('');
  });

  it('multiline content only uses the first line', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (line1, line2) => {
          const content = `${line1}\n${line2}`;
          const title = extractTitle(content);
          // Title should never contain a newline
          expect(title).not.toContain('\n');
          // Title should be derived from line1 only
          expect(title).toBe(line1.slice(0, 50));
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Property 15: Circular buffer invariant
// **Validates: Requirements 8.1, 8.2**
describe('Property 15: Circular buffer invariant', () => {
  it('buffer never exceeds 30 entries regardless of push count', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float(), { minLength: 0, maxLength: 200 }),
        (values) => {
          const buffer = new CircularBuffer<number>(30);
          for (const v of values) {
            buffer.push(v);
          }
          expect(buffer.size).toBeLessThanOrEqual(30);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('entries are in FIFO order (oldest first, newest last)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
        (values) => {
          const buffer = new CircularBuffer<number>(30);
          for (const v of values) {
            buffer.push(v);
          }

          const all = buffer.getAll();
          // The entries should be the last min(values.length, 30) values in order
          const expectedCount = Math.min(values.length, 30);
          expect(all.length).toBe(expectedCount);

          const expectedValues = values.slice(-expectedCount);
          expect(all).toEqual(expectedValues);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('buffer size equals min(pushCount, maxSize)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.array(fc.integer(), { minLength: 0, maxLength: 100 }),
        (maxSize, values) => {
          const buffer = new CircularBuffer<number>(maxSize);
          for (const v of values) {
            buffer.push(v);
          }
          expect(buffer.size).toBe(Math.min(values.length, maxSize));
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Property 20: Magnetic dock icon offset constraint
// **Validates: Requirements 12.6**
describe('Property 20: Magnetic dock icon offset constraint', () => {
  it('offset magnitude is at most 6px when cursor is within 80px', () => {
    const posArb = fc.record({
      x: fc.float({ min: -500, max: 500, noNaN: true }),
      y: fc.float({ min: -500, max: 500, noNaN: true }),
    });

    fc.assert(
      fc.property(posArb, posArb, (cursor, icon) => {
        const offset = magneticEffect(cursor, icon);
        const magnitude = Math.sqrt(offset.x * offset.x + offset.y * offset.y);

        // Offset magnitude must never exceed 6px
        expect(magnitude).toBeLessThanOrEqual(6 + 1e-10); // floating point tolerance
      }),
      { numRuns: 100 },
    );
  });

  it('offset is zero when cursor is more than 80px from icon', () => {
    const iconArb = fc.record({
      x: fc.float({ min: -200, max: 200, noNaN: true }),
      y: fc.float({ min: -200, max: 200, noNaN: true }),
    });

    fc.assert(
      fc.property(
        iconArb,
        fc.float({ min: 81, max: 500, noNaN: true }),
        fc.float({ min: 0, max: Math.fround(2 * Math.PI), noNaN: true }),
        (icon, distance, angle) => {
          // Place cursor at exactly `distance` away from icon center
          const cursor = {
            x: icon.x + distance * Math.cos(angle),
            y: icon.y + distance * Math.sin(angle),
          };

          const offset = magneticEffect(cursor, icon);
          expect(offset.x).toBe(0);
          expect(offset.y).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('offset is directed toward the cursor position', () => {
    const iconArb = fc.record({
      x: fc.float({ min: -200, max: 200, noNaN: true }),
      y: fc.float({ min: -200, max: 200, noNaN: true }),
    });

    fc.assert(
      fc.property(
        iconArb,
        fc.float({ min: 1, max: 79, noNaN: true }),
        fc.float({ min: 0, max: Math.fround(2 * Math.PI), noNaN: true }),
        (icon, distance, angle) => {
          // Place cursor within 80px but not at center
          const cursor = {
            x: icon.x + distance * Math.cos(angle),
            y: icon.y + distance * Math.sin(angle),
          };

          const offset = magneticEffect(cursor, icon);

          // Direction from icon to cursor
          const dx = cursor.x - icon.x;
          const dy = cursor.y - icon.y;

          // Dot product of offset and direction should be positive (same direction)
          const dot = offset.x * dx + offset.y * dy;
          expect(dot).toBeGreaterThanOrEqual(-1e-10); // floating point tolerance
        },
      ),
      { numRuns: 100 },
    );
  });
});
