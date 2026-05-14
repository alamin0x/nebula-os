import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useWindowStore } from './windowStore';
import type { AppId } from '../types';

const ALL_APP_IDS: AppId[] = [
  'notes',
  'ai-assistant',
  'music-player',
  'system-monitor',
  'terminal',
  'secret-room',
];

const appIdArb = fc.constantFrom(...ALL_APP_IDS);

describe('windowStore property tests', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: [], activeWindowId: null });
  });

  // Feature: nebula-os, Property 2: No duplicate windows for the same application
  // **Validates: Requirements 2.5**
  describe('Property 2: No duplicate windows for the same application', () => {
    it('opening the same app multiple times never creates duplicates', () => {
      fc.assert(
        fc.property(appIdArb, fc.integer({ min: 2, max: 10 }), (appId, repeatCount) => {
          useWindowStore.setState({ windows: [], activeWindowId: null });

          for (let i = 0; i < repeatCount; i++) {
            useWindowStore.getState().openWindow(appId);
          }

          const { windows } = useWindowStore.getState();
          const appWindows = windows.filter((w) => w.appId === appId);
          expect(appWindows).toHaveLength(1);
        }),
        { numRuns: 100 },
      );
    });

    it('opening an already-open app sets its z-index to the maximum', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(appIdArb, { minLength: 2, maxLength: 6 }),
          (appIds) => {
            useWindowStore.setState({ windows: [], activeWindowId: null });

            // Open all apps
            for (const id of appIds) {
              useWindowStore.getState().openWindow(id);
            }

            // Re-open the first app (should bring to foreground, not duplicate)
            const targetAppId = appIds[0];
            useWindowStore.getState().openWindow(targetAppId);

            const { windows } = useWindowStore.getState();
            // Window count should not have increased
            expect(windows).toHaveLength(appIds.length);

            // The target window should have the highest z-index
            const targetWindow = windows.find((w) => w.appId === targetAppId)!;
            const otherWindows = windows.filter((w) => w.appId !== targetAppId);
            for (const other of otherWindows) {
              expect(targetWindow.zIndex).toBeGreaterThan(other.zIndex);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: nebula-os, Property 4: Minimum window size constraint
  // **Validates: Requirements 4.2**
  describe('Property 4: Minimum window size constraint', () => {
    it('updateSize never produces dimensions below 200x150', () => {
      fc.assert(
        fc.property(
          appIdArb,
          fc.record({
            width: fc.float({ min: -1000, max: 5000, noNaN: true, noDefaultInfinity: true }),
            height: fc.float({ min: -1000, max: 5000, noNaN: true, noDefaultInfinity: true }),
          }),
          (appId, size) => {
            useWindowStore.setState({ windows: [], activeWindowId: null });
            useWindowStore.getState().openWindow(appId);

            const id = useWindowStore.getState().windows[0].id;
            useWindowStore.getState().updateSize(id, size);

            const win = useWindowStore.getState().windows[0];
            expect(win.size.width).toBeGreaterThanOrEqual(200);
            expect(win.size.height).toBeGreaterThanOrEqual(150);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('sizes above minimum are preserved exactly', () => {
      fc.assert(
        fc.property(
          appIdArb,
          fc.record({
            width: fc.integer({ min: 200, max: 5000 }),
            height: fc.integer({ min: 150, max: 5000 }),
          }),
          (appId, size) => {
            useWindowStore.setState({ windows: [], activeWindowId: null });
            useWindowStore.getState().openWindow(appId);

            const id = useWindowStore.getState().windows[0].id;
            useWindowStore.getState().updateSize(id, size);

            const win = useWindowStore.getState().windows[0];
            expect(win.size.width).toBe(size.width);
            expect(win.size.height).toBe(size.height);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: nebula-os, Property 5: Maximize/restore round-trip preserves bounds
  // **Validates: Requirements 4.4, 4.5**
  describe('Property 5: Maximize/restore round-trip preserves bounds', () => {
    it('maximizing then restoring returns window to original position and size', () => {
      fc.assert(
        fc.property(
          appIdArb,
          fc.record({
            x: fc.integer({ min: 0, max: 2000 }),
            y: fc.integer({ min: 0, max: 2000 }),
          }),
          fc.record({
            width: fc.integer({ min: 200, max: 2000 }),
            height: fc.integer({ min: 150, max: 1500 }),
          }),
          (appId, position, size) => {
            useWindowStore.setState({ windows: [], activeWindowId: null });
            useWindowStore.getState().openWindow(appId);

            const id = useWindowStore.getState().windows[0].id;

            // Set custom position and size
            useWindowStore.getState().updatePosition(id, position);
            useWindowStore.getState().updateSize(id, size);

            // Maximize
            useWindowStore.getState().maximizeWindow(id);
            const maximized = useWindowStore.getState().windows[0];
            expect(maximized.isMaximized).toBe(true);
            expect(maximized.previousBounds).toBeDefined();

            // Restore
            useWindowStore.getState().restoreWindow(id);
            const restored = useWindowStore.getState().windows[0];

            expect(restored.isMaximized).toBe(false);
            expect(restored.position.x).toBe(position.x);
            expect(restored.position.y).toBe(position.y);
            expect(restored.size.width).toBe(size.width);
            expect(restored.size.height).toBe(size.height);
            expect(restored.previousBounds).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: nebula-os, Property 6: Close removes window from state
  // **Validates: Requirements 4.6**
  describe('Property 6: Close removes window from state', () => {
    it('closing a window removes exactly that window, leaving others unchanged', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(appIdArb, { minLength: 1, maxLength: 6 }),
          fc.nat(),
          (appIds, indexSeed) => {
            useWindowStore.setState({ windows: [], activeWindowId: null });

            // Open all apps
            for (const id of appIds) {
              useWindowStore.getState().openWindow(id);
            }

            const windowsBefore = useWindowStore.getState().windows;
            const targetIndex = indexSeed % windowsBefore.length;
            const targetWindow = windowsBefore[targetIndex];
            const otherWindowIds = windowsBefore
              .filter((w) => w.id !== targetWindow.id)
              .map((w) => w.id);

            // Close the target window
            useWindowStore.getState().closeWindow(targetWindow.id);

            const windowsAfter = useWindowStore.getState().windows;

            // Exactly one window removed
            expect(windowsAfter).toHaveLength(windowsBefore.length - 1);

            // The closed window is gone
            expect(windowsAfter.find((w) => w.id === targetWindow.id)).toBeUndefined();

            // All other windows still present
            for (const otherId of otherWindowIds) {
              expect(windowsAfter.find((w) => w.id === otherId)).toBeDefined();
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: nebula-os, Property 7: Focused window gets highest z-index
  // **Validates: Requirements 4.7, 4.8**
  describe('Property 7: Focused window gets highest z-index', () => {
    it('focusing a window assigns it a z-index strictly greater than all others', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(appIdArb, { minLength: 2, maxLength: 6 }),
          fc.nat(),
          (appIds, indexSeed) => {
            useWindowStore.setState({ windows: [], activeWindowId: null });

            // Open all apps
            for (const id of appIds) {
              useWindowStore.getState().openWindow(id);
            }

            const windows = useWindowStore.getState().windows;
            const targetIndex = indexSeed % windows.length;
            const targetId = windows[targetIndex].id;

            // Focus the target window
            useWindowStore.getState().focusWindow(targetId);

            const updatedWindows = useWindowStore.getState().windows;
            const focusedWindow = updatedWindows.find((w) => w.id === targetId)!;
            const otherWindows = updatedWindows.filter((w) => w.id !== targetId);

            for (const other of otherWindows) {
              expect(focusedWindow.zIndex).toBeGreaterThan(other.zIndex);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('opening a new window gives it the highest z-index', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(appIdArb, { minLength: 2, maxLength: 6 }),
          (appIds) => {
            useWindowStore.setState({ windows: [], activeWindowId: null });

            // Open all apps
            for (const id of appIds) {
              useWindowStore.getState().openWindow(id);
            }

            const { windows } = useWindowStore.getState();
            // The last opened window should have the highest z-index
            const lastAppId = appIds[appIds.length - 1];
            const lastWindow = windows.find((w) => w.appId === lastAppId)!;
            const otherWindows = windows.filter((w) => w.appId !== lastAppId);

            for (const other of otherWindows) {
              expect(lastWindow.zIndex).toBeGreaterThan(other.zIndex);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('focused window becomes the activeWindowId', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(appIdArb, { minLength: 2, maxLength: 6 }),
          fc.nat(),
          (appIds, indexSeed) => {
            useWindowStore.setState({ windows: [], activeWindowId: null });

            for (const id of appIds) {
              useWindowStore.getState().openWindow(id);
            }

            const windows = useWindowStore.getState().windows;
            const targetIndex = indexSeed % windows.length;
            const targetId = windows[targetIndex].id;

            useWindowStore.getState().focusWindow(targetId);

            expect(useWindowStore.getState().activeWindowId).toBe(targetId);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
