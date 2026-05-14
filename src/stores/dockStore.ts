import { create } from 'zustand';

const STORAGE_KEY = 'nebula-dock-pinned';

const DEFAULT_PINNED_APPS: string[] = [
  'browser',
  'notes',
  'ai-assistant',
  'music-player',
  'terminal',
  'file-explorer',
  'app-store',
  'settings',
];

interface DockStore {
  pinnedApps: string[];
  addToDock: (appId: string) => void;
  removeFromDock: (appId: string) => void;
  reorderDock: (fromIndex: number, toIndex: number) => void;
  loadFromStorage: () => void;
}

export const useDockStore = create<DockStore>((set, get) => ({
  pinnedApps: [...DEFAULT_PINNED_APPS],

  addToDock: (appId: string) => {
    const { pinnedApps } = get();
    if (pinnedApps.includes(appId)) return;
    const newPinned = [...pinnedApps, appId];
    set({ pinnedApps: newPinned });
    saveToStorage(newPinned);
  },

  removeFromDock: (appId: string) => {
    const { pinnedApps } = get();
    const newPinned = pinnedApps.filter((id) => id !== appId);
    set({ pinnedApps: newPinned });
    saveToStorage(newPinned);
  },

  reorderDock: (fromIndex: number, toIndex: number) => {
    const { pinnedApps } = get();
    if (fromIndex < 0 || fromIndex >= pinnedApps.length) return;
    if (toIndex < 0 || toIndex >= pinnedApps.length) return;
    const newPinned = [...pinnedApps];
    const [moved] = newPinned.splice(fromIndex, 1);
    newPinned.splice(toIndex, 0, moved);
    set({ pinnedApps: newPinned });
    saveToStorage(newPinned);
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
          set({ pinnedApps: parsed });
          return;
        }
      }
    } catch {
      console.warn('Failed to load dock pinned apps from localStorage. Using defaults.');
    }
    set({ pinnedApps: [...DEFAULT_PINNED_APPS] });
  },
}));

function saveToStorage(pinnedApps: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedApps));
  } catch {
    console.warn('Failed to save dock pinned apps to localStorage.');
  }
}

// Load on module init
useDockStore.getState().loadFromStorage();
