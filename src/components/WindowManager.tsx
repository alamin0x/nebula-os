import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useWindowStore } from '../stores/windowStore';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import { clampPosition } from '../utils/clampPosition';
import { AppRenderer } from '../apps/registry';
import WindowChrome from './WindowChrome';
import type { WindowState } from '../types';

/** Built-in app IDs that support resizing */
const BUILT_IN_IDS = new Set(['notes', 'ai-assistant', 'music-player', 'system-monitor', 'terminal', 'secret-room', 'browser', 'app-store']);

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

/** Breakpoint thresholds for responsive behavior */
const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_TABLET = 1024;

type ViewportMode = 'mobile' | 'tablet' | 'desktop';

/**
 * Determines the current viewport mode based on window width.
 */
function getViewportMode(width: number): ViewportMode {
  if (width < BREAKPOINT_MOBILE) return 'mobile';
  if (width < BREAKPOINT_TABLET) return 'tablet';
  return 'desktop';
}

/**
 * Custom hook that tracks viewport size and mode, triggering re-renders on resize.
 */
function useViewport() {
  const [viewport, setViewport] = useState({
    width: globalThis.innerWidth || 1024,
    height: globalThis.innerHeight || 768,
  });

  useEffect(() => {
    function handleResize() {
      setViewport({
        width: globalThis.innerWidth,
        height: globalThis.innerHeight,
      });
    }

    globalThis.addEventListener('resize', handleResize);
    return () => globalThis.removeEventListener('resize', handleResize);
  }, []);

  const mode = getViewportMode(viewport.width);

  return { viewport, mode };
}

/**
 * Computes responsive window position and size based on viewport mode.
 * - Mobile: full-screen (fills available space)
 * - Tablet: constrained to 80% of viewport, centered
 * - Desktop: uses original window position/size with clamping
 */
function getResponsiveWindowBounds(
  window: WindowState,
  viewportWidth: number,
  viewportHeight: number,
  mode: ViewportMode,
) {
  if (mode === 'mobile') {
    // Full-screen card mode
    return {
      position: { x: 0, y: 0 },
      size: { width: viewportWidth, height: viewportHeight },
    };
  }

  if (mode === 'tablet') {
    // Constrained to 80% of viewport, centered
    const maxWidth = Math.floor(viewportWidth * 0.8);
    const maxHeight = Math.floor(viewportHeight * 0.8);
    const constrainedWidth = Math.min(window.size.width, maxWidth);
    const constrainedHeight = Math.min(window.size.height, maxHeight);
    const centeredX = Math.floor((viewportWidth - constrainedWidth) / 2);
    const centeredY = Math.floor((viewportHeight - constrainedHeight) / 2);

    return {
      position: { x: centeredX, y: centeredY },
      size: { width: constrainedWidth, height: constrainedHeight },
    };
  }

  // Desktop: use original bounds, clamped to viewport
  const clamped = clampPosition(
    window.position,
    window.size,
    { width: viewportWidth, height: viewportHeight },
  );

  return {
    position: clamped,
    size: window.size,
  };
}

/**
 * Renders a single window using react-rnd for drag and resize.
 * Adapts behavior based on viewport mode:
 * - Desktop: full drag/resize
 * - Tablet: drag enabled, constrained size
 * - Mobile: fixed full-screen, no drag/resize
 */
