import { describe, it, expect } from 'vitest';
import { formatClock, formatDate } from './formatTime';

describe('formatClock', () => {
  it('formats midnight as 00:00:00', () => {
    const date = new Date(2024, 0, 1, 0, 0, 0);
    expect(formatClock(date)).toBe('00:00:00');
  });

  it('formats noon as 12:00:00', () => {
    const date = new Date(2024, 0, 1, 12, 0, 0);
    expect(formatClock(date)).toBe('12:00:00');
  });

  it('pads single-digit hours, minutes, and seconds', () => {
    const date = new Date(2024, 0, 1, 3, 5, 9);
    expect(formatClock(date)).toBe('03:05:09');
  });

  it('formats end of day as 23:59:59', () => {
    const date = new Date(2024, 0, 1, 23, 59, 59);
    expect(formatClock(date)).toBe('23:59:59');
  });
});

describe('formatDate', () => {
  it('formats a Monday in January', () => {
    // January 15, 2024 is a Monday
    const date = new Date(2024, 0, 15);
    expect(formatDate(date)).toBe('Monday, January 15');
  });

  it('formats a Sunday in December', () => {
    // December 1, 2024 is a Sunday
    const date = new Date(2024, 11, 1);
    expect(formatDate(date)).toBe('Sunday, December 1');
  });

  it('formats a Wednesday in June', () => {
    // June 5, 2024 is a Wednesday
    const date = new Date(2024, 5, 5);
    expect(formatDate(date)).toBe('Wednesday, June 5');
  });
});
