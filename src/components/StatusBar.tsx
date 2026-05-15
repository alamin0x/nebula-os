import { useState, useEffect, useCallback, memo } from 'react';
import { formatClock, formatDate } from '../utils/formatTime';
import { useThemeStore } from '../stores/themeStore';
import { useWindowStore } from '../stores/windowStore';
import AppLauncher from './AppLauncher';

/**
 * StatusBar component — sits at the top of the desktop.
 * Displays real-time clock (HH:MM:SS), current date, active theme name,
 * system status indicators (open window count), and an app launcher button.
 * On mobile: hides date, shows battery/wifi icons for realism.
 */
export const StatusBar = memo(function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  const [launcherOpen, setLauncherOpen] = useState(false);
  const activeTheme = useThemeStore((state) => state.activeTheme);
  const windowCount = useWindowStore((state) => state.windows.length);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleLauncher = useCallback(() => {
    setLauncherOpen((prev) => !prev);
  }, []);

  const closeLauncher = useCallback(() => {
    setLauncherOpen(false);
  }, []);

  return (
    <>
      <header
        className="glass fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-2 md:px-4 py-1.5 md:py-2 h-9 md:h-10"
        style={{ fontFamily: 'var(--font-primary)' }}
      >
        {/* Left section: launcher button + date and theme */}
        <div className="flex items-center gap-2 md:gap-4 text-sm">
          <button
            onClick={toggleLauncher}
            className="flex items-center justify-center w-6 h-6 rounded transition-colors duration-150 hover:bg-[var(--theme-surface)]"
            aria-label="Open app launcher"
            title="App Launcher"
          >
            <span className="text-sm">🚀</span>
          </button>
          <span
            className="opacity-80 hidden md:inline"
            style={{ color: 'var(--theme-text)' }}
          >
            {formatDate(now)}
          </span>
          <span
            className="rounded px-2 py-0.5 text-xs font-medium capitalize hidden md:inline"
            style={{
              backgroundColor: 'var(--theme-surface)',
              color: 'var(--theme-primary)',
            }}
          >
            {activeTheme}
          </span>
        </div>

        {/* Center: clock */}
        <div
          className="text-xs md:text-sm font-semibold tracking-wider"
          style={{
            fontFamily: 'var(--font-accent)',
            color: 'var(--theme-primary)',
          }}
        >
          {formatClock(now)}
        </div>

        {/* Right section: system indicators */}
        <div className="flex items-center gap-2 md:gap-3 text-xs">
          {/* WiFi icon */}
          <span
            className="opacity-70"
            style={{ color: 'var(--theme-text)' }}
            title="WiFi Connected"
            aria-label="WiFi connected"
          >
            📶
          </span>
          {/* Battery icon */}
          <span
            className="opacity-70"
            style={{ color: 'var(--theme-text)' }}
            title="Battery 100%"
            aria-label="Battery full"
          >
            🔋
          </span>
          <span
            className="items-center gap-1 opacity-80 hidden md:flex"
            style={{ color: 'var(--theme-text)' }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: 'var(--theme-secondary)' }}
            />
            {windowCount} {windowCount === 1 ? 'window' : 'windows'}
          </span>
        </div>
      </header>

      {/* App Launcher overlay */}
      <AppLauncher isOpen={launcherOpen} onClose={closeLauncher} />
    </>
  );
});
