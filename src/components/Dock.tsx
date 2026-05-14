import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import { useDockStore } from '../stores/dockStore';
import { magneticEffect } from '../utils/magneticEffect';
import type { AppId, Position } from '../types';

interface DockApp {
  id: AppId;
  title: string;
  icon: string;
}

/** Map of all known built-in app metadata for resolving pinned IDs */
const ALL_BUILT_IN_APPS: Record<string, { title: string; icon: string }> = {
  'browser': { title: 'Browser', icon: '🌐' },
  'notes': { title: 'Notes', icon: '📝' },
  'ai-assistant': { title: 'AI Assistant', icon: '🤖' },
  'music-player': { title: 'Music Player', icon: '🎵' },
  'system-monitor': { title: 'System Monitor', icon: '📊' },
  'terminal': { title: 'Terminal', icon: '💻' },
  'file-explorer': { title: 'File Explorer', icon: '📂' },
  'app-store': { title: 'App Store', icon: '🏪' },
  'settings': { title: 'Settings', icon: '⚙️' },
  'secret-room': { title: 'Secret Room', icon: '🔮' },
  'calendar': { title: 'Calendar', icon: '📅' },
  'weather': { title: 'Weather', icon: '🌤️' },
  'text-editor': { title: 'Text Editor', icon: '✏️' },
  'task-manager': { title: 'Task Manager', icon: '📋' },
  'recycle-bin': { title: 'Recycle Bin', icon: '🗑️' },
};

/**
 * Dock component — application launcher with magnetic hover effect.
 * Vertical panel on the left for ≥1024px viewports; bottom bar for <1024px.
 * Icons shift toward the cursor (max 6px) when within 80px using magneticEffect utility.
 * Supports both mouse and touch interactions.
 * Reads pinned apps from dockStore for customization.
 */
export const Dock = memo(function Dock() {
  const openWindow = useWindowStore((state) => state.openWindow);
  const windows = useWindowStore((state) => state.windows);
  const installedApps = useInstalledAppsStore((state) => state.apps);
  const pinnedApps = useDockStore((state) => state.pinnedApps);
  const removeFromDock = useDockStore((state) => state.removeFromDock);
  const addToDock = useDockStore((state) => state.addToDock);
  const [cursorPos, setCursorPos] = useState<Position>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [showAddPopover, setShowAddPopover] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Map<AppId, HTMLButtonElement>>(new Map());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Resolve pinned app IDs to DockApp objects
  const pinnedDockApps: DockApp[] = pinnedApps
    .map((appId) => {
      const builtIn = ALL_BUILT_IN_APPS[appId];
      if (builtIn) {
        return { id: appId as AppId, title: builtIn.title, icon: builtIn.icon };
      }
      const storeApp = installedApps.find((a) => a.id === appId);
      if (storeApp) {
        return { id: storeApp.id as AppId, title: storeApp.name, icon: storeApp.icon };
      }
      return null;
    })
    .filter((app): app is DockApp => app !== null);

  // Also include installed store apps that aren't already pinned
  const installedNotPinned = installedApps
    .filter((a) => !pinnedApps.includes(a.id))
    .map((a) => ({ id: a.id as AppId, title: a.name, icon: a.icon }));

  const DOCK_APPS: DockApp[] = [...pinnedDockApps, ...installedNotPinned];

  // Apps available to add (not currently in dock)
  const availableToAdd: DockApp[] = Object.entries(ALL_BUILT_IN_APPS)
    .filter(([id]) => !pinnedApps.includes(id))
    .map(([id, meta]) => ({ id: id as AppId, title: meta.title, icon: meta.icon }));

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

  // Close popover when clicking outside
  useEffect(() => {
    if (!showAddPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowAddPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddPopover]);

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
      e.preventDefault();
      openWindow(appId);
    },
    [openWindow]
  );

  const handleRemoveFromDock = useCallback(
    (appId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeFromDock(appId);
    },
    [removeFromDock]
  );

  const handleAddToDock = useCallback(
    (appId: string) => {
      addToDock(appId);
      setShowAddPopover(false);
    },
    [addToDock]
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
        const isPinned = pinnedApps.includes(app.id);

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

            {/* Remove button — visible on hover for pinned apps */}
            {isPinned && (
              <span
                onClick={(e) => handleRemoveFromDock(app.id, e)}
                className="
                  absolute -top-1 -right-1 w-4 h-4
                  flex items-center justify-center
                  rounded-full text-[10px] font-bold
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-150 cursor-pointer
                  hover:scale-110
                "
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.9)',
                  color: '#fff',
                }}
                role="button"
                aria-label={`Remove ${app.title} from dock`}
                tabIndex={-1}
              >
                ×
              </span>
            )}

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

      {/* Add to dock button */}
      <div className="relative">
        <button
          onClick={() => setShowAddPopover(!showAddPopover)}
          className="
            flex items-center justify-center
            w-11 h-11 rounded-lg
            transition-all duration-200 ease-out
            hover:bg-[var(--theme-surface)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]
            border border-dashed
          "
          style={{
            borderColor: 'var(--theme-primary)',
            opacity: 0.5,
          }}
          title="Add app to dock"
          aria-label="Add app to dock"
        >
          <span className="text-lg select-none" style={{ color: 'var(--theme-primary)' }}>
            +
          </span>
        </button>

        {/* Add popover */}
        {showAddPopover && (
          <div
            ref={popoverRef}
            className="
              absolute z-50 p-2 rounded-lg shadow-xl
              lg:left-full lg:top-0 lg:ml-2
              max-lg:bottom-full max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:mb-2
              max-h-60 overflow-y-auto min-w-[180px]
            "
            style={{
              backgroundColor: 'var(--theme-background)',
              border: '1px solid var(--theme-surface)',
            }}
          >
            {availableToAdd.length === 0 ? (
              <p className="text-xs opacity-50 p-2" style={{ color: 'var(--theme-text)' }}>
                All apps are in dock
              </p>
            ) : (
              availableToAdd.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAddToDock(app.id)}
                  className="
                    flex items-center gap-2 w-full px-3 py-2 rounded-md text-left
                    transition-colors hover:bg-[var(--theme-surface)]
                  "
                  style={{ color: 'var(--theme-text)' }}
                >
                  <span className="text-base">{app.icon}</span>
                  <span className="text-xs">{app.title}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </nav>
  );
});
