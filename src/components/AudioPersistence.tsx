import { useEffect, useRef, useCallback, useState, memo } from 'react';
import { useMusicStore } from '../stores/musicStore';

/**
 * AudioPersistence — renders an HTML5 Audio element at the App level,
 * outside the window DOM, so that music playback continues uninterrupted
 * when the Music Player window is minimized, closed, or unfocused.
 *
 * Responsibilities:
 * - Syncs audio playback state with musicStore (play/pause/track/volume)
 * - Handles browser autoplay policy (shows prompt on rejection)
 * - Handles track load failures (skips to next track)
 * - Persists playback regardless of window lifecycle
 */
const AudioPersistence = memo(function AudioPersistence() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const isPlaying = useMusicStore((state) => state.isPlaying);
  const volume = useMusicStore((state) => state.volume);
  const currentTrackIndex = useMusicStore((state) => state.currentTrackIndex);
  const tracks = useMusicStore((state) => state.tracks);
  const pause = useMusicStore((state) => state.pause);
  const next = useMusicStore((state) => state.next);

  const currentTrack = tracks[currentTrackIndex];

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sync track source
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.src;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          // Autoplay blocked or load error — handled by error/play handlers
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex, currentTrack?.src]);

  // Sync play/pause state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Browser autoplay policy blocked playback
          setAutoplayBlocked(true);
          pause();
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, pause]);

  // Handle track load error — skip to next track
  const handleError = useCallback(() => {
    if (isPlaying && tracks.length > 1) {
      next();
    } else {
      pause();
    }
  }, [isPlaying, tracks.length, next, pause]);

  // Handle user click to enable audio after autoplay block
  const handleEnableAudio = useCallback(() => {
    setAutoplayBlocked(false);
    useMusicStore.getState().play();
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        preload="auto"
        onError={handleError}
        data-testid="audio-persistence-element"
      />
      {autoplayBlocked && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[2000] px-4 py-2 rounded-lg cursor-pointer transition-opacity duration-200 hover:opacity-90"
          style={{
            background: 'var(--theme-surface)',
            border: '1px solid var(--theme-primary)',
            color: 'var(--theme-text)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={handleEnableAudio}
          role="button"
          aria-label="Click to enable audio"
          data-testid="autoplay-blocked-prompt"
        >
          🎵 Click to enable audio
        </div>
      )}
    </>
  );
});

export default AudioPersistence;
