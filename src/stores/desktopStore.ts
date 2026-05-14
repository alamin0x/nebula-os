import { create } from 'zustand';

const STORAGE_KEY = 'nebula-desktop-hidden';

interface DesktopStore {
  hiddenApps: string[];
  hideApp: (appId: string) => void;
  showApp: (appId: string) => void;
  loadFromStorage: () => void;
}

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  hiddenApps: [],

  hideApp: (appId: string) => {
    const { hiddenApps } = get();
    if (hiddenApps.includes(appId)) return;
    const newHidden = [...hiddenApps, appId];
    set({ hiddenApps: newHidden });
    saveToStorage(newHidden);
  },

  showApp: (appId: string) => {
    const { hiddenApps } = get();
    const newHidden = hiddenApps.filter((id) => id !== appId);
    set({ hiddenApps: newHidden });
    saveToStorage(newHidden);
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
          set({ hiddenApps: parsed });
          return;
        }
      }
    } catch {
      console.warn('Failed to load desktop hidden apps from localStorage. Starting fresh.');
    }
    set({ hiddenApps: [] });
  },
}));

function saveToStorage(hiddenApps: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenApps));
  } catch {
    console.warn('Failed to save desktop hidden apps to localStorage.');
  }
}

// Load on module init
useDesktopStore.getState().loadFromStorage();
