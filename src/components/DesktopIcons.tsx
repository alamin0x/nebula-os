import { useState, useCallback, useEffect, useRef, memo } from 'react';
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
];

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
 * Icons are arranged in a vertical grid and open the corresponding window on double-click.
 * Dynamically includes installed store apps.
 * Filters out hidden apps (moved to recycle bin).
 * Includes a fixed Recycle Bin icon at the bottom-right.
 * Supports HTML5 drag-and-drop: drag icons to dock or recycle bin.
 */
export const DesktopIcons = memo(function DesktopIcons() {
  const openWindow = useWindowStore((state) => state.openWindow);
  const installedApps = useInstalledAppsStore((state) => state.apps);
  const hiddenApps = useDesktopStore((state) => state.hiddenApps);
  const hideApp = useDesktopStore((state) => state.hideApp);
  const moveToTrash = useRecycleBinStore((state) => state.moveToTrash);
  const recycleBinItems = useRecycleBinStore((state) => state.items);
  const pinnedApps = useDockStore((state) => state.pinnedApps);
  const addToDock = useDockStore((state) => state.addToDock);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    appId: '',
    title: '',
    icon: '',
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null);
  const [recycleBinDragOver, setRecycleBinDragOver] = useState(false);

  const allIcons: DesktopIcon[] = [
    ...BUILT_IN_DESKTOP_ICONS,
    ...installedApps.map((a) => ({ id: a.id as AppId, title: a.name, icon: a.icon })),
  ];

  // Filter out hidden apps
  const visibleIcons = allIcons.filter((app) => !hiddenApps.includes(app.id));

  const handleDoubleClick = useCallback(
    (appId: AppId) => {
      openWindow(appId);
    },
    [openWindow]
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

  const handleOpenRecycleBin = useCallback(() => {
    openWindow('recycle-bin' as AppId);
  }, [openWindow]);

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

  const handleDragEnd = useCallback(() => {
    setDraggingAppId(null);
  }, []);

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
        if (data.appId) {
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

  return (
    <>
      <div
        className="absolute top-14 left-20 bottom-14 z-10 flex flex-col flex-wrap content-start gap-2 p-4 lg:left-20 max-lg:left-4"
        data-testid="desktop-icons"
      >
        {visibleIcons.map((app) => (
          <button
            key={app.id}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, app)}
            onDragEnd={handleDragEnd}
            onDoubleClick={() => handleDoubleClick(app.id)}
            onContextMenu={(e) => handleContextMenu(e, app)}
            className="
              flex flex-col items-center justify-center gap-1
              w-20 h-20 rounded-lg
              transition-all duration-200 ease-out
              hover:bg-[var(--theme-surface)]
              focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]
              cursor-pointer select-none
            "
            style={{
              opacity: draggingAppId === app.id ? 0.5 : 1,
            }}
            data-testid={`desktop-icon-${app.id}`}
            aria-label={`Open ${app.title}`}
            title={`Double-click to open ${app.title}`}
          >
            <span className="text-3xl" aria-hidden="true">
              {app.icon}
            </span>
            <span
              className="text-xs text-center leading-tight max-w-[72px] truncate"
              style={{ color: 'var(--theme-text)' }}
            >
              {app.title}
            </span>
          </button>
        ))}
      </div>

      {/* Recycle Bin — fixed at bottom-right, also a drop target */}
      <button
        onClick={handleOpenRecycleBin}
        onDoubleClick={handleOpenRecycleBin}
        onDragOver={handleRecycleBinDragOver}
        onDragEnter={handleRecycleBinDragEnter}
        onDragLeave={handleRecycleBinDragLeave}
        onDrop={handleRecycleBinDrop}
        className="
          fixed bottom-20 right-6 z-10
          flex flex-col items-center justify-center gap-1
          w-20 h-20 rounded-lg
          transition-all duration-200 ease-out
          hover:bg-[var(--theme-surface)]
          focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]
          cursor-pointer select-none
          lg:bottom-6
        "
        style={{
          transform: recycleBinDragOver ? 'scale(1.2)' : 'scale(1)',
          boxShadow: recycleBinDragOver
            ? '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)'
            : 'none',
        }}
        data-testid="desktop-icon-recycle-bin"
        aria-label="Open Recycle Bin"
        title="Recycle Bin"
      >
        <span className="text-3xl relative" aria-hidden="true">
          🗑️
          {recycleBinItems.length > 0 && (
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
          className="text-xs text-center leading-tight"
          style={{ color: 'var(--theme-text)' }}
        >
          Recycle Bin
        </span>
      </button>

      {/* Inline context menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-[2000] py-1 rounded-lg shadow-xl min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
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
          <button
            onClick={handleRemoveFromDesktop}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--theme-surface)]"
            style={{ color: '#ef4444' }}
          >
            <span aria-hidden="true">🗑️</span>
            Remove from Desktop
          </button>
        </div>
      )}
    </>
  );
});
