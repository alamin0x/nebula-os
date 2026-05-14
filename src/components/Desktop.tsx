import { memo, useCallback } from 'react';
import { StatusBar } from './StatusBar';
import { Dock } from './Dock';
import { DesktopIcons } from './DesktopIcons';
import BackgroundRenderer from './BackgroundRenderer';
import MouseGlow from './MouseGlow';
import WindowManager from './WindowManager';
import MatrixRain from './MatrixRain';
import HackSequence from './HackSequence';
import ContextMenu from './ContextMenu';
import { useTerminalStore } from '../stores/terminalStore';
import { useSettingsStore, WALLPAPER_OPTIONS } from '../stores/settingsStore';

/**
 * Desktop layout component — the main container rendered after boot.
 *
 * Composes:
 * - BackgroundRenderer (animated nebula background, z-index 0)
 * - MouseGlow (cursor glow effect, z-index 1)
 * - StatusBar (top bar with clock, z-index 10)
 * - Dock (left-side app launcher, z-index 10)
 * - WindowManager (react-rnd powered windows, z-index 100+)
 * - MatrixRain (overlay triggered by terminal "matrix" command, z-index 1000)
 * - HackSequence (overlay triggered by terminal "hack" command, z-index 1000)
 * - ContextMenu (right-click menu, z-index 2000)
 *
 * Uses absolute/fixed positioning to layer elements correctly per the z-index stack:
 *   Background (0) → Desktop UI (10) → Windows (100+) → Overlays (1000) → Context Menu (2000)
 */
const Desktop = memo(function Desktop() {
  const matrixRainActive = useTerminalStore((state) => state.matrixRainActive);
  const setMatrixRainActive = useTerminalStore((state) => state.setMatrixRainActive);
  const hackActive = useTerminalStore((state) => state.hackActive);
  const setHackActive = useTerminalStore((state) => state.setHackActive);
  const wallpaper = useSettingsStore((state) => state.wallpaper);

  const handleMatrixDismiss = useCallback(() => {
    setMatrixRainActive(false);
  }, [setMatrixRainActive]);

  const handleHackComplete = useCallback(() => {
    setHackActive(false);
  }, [setHackActive]);

  // Determine wallpaper background style
  const wallpaperDef = WALLPAPER_OPTIONS.find((w) => w.id === wallpaper);
  const showAnimatedBg = wallpaper === 'nebula-default';
  const wallpaperCss = wallpaperDef?.css || '';

  // Cyber Grid needs a special overlay for the grid lines
  const isCyberGrid = wallpaper === 'cyber-grid';

  return (
    <div
      className="h-full w-full relative overflow-hidden"
      style={{
        backgroundColor: 'var(--theme-background)',
        background: !showAnimatedBg ? wallpaperCss : undefined,
      }}
      data-testid="desktop"
    >
      {/* Layer 0: Animated background (only for nebula-default wallpaper) */}
      {showAnimatedBg && <BackgroundRenderer />}

      {/* Cyber Grid overlay */}
      {isCyberGrid && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            backgroundImage:
              'linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden="true"
        />
      )}

      {/* Layer 1: Mouse glow effect */}
      <MouseGlow />

      {/* Layer 10: Desktop UI — StatusBar + Dock + Desktop Icons */}
      <StatusBar />
      <Dock />
      <DesktopIcons />

      {/* Layer 100+: Window rendering area */}
      <WindowManager />

      {/* Layer 1000: Matrix rain overlay */}
      {matrixRainActive && (
        <MatrixRain onDismiss={handleMatrixDismiss} />
      )}

      {/* Layer 1000: Hack sequence overlay */}
      {hackActive && <HackSequence onComplete={handleHackComplete} />}

      {/* Layer 2000: Context menu */}
      <ContextMenu />
    </div>
  );
});

export default Desktop;
