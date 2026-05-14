import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useThemeStore } from './themeStore';
import { themes } from '../utils/themes';
import type { ThemeName } from '../types';

// Feature: nebula-os, Property 19: Theme switching applies correct palette
// **Validates: Requirements 10.3**
describe('Property 19: Theme switching applies correct palette', () => {
  const validThemeNames: ThemeName[] = ['cyberpunk', 'matrix', 'aurora'];

  // Arbitrary that generates a valid theme name
  const themeNameArb = fc.constantFrom(...validThemeNames);

  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ activeTheme: 'cyberpunk' });
    // Clear any CSS custom properties
    const root = document.documentElement;
    root.style.removeProperty('--theme-primary');
    root.style.removeProperty('--theme-secondary');
    root.style.removeProperty('--theme-accent');
    root.style.removeProperty('--theme-background');
    root.style.removeProperty('--theme-surface');
    root.style.removeProperty('--theme-text');
  });

  it('setTheme always results in a valid theme from the predefined set', () => {
    fc.assert(
      fc.property(themeNameArb, (themeName) => {
        const { setTheme } = useThemeStore.getState();
        setTheme(themeName);

        const state = useThemeStore.getState();
        expect(validThemeNames).toContain(state.activeTheme);
        expect(state.activeTheme).toBe(themeName);
      }),
      { numRuns: 100 },
    );
  });

  it('setTheme applies all CSS custom properties matching the predefined palette', () => {
    fc.assert(
      fc.property(themeNameArb, (themeName) => {
        const { setTheme } = useThemeStore.getState();
        setTheme(themeName);

        const root = document.documentElement;
        const expectedTheme = themes[themeName];

        // All color values must match the predefined palette for that theme
        expect(root.style.getPropertyValue('--theme-primary')).toBe(expectedTheme.colors.primary);
        expect(root.style.getPropertyValue('--theme-secondary')).toBe(expectedTheme.colors.secondary);
        expect(root.style.getPropertyValue('--theme-accent')).toBe(expectedTheme.colors.accent);
        expect(root.style.getPropertyValue('--theme-background')).toBe(expectedTheme.colors.background);
        expect(root.style.getPropertyValue('--theme-surface')).toBe(expectedTheme.colors.surface);
        expect(root.style.getPropertyValue('--theme-text')).toBe(expectedTheme.colors.text);
      }),
      { numRuns: 100 },
    );
  });

  it('invalid theme names do not change the active theme state', () => {
    // Generate arbitrary strings that are NOT valid theme names
    const invalidThemeArb = fc.string({ minLength: 1, maxLength: 50 }).filter(
      (s) => !validThemeNames.includes(s as ThemeName),
    );

    fc.assert(
      fc.property(invalidThemeArb, (invalidName) => {
        // Set a known initial state
        useThemeStore.setState({ activeTheme: 'cyberpunk' });

        const { setTheme } = useThemeStore.getState();
        setTheme(invalidName as ThemeName);

        // State should remain unchanged
        expect(useThemeStore.getState().activeTheme).toBe('cyberpunk');
      }),
      { numRuns: 100 },
    );
  });

  it('sequential theme switches always leave the store in a consistent state', () => {
    fc.assert(
      fc.property(
        fc.array(themeNameArb, { minLength: 1, maxLength: 20 }),
        (themeSequence) => {
          for (const themeName of themeSequence) {
            const { setTheme } = useThemeStore.getState();
            setTheme(themeName);
          }

          // After all switches, the active theme should be the last one applied
          const lastTheme = themeSequence[themeSequence.length - 1];
          const state = useThemeStore.getState();
          expect(state.activeTheme).toBe(lastTheme);

          // And CSS properties should match the last theme
          const root = document.documentElement;
          const expectedTheme = themes[lastTheme];
          expect(root.style.getPropertyValue('--theme-primary')).toBe(expectedTheme.colors.primary);
          expect(root.style.getPropertyValue('--theme-secondary')).toBe(expectedTheme.colors.secondary);
          expect(root.style.getPropertyValue('--theme-accent')).toBe(expectedTheme.colors.accent);
          expect(root.style.getPropertyValue('--theme-background')).toBe(expectedTheme.colors.background);
          expect(root.style.getPropertyValue('--theme-surface')).toBe(expectedTheme.colors.surface);
          expect(root.style.getPropertyValue('--theme-text')).toBe(expectedTheme.colors.text);
        },
      ),
      { numRuns: 100 },
    );
  });
});
