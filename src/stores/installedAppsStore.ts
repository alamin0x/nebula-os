import { create } from 'zustand';
import type { AppManifest } from '../types/appManifest';
import { validateManifest } from '../types/appManifest';
import { useWindowStore } from './windowStore';

const STORAGE_KEY = 'nebula-installed-apps';

interface InstalledAppsStore {
  apps: AppManifest[];
  installApp: (manifest: AppManifest) => string | null; // returns error or null
  uninstallApp: (id: string) => void;
  loadFromStorage: () => void;
  getApp: (id: string) => AppManifest | undefined;
}

export const useInstalledAppsStore = create<InstalledAppsStore>((set, get) => ({
  apps: [],

  installApp: (manifest: AppManifest) => {
    const error = validateManifest(manifest);
    if (error) return error;

    const { apps } = get();
    // Don't install duplicates
    if (apps.some((a) => a.id === manifest.id)) {
      return `App "${manifest.name}" is already installed.`;
    }

    const newApps = [...apps, manifest];
    set({ apps: newApps });
    saveToStorage(newApps);
    return null;
  },

  uninstallApp: (id: string) => {
    // Close the window if it's open
    const windowState = useWindowStore.getState();
    const openWindow = windowState.windows.find((w) => w.appId === id);
    if (openWindow) {
      windowState.closeWindow(openWindow.id);
    }

    const newApps = get().apps.filter((a) => a.id !== id);
    set({ apps: newApps });
    saveToStorage(newApps);
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Validate each manifest
          const valid = parsed.filter((m: unknown) => validateManifest(m) === null) as AppManifest[];
          set({ apps: valid });
          return;
        }
      }
    } catch {
      console.warn('Failed to load installed apps from localStorage. Starting fresh.');
    }
    set({ apps: [] });
  },

  getApp: (id: string) => {
    return get().apps.find((a) => a.id === id);
  },
}));

function saveToStorage(apps: AppManifest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch {
    console.warn('Failed to save installed apps to localStorage.');
  }
}

// Load on module init
useInstalledAppsStore.getState().loadFromStorage();
