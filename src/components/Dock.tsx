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

/** MIME type used for drag-and-drop data transfer of Nebula app info */
const DRAG_MIME = 'application/nebula-app';
/** MIME type for dock-internal reorder drags */
const DOCK_REORDER_MIME = 'application/nebula-dock-reorder';

/**
 * Dock component — application launcher with magnetic hover effect.
 * Vertical panel on the left for ≥1024px viewports; bottom bar for <1024px.
 * Icons shift toward the cursor (max 6px) when within 80px using magneticEffect utility.
 * Supports both mouse and touch interactions.
 * Reads pinned apps from dockStore for customization.
 * Supports HTML5 drag-and-drop: drop desktop icons to add, drag out to remove, reorder within.
 */
export const Dock = memo(function Dock() {
  const openWindow = useWindowStore((state) => state.openWindow);
  const windows = useWindowStore((state) => state.windows);
  const installedApps = useInstalledAppsStore((state) => state.apps);
  const pinnedApps = useDockStore((state) => state.pinnedApps);
  const addToDock = useDockStore((state) => state.addToDock);
  const removeFromDock = useDockStore((state) => state.removeFromDock);
  const reorderDock = useDockStore((state) => state.reorderDock);
  const [cursorPos, setCursorPos] = useState<Position>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Map<AppId, HTMLButtonElement>>(new Map());

  // Drag-and-drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingDockAppId, setDraggingDockAppId] = useState<string | null>(null);
  const dragSourceIndex = useRef<number | null>(null);
  const dragCounter = useRef(0);

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
      e.preventDefault();
      openWindow(appId);
    },
    [openWindow]
  );

  // --- Dock icon drag handlers (for reorder + drag-out-to-remove) ---
  const handleDockIconDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>, appId: string, index: number) => {
      e.dataTransfer.setData(DOCK_REORDER_MIME, JSON.stringify({ appId, index }));
      e.dataTransfer.setData(
        DRAG_MIME,
        JSON.stringify({ appId, title: '', icon: '', fromDock: true })
      );
      e.dataTransfer.effectAllowed = 'move';
      dragSourceIndex.current = index;
      setDraggingDockAppId(appId);
    },
    []
  );

  const handleDockIconDragEnd = useCallback(
    (e: React.DragEvent<HTMLButtonElement>, appId: string) => {
      // If dropEffect is 'none', the drop happened outside any valid target — remove from dock
      if (e.dataTransfer.dropEffect === 'none') {
        removeFromDock(appId);
      }
      setDraggingDockAppId(null);
      dragSourceIndex.current = null;
      setDragOverIndex(null);
    },
    [removeFromDock]
  );

  // --- Dock container drop target handlers ---
  const handleDockDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      // Calculate insertion index based on cursor position
      const dockEl = dockRef.current;
      if (!dockEl) return;

      const icons = Array.from(dockEl.querySelectorAll('[data-dock-index]'));
      let insertIndex = DOCK_APPS.length;

      for (let i = 0; i < icons.length; i++) {
        const rect = icons[i].getBoundingClientRect();
        // Check if we're using vertical (lg) or horizontal (max-lg) layout
        const isVertical = window.innerWidth >= 1024;
        const midpoint = isVertical
          ? rect.top + rect.height / 2
          : rect.left + rect.width / 2;
        const cursorPoint = isVertical ? e.clientY : e.clientX;

        if (cursorPoint < midpoint) {
          insertIndex = i;
          break;
        }
      }

      setDragOverIndex(insertIndex);
    },
    [DOCK_APPS.length]
  );

  const handleDockDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragOver(true);
  }, []);

  const handleDockDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
      setDragOverIndex(null);
    }
  }, []);

  const handleDockDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setDragOverIndex(null);
      dragCounter.current = 0;

      // Check if this is a dock reorder
      const reorderData = e.dataTransfer.getData(DOCK_REORDER_MIME);
      if (reorderData) {
        try {
          const { index: fromIndex } = JSON.parse(reorderData) as { appId: string; index: number };
          // Calculate target index
          const dockEl = dockRef.current;
          if (!dockEl) return;

          const icons = Array.from(dockEl.querySelectorAll('[data-dock-index]'));
          let toIndex = pinnedDockApps.length;

          for (let i = 0; i < icons.length; i++) {
            const rect = icons[i].getBoundingClientRect();
            const isVertical = window.innerWidth >= 1024;
            const midpoint = isVertical
              ? rect.top + rect.height / 2
              : rect.left + rect.width / 2;
            const cursorPoint = isVertical ? e.clientY : e.clientX;

            if (cursorPoint < midpoint) {
              toIndex = i;
              break;
            }
          }

          // Adjust toIndex if dragging downward/rightward
          if (fromIndex < toIndex) {
            toIndex = Math.max(0, toIndex - 1);
          }

          if (fromIndex !== toIndex) {
            reorderDock(fromIndex, toIndex);
          }
        } catch {
          // ignore
        }
        return;
      }

      // Otherwise, it's a desktop icon being dropped onto the dock
      const appData = e.dataTransfer.getData(DRAG_MIME);
      if (appData) {
        try {
          const data = JSON.parse(appData) as { appId: string; title: string; icon: string; fromDock?: boolean };
          if (data.appId && !data.fromDock) {
            addToDock(data.appId);
          }
        } catch {
          // ignore
        }
      }
    },
    [addToDock, reorderDock, pinnedDockApps.length]
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
      onDragOver={handleDockDragOver}
      onDragEnter={handleDockDragEnter}
      onDragLeave={handleDockDragLeave}
      onDrop={handleDockDrop}
      className="
        glass fixed z-10 flex
        lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:py-3 lg:px-2 lg:rounded-r-xl lg:gap-2
        max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:top-auto
        max-lg:translate-y-0 max-lg:flex-row max-lg:justify-center
        max-lg:py-2 max-lg:px-4 max-lg:rounded-t-xl max-lg:gap-2
        transition-shadow duration-200
      "
      style={{
        boxShadow: isDragOver
          ? '0 0 16px 4px var(--theme-primary), inset 0 0 8px 1px var(--theme-primary)'
          : undefined,
      }}
      data-testid="dock"
      aria-label="Application dock"
    >
      {DOCK_APPS.map((app, index) => {
        const offset = getIconOffset(app.id);
        const minimized = isMinimized(app.id);
        const open = isOpen(app.id);
        const showInsertBefore = isDragOver && dragOverIndex === index;

        return (
          <div key={app.id} className="relative flex lg:flex-col max-lg:flex-row items-center">
            {/* Insertion indicator line */}
            {showInsertBefore && (
              <span
                className="absolute lg:-top-1 lg:left-1 lg:right-1 lg:h-[2px] max-lg:-left-1 max-lg:top-1 max-lg:bottom-1 max-lg:w-[2px] rounded-full"
                style={{ backgroundColor: 'var(--theme-primary)' }}
                aria-hidden="true"
              />
            )}
            <button
              ref={setIconRef(app.id)}
              draggable="true"
              onDragStart={(e) => handleDockIconDragStart(e, app.id, index)}
              onDragEnd={(e) => handleDockIconDragEnd(e, app.id)}
              onClick={() => handleAppClick(app.id)}
              onTouchEnd={(e) => handleAppTouchEnd(app.id, e)}
              data-dock-index={index}
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
                opacity: draggingDockAppId === app.id ? 0.5 : 1,
              }}
              title={app.title}
              aria-label={`Open ${app.title}`}
            >
              <span className="text-xl select-none" aria-hidden="true">
                {app.icon}
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
          </div>
        );
      })}

      {/* Insertion indicator at the end */}
      {isDragOver && dragOverIndex === DOCK_APPS.length && (
        <span
          className="lg:h-[2px] lg:mx-1 max-lg:w-[2px] max-lg:my-1 rounded-full"
          style={{ backgroundColor: 'var(--theme-primary)' }}
          aria-hidden="true"
        />
      )}
    </nav>
  );
});
