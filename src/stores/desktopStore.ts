import { create } from 'zustand';

const STORAGE_KEY = 'nebula-desktop-hidden';
const POSITIONS_STORAGE_KEY = 'nebula-desktop-positions';

interface DesktopStore {
  hiddenApps: string[];
  positions: Record<string, { col: number; row: number }>;
  hideApp: (appId: string) => void;
  showApp: (appId: string) => void;
  setPosition: (appId: string, col: number, row: number) => void;
  loadFromStorage: () => void;
}

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  hiddenApps: [],
  positions: {},

  hideApp: (appId: string) => {
    const { hiddenApps } = get();
    if (hiddenApps.includes(appId)) return;
    const newHidden = [...hiddenApps, appId];
    set({ hiddenApps: newHidden });
    saveHiddenToStorage(newHidden);
  },

  showApp: (appId: string) => {
    const { hiddenApps } = get();
    const newHidden = hiddenApps.filter((id) => id !== appId);
    set({ hiddenApps: newHidden });
    saveHiddenToStorage(newHidden);
  },

  setPosition: (appId: string, col: number, row: number) => {
    const { positions } = get();
    const newPositions = { ...positions, [appId]: { col, row } };
    set({ positions: newPositions });
    savePositionsToStorage(newPositions);
  },

  loadFromStorage: () => {
    let hiddenApps: string[] = [];
    let positions: Record<string, { col: number; row: number }> = {};

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
          hiddenApps = parsed;
        }
      }
    } catch {
      console.warn('Failed to load desktop hidden apps from localStorage. Starting fresh.');
    }

    try {
      const raw = localStorage.getItem(POSITIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          positions = parsed;
        }
      }
    } catch {
      console.warn('Failed to load desktop positions from localStorage. Starting fresh.');
    }

    set({ hiddenApps, positions });
  },
}));

function saveHiddenToStorage(hiddenApps: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenApps));
  } catch {
    console.warn('Failed to save desktop hidden apps to localStorage.');
  }
}

function savePositionsToStorage(positions: Record<string, { col: number; row: number }>): void {
  try {
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    console.warn('Failed to save desktop positions to localStorage.');
  }
}

// Load on module init
useDesktopStore.getState().loadFromStorage();
