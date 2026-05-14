import { create } from 'zustand';
import type { TerminalStore } from '../types/stores';
import type { TerminalEntry, ThemeName } from '../types';
import { parseCommand } from '../utils/commandParser';
import { useThemeStore } from './themeStore';
import { useWindowStore } from './windowStore';
import { useMusicStore } from './musicStore';

let entryId = 0;

function createEntry(type: TerminalEntry['type'], content: string): TerminalEntry {
  return {
    id: `entry-${++entryId}`,
    type,
    content,
    timestamp: Date.now(),
  };
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  history: [],
  currentPath: [],
  hackActive: false,
  matrixRainActive: false,

  executeCommand: (input: string) => {
    const { currentPath, history } = get();
    const trimmed = input.trim();

    // Add the input entry to history
    const inputEntry = createEntry('input', trimmed);

    // Parse and execute the command
    const result = parseCommand(trimmed, currentPath);

    // Handle clear action — wipe history entirely
    if (result.action === 'clear') {
      set({ history: [] });
      return;
    }

    // Handle theme switching — call themeStore.setTheme() with the payload
    if (result.action === 'theme' && result.actionPayload) {
      useThemeStore.getState().setTheme(result.actionPayload as ThemeName);
    }

    // Handle open-notes — open the Notes window
    if (result.action === 'open-notes') {
      useWindowStore.getState().openWindow('notes');
    }

    // Handle play-music — open Music Player and start playback
    if (result.action === 'play-music') {
      useWindowStore.getState().openWindow('music-player');
      useMusicStore.getState().play();
    }

    // Handle secret — open the Secret Room window
    if (result.action === 'secret') {
      useWindowStore.getState().openWindow('secret-room');
    }

    // Build new history with input + output
    const newEntries: TerminalEntry[] = [inputEntry];

    if (result.output) {
      const outputType: TerminalEntry['type'] =
        result.output.startsWith('Command not found:') ||
        result.output.startsWith('cd: no such') ||
        result.output.startsWith('Error:')
          ? 'error'
          : 'output';
      newEntries.push(createEntry(outputType, result.output));
    }

    const updates: Partial<TerminalStore> = {
      history: [...history, ...newEntries],
    };

    // Handle path changes from cd
    if (result.newPath !== undefined) {
      updates.currentPath = result.newPath;
    }

    set(updates as TerminalStore);

    // Trigger hack sequence overlay
    if (result.action === 'hack') {
      set({ hackActive: true });
    }

    // Trigger matrix rain overlay
    if (result.action === 'matrix') {
      set({ matrixRainActive: true });
    }
  },

  clear: () => {
    set({ history: [] });
  },

  setHackActive: (active: boolean) => {
    set({ hackActive: active });
  },

  setMatrixRainActive: (active: boolean) => {
    set({ matrixRainActive: active });
  },
}));
