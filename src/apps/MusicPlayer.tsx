import { useCallback, memo } from 'react';
import { useMusicStore } from '../stores/musicStore';

const MusicPlayer = memo(function MusicPlayer() {
  const {
    tracks,
    currentTrackIndex,
    isPlaying,
    volume,
    progress,
    play,
    pause,
    next,
    previous,
    setVolume,
  } = useMusicStore();

  const currentTrack = tracks[currentTrackIndex];

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolume(parseFloat(e.target.value));
    },
    [setVolume]
  );

  const formatTime = useCallback((percent: number): string => {
    // Simulate a 3:30 track length
    const totalSeconds = 210;
    const currentSeconds = Math.floor((percent / 100) * totalSeconds);
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const totalTime = '3:30';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {/* Blurred album background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(135deg, var(--theme-primary), var(--theme-accent))`,
          filter: 'blur(12px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-4 gap-4">
        {/* Album art / Vinyl */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="relative">
            {/* Vinyl record */}
            <div
              className={`w-40 h-40 rounded-full border-4 border-white/10 flex items-center justify-center ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{
                background: `conic-gradient(from 0deg, #1a1a2e, #2d2d44, #1a1a2e, #2d2d44, #1a1a2e)`,
                animationDuration: '3s',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }}
            >
              {/* Center label */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, var(--theme-primary), var(--theme-accent))`,
                }}
              >
                <div className="w-3 h-3 rounded-full bg-black/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Track info */}
        <div className="text-center">
          <h3
            className="text-lg font-semibold truncate"
            style={{ color: 'var(--theme-text)' }}
          >
            {currentTrack?.title ?? 'No Track'}
          </h3>
          <p
            className="text-sm opacity-70 truncate"
            style={{ color: 'var(--theme-text)' }}
          >
            {currentTrack?.artist ?? 'Unknown Artist'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, var(--theme-primary), var(--theme-accent))`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs opacity-60" style={{ color: 'var(--theme-text)' }}>
            <span>{formatTime(progress)}</span>
            <span>{totalTime}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Previous */}
          <button
            onClick={previous}
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]/70"
            aria-label="Previous track"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
              style={{ color: 'var(--theme-text)' }}
            >
              <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V7.19c0-1.44-1.555-2.342-2.805-1.628L12 9.53V7.19c0-1.44-1.555-2.342-2.805-1.628l-6.928 3.96a1.875 1.875 0 000 3.255l6.928 3.662z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="p-3 rounded-full transition-colors duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              background: `linear-gradient(135deg, var(--theme-primary), var(--theme-accent))`,
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={next}
            className="p-2 rounded-full hover:bg-white/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]/70"
            aria-label="Next track"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
              style={{ color: 'var(--theme-text)' }}
            >
              <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v9.726c0 1.44 1.555 2.342 2.805 1.628L12 16.471v2.34c0 1.44 1.555 2.342 2.805 1.628l6.928-3.96a1.875 1.875 0 000-3.255l-6.928-3.662C13.555 8.848 12 9.75 12 11.19v2.34L5.055 7.06z" />
            </svg>
          </button>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-3 px-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 shrink-0"
            style={{ color: 'var(--theme-text)', opacity: 0.7 }}
          >
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--theme-primary) ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
            }}
            aria-label="Volume"
          />
          <span
            className="text-xs w-8 text-right opacity-70"
            style={{ color: 'var(--theme-text)' }}
          >
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
});

export default MusicPlayer;
