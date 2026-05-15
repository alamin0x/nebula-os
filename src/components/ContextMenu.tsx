import { useState, useEffect, useCallback, memo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useSettingsStore, WALLPAPER_OPTIONS } from '../stores/settingsStore';
import { useDesktopStore } from '../stores/desktopStore';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

interface ContextMenuProps {
  /** Callback when "About Nebula OS" is clicked — shows info dialog */
  onAbout?: () => void;
}

/**
 * ContextMenu — right-click context menu for the desktop area.
 * Appears at mouse position, closes on click elsewhere or Escape.
 * Uses glassmorphism styling.
 */
const ContextMenu = memo(function ContextMenu({ onAbout }: ContextMenuProps) {
  const [menu, setMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const [showAbout, setShowAbout] = useState(false);
  const openWindow = useWindowStore((s) => s.openWindow);
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const setWallpaper = useSettingsStore((s) => s.setWallpaper);
  const setSettingsActiveTab = useSettingsStore((s) => s.setSettingsActiveTab);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Only show on the desktop area (not inside windows)
    const target = e.target as HTMLElement;
    const isDesktopArea =
      target.closest('[data-testid="desktop"]') &&
      !target.closest('[data-testid^="window-chrome"]') &&
      !target.closest('[data-testid="dock"]') &&
      !target.closest('nav') &&
      !target.closest('header');

    if (!isDesktopArea) return;

    e.preventDefault();
    setMenu({ visible: true, x: e.clientX, y: e.clientY });
  }, []);

  const handleClose = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMenu((prev) => ({ ...prev, visible: false }));
      setShowAbout(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClose);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClose);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleContextMenu, handleClose, handleKeyDown]);

  const menuItems = [
    {
      icon: '🔄',
      label: 'Refresh Desktop',
      action: () => {
        useDesktopStore.getState().resetPositions();
        handleClose();
      },
    },
    {
      icon: '📁',
      label: 'New Folder',
      action: () => {
        handleClose();
      },
    },
    {
      icon: '📄',
      label: 'New File',
      action: () => {
        handleClose();
      },
    },
    { divider: true },
    {
      icon: '🎨',
      label: 'Change Wallpaper',
      action: () => {
        const currentIndex = WALLPAPER_OPTIONS.findIndex((wp) => wp.id === wallpaper);
        const nextIndex = (currentIndex + 1) % WALLPAPER_OPTIONS.length;
        setWallpaper(WALLPAPER_OPTIONS[nextIndex].id);
        handleClose();
      },
    },
    {
      icon: '🖥️',
      label: 'Display Settings',
      action: () => {
        setSettingsActiveTab('display');
        openWindow('settings');
        handleClose();
      },
    },
    { divider: true },
    {
      icon: '📋',
      label: 'Paste',
      action: () => {
        handleClose();
      },
    },
    {
      icon: 'ℹ️',
      label: 'About Nebula OS',
      action: () => {
        handleClose();
        if (onAbout) {
          onAbout();
        } else {
          setShowAbout(true);
        }
      },
    },
  ];

  return (
    <>
      {menu.visible && (
        <div
          className="fixed z-[2000] min-w-[200px] rounded-lg py-1.5 shadow-xl border"
          style={{
            left: Math.min(menu.x, window.innerWidth - 220),
            top: Math.min(menu.y, window.innerHeight - 300),
            backgroundColor: 'rgba(15, 15, 25, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          data-testid="context-menu"
        >
          {menuItems.map((item, idx) => {
            if ('divider' in item && item.divider) {
              return (
                <div
                  key={`divider-${idx}`}
                  className="my-1 mx-2 border-t"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                />
              );
            }
            const menuItem = item as { icon: string; label: string; action: () => void };
            return (
              <button
                key={menuItem.label}
                onClick={menuItem.action}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors duration-100 hover:bg-white/10"
                style={{ color: 'var(--theme-text)' }}
              >
                <span className="text-sm" aria-hidden="true">{menuItem.icon}</span>
                <span>{menuItem.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* About dialog */}
      {showAbout && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="rounded-xl p-6 shadow-2xl border max-w-sm text-center"
            style={{
              backgroundColor: 'rgba(15, 15, 25, 0.95)',
              backdropFilter: 'blur(16px)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🌌</div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--theme-primary)' }}>
              Nebula OS
            </h2>
            <p className="text-sm opacity-70 mb-3" style={{ color: 'var(--theme-text)' }}>
              Version 1.0.0
            </p>
            <p className="text-xs opacity-50 mb-4" style={{ color: 'var(--theme-text)' }}>
              A futuristic browser-based operating system built with React, TypeScript, Vite, and TailwindCSS.
            </p>
            <button
              onClick={() => setShowAbout(false)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
              style={{
                backgroundColor: 'var(--theme-primary)',
                color: 'var(--theme-background)',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default ContextMenu;