const WindowItem = memo(function WindowItem({
  window,
  mode,
  viewportWidth,
  viewportHeight,
}: {
  window: WindowState;
  mode: ViewportMode;
  viewportWidth: number;
  viewportHeight: number;
}) {
  const updatePosition = useWindowStore((s) => s.updatePosition);
  const updateSize = useWindowStore((s) => s.updateSize);
  const focusWindow = useWindowStore((s) => s.focusWindow);

  const bounds = useMemo(
    () => getResponsiveWindowBounds(window, viewportWidth, viewportHeight, mode),
    [window, viewportWidth, viewportHeight, mode],
  );

  const handleDragStop = useCallback(
    (_e: unknown, data: { x: number; y: number }) => {
      const viewport = {
        width: viewportWidth,
        height: viewportHeight,
      };
      const clamped = clampPosition(
        { x: data.x, y: data.y },
        window.size,
        viewport,
      );
      updatePosition(window.id, clamped);
    },
    [window.id, window.size, viewportWidth, viewportHeight, updatePosition],
  );

  const handleResizeStop = useCallback(
    (
      _e: unknown,
      _direction: unknown,
      ref: HTMLElement,
      _delta: unknown,
      position: { x: number; y: number },
    ) => {
      const newWidth = parseInt(ref.style.width, 10);
      const newHeight = parseInt(ref.style.height, 10);
      updateSize(window.id, { width: newWidth, height: newHeight });
      updatePosition(window.id, { x: position.x, y: position.y });
    },
    [window.id, updateSize, updatePosition],
  );

  const handleMouseDown = useCallback(() => {
    focusWindow(window.id);
  }, [window.id, focusWindow]);

  // Mobile: render as a fixed full-screen card (no Rnd needed)
  if (mode === 'mobile') {
    return (
      <div
        data-testid={`window-${window.appId}`}
        data-window-id={window.id}
        className="absolute inset-0 pointer-events-auto"
        style={{ zIndex: window.zIndex }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <WindowChrome
          windowId={window.id}
          appId={window.appId}
          title={window.title}
          isMaximized={window.isMaximized}
          dragHandleClassName="window-drag-handle"
        >
          <AppRenderer appId={window.appId} />
        </WindowChrome>
      </div>
    );
  }

  // Tablet and Desktop: use react-rnd with appropriate constraints
  // Store apps (non-built-in) are fixed size — no resizing
  const isStoreApp = !BUILT_IN_IDS.has(window.appId);
  const disableResize = mode === 'tablet' || isStoreApp;

  return (
    <Rnd
      size={{ width: bounds.size.width, height: bounds.size.height }}
      position={{ x: bounds.position.x, y: bounds.position.y }}
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      dragHandleClassName="window-drag-handle"
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={handleMouseDown}
      enableResizing={!disableResize}
      disableDragging={false}
      style={{ zIndex: window.zIndex, pointerEvents: 'auto' }}
      bounds="parent"
      data-testid={`window-${window.appId}`}
      data-window-id={window.id}
    >
      <WindowChrome
        windowId={window.id}
        appId={window.appId}
        title={window.title}
        isMaximized={window.isMaximized}
        dragHandleClassName="window-drag-handle"
      >
        <AppRenderer appId={window.appId} />
      </WindowChrome>
    </Rnd>
  );
});

/**
 * WindowManager — renders all open (non-minimized) windows from the windowStore
 * using react-rnd for drag and resize functionality.
 *
 * Responsive behavior:
 * - Desktop (≥1024px): standard draggable/resizable windows
 * - Tablet (768–1023px): windows centered, constrained to 80% viewport, draggable
 * - Mobile (<768px): full-screen card mode with bottom tab bar for switching
 *
 * Each window:
 * - Is draggable via the title bar (drag handle class) on tablet/desktop
 * - Is resizable from edges/corners on desktop only
 * - Enforces minimum size of 200x150
 * - Syncs position/size back to the store on drag/resize end
 * - Gains focus (highest z-index) on mousedown/touchstart
 * - Respects z-index from window state
 * - Skips rendering if minimized
 * - Re-constrains on viewport resize using clampPosition
 */
const WindowManager = memo(function WindowManager() {
  const windows = useWindowStore((state) => state.windows);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const { viewport, mode } = useViewport();

  const visibleWindows = useMemo(
    () => windows.filter((w) => !w.isMinimized),
    [windows]
  );

  // On mobile, only show the active (highest z-index) window in the main area
  const activeWindow = useMemo(() => {
    if (mode !== 'mobile' || visibleWindows.length === 0) return null;
    return visibleWindows.reduce((prev, curr) =>
      curr.zIndex > prev.zIndex ? curr : prev,
    );
  }, [mode, visibleWindows]);

  return (
    <>
      <main
        className="absolute inset-0 pt-10 lg:pl-16 z-[100] pointer-events-none"
        data-testid="window-area"
        aria-label="Window workspace"
      >
        {mode === 'mobile' ? (
          // Mobile: render only the active window full-screen
          activeWindow && (
            <WindowItem
              key={activeWindow.id}
              window={activeWindow}
              mode={mode}
              viewportWidth={viewport.width}
              viewportHeight={viewport.height}
            />
          )
        ) : (
          // Tablet/Desktop: render all visible windows
          visibleWindows.map((w) => (
            <WindowItem
              key={w.id}
              window={w}
              mode={mode}
              viewportWidth={viewport.width}
              viewportHeight={viewport.height}
            />
          ))
        )}
      </main>

      {/* Mobile: bottom tab bar for switching between open windows */}
      {mode === 'mobile' && visibleWindows.length > 1 && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-around glass border-t border-white/10 py-2 px-1"
          style={{ touchAction: 'manipulation' }}
          data-testid="mobile-tab-bar"
          aria-label="Open applications"
        >
          {visibleWindows.map((w) => (
            <button
              key={w.id}
              onClick={() => focusWindow(w.id)}
              onTouchEnd={(e) => {
                e.preventDefault();
                focusWindow(w.id);
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-md transition-colors duration-200 touch-manipulation ${
                activeWindow?.id === w.id
                  ? 'bg-white/10'
                  : 'bg-transparent hover:bg-white/5 active:bg-white/10'
              }`}
              aria-label={`Switch to ${w.title}`}
              aria-current={activeWindow?.id === w.id ? 'true' : undefined}
              data-testid={`mobile-tab-${w.appId}`}
            >
              <span className="text-xs truncate max-w-[60px]" style={{ color: 'var(--theme-text)' }}>
                {w.title}
              </span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
});

export default WindowManager;
