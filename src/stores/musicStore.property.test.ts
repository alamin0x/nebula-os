import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useMusicStore } from './musicStore';
import type { Track } from '../types/index';

// Helper to generate a track arbitrary
const trackArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  artist: fc.string({ minLength: 1, maxLength: 50 }),
  src: fc.string({ minLength: 1, maxLength: 100 }),
});

// Generate a non-empty playlist (N >= 1)
const playlistArb = fc.array(trackArb, { minLength: 1, maxLength: 20 });

// Feature: nebula-os, Property 13: Playlist index wrapping
// **Validates: Requirements 7.4**
describe('Property 13: Playlist index wrapping', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMusicStore.getState().stopProgressSimulation();
    localStorage.clear();
  });

  afterEach(() => {
    useMusicStore.getState().stopProgressSimulation();
    vi.useRealTimers();
  });

  it('next at last track wraps to index 0', () => {
    fc.assert(
      fc.property(playlistArb, (tracks: Track[]) => {
        const lastIndex = tracks.length - 1;
        useMusicStore.setState({
          tracks,
          currentTrackIndex: lastIndex,
          isPlaying: false,
          volume: 0.7,
        });

        useMusicStore.getState().next();

        expect(useMusicStore.getState().currentTrackIndex).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it('previous at index 0 wraps to last track', () => {
    fc.assert(
      fc.property(playlistArb, (tracks: Track[]) => {
        useMusicStore.setState({
          tracks,
          currentTrackIndex: 0,
          isPlaying: false,
          volume: 0.7,
        });

        useMusicStore.getState().previous();

        expect(useMusicStore.getState().currentTrackIndex).toBe(tracks.length - 1);
      }),
      { numRuns: 100 },
    );
  });

  it('next always produces a valid track index', () => {
    fc.assert(
      fc.property(
        playlistArb,
        fc.nat(),
        (tracks: Track[], rawIndex: number) => {
          const currentIndex = rawIndex % tracks.length;
          useMusicStore.setState({
            tracks,
            currentTrackIndex: currentIndex,
            isPlaying: false,
            volume: 0.7,
          });

          useMusicStore.getState().next();

          const newIndex = useMusicStore.getState().currentTrackIndex;
          expect(newIndex).toBeGreaterThanOrEqual(0);
          expect(newIndex).toBeLessThan(tracks.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('previous always produces a valid track index', () => {
    fc.assert(
      fc.property(
        playlistArb,
        fc.nat(),
        (tracks: Track[], rawIndex: number) => {
          const currentIndex = rawIndex % tracks.length;
          useMusicStore.setState({
            tracks,
            currentTrackIndex: currentIndex,
            isPlaying: false,
            volume: 0.7,
          });

          useMusicStore.getState().previous();

          const newIndex = useMusicStore.getState().currentTrackIndex;
          expect(newIndex).toBeGreaterThanOrEqual(0);
          expect(newIndex).toBeLessThan(tracks.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('next followed by previous returns to original index', () => {
    fc.assert(
      fc.property(
        playlistArb,
        fc.nat(),
        (tracks: Track[], rawIndex: number) => {
          const currentIndex = rawIndex % tracks.length;
          useMusicStore.setState({
            tracks,
            currentTrackIndex: currentIndex,
            isPlaying: false,
            volume: 0.7,
          });

          useMusicStore.getState().next();
          useMusicStore.getState().previous();

          expect(useMusicStore.getState().currentTrackIndex).toBe(currentIndex);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Property 14: Volume clamping
// **Validates: Requirements 7.6**
describe('Property 14: Volume clamping', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setVolume always clamps to [0, 1] for any numeric input', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (volume: number) => {
          useMusicStore.getState().setVolume(volume);

          const stored = useMusicStore.getState().volume;
          expect(stored).toBeGreaterThanOrEqual(0);
          expect(stored).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('values within [0, 1] are preserved exactly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (volume: number) => {
          useMusicStore.getState().setVolume(volume);

          expect(useMusicStore.getState().volume).toBe(volume);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('negative values are clamped to 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: -Number.MIN_VALUE, noNaN: true, noDefaultInfinity: true }),
        (volume: number) => {
          useMusicStore.getState().setVolume(volume);

          expect(useMusicStore.getState().volume).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('values greater than 1 are clamped to 1', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1 + Number.EPSILON, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (volume: number) => {
          useMusicStore.getState().setVolume(volume);

          expect(useMusicStore.getState().volume).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: nebula-os, Play/pause toggle correctness
// **Validates: Requirements 7.2**
describe('musicStore: play/pause toggle correctness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMusicStore.getState().stopProgressSimulation();
    localStorage.clear();
  });

  afterEach(() => {
    useMusicStore.getState().stopProgressSimulation();
    vi.useRealTimers();
  });

  it('play always sets isPlaying to true regardless of prior state', () => {
    fc.assert(
      fc.property(fc.boolean(), (initialPlaying: boolean) => {
        useMusicStore.setState({ isPlaying: initialPlaying });

        useMusicStore.getState().play();

        expect(useMusicStore.getState().isPlaying).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('pause always sets isPlaying to false regardless of prior state', () => {
    fc.assert(
      fc.property(fc.boolean(), (initialPlaying: boolean) => {
        useMusicStore.setState({ isPlaying: initialPlaying });

        useMusicStore.getState().pause();

        expect(useMusicStore.getState().isPlaying).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('play followed by pause always results in not playing', () => {
    fc.assert(
      fc.property(fc.boolean(), (initialPlaying: boolean) => {
        useMusicStore.setState({ isPlaying: initialPlaying });

        useMusicStore.getState().play();
        useMusicStore.getState().pause();

        expect(useMusicStore.getState().isPlaying).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
