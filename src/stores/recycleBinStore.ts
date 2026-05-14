import { create } from 'zustand';

const STORAGE_KEY = 'nebula-recycle-bin';

export interface RecycleBinItem {
  id: string;
  appId: string;
  title: string;
  icon: string;
  removedAt: number;
}

interface RecycleBinStore {
  items: RecycleBinItem[];
  moveToTrash: (appId: string, title: string, icon: string) => void;
  restore: (id: string) => void;
  emptyTrash: () => void;
  loadFromStorage: () => void;
}

export const useRecycleBinStore = create<RecycleBinStore>((set, get) => ({
  items: [],

  moveToTrash: (appId: string, title: string, icon: string) => {
    const { items } = get();
    // Don't add duplicates
    if (items.some((item) => item.appId === appId)) return;
    const newItem: RecycleBinItem = {
      id: `trash-${appId}-${Date.now()}`,
      appId,
      title,
      icon,
      removedAt: Date.now(),
    };
    const newItems = [...items, newItem];
    set({ items: newItems });
    saveToStorage(newItems);
  },

  restore: (id: string) => {
    const { items } = get();
    const newItems = items.filter((item) => item.id !== id);
    set({ items: newItems });
    saveToStorage(newItems);
  },

  emptyTrash: () => {
    set({ items: [] });
    saveToStorage([]);
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          set({ items: parsed });
          return;
        }
      }
    } catch {
      console.warn('Failed to load recycle bin from localStorage. Starting fresh.');
    }
    set({ items: [] });
  },
}));

function saveToStorage(items: RecycleBinItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.warn('Failed to save recycle bin to localStorage.');
  }
}

// Load on module init
useRecycleBinStore.getState().loadFromStorage();
