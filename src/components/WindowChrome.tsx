import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWindowStore } from '../stores/windowStore';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import type { AppId } from '../types';

/** App icon map — matches the Dock icons */
const APP_ICONS: Record<string, string> = {
  'notes': '📝',
  'ai-assistant': '🤖',
  'music-player': '🎵',
  'system-monitor': '📊',
  'terminal': '💻',
  'secret-room': '🔮',
  'browser': '🌐',
  'app-store': '🏪',
  'settings': '⚙️',
  'file-explorer': '📂',
  'calendar': '📅',
  'weather': '🌤️',
  'text-editor': '✏️',
  'task-manager': '📋',
};

interface WindowChromeProps {
  /** Unique window ID */
  windowId: string;
  /** Application ID */
  appId: AppId;
  /** Window title displayed in the title bar */
  title: string;
  /** Whether the window is currently maximized */
  isMaximized: boolean;
  /** Children rendered inside the window content area */
  children?: React.ReactNode;
  /** Class name for the drag handle — used by react-rnd to identify the drag target */
  dragHandleClassName: string;
}

/**
 * WindowChrome — provides the title bar, window controls, and glassmorphism
 * styling for each window. Includes Framer Motion open/close animations
 * (scale + opacity) and traffic-light style control buttons.
 *
 * The title bar acts as the drag handle for react-rnd (identified by dragHandleClassName).
 */
const WindowChrome = memo(function WindowChrome({
  windowId,
  appId,
  title,
  isMaximized,
  children,
  dragHandleClassName,
}: WindowChromeProps) {
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const maximizeWindow = useWindowStore((state) => state.maximizeWindow);
  const restoreWindow = useWindowStore((state) => state.restoreWindow);

  const handleClose = useCallback((e?: React.TouchEvent) => {
    if (e) e.preventDefault();
    closeWindow(windowId);
  }, [closeWindow, windowId]);

  const handleMinimize = useCallback((e?: React.TouchEvent) => {
    if (e) e.preventDefault();
    minimizeWindow(windowId);
  }, [minimizeWindow, windowId]);

  const handleMaximizeToggle = useCallback((e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isMaximized) {
      restoreWindow(windowId);
    } else {
      maximizeWindow(windowId);
    }
  }, [isMaximized, maximizeWindow, restoreWindow, windowId]);

  return (
    <motion.div
      className="glass rounded-lg overflow-hidden shadow-lg flex flex-col h-full w-full"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      data-testid={`window-chrome-${appId}`}
    >
      {/* Title bar — drag handle */}
      <div
        className={`${dragHandleClassName} flex items-center justify-between px-3 py-2 border-b border-white/10 cursor-move select-none shrink-0`}
        data-testid={`window-titlebar-${appId}`}
        onDoubleClick={handleMaximizeToggle}
      >
        {/* Left: App icon + title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm select-none" aria-hidden="true">
            {APP_ICONS[appId] || useInstalledAppsStore.getState().getApp(appId)?.icon || '📦'}
          </span>
          <span
            className="text-sm font-medium truncate"
            style={{ color: 'var(--theme-text)' }}
          >
            {title}
          </span>
        </div>

        {/* Right: Traffic light controls */}
        <div className="flex items-center gap-1.5 shrink-0" role="group" aria-label="Window controls">
          {/* Minimize (yellow) */}
          <button
            onClick={() => handleMinimize()}
            onTouchEnd={(e) => handleMinimize(e)}
            className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 active:bg-yellow-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent touch-manipulation"
            aria-label={`Minimize ${title}`}
            data-testid={`window-minimize-${appId}`}
          />
          {/* Maximize/Restore (green) */}
          <button
            onClick={(e) => handleMaximizeToggle(e)}
            onTouchEnd={(e) => handleMaximizeToggle(e)}
            className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 active:bg-green-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent touch-manipulation"
            aria-label={isMaximized ? `Restore ${title}` : `Maximize ${title}`}
            data-testid={`window-maximize-${appId}`}
          />
          {/* Close (red) */}
          <button
            onClick={() => handleClose()}
            onTouchEnd={(e) => handleClose(e)}
            className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 active:bg-red-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent touch-manipulation"
            aria-label={`Close ${title}`}
            data-testid={`window-close-${appId}`}
          />
        </div>
      </div>

      {/* Window content area */}
      <div className="flex-1 overflow-auto min-h-0">
        {children}
      </div>
    </motion.div>
  );
});

export default WindowChrome;
