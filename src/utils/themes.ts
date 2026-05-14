import type { Theme, ThemeName } from '../types';

/**
 * Theme definitions for Nebula OS.
 * Each theme provides a complete color palette used across the UI.
 */
export const themes: Record<ThemeName, Theme> = {
  cyberpunk: {
    name: 'cyberpunk',
    colors: {
      primary: '#8B5CF6',
      secondary: '#06B6D4',
      accent: '#EC4899',
      background: '#0a0a0f',
      surface: 'rgba(139, 92, 246, 0.15)',
      text: '#e2e8f0',
    },
  },
  matrix: {
    name: 'matrix',
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      accent: '#4ade80',
      background: '#000000',
      surface: 'rgba(34, 197, 94, 0.1)',
      text: '#22c55e',
    },
  },
  aurora: {
    name: 'aurora',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#0f172a',
      surface: 'rgba(99, 102, 241, 0.12)',
      text: '#e2e8f0',
    },
  },
};

/**
 * CSS custom property names mapped to theme color keys.
 */
const CSS_PROPERTY_MAP: Record<keyof Theme['colors'], string> = {
  primary: '--theme-primary',
  secondary: '--theme-secondary',
  accent: '--theme-accent',
  background: '--theme-background',
  surface: '--theme-surface',
  text: '--theme-text',
};

/**
 * Derives a more opaque fallback background for browsers without backdrop-filter.
 * Takes the theme background color and produces an 85% opaque version.
 */
function deriveGlassFallback(theme: Theme): string {
  const bg = theme.colors.background;
  // Parse hex background color to produce an rgba fallback with high opacity
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.85)`;
}

/**
 * Applies a theme by setting CSS custom properties on document.documentElement.
 * This enables dynamic theme switching without a full re-render.
 * Also sets the --glass-fallback-bg variable for @supports fallback.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  for (const [key, cssVar] of Object.entries(CSS_PROPERTY_MAP)) {
    const colorKey = key as keyof Theme['colors'];
    root.style.setProperty(cssVar, theme.colors[colorKey]);
  }

  // Set fallback background for browsers without backdrop-filter support
  root.style.setProperty('--glass-fallback-bg', deriveGlassFallback(theme));
}

/**
 * Returns the default theme (cyberpunk).
 */
export function getDefaultTheme(): Theme {
  return themes.cyberpunk;
}
