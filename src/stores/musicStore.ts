import { create } from 'zustand';
import type { MusicStore } from '../types/stores';
import type { Track } from '../types/index';

const defaultTracks: Track[] = [
  {
    id: 'track-1',
    title: 'Midnight Drive',
    artist: 'Nebula Beats',
    src: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  },
  {
    id: 'track-2',
    title: 'Neon Rain',
    artist: 'Cyber Lo-Fi',
    src: 'https://cdn.pixabay.com/audio/2022/10/25/audio_32ff5f5e3e.mp3',
  },
  {
    id: 'track-3',
    title: 'Digital Sunset',
    artist: 'Ambient Waves',
    src: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
  },
];

function loadVolumeFromStorage(): number {
  try {
    const stored = localStorage.getItem('nebula-music-volume');
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) {
        return Math.max(0, Math.min(1, parsed));
      }
    }
  } catch {
    // localStorage unavailable, use default
  }
  return 0.7;
}

function saveVolumeToStorage(volume: number): void {
  try {
    localStorage.setItem('nebula-music-volume', String(volume));
  } catch {
    // localStorage unavailable, silently fail
  }
}

// Module-level interval reference for progress simulation
let progressInterval: ReturnType<typeof setInterval> | null = null;

export const useMusicStore = create<MusicStore>((set, get) => ({
  tracks: defaultTracks,
  currentTrackIndex: 0,
  isPlaying: false,
  volume: loadVolumeFromStorage(),
  progress: 0,

  play: () => {
    set({ isPlaying: true });
    get().startProgressSimulation();
  },

  pause: () => {
    set({ isPlaying: false });
    get().stopProgressSimulation();
  },

  next: () => {
    const { tracks, currentTrackIndex } = get();
    if (tracks.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    set({ currentTrackIndex: nextIndex, progress: 0 });
  },

  previous: () => {
    const { tracks, currentTrackIndex } = get();
    if (tracks.length === 0) return;
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    set({ currentTrackIndex: prevIndex, progress: 0 });
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    set({ volume: clamped });
    saveVolumeToStorage(clamped);
  },

  setProgress: (progress: number) => {
    set({ progress: Math.max(0, Math.min(100, progress)) });
  },

  startProgressSimulation: () => {
    // Clear any existing interval to avoid duplicates
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    progressInterval = setInterval(() => {
      const { progress, next, isPlaying } = get();
      if (!isPlaying) {
        // Safety check: stop if not playing
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        return;
      }
      if (progress >= 100) {
        next();
      } else {
        set({ progress: progress + 0.5 });
      }
    }, 150);
  },

  stopProgressSimulation: () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  },
}));
