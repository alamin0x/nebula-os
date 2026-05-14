import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useMusicStore } from './musicStore';

describe('musicStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store state before each test
    useMusicStore.getState().stopProgressSimulation();
    useMusicStore.setState({
      tracks: [
        { id: '1', title: 'Track 1', artist: 'Artist 1', src: '/a.mp3' },
        { id: '2', title: 'Track 2', artist: 'Artist 2', src: '/b.mp3' },
        { id: '3', title: 'Track 3', artist: 'Artist 3', src: '/c.mp3' },
      ],
      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.7,
      progress: 0,
    });
    localStorage.clear();
  });

  afterEach(() => {
    useMusicStore.getState().stopProgressSimulation();
    vi.useRealTimers();
  });

  describe('play/pause', () => {
    it('should set isPlaying to true on play', () => {
      useMusicStore.getState().play();
      expect(useMusicStore.getState().isPlaying).toBe(true);
    });

    it('should set isPlaying to false on pause', () => {
      useMusicStore.setState({ isPlaying: true });
      useMusicStore.getState().pause();
      expect(useMusicStore.getState().isPlaying).toBe(false);
    });
  });

  describe('next', () => {
    it('should advance to the next track', () => {
      useMusicStore.getState().next();
      expect(useMusicStore.getState().currentTrackIndex).toBe(1);
    });

    it('should wrap to index 0 when at the last track', () => {
      useMusicStore.setState({ currentTrackIndex: 2 });
      useMusicStore.getState().next();
      expect(useMusicStore.getState().currentTrackIndex).toBe(0);
    });
  });

  describe('previous', () => {
    it('should go to the previous track', () => {
      useMusicStore.setState({ currentTrackIndex: 2 });
      useMusicStore.getState().previous();
      expect(useMusicStore.getState().currentTrackIndex).toBe(1);
    });

    it('should wrap to the last track when at index 0', () => {
      useMusicStore.setState({ currentTrackIndex: 0 });
      useMusicStore.getState().previous();
      expect(useMusicStore.getState().currentTrackIndex).toBe(2);
    });
  });

  describe('setVolume', () => {
    it('should set volume within valid range', () => {
      useMusicStore.getState().setVolume(0.5);
      expect(useMusicStore.getState().volume).toBe(0.5);
    });

    it('should clamp volume to 0 when given a negative value', () => {
      useMusicStore.getState().setVolume(-0.5);
      expect(useMusicStore.getState().volume).toBe(0);
    });

    it('should clamp volume to 1 when given a value greater than 1', () => {
      useMusicStore.getState().setVolume(1.5);
      expect(useMusicStore.getState().volume).toBe(1);
    });

    it('should persist volume to localStorage', () => {
      useMusicStore.getState().setVolume(0.3);
      expect(localStorage.getItem('nebula-music-volume')).toBe('0.3');
    });
  });

  describe('progress persistence', () => {
    it('should advance progress while playing', () => {
      useMusicStore.getState().play();
      vi.advanceTimersByTime(150 * 10); // 10 ticks
      expect(useMusicStore.getState().progress).toBe(5); // 0.5 * 10
    });

    it('should stop progress when paused', () => {
      useMusicStore.getState().play();
      vi.advanceTimersByTime(150 * 10); // advance 10 ticks
      useMusicStore.getState().pause();
      const progressAtPause = useMusicStore.getState().progress;
      vi.advanceTimersByTime(150 * 10); // advance more
      expect(useMusicStore.getState().progress).toBe(progressAtPause);
    });

    it('should retain progress state when not interacted with (simulates minimized window)', () => {
      useMusicStore.getState().play();
      vi.advanceTimersByTime(150 * 20); // advance 20 ticks = 10% progress
      const progressBefore = useMusicStore.getState().progress;
      expect(progressBefore).toBe(10);
      // Simulate window being closed/minimized - progress continues in store
      vi.advanceTimersByTime(150 * 20); // advance 20 more ticks
      expect(useMusicStore.getState().progress).toBe(20);
    });

    it('should reset progress to 0 when next track is called', () => {
      useMusicStore.setState({ progress: 50 });
      useMusicStore.getState().next();
      expect(useMusicStore.getState().progress).toBe(0);
    });

    it('should reset progress to 0 when previous track is called', () => {
      useMusicStore.setState({ progress: 50 });
      useMusicStore.getState().previous();
      expect(useMusicStore.getState().progress).toBe(0);
    });

    it('should auto-advance to next track when progress reaches 100', () => {
      useMusicStore.setState({ progress: 99.5 });
      useMusicStore.getState().play();
      vi.advanceTimersByTime(150); // one tick pushes to 100
      vi.advanceTimersByTime(150); // next tick triggers next()
      expect(useMusicStore.getState().currentTrackIndex).toBe(1);
      expect(useMusicStore.getState().progress).toBe(0);
    });
  });
});
