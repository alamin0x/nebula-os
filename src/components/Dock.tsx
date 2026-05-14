import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import { magneticEffect } from '../utils/magneticEffect';
import type { AppId, Position } from '../types';

interface DockApp {
  id: AppId;
  title: string;
  icon: string;
}

const BUILT_IN_DOCK_APPS: DockApp[] = [
  { id: 'browser', title: 'Browser', icon: '🌐' },
  { id: 'notes', title: 'Notes', icon: '📝' },
  { id: 'ai-assistant', title: 'AI Assistant', icon: '🤖' },
  { id: 'music-player', title: 'Music Player', icon: '🎵' },
  { id: 'system-monitor', title: 'System Monitor', icon: '📊' },
  { id: 'terminal', title: 'Terminal', icon: '💻' },
  { id: 'app-store', title: 'App Store', icon: '🏪' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
];

/**
 * Dock component — application launcher with magnetic hover effect.
 * Vertical panel on the left for ≥1024px viewports; bottom bar for <1024px.
 * Icons shift toward the cursor (max 6px) when within 80px using magneticEffect utility.
 * Supports both mouse and touch interactions.
 */
export const Dock = memo(function Dock() {
  const openWindow = useWindowStore((state) => state.openWindow);
  const windows = useWindowStore((state) => state.windows);
  const installedApps = useInstalledAppsStore((state) => state.apps);
  const [cursorPos, setCursorPos] = useState<Position>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Map<AppId, HTMLButtonElement>>(new Map());

  // Combine built-in dock apps with installed store apps
  const DOCK_APPS: DockApp[] = [
    ...BUILT_IN_DOCK_APPS,
    ...installedApps.map((a) => ({ id: a.id as AppId, title: a.name, icon: a.icon })),
  ];

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      setCursorPos({ x: touch.clientX, y: touch.clientY });
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsHovering(true);
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      setCursorPos({ x: touch.clientX, y: touch.clientY });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsHovering(false);
    setCursorPos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isHovering) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovering, handleMouseMove]);

  const handleDockMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleDockMouseLeave = useCallback(() => {
    setIsHovering(false);
    setCursorPos({ x: 0, y: 0 });
  }, []);

  const handleAppClick = useCallback(
    (appId: AppId) => {
      openWindow(appId);
    },
    [openWindow]
  );

  const handleAppTouchEnd = useCallback(
    (appId: AppId, e: React.TouchEvent) => {
      // Prevent the click event from also firing (avoids double-open)
      e.preventDefault();
      openWindow(appId);
    },
    [openWindow]
  );

  const getIconOffset = useCallback(
    (appId: AppId): Position => {
      if (!isHovering) return { x: 0, y: 0 };

      const iconEl = iconRefs.current.get(appId);
      if (!iconEl) return { x: 0, y: 0 };

      const rect = iconEl.getBoundingClientRect();
      const iconCenter: Position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      return magneticEffect(cursorPos, iconCenter);
    },
    [isHovering, cursorPos]
  );

  const isMinimized = useCallback(
    (appId: AppId): boolean => {
      return windows.some((w) => w.appId === appId && w.isMinimized);
    },
    [windows]
  );

  const isOpen = useCallback(
    (appId: AppId): boolean => {
      return windows.some((w) => w.appId === appId);
    },
    [windows]
  );

  const setIconRef = useCallback(
    (appId: AppId) => (el: HTMLButtonElement | null) => {
      if (el) {
        iconRefs.current.set(appId, el);
      } else {
        iconRefs.current.delete(appId);
      }
    },
    []
  );

  return (
    <nav
      ref={dockRef}
      onMouseEnter={handleDockMouseEnter}
      onMouseLeave={handleDockMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="
        glass fixed z-10 flex
        lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:py-3 lg:px-2 lg:rounded-r-xl lg:gap-2
        max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:top-auto
        max-lg:translate-y-0 max-lg:flex-row max-lg:justify-center
        max-lg:py-2 max-lg:px-4 max-lg:rounded-t-xl max-lg:gap-2
      "
      data-testid="dock"
      aria-label="Application dock"
    >
      {DOCK_APPS.map((app) => {
        const offset = getIconOffset(app.id);
        const minimized = isMinimized(app.id);
        const open = isOpen(app.id);

        return (
          <button
            key={app.id}
            ref={setIconRef(app.id)}
            onClick={() => handleAppClick(app.id)}
            onTouchEnd={(e) => handleAppTouchEnd(app.id, e)}
            className="
              relative flex items-center justify-center
              w-11 h-11 rounded-lg
              transition-all duration-200 ease-out
              hover:bg-[var(--theme-surface)]
              active:bg-[var(--theme-surface)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
              group
            "
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
            title={app.title}
            aria-label={`Open ${app.title}`}
          >
            <span className="text-xl select-none" aria-hidden="true">
              {app.icon}
            </span>

            {/* Tooltip — only shown on desktop (hover) */}
            <span
              className="
                absolute left-full ml-2 px-2 py-1 rounded text-xs whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-200
                lg:block hidden
              "
              style={{
                backgroundColor: 'var(--theme-background)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-surface)',
              }}
            >
              {app.title}
            </span>

            {/* Minimized / open indicator dot */}
            {open && (
              <span
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all duration-200"
                style={{
                  width: minimized ? '4px' : '8px',
                  backgroundColor: minimized
                    ? 'var(--theme-secondary)'
                    : 'var(--theme-primary)',
                  opacity: minimized ? 0.6 : 1,
                }}
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
});
