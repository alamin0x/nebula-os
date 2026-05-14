import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import Terminal from './Terminal';
import { useTerminalStore } from '../stores/terminalStore';
import { useThemeStore } from '../stores/themeStore';
import { useWindowStore } from '../stores/windowStore';
import { useMusicStore } from '../stores/musicStore';

describe('Terminal', () => {
  beforeEach(() => {
    // Reset terminal store state before each test
    useTerminalStore.setState({ history: [], currentPath: [] });
  });

  it('renders the prompt with default path', () => {
    render(<Terminal />);
    // The prompt should show "guest@nebula:~$"
    const prompts = screen.getAllByText('guest@nebula:~$');
    expect(prompts.length).toBeGreaterThan(0);
  });

  it('renders the input field', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');
    expect(input).toBeInTheDocument();
  });

  it('submits a command on Enter', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');

    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.submit(input.closest('form')!);

    // After submitting, the input should be cleared
    expect(input).toHaveValue('');

    // The history should now contain the input entry
    const state = useTerminalStore.getState();
    expect(state.history.length).toBeGreaterThan(0);
    expect(state.history[0].type).toBe('input');
    expect(state.history[0].content).toBe('help');
  });

  it('does not submit empty input', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');

    fireEvent.submit(input.closest('form')!);

    const state = useTerminalStore.getState();
    expect(state.history.length).toBe(0);
  });

  it('navigates command history with up/down arrows', () => {
    // Pre-populate history with some commands
    const store = useTerminalStore.getState();
    store.executeCommand('help');
    store.executeCommand('about');

    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');

    // Press up arrow to get last command
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveValue('about');

    // Press up arrow again to get first command
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveValue('help');

    // Press down arrow to go back to second command
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveValue('about');

    // Press down arrow past the end to clear input
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveValue('');
  });

  it('displays error entries with different styling', () => {
    // Execute an unrecognized command to generate an error entry
    const store = useTerminalStore.getState();
    store.executeCommand('unknowncmd123');

    render(<Terminal />);

    // The error message should be visible
    expect(
      screen.getByText(/Command not found: unknowncmd123/)
    ).toBeInTheDocument();
  });

  it('updates prompt when currentPath changes', () => {
    // Simulate navigating to a directory
    useTerminalStore.setState({ currentPath: ['projects'] });

    render(<Terminal />);
    const prompts = screen.getAllByText('guest@nebula:~/projects$');
    expect(prompts.length).toBeGreaterThan(0);
  });

  describe('theme switching via terminal command', () => {
    beforeEach(() => {
      // Reset theme to default before each theme test
      useThemeStore.getState().setTheme('cyberpunk');
    });

    it('switches theme to matrix when "theme matrix" is executed', () => {
      const store = useTerminalStore.getState();
      store.executeCommand('theme matrix');

      expect(useThemeStore.getState().activeTheme).toBe('matrix');
    });

    it('switches theme to aurora when "theme aurora" is executed', () => {
      const store = useTerminalStore.getState();
      store.executeCommand('theme aurora');

      expect(useThemeStore.getState().activeTheme).toBe('aurora');
    });

    it('switches theme to cyberpunk when "theme cyberpunk" is executed', () => {
      // First switch away from cyberpunk
      useThemeStore.getState().setTheme('matrix');

      const store = useTerminalStore.getState();
      store.executeCommand('theme cyberpunk');

      expect(useThemeStore.getState().activeTheme).toBe('cyberpunk');
    });

    it('does not change theme for invalid theme name', () => {
      const store = useTerminalStore.getState();
      store.executeCommand('theme invalid');

      // Should remain on default cyberpunk
      expect(useThemeStore.getState().activeTheme).toBe('cyberpunk');
    });

    it('provides visual feedback in terminal output after theme switch', () => {
      const store = useTerminalStore.getState();
      store.executeCommand('theme aurora');

      const state = useTerminalStore.getState();
      const outputEntry = state.history.find(
        (e) => e.type === 'output' && e.content.includes('aurora')
      );
      expect(outputEntry).toBeDefined();
      expect(outputEntry!.content).toBe('Theme switched to aurora.');
    });

    it('handles theme command case-insensitively', () => {
      const store = useTerminalStore.getState();
      store.executeCommand('THEME Matrix');

      expect(useThemeStore.getState().activeTheme).toBe('matrix');
    });
  });

  describe('cross-app commands', () => {
    beforeEach(() => {
      useWindowStore.setState({ windows: [], activeWindowId: null });
      useMusicStore.setState({ isPlaying: false, currentTrackIndex: 0 });
    });

    it('"notes" command opens the Notes window', () => {
      const store = useTerminalStore.getState();
      store.executeCommand('notes');

      const windowState = useWindowStore.getState();
      expect(windowState.windows.some((w) => w.appId === 'notes')).toBe(true);
    });

    it('"music" command opens Music Player and starts playback', () => {
      const store = useTerminalStore.getState();
      store.executeCommand('music');

      const windowState = useWindowStore.getState();
      expect(windowState.windows.some((w) => w.appId === 'music-player')).toBe(true);

      const musicState = useMusicStore.getState();
      expect(musicState.isPlaying).toBe(true);
    });

    it('"secret" command opens the Secret Room window', () => {
      const store = useTerminalStore.getState();
      store.executeCommand('secret');

      const windowState = useWindowStore.getState();
      expect(windowState.windows.some((w) => w.appId === 'secret-room')).toBe(true);
    });

    it('"notes" command does not open duplicate window if already open', () => {
      useWindowStore.getState().openWindow('notes');
      const initialCount = useWindowStore.getState().windows.length;

      useTerminalStore.getState().executeCommand('notes');

      expect(useWindowStore.getState().windows.length).toBe(initialCount);
    });

    it('"music" command does not open duplicate window if already open', () => {
      useWindowStore.getState().openWindow('music-player');
      const initialCount = useWindowStore.getState().windows.length;

      useTerminalStore.getState().executeCommand('music');

      expect(useWindowStore.getState().windows.length).toBe(initialCount);
      expect(useMusicStore.getState().isPlaying).toBe(true);
    });
  });
});
