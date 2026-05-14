import { memo, useCallback } from 'react';
import { StatusBar } from './StatusBar';
import { Dock } from './Dock';
import { DesktopIcons } from './DesktopIcons';
import BackgroundRenderer from './BackgroundRenderer';
import MouseGlow from './MouseGlow';
import WindowManager from './WindowManager';
import MatrixRain from './MatrixRain';
import HackSequence from './HackSequence';
import { useTerminalStore } from '../stores/terminalStore';

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
 *
 * Uses absolute/fixed positioning to layer elements correctly per the z-index stack:
 *   Background (0) → Desktop UI (10) → Windows (100+) → Overlays (1000)
 */
const Desktop = memo(function Desktop() {
  const matrixRainActive = useTerminalStore((state) => state.matrixRainActive);
  const setMatrixRainActive = useTerminalStore((state) => state.setMatrixRainActive);
  const hackActive = useTerminalStore((state) => state.hackActive);
  const setHackActive = useTerminalStore((state) => state.setHackActive);

  const handleMatrixDismiss = useCallback(() => {
    setMatrixRainActive(false);
  }, [setMatrixRainActive]);

  const handleHackComplete = useCallback(() => {
    setHackActive(false);
  }, [setHackActive]);

  return (
    <div
      className="h-full w-full relative overflow-hidden"
      style={{ backgroundColor: 'var(--theme-background)' }}
      data-testid="desktop"
    >
      {/* Layer 0: Animated background */}
      <BackgroundRenderer />

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
    </div>
  );
});

export default Desktop;
