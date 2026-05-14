import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import MusicPlayer from './MusicPlayer';
import { useMusicStore } from '../stores/musicStore';

describe('MusicPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMusicStore.getState().stopProgressSimulation();
    useMusicStore.setState({
      tracks: [
        { id: 'track-1', title: 'Midnight Drive', artist: 'Nebula Beats', src: '/audio/midnight-drive.mp3' },
        { id: 'track-2', title: 'Neon Rain', artist: 'Cyber Lo-Fi', src: '/audio/neon-rain.mp3' },
        { id: 'track-3', title: 'Digital Sunset', artist: 'Ambient Waves', src: '/audio/digital-sunset.mp3' },
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

  it('renders the current track title and artist', () => {
    render(<MusicPlayer />);
    expect(screen.getByText('Midnight Drive')).toBeInTheDocument();
    expect(screen.getByText('Nebula Beats')).toBeInTheDocument();
  });

  it('renders play button when not playing', () => {
    render(<MusicPlayer />);
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  it('renders pause button when playing', () => {
    useMusicStore.setState({ isPlaying: true });
    render(<MusicPlayer />);
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('toggles play/pause on button click', () => {
    render(<MusicPlayer />);

    // Click play
    fireEvent.click(screen.getByLabelText('Play'));
    expect(useMusicStore.getState().isPlaying).toBe(true);

    // Re-render with updated state
    // The component reads from the store so it should reflect the change
  });

  it('toggles from playing to paused on button click', () => {
    useMusicStore.setState({ isPlaying: true });
    render(<MusicPlayer />);

    fireEvent.click(screen.getByLabelText('Pause'));
    expect(useMusicStore.getState().isPlaying).toBe(false);
  });

  it('goes to next track when clicking next button', () => {
    render(<MusicPlayer />);
    fireEvent.click(screen.getByLabelText('Next track'));

    expect(useMusicStore.getState().currentTrackIndex).toBe(1);
  });

  it('goes to previous track when clicking previous button', () => {
    useMusicStore.setState({ currentTrackIndex: 1 });
    render(<MusicPlayer />);
    fireEvent.click(screen.getByLabelText('Previous track'));

    expect(useMusicStore.getState().currentTrackIndex).toBe(0);
  });

  it('wraps to first track when clicking next on last track', () => {
    useMusicStore.setState({ currentTrackIndex: 2 });
    render(<MusicPlayer />);
    fireEvent.click(screen.getByLabelText('Next track'));

    expect(useMusicStore.getState().currentTrackIndex).toBe(0);
  });

  it('wraps to last track when clicking previous on first track', () => {
    useMusicStore.setState({ currentTrackIndex: 0 });
    render(<MusicPlayer />);
    fireEvent.click(screen.getByLabelText('Previous track'));

    expect(useMusicStore.getState().currentTrackIndex).toBe(2);
  });

  it('updates volume when slider changes', () => {
    render(<MusicPlayer />);
    const slider = screen.getByLabelText('Volume');

    fireEvent.change(slider, { target: { value: '0.5' } });
    expect(useMusicStore.getState().volume).toBe(0.5);
  });

  it('displays current volume percentage', () => {
    useMusicStore.setState({ volume: 0.7 });
    render(<MusicPlayer />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('displays track info for second track when index changes', () => {
    useMusicStore.setState({ currentTrackIndex: 1 });
    render(<MusicPlayer />);
    expect(screen.getByText('Neon Rain')).toBeInTheDocument();
    expect(screen.getByText('Cyber Lo-Fi')).toBeInTheDocument();
  });

  it('applies spinning animation class when playing', () => {
    useMusicStore.setState({ isPlaying: true });
    const { container } = render(<MusicPlayer />);
    const vinyl = container.querySelector('.animate-spin');
    expect(vinyl).not.toBeNull();
  });

  it('does not apply spinning animation class when paused', () => {
    useMusicStore.setState({ isPlaying: false });
    const { container } = render(<MusicPlayer />);
    const vinyl = container.querySelector('.animate-spin');
    expect(vinyl).toBeNull();
  });
});
