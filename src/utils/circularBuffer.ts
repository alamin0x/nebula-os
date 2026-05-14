/**
 * A fixed-size FIFO circular buffer that holds at most `maxSize` entries.
 * Entries are stored in FIFO order: oldest first, newest last.
 * When the buffer is full, the oldest entry is discarded on push.
 */
export class CircularBuffer<T> {
  private buffer: T[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 30) {
    this.maxSize = maxSize;
  }

  /**
   * Push a new value into the buffer.
   * If the buffer is at capacity, the oldest entry is removed.
   */
  push(value: T): void {
    if (this.buffer.length >= this.maxSize) {
      this.buffer.shift();
    }
    this.buffer.push(value);
  }

  /**
   * Returns all entries in FIFO order (oldest first, newest last).
   */
  getAll(): T[] {
    return [...this.buffer];
  }

  /**
   * Returns the current number of entries in the buffer.
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Clears all entries from the buffer.
   */
  clear(): void {
    this.buffer = [];
  }
}
