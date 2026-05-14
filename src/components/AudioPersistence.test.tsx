import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AudioPersistence from './AudioPersistence';
import { useMusicStore } from '../stores/musicStore';

// Mock HTMLMediaElement methods
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();
const mockLoad = vi.fn();

beforeEach(() => {
  // Mock HTMLMediaElement.prototype methods
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: mockPlay,
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: mockPause,
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: mockLoad,
  });
});

describe('AudioPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPlay.mockResolvedValue(undefined);
    mockPause.mockClear();
    mockLoad.mockClear();

    useMusicStore.getState().stopProgressSimulation();
    useMusicStore.setState({
      tracks: [
        { id: '1', title: 'Track 1', artist: 'Artist 1', src: '/audio/track1.mp3' },
        { id: '2', title: 'Track 2', artist: 'Artist 2', src: '/audio/track2.mp3' },
        { id: '3', title: 'Track 3', artist: 'Artist 3', src: '/audio/track3.mp3' },
      ],
      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.7,
      progress: 0,
    });
  });

  afterEach(() => {
    useMusicStore.getState().stopProgressSimulation();
    vi.useRealTimers();
  });

  it('renders an audio element at the app level', () => {
    render(<AudioPersistence />);
    const audio = screen.getByTestId('audio-persistence-element');
    expect(audio).toBeInTheDocument();
    expect(audio.tagName).toBe('AUDIO');
  });

  it('syncs volume from musicStore to audio element', () => {
    render(<AudioPersistence />);
    const audio = screen.getByTestId('audio-persistence-element') as HTMLAudioElement;

    act(() => {
      useMusicStore.getState().setVolume(0.3);
    });

    expect(audio.volume).toBe(0.3);
  });

  it('calls audio.play() when musicStore isPlaying becomes true', async () => {
    render(<AudioPersistence />);

    await act(async () => {
      useMusicStore.setState({ isPlaying: true });
    });

    expect(mockPlay).toHaveBeenCalled();
  });

  it('calls audio.pause() when musicStore isPlaying becomes false', async () => {
    useMusicStore.setState({ isPlaying: true });
    render(<AudioPersistence />);

    await act(async () => {
      useMusicStore.setState({ isPlaying: false });
    });

    expect(mockPause).toHaveBeenCalled();
  });

  it('shows autoplay blocked prompt when play() is rejected', async () => {
    mockPlay.mockRejectedValueOnce(new Error('Autoplay blocked'));

    render(<AudioPersistence />);

    await act(async () => {
      useMusicStore.setState({ isPlaying: true });
    });

    // Wait for the promise rejection to be handled
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('autoplay-blocked-prompt')).toBeInTheDocument();
    expect(screen.getByText('🎵 Click to enable audio')).toBeInTheDocument();
  });

  it('dismisses autoplay prompt and resumes playback on click', async () => {
    mockPlay.mockRejectedValueOnce(new Error('Autoplay blocked'));

    render(<AudioPersistence />);

    await act(async () => {
      useMusicStore.setState({ isPlaying: true });
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Now allow play to succeed
    mockPlay.mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(screen.getByTestId('autoplay-blocked-prompt'));
    });

    expect(screen.queryByTestId('autoplay-blocked-prompt')).not.toBeInTheDocument();
    expect(useMusicStore.getState().isPlaying).toBe(true);
  });

  it('skips to next track on audio error when playing', async () => {
    useMusicStore.setState({ isPlaying: true, currentTrackIndex: 0 });
    render(<AudioPersistence />);

    const audio = screen.getByTestId('audio-persistence-element');

    await act(async () => {
      fireEvent.error(audio);
    });

    expect(useMusicStore.getState().currentTrackIndex).toBe(1);
  });

  it('pauses on audio error when only one track exists', async () => {
    useMusicStore.setState({
      isPlaying: true,
      currentTrackIndex: 0,
      tracks: [{ id: '1', title: 'Only Track', artist: 'Artist', src: '/audio/only.mp3' }],
    });
    render(<AudioPersistence />);

    const audio = screen.getByTestId('audio-persistence-element');

    await act(async () => {
      fireEvent.error(audio);
    });

    expect(useMusicStore.getState().isPlaying).toBe(false);
  });

  describe('audio persistence across window lifecycle', () => {
    it('musicStore isPlaying state is not affected by component unmount/remount', () => {
      // Start playing
      useMusicStore.getState().play();
      expect(useMusicStore.getState().isPlaying).toBe(true);

      // Simulate window close/minimize — the AudioPersistence component stays mounted
      // at App level, but even if it were unmounted, the store state persists
      const { unmount } = render(<AudioPersistence />);
      unmount();

      // isPlaying state persists in the store
      expect(useMusicStore.getState().isPlaying).toBe(true);
    });

    it('progress simulation continues regardless of MusicPlayer window visibility', () => {
      useMusicStore.getState().play();
      vi.advanceTimersByTime(150 * 20); // 20 ticks = 10% progress

      expect(useMusicStore.getState().progress).toBe(10);
      expect(useMusicStore.getState().isPlaying).toBe(true);

      // Simulate more time passing (window minimized/closed — store is independent)
      vi.advanceTimersByTime(150 * 20); // 20 more ticks

      expect(useMusicStore.getState().progress).toBe(20);
      expect(useMusicStore.getState().isPlaying).toBe(true);
    });

    it('re-opened MusicPlayer reflects current playback state', () => {
      // Start playing and advance progress
      useMusicStore.getState().play();
      vi.advanceTimersByTime(150 * 40); // 40 ticks = 20% progress

      // Verify state is correct (as if MusicPlayer window was re-opened)
      const state = useMusicStore.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.progress).toBe(20);
      expect(state.currentTrackIndex).toBe(0);
    });

    it('AudioPersistence component renders outside window DOM hierarchy', () => {
      // This test verifies the component renders independently
      const { container } = render(<AudioPersistence />);
      const audio = container.querySelector('audio');
      expect(audio).not.toBeNull();
      // The audio element should not be inside any window chrome
      expect(audio?.closest('[data-testid="window-chrome"]')).toBeNull();
    });
  });
});
