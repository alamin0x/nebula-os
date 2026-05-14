import { describe, it, expect } from 'vitest';
import { extractTitle } from './extractTitle';

describe('extractTitle', () => {
  it('returns empty string for empty content', () => {
    expect(extractTitle('')).toBe('');
  });

  it('returns full first line when shorter than 50 chars', () => {
    expect(extractTitle('Hello World')).toBe('Hello World');
  });

  it('truncates first line to 50 characters', () => {
    const longLine = 'A'.repeat(100);
    expect(extractTitle(longLine)).toBe('A'.repeat(50));
  });

  it('only uses the first line of multiline content', () => {
    const content = 'First Line\nSecond Line\nThird Line';
    expect(extractTitle(content)).toBe('First Line');
  });

  it('truncates first line of multiline content at 50 chars', () => {
    const content = 'B'.repeat(80) + '\nSecond Line';
    expect(extractTitle(content)).toBe('B'.repeat(50));
  });

  it('handles content that is exactly 50 characters', () => {
    const content = 'C'.repeat(50);
    expect(extractTitle(content)).toBe('C'.repeat(50));
  });
});
