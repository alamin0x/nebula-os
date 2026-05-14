import { describe, it, expect } from 'vitest';
import { CircularBuffer } from './circularBuffer';

describe('CircularBuffer', () => {
  it('starts empty', () => {
    const buffer = new CircularBuffer<number>();
    expect(buffer.size).toBe(0);
    expect(buffer.getAll()).toEqual([]);
  });

  it('stores pushed values in FIFO order', () => {
    const buffer = new CircularBuffer<number>();
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);
    expect(buffer.getAll()).toEqual([1, 2, 3]);
  });

  it('never exceeds max size of 30', () => {
    const buffer = new CircularBuffer<number>(30);
    for (let i = 0; i < 50; i++) {
      buffer.push(i);
    }
    expect(buffer.size).toBe(30);
  });

  it('discards oldest entries when full', () => {
    const buffer = new CircularBuffer<number>(3);
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);
    buffer.push(4);
    expect(buffer.getAll()).toEqual([2, 3, 4]);
  });

  it('maintains FIFO order after overflow', () => {
    const buffer = new CircularBuffer<number>(30);
    for (let i = 0; i < 35; i++) {
      buffer.push(i);
    }
    const all = buffer.getAll();
    expect(all[0]).toBe(5); // oldest remaining
    expect(all[all.length - 1]).toBe(34); // newest
  });

  it('clears all entries', () => {
    const buffer = new CircularBuffer<number>();
    buffer.push(1);
    buffer.push(2);
    buffer.clear();
    expect(buffer.size).toBe(0);
    expect(buffer.getAll()).toEqual([]);
  });

  it('returns a copy from getAll, not a reference', () => {
    const buffer = new CircularBuffer<number>();
    buffer.push(1);
    const result = buffer.getAll();
    result.push(999);
    expect(buffer.size).toBe(1);
  });
});
