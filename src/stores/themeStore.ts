import { create } from 'zustand';
import type { ThemeStore } from '../types/stores';
import type { ThemeName } from '../types';
import { themes, applyTheme } from '../utils/themes';

const STORAGE_KEY = 'nebula-theme';

/**
 * Loads the saved theme name from localStorage.
 * Returns 'cyberpunk' as the default if nothing is saved or the value is invalid.
 */
function loadThemeFromStorage(): ThemeName {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && Object.hasOwn(themes, saved)) {
      return saved as ThemeName;
    }
  } catch {
    // localStorage unavailable — fall back to default
  }
  return 'cyberpunk';
}

/**
 * Persists the theme name to localStorage.
 */
function saveThemeToStorage(name: ThemeName): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Storage unavailable or quota exceeded — silently ignore
  }
}

/**
 * Zustand store for theme management.
 * Handles switching between themes, persisting the selection to localStorage,
 * and applying CSS custom properties to the document root.
 */
export const useThemeStore = create<ThemeStore>((set) => {
  // Load initial theme and apply it
  const initialTheme = loadThemeFromStorage();
  applyTheme(themes[initialTheme]);

  return {
    activeTheme: initialTheme,

    setTheme: (name: ThemeName) => {
      if (!Object.hasOwn(themes, name)) return;

      applyTheme(themes[name]);
      saveThemeToStorage(name);
      set({ activeTheme: name });
    },
  };
});
