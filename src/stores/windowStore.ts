import { create } from 'zustand';
import type { AppId, Position, Size, WindowState } from '../types';
import type { WindowStore } from '../types/stores';
import { useInstalledAppsStore } from './installedAppsStore';

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;

const APP_TITLES: Record<string, string> = {
  'notes': 'Notes',
  'ai-assistant': 'AI Assistant',
  'music-player': 'Music Player',
  'system-monitor': 'System Monitor',
  'terminal': 'Terminal',
  'secret-room': 'Secret Room',
  'browser': 'Browser',
  'app-store': 'App Store',
  'settings': 'Settings',
};

const APP_DEFAULT_SIZES: Record<string, Size> = {
  'notes': { width: 700, height: 500 },
  'ai-assistant': { width: 600, height: 500 },
  'music-player': { width: 400, height: 500 },
  'system-monitor': { width: 600, height: 400 },
  'terminal': { width: 700, height: 450 },
  'secret-room': { width: 500, height: 400 },
  'browser': { width: 900, height: 600 },
  'app-store': { width: 600, height: 500 },
  'settings': { width: 700, height: 500 },
};

function getNextZIndex(windows: WindowState[]): number {
  if (windows.length === 0) return 100;
  return Math.max(...windows.map((w) => w.zIndex)) + 1;
}

function generateWindowId(appId: AppId): string {
  return `${appId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindowId: null,

  openWindow: (appId: AppId) => {
    const { windows } = get();
    const existing = windows.find((w) => w.appId === appId);

    if (existing) {
      // Don't open a duplicate — bring existing to foreground
      get().focusWindow(existing.id);
      return;
    }

    const zIndex = getNextZIndex(windows);
    const defaultSize = APP_DEFAULT_SIZES[appId] || { width: 400, height: 400 };
    
    // For store apps, get the name from the manifest
    let title = APP_TITLES[appId] || appId;
    const storeApp = useInstalledAppsStore.getState().getApp(appId);
    if (storeApp) {
      title = storeApp.name;
    }
    const newWindow: WindowState = {
      id: generateWindowId(appId),
      appId,
      title,
      position: {
        x: Math.max(0, Math.floor((window.innerWidth - defaultSize.width) / 2)),
        y: Math.max(0, Math.floor((window.innerHeight - defaultSize.height) / 2)),
      },
      size: { ...defaultSize },
      zIndex,
      isMinimized: false,
      isMaximized: false,
    };

    set({
      windows: [...windows, newWindow],
      activeWindowId: newWindow.id,
    });
  },

  closeWindow: (id: string) => {
    const { windows, activeWindowId } = get();
    const filtered = windows.filter((w) => w.id !== id);
    set({
      windows: filtered,
      activeWindowId: activeWindowId === id ? null : activeWindowId,
    });
  },

  minimizeWindow: (id: string) => {
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true } : w
      ),
      activeWindowId: get().activeWindowId === id ? null : get().activeWindowId,
    });
  },

  maximizeWindow: (id: string) => {
    set({
      windows: get().windows.map((w) => {
        if (w.id !== id) return w;
        return {
          ...w,
          isMaximized: true,
          previousBounds: { position: { ...w.position }, size: { ...w.size } },
          position: { x: 0, y: 0 },
          size: { width: window.innerWidth, height: window.innerHeight },
        };
      }),
    });
  },

  restoreWindow: (id: string) => {
    set({
      windows: get().windows.map((w) => {
        if (w.id !== id) return w;
        if (!w.previousBounds) return { ...w, isMaximized: false };
        return {
          ...w,
          isMaximized: false,
          position: { ...w.previousBounds.position },
          size: { ...w.previousBounds.size },
          previousBounds: undefined,
        };
      }),
    });
  },

  focusWindow: (id: string) => {
    const { windows } = get();
    const zIndex = getNextZIndex(windows);
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, zIndex, isMinimized: false } : w
      ),
      activeWindowId: id,
    });
  },

  updatePosition: (id: string, position: Position) => {
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, position } : w
      ),
    });
  },

  updateSize: (id: string, size: Size) => {
    const clampedSize: Size = {
      width: Math.max(size.width, MIN_WIDTH),
      height: Math.max(size.height, MIN_HEIGHT),
    };
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, size: clampedSize } : w
      ),
    });
  },
}));
