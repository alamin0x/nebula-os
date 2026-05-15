import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useInstalledAppsStore } from '../stores/installedAppsStore';
import { useDesktopStore } from '../stores/desktopStore';
import { useRecycleBinStore } from '../stores/recycleBinStore';
import { useDockStore } from '../stores/dockStore';
import type { AppId } from '../types';

interface DesktopIcon {
  id: AppId;
  title: string;
  icon: string;
}

const BUILT_IN_DESKTOP_ICONS: DesktopIcon[] = [
  { id: 'browser', title: 'Browser', icon: '🌐' },
  { id: 'notes', title: 'Notes', icon: '📝' },
  { id: 'terminal', title: 'Terminal', icon: '💻' },
  { id: 'music-player', title: 'Music Player', icon: '🎵' },
  { id: 'system-monitor', title: 'System Monitor', icon: '📊' },
  { id: 'app-store', title: 'App Store', icon: '🏪' },
  { id: 'file-explorer', title: 'File Explorer', icon: '📂' },
  { id: 'calendar', title: 'Calendar', icon: '📅' },
  { id: 'weather', title: 'Weather', icon: '🌤️' },
  { id: 'text-editor', title: 'Text Editor', icon: '✏️' },
  { id: 'task-manager', title: 'Task Manager', icon: '📋' },
  { id: 'ai-assistant', title: 'AI Assistant', icon: '🤖' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
];

/** Grid cell size in pixels — responsive */
const GRID_CELL_WIDTH = 90;
const GRID_CELL_HEIGHT = 90;
const GRID_CELL_WIDTH_MOBILE = 75;
const GRID_CELL_HEIGHT_MOBILE = 75;

/** Mobile breakpoint */
const MOBILE_BREAKPOINT = 768;

function getIsMobile(): boolean {
  return (globalThis.innerWidth || 1024) < MOBILE_BREAKPOINT;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  appId: string;
  title: string;
  icon: string;
}

/** MIME type used for drag-and-drop data transfer of Nebula app info */
const DRAG_MIME = 'application/nebula-app';

/**
 * DesktopIcons component — displays clickable app icons on the desktop surface.
 * Icons are positioned on a grid and can be repositioned by dragging.
 * Opens the corresponding window on double-click.
 * Dynamically includes installed store apps.
 * Filters out hidden apps (moved to recycle bin).
 * Includes the Recycle Bin as an inline icon (not hideable).
 * Supports HTML5 drag-and-drop: drag icons to dock, recycle bin, or reposition on desktop.
 */
export const DesktopIcons = memo(function DesktopIcons() {
  const openWindow = useWindowStore((state) => state.openWindow);
  const installedApps = useInstalledAppsStore((state) => state.apps);
  const hiddenApps = useDesktopStore((state) => state.hiddenApps);
  const positions = useDesktopStore((state) => state.positions);
  const setPosition = useDesktopStore((state) => state.setPosition);
  const hideApp = useDesktopStore((state) => state.hideApp);
  const moveToTrash = useRecycleBinStore((state) => state.moveToTrash);
  const recycleBinItems = useRecycleBinStore((state) => state.items);
  const pinnedApps = useDockStore((state) => state.pinnedApps);
  const addToDock = useDockStore((state) => state.addToDock);

  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    appId: '',
    title: '',
    icon: '',
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null);
  const [recycleBinDragOver, setRecycleBinDragOver] = useState(false);

  // Track mobile state on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(getIsMobile());
    globalThis.addEventListener('resize', handleResize);
    return () => globalThis.removeEventListener('resize', handleResize);
  }, []);

  const cellWidth = isMobile ? GRID_CELL_WIDTH_MOBILE : GRID_CELL_WIDTH;
  const cellHeight = isMobile ? GRID_CELL_HEIGHT_MOBILE : GRID_CELL_HEIGHT;

  const allIcons: DesktopIcon[] = useMemo(() => [
    ...BUILT_IN_DESKTOP_ICONS,
    ...installedApps.map((a) => ({ id: a.id as AppId, title: a.name, icon: a.icon })),
    { id: 'recycle-bin' as AppId, title: 'Recycle Bin', icon: '🗑️' },
  ], [installedApps]);

  // Filter out hidden apps (recycle-bin is never hidden)
  const visibleIcons = useMemo(
    () => allIcons.filter((app) => app.id === 'recycle-bin' || !hiddenApps.includes(app.id)),
    [allIcons, hiddenApps]
  );

  // Compute positions for all visible icons, assigning defaults in column-first order
  const iconPositions = useMemo(() => {
    const result: Record<string, { col: number; row: number }> = {};
    const occupied = new Set<string>();

    // First pass: place icons that already have saved positions
    for (const icon of visibleIcons) {
      const saved = positions[icon.id];
      if (saved) {
        result[icon.id] = saved;
        occupied.add(`${saved.col},${saved.row}`);
      }
    }

    // Calculate max rows based on container height (estimate)
    const containerHeight = containerRef.current?.clientHeight || (window.innerHeight - 120);
    const maxRows = Math.max(1, Math.floor(containerHeight / cellHeight));

    // Second pass: assign positions to icons without saved positions (column-first order)
    let col = 0;
    let row = 0;

    const findNextEmpty = (): { col: number; row: number } => {
      while (occupied.has(`${col},${row}`)) {
        row++;
        if (row >= maxRows) {
          row = 0;
          col++;
        }
      }
      return { col, row };
    };

    for (const icon of visibleIcons) {
      if (!result[icon.id]) {
        const pos = findNextEmpty();
        result[icon.id] = pos;
        occupied.add(`${pos.col},${pos.row}`);
        row++;
        if (row >= maxRows) {
          row = 0;
          col++;
        }
      }
    }

    return result;
  }, [visibleIcons, positions, cellHeight]);

  const handleDoubleClick = useCallback(
    (appId: AppId) => {
      openWindow(appId);
    },
    [openWindow]
  );

  // Single tap to open on mobile
  const handleSingleTap = useCallback(
    (appId: AppId) => {
      if (isMobile) {
        openWindow(appId);
      }
    },
    [openWindow, isMobile]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, app: DesktopIcon) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        appId: app.id,
        title: app.title,
        icon: app.icon,
      });
    },
    []
  );

  const handleAddToDock = useCallback(() => {
    if (contextMenu.appId) {
      addToDock(contextMenu.appId);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [contextMenu.appId, addToDock]);

  const handleRemoveFromDesktop = useCallback(() => {
    if (contextMenu.appId) {
      hideApp(contextMenu.appId);
      moveToTrash(contextMenu.appId, contextMenu.title, contextMenu.icon);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, [contextMenu.appId, contextMenu.title, contextMenu.icon, hideApp, moveToTrash]);

  // --- Drag handlers for desktop icons ---
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>, app: DesktopIcon) => {
      e.dataTransfer.setData(
        DRAG_MIME,
        JSON.stringify({ appId: app.id, title: app.title, icon: app.icon })
      );
      e.dataTransfer.effectAllowed = 'move';
      setDraggingAppId(app.id);
    },
    []
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      const appId = draggingAppId;
      setDraggingAppId(null);

      // If the drop was not handled by dock or recycle bin, reposition on desktop
      // dropEffect 'none' means no valid drop target accepted it
      if (!appId) return;

      // Check if the drop happened on the desktop (not on dock or recycle bin)
      // We use the drop coordinates to calculate grid position
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      // Only reposition if the drop is within the container bounds
      if (x < 0 || y < 0 || x > containerRect.width || y > containerRect.height) return;

      // If dropEffect is 'move' and it was handled by dock/recycle-bin, don't reposition
      // The dock and recycle bin set dropEffect to 'move' via preventDefault in dragOver
      // If dropEffect is 'none', the drop wasn't accepted anywhere — reposition on desktop
      // However, browsers may report 'none' even for valid drops in some cases.
      // We'll reposition only if dropEffect is 'none' (meaning no drop target accepted it)
      if (e.dataTransfer.dropEffect !== 'none') return;

      const col = Math.max(0, Math.floor(x / cellWidth));
      const row = Math.max(0, Math.floor(y / cellHeight));

      // Check if cell is occupied by another icon
      const occupiedBy = Object.entries(iconPositions).find(
        ([id, pos]) => id !== appId && pos.col === col && pos.row === row
      );

      if (!occupiedBy) {
        setPosition(appId, col, row);
      } else {
        // Find nearest empty cell
        const occupied = new Set(
          Object.entries(iconPositions)
            .filter(([id]) => id !== appId)
            .map(([, pos]) => `${pos.col},${pos.row}`)
        );

        let bestCol = col;
        let bestRow = row;
        let bestDist = Infinity;

        // Search in a spiral pattern around the target
        const maxSearch = 20;
        for (let dc = -maxSearch; dc <= maxSearch; dc++) {
          for (let dr = -maxSearch; dr <= maxSearch; dr++) {
            const c = col + dc;
            const r = row + dr;
            if (c < 0 || r < 0) continue;
            if (!occupied.has(`${c},${r}`)) {
              const dist = Math.abs(dc) + Math.abs(dr);
              if (dist < bestDist) {
                bestDist = dist;
                bestCol = c;
                bestRow = r;
              }
            }
          }
        }

        setPosition(appId, bestCol, bestRow);
      }
    },
    [draggingAppId, iconPositions, setPosition]
  );

  // --- Recycle Bin drop target handlers ---
  const handleRecycleBinDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setRecycleBinDragOver(true);
  }, []);

  const handleRecycleBinDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setRecycleBinDragOver(true);
  }, []);

  const handleRecycleBinDragLeave = useCallback(() => {
    setRecycleBinDragOver(false);
  }, []);

  const handleRecycleBinDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setRecycleBinDragOver(false);
      const raw = e.dataTransfer.getData(DRAG_MIME);
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as { appId: string; title: string; icon: string };
        // Don't allow dropping dock-only drags onto recycle bin
        if (data.appId && data.appId !== 'recycle-bin') {
          hideApp(data.appId);
          moveToTrash(data.appId, data.title, data.icon);
        }
      } catch {
        // ignore malformed data
      }
    },
    [hideApp, moveToTrash]
  );

  // Close context menu on click outside or Escape
  useEffect(() => {
    if (!contextMenu.visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.visible]);

  const isInDock = pinnedApps.includes(contextMenu.appId);
  const isRecycleBinContext = contextMenu.appId === 'recycle-bin';

  return (
    <>
      <div
        ref={containerRef}
        className="absolute top-12 left-4 bottom-14 z-10 p-2 md:top-14 md:p-4 lg:left-20"
        style={{ position: 'absolute' }}
        data-testid="desktop-icons"
      >
        {visibleIcons.map((app) => {
          const pos = iconPositions[app.id] || { col: 0, row: 0 };
          const isRecycleBin = app.id === 'recycle-bin';

          return (
            <button
              key={app.id}
              draggable={!isMobile}
              onDragStart={(e) => handleDragStart(e, app)}
              onDragEnd={handleDragEnd}
              onDoubleClick={() => handleDoubleClick(app.id)}
              onClick={() => handleSingleTap(app.id)}
              onContextMenu={(e) => handleContextMenu(e, app)}
              onDragOver={isRecycleBin ? handleRecycleBinDragOver : undefined}
              onDragEnter={isRecycleBin ? handleRecycleBinDragEnter : undefined}
              onDragLeave={isRecycleBin ? handleRecycleBinDragLeave : undefined}
              onDrop={isRecycleBin ? handleRecycleBinDrop : undefined}
              className="
                absolute flex flex-col items-center justify-center gap-1
                w-16 h-16 md:w-20 md:h-20 rounded-lg
                transition-all duration-200 ease-out
                hover:bg-[var(--theme-surface)]
                focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]
                cursor-pointer select-none
              "
              style={{
                left: `${pos.col * cellWidth}px`,
                top: `${pos.row * cellHeight}px`,
                opacity: draggingAppId === app.id ? 0.5 : 1,
                transform: isRecycleBin && recycleBinDragOver ? 'scale(1.2)' : 'scale(1)',
                boxShadow: isRecycleBin && recycleBinDragOver
                  ? '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)'
                  : 'none',
              }}
              data-testid={`desktop-icon-${app.id}`}
              aria-label={`Open ${app.title}`}
              title={isMobile ? `Tap to open ${app.title}` : `Double-click to open ${app.title}`}
            >
              <span className="text-2xl md:text-3xl relative" aria-hidden="true">
                {app.icon}
                {isRecycleBin && recycleBinItems.length > 0 && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-1"
                    style={{
                      backgroundColor: 'var(--theme-primary)',
                      color: '#fff',
                    }}
                  >
                    {recycleBinItems.length}
                  </span>
                )}
              </span>
              <span
                className="text-xs text-center leading-tight max-w-[72px] truncate"
                style={{ color: 'var(--theme-text)' }}
              >
                {app.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline context menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-[2000] py-1 rounded-lg shadow-xl min-w-[160px]"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: Math.min(contextMenu.y, window.innerHeight - 120),
            backgroundColor: 'var(--theme-background)',
            border: '1px solid var(--theme-surface)',
          }}
        >
          {!isInDock && (
            <button
              onClick={handleAddToDock}
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--theme-surface)]"
              style={{ color: 'var(--theme-text)' }}
            >
              <span aria-hidden="true">📌</span>
              Add to Dock
            </button>
          )}
          {!isRecycleBinContext && (
            <button
              onClick={handleRemoveFromDesktop}
              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--theme-surface)]"
              style={{ color: '#ef4444' }}
            >
              <span aria-hidden="true">🗑️</span>
              Remove from Desktop
            </button>
          )}
        </div>
      )}
    </>
  );
});
