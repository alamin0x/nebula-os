import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from './windowStore';

describe('windowStore', () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: [], activeWindowId: null });
  });

  describe('openWindow', () => {
    it('opens a new window with correct properties', () => {
      useWindowStore.getState().openWindow('notes');
      const { windows } = useWindowStore.getState();

      expect(windows).toHaveLength(1);
      expect(windows[0].appId).toBe('notes');
      expect(windows[0].title).toBe('Notes');
      expect(windows[0].isMinimized).toBe(false);
      expect(windows[0].isMaximized).toBe(false);
      expect(windows[0].zIndex).toBeGreaterThanOrEqual(100);
    });

    it('does not open duplicate windows for the same app', () => {
      useWindowStore.getState().openWindow('notes');
      useWindowStore.getState().openWindow('notes');
      const { windows } = useWindowStore.getState();

      expect(windows).toHaveLength(1);
    });

    it('brings existing window to foreground when opening duplicate', () => {
      useWindowStore.getState().openWindow('notes');
      useWindowStore.getState().openWindow('terminal');
      useWindowStore.getState().openWindow('notes');

      const { windows, activeWindowId } = useWindowStore.getState();
      const notesWindow = windows.find((w) => w.appId === 'notes')!;
      const terminalWindow = windows.find((w) => w.appId === 'terminal')!;

      expect(notesWindow.zIndex).toBeGreaterThan(terminalWindow.zIndex);
      expect(activeWindowId).toBe(notesWindow.id);
    });

    it('assigns highest z-index to newly opened window', () => {
      useWindowStore.getState().openWindow('notes');
      useWindowStore.getState().openWindow('terminal');

      const { windows } = useWindowStore.getState();
      const terminalWindow = windows.find((w) => w.appId === 'terminal')!;
      const notesWindow = windows.find((w) => w.appId === 'notes')!;

      expect(terminalWindow.zIndex).toBeGreaterThan(notesWindow.zIndex);
    });
  });

  describe('closeWindow', () => {
    it('removes the window from state', () => {
      useWindowStore.getState().openWindow('notes');
      const { windows } = useWindowStore.getState();
      const id = windows[0].id;

      useWindowStore.getState().closeWindow(id);
      expect(useWindowStore.getState().windows).toHaveLength(0);
    });

    it('leaves other windows unchanged', () => {
      useWindowStore.getState().openWindow('notes');
      useWindowStore.getState().openWindow('terminal');
      const notesId = useWindowStore.getState().windows.find((w) => w.appId === 'notes')!.id;

      useWindowStore.getState().closeWindow(notesId);
      const { windows } = useWindowStore.getState();

      expect(windows).toHaveLength(1);
      expect(windows[0].appId).toBe('terminal');
    });

    it('clears activeWindowId if closed window was active', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;

      useWindowStore.getState().closeWindow(id);
      expect(useWindowStore.getState().activeWindowId).toBeNull();
    });
  });

  describe('minimizeWindow', () => {
    it('sets isMinimized to true', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;

      useWindowStore.getState().minimizeWindow(id);
      expect(useWindowStore.getState().windows[0].isMinimized).toBe(true);
    });

    it('clears activeWindowId if minimized window was active', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;

      useWindowStore.getState().minimizeWindow(id);
      expect(useWindowStore.getState().activeWindowId).toBeNull();
    });
  });

  describe('maximizeWindow', () => {
    it('sets isMaximized to true and stores previous bounds', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;
      const originalPos = { ...useWindowStore.getState().windows[0].position };
      const originalSize = { ...useWindowStore.getState().windows[0].size };

      useWindowStore.getState().maximizeWindow(id);
      const win = useWindowStore.getState().windows[0];

      expect(win.isMaximized).toBe(true);
      expect(win.previousBounds).toEqual({ position: originalPos, size: originalSize });
    });
  });

  describe('restoreWindow', () => {
    it('restores previous bounds after maximize', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;
      const originalPos = { ...useWindowStore.getState().windows[0].position };
      const originalSize = { ...useWindowStore.getState().windows[0].size };

      useWindowStore.getState().maximizeWindow(id);
      useWindowStore.getState().restoreWindow(id);

      const win = useWindowStore.getState().windows[0];
      expect(win.isMaximized).toBe(false);
      expect(win.position).toEqual(originalPos);
      expect(win.size).toEqual(originalSize);
      expect(win.previousBounds).toBeUndefined();
    });
  });

  describe('focusWindow', () => {
    it('assigns highest z-index to focused window', () => {
      useWindowStore.getState().openWindow('notes');
      useWindowStore.getState().openWindow('terminal');
      useWindowStore.getState().openWindow('music-player');

      const notesId = useWindowStore.getState().windows.find((w) => w.appId === 'notes')!.id;
      useWindowStore.getState().focusWindow(notesId);

      const { windows } = useWindowStore.getState();
      const notesWindow = windows.find((w) => w.appId === 'notes')!;
      const otherWindows = windows.filter((w) => w.appId !== 'notes');

      for (const other of otherWindows) {
        expect(notesWindow.zIndex).toBeGreaterThan(other.zIndex);
      }
    });

    it('sets activeWindowId to focused window', () => {
      useWindowStore.getState().openWindow('notes');
      useWindowStore.getState().openWindow('terminal');

      const notesId = useWindowStore.getState().windows.find((w) => w.appId === 'notes')!.id;
      useWindowStore.getState().focusWindow(notesId);

      expect(useWindowStore.getState().activeWindowId).toBe(notesId);
    });

    it('un-minimizes the window when focused', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;

      useWindowStore.getState().minimizeWindow(id);
      expect(useWindowStore.getState().windows[0].isMinimized).toBe(true);

      useWindowStore.getState().focusWindow(id);
      expect(useWindowStore.getState().windows[0].isMinimized).toBe(false);
    });
  });

  describe('updatePosition', () => {
    it('updates the window position', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;

      useWindowStore.getState().updatePosition(id, { x: 300, y: 200 });
      expect(useWindowStore.getState().windows[0].position).toEqual({ x: 300, y: 200 });
    });
  });

  describe('updateSize', () => {
    it('updates the window size', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;

      useWindowStore.getState().updateSize(id, { width: 800, height: 600 });
      expect(useWindowStore.getState().windows[0].size).toEqual({ width: 800, height: 600 });
    });

    it('enforces minimum width of 200px', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;

      useWindowStore.getState().updateSize(id, { width: 100, height: 600 });
      expect(useWindowStore.getState().windows[0].size.width).toBe(200);
    });

    it('enforces minimum height of 150px', () => {
      useWindowStore.getState().openWindow('notes');
      const id = useWindowStore.getState().windows[0].id;

      useWindowStore.getState().updateSize(id, { width: 800, height: 50 });
      expect(useWindowStore.getState().windows[0].size.height).toBe(150);
    });
  });
});
