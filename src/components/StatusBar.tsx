import { useState, useEffect, memo } from 'react';
import { formatClock, formatDate } from '../utils/formatTime';
import { useThemeStore } from '../stores/themeStore';
import { useWindowStore } from '../stores/windowStore';

/**
 * StatusBar component — sits at the top of the desktop.
 * Displays real-time clock (HH:MM:SS), current date, active theme name,
 * and system status indicators (open window count).
 */
export const StatusBar = memo(function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  const activeTheme = useThemeStore((state) => state.activeTheme);
  const windowCount = useWindowStore((state) => state.windows.length);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="glass fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 h-10"
      style={{ fontFamily: 'var(--font-primary)' }}
    >
      {/* Left section: date and theme */}
      <div className="flex items-center gap-4 text-sm">
        <span
          className="opacity-80"
          style={{ color: 'var(--theme-text)' }}
        >
          {formatDate(now)}
        </span>
        <span
          className="rounded px-2 py-0.5 text-xs font-medium capitalize"
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
        className="text-sm font-semibold tracking-wider"
        style={{
          fontFamily: 'var(--font-accent)',
          color: 'var(--theme-primary)',
        }}
      >
        {formatClock(now)}
      </div>

      {/* Right section: system indicators */}
      <div className="flex items-center gap-3 text-xs">
        <span
          className="flex items-center gap-1 opacity-80"
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
  );
});
