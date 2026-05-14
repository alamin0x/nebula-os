import { render, screen, act, fireEvent, within, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from '../App';
import { useWindowStore } from '../stores/windowStore';
import { useTerminalStore } from '../stores/terminalStore';
import { useThemeStore } from '../stores/themeStore';
import { useMusicStore } from '../stores/musicStore';
import { themes } from '../utils/themes';

/**
 * Integration tests for Nebula OS.
 *
 * These tests verify end-to-end flows through the full component tree
 * using Vitest + React Testing Library (jsdom). They cover:
 * 1. Boot sequence → Desktop transition
 * 2. Dock icon clicks → window opening
 * 3. Terminal commands (help, theme, notes, music)
 * 4. Window management (minimize, maximize, close, focus)
 * 5. Theme switching via CSS custom properties
 *
 * Validates: Requirements 1.1–1.6, 4.1–4.9, 9.4, 9.6, 10.3, 13.1–13.3
 */

// Mock framer-motion to avoid animation timing issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
    pre: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <pre {...rest}>{children}</pre>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock canvas for BackgroundRenderer and MatrixRain
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  measureText: vi.fn(() => ({ width: 10 })),
  canvas: { width: 1024, height: 768 },
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// Mock Web Audio API for MusicPlayer
const mockAudioContext = {
  createAnalyser: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn(),
  })),
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 1 },
  })),
  destination: {},
  state: 'running',
  resume: vi.fn(),
};

(globalThis as unknown as Record<string, unknown>).AudioContext = vi.fn(() => mockAudioContext);
(globalThis as unknown as Record<string, unknown>).webkitAudioContext = vi.fn(() => mockAudioContext);

// Mock HTMLMediaElement play/pause
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: vi.fn(() => Promise.resolve()),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: vi.fn(),
});

/**
 * Helper: get a dock button by app name.
 * Scopes the query to the dock element to avoid conflicts with desktop icons.
 */
function getDockButton(appName: string): HTMLElement {
  const dock = screen.getByTestId('dock');
  return within(dock).getByLabelText(`Open ${appName}`);
}

describe('Integration: Boot Sequence', () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    vi.useFakeTimers();
    useWindowStore.setState({ windows: [], activeWindowId: null });
    useTerminalStore.setState({ history: [], currentPath: [], hackActive: false, matrixRainActive: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('completes boot sequence and transitions to desktop', () => {
    render(<App />);

    // Boot screen should be visible initially
    expect(screen.getByTestId('boot-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop')).not.toBeInTheDocument();

    // Advance past boot duration (3000ms) + glitch transition (400ms)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Desktop should now be visible
    expect(screen.getByTestId('desktop')).toBeInTheDocument();
    expect(screen.queryByTestId('boot-screen')).not.toBeInTheDocument();
  });

  it('shows boot messages in sequence before transitioning', () => {
    render(<App />);

    // First message
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByText('Initializing Nebula Core...')).toBeInTheDocument();

    // Second message
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByText('Loading modules...')).toBeInTheDocument();

    // Third message
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByText('Access granted.')).toBeInTheDocument();

    // Complete boot
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByTestId('desktop')).toBeInTheDocument();
  });

  it('skips boot when session flag is set', () => {
    sessionStorage.setItem('nebula-booted', 'true');
    render(<App />);

    expect(screen.getByTestId('desktop')).toBeInTheDocument();
    expect(screen.queryByTestId('boot-screen')).not.toBeInTheDocument();
  });

  it('sets session flag after boot completes', () => {
    render(<App />);

    expect(sessionStorage.getItem('nebula-booted')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(sessionStorage.getItem('nebula-booted')).toBe('true');
  });
});

describe('Integration: Dock Icon Clicks Open Windows', () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.setItem('nebula-booted', 'true');
    localStorage.clear();
    vi.useFakeTimers();
    useWindowStore.setState({ windows: [], activeWindowId: null });
    useTerminalStore.setState({ history: [], currentPath: [], hackActive: false, matrixRainActive: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('clicking Notes dock icon opens a Notes window', () => {
    render(<App />);

    const notesIcon = getDockButton('Notes');
    fireEvent.click(notesIcon);

    // Window should be in the store
    const windows = useWindowStore.getState().windows;
    expect(windows).toHaveLength(1);
    expect(windows[0].appId).toBe('notes');
    expect(windows[0].title).toBe('Notes');
  });

  it('clicking Terminal dock icon opens a Terminal window', () => {
    render(<App />);

    const terminalIcon = getDockButton('Terminal');
    fireEvent.click(terminalIcon);

    const windows = useWindowStore.getState().windows;
    expect(windows).toHaveLength(1);
    expect(windows[0].appId).toBe('terminal');
  });

  it('clicking Music Player dock icon opens a Music Player window', () => {
    render(<App />);

    const musicIcon = getDockButton('Music Player');
    fireEvent.click(musicIcon);

    const windows = useWindowStore.getState().windows;
    expect(windows).toHaveLength(1);
    expect(windows[0].appId).toBe('music-player');
  });

  it('clicking the same dock icon twice does not create duplicate windows', () => {
    render(<App />);

    const notesIcon = getDockButton('Notes');
    fireEvent.click(notesIcon);
    fireEvent.click(notesIcon);

    const windows = useWindowStore.getState().windows;
    expect(windows).toHaveLength(1);
  });

  it('clicking different dock icons opens multiple windows', () => {
    render(<App />);

    fireEvent.click(getDockButton('Notes'));
    fireEvent.click(getDockButton('Terminal'));
    fireEvent.click(getDockButton('Music Player'));

    const windows = useWindowStore.getState().windows;
    expect(windows).toHaveLength(3);
    expect(windows.map((w) => w.appId).sort()).toEqual(
      ['music-player', 'notes', 'terminal'].sort()
    );
  });
});

describe('Integration: Terminal Commands', () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.setItem('nebula-booted', 'true');
    localStorage.clear();
    vi.useFakeTimers();
    useWindowStore.setState({ windows: [], activeWindowId: null });
    useTerminalStore.setState({ history: [], currentPath: [], hackActive: false, matrixRainActive: false });
    useMusicStore.setState({ isPlaying: false, currentTrackIndex: 0, progress: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('"help" command produces output listing available commands', () => {
    useTerminalStore.getState().executeCommand('help');

    const history = useTerminalStore.getState().history;
    const output = history.find((e) => e.type === 'output');
    expect(output).toBeDefined();
    expect(output!.content).toContain('help');
    expect(output!.content).toContain('notes');
    expect(output!.content).toContain('music');
  });

  it('"theme matrix" command switches to matrix theme', () => {
    useTerminalStore.getState().executeCommand('theme matrix');

    expect(useThemeStore.getState().activeTheme).toBe('matrix');
  });

  it('"theme aurora" command switches to aurora theme', () => {
    useTerminalStore.getState().executeCommand('theme aurora');

    expect(useThemeStore.getState().activeTheme).toBe('aurora');
  });

  it('"theme cyberpunk" command switches to cyberpunk theme', () => {
    // Start with a different theme
    useThemeStore.getState().setTheme('matrix');
    expect(useThemeStore.getState().activeTheme).toBe('matrix');

    useTerminalStore.getState().executeCommand('theme cyberpunk');

    expect(useThemeStore.getState().activeTheme).toBe('cyberpunk');
  });

  it('"notes" command opens the Notes window', () => {
    useTerminalStore.getState().executeCommand('notes');

    const windows = useWindowStore.getState().windows;
    expect(windows).toHaveLength(1);
    expect(windows[0].appId).toBe('notes');
  });

  it('"music" command opens Music Player and starts playback', () => {
    useTerminalStore.getState().executeCommand('music');

    const windows = useWindowStore.getState().windows;
    expect(windows).toHaveLength(1);
    expect(windows[0].appId).toBe('music-player');
    expect(useMusicStore.getState().isPlaying).toBe(true);
  });

  it('"clear" command empties terminal history', () => {
    useTerminalStore.getState().executeCommand('help');
    expect(useTerminalStore.getState().history.length).toBeGreaterThan(0);

    useTerminalStore.getState().executeCommand('clear');
    expect(useTerminalStore.getState().history).toHaveLength(0);
  });

  it('unrecognized command produces error message', () => {
    useTerminalStore.getState().executeCommand('foobar');

    const history = useTerminalStore.getState().history;
    const error = history.find((e) => e.type === 'error');
    expect(error).toBeDefined();
    expect(error!.content).toContain('Command not found: foobar');
    expect(error!.content).toContain("Type 'help' for available commands.");
  });

  it('commands are case-insensitive', () => {
    useTerminalStore.getState().executeCommand('HELP');

    const history = useTerminalStore.getState().history;
    const output = history.find((e) => e.type === 'output');
    expect(output).toBeDefined();
    expect(output!.content).toContain('help');
  });
});

describe('Integration: Window Management', () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.setItem('nebula-booted', 'true');
    localStorage.clear();
    vi.useFakeTimers();
    useWindowStore.setState({ windows: [], activeWindowId: null });
    useTerminalStore.setState({ history: [], currentPath: [], hackActive: false, matrixRainActive: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('closing a window removes it from the store', () => {
    useWindowStore.getState().openWindow('notes');
    expect(useWindowStore.getState().windows).toHaveLength(1);

    const windowId = useWindowStore.getState().windows[0].id;
    useWindowStore.getState().closeWindow(windowId);

    expect(useWindowStore.getState().windows).toHaveLength(0);
  });

  it('minimizing a window sets isMinimized to true', () => {
    useWindowStore.getState().openWindow('terminal');
    const windowId = useWindowStore.getState().windows[0].id;

    useWindowStore.getState().minimizeWindow(windowId);

    const window = useWindowStore.getState().windows[0];
    expect(window.isMinimized).toBe(true);
  });

  it('maximizing a window stores previous bounds and expands', () => {
    useWindowStore.getState().openWindow('notes');
    const windowId = useWindowStore.getState().windows[0].id;
    const originalSize = { ...useWindowStore.getState().windows[0].size };
    const originalPosition = { ...useWindowStore.getState().windows[0].position };

    useWindowStore.getState().maximizeWindow(windowId);

    const window = useWindowStore.getState().windows[0];
    expect(window.isMaximized).toBe(true);
    expect(window.previousBounds).toBeDefined();
    expect(window.previousBounds!.size).toEqual(originalSize);
    expect(window.previousBounds!.position).toEqual(originalPosition);
  });

  it('restoring a maximized window returns to original bounds', () => {
    useWindowStore.getState().openWindow('notes');
    const windowId = useWindowStore.getState().windows[0].id;
    const originalSize = { ...useWindowStore.getState().windows[0].size };
    const originalPosition = { ...useWindowStore.getState().windows[0].position };

    useWindowStore.getState().maximizeWindow(windowId);
    useWindowStore.getState().restoreWindow(windowId);

    const window = useWindowStore.getState().windows[0];
    expect(window.isMaximized).toBe(false);
    expect(window.size).toEqual(originalSize);
    expect(window.position).toEqual(originalPosition);
    expect(window.previousBounds).toBeUndefined();
  });

  it('focusing a window gives it the highest z-index', () => {
    useWindowStore.getState().openWindow('notes');
    useWindowStore.getState().openWindow('terminal');
    useWindowStore.getState().openWindow('music-player');

    const windows = useWindowStore.getState().windows;
    const notesId = windows.find((w) => w.appId === 'notes')!.id;

    // Focus the notes window (which was opened first, so has lowest z-index)
    useWindowStore.getState().focusWindow(notesId);

    const updatedWindows = useWindowStore.getState().windows;
    const notesWindow = updatedWindows.find((w) => w.appId === 'notes')!;
    const otherWindows = updatedWindows.filter((w) => w.appId !== 'notes');

    for (const other of otherWindows) {
      expect(notesWindow.zIndex).toBeGreaterThan(other.zIndex);
    }
  });

  it('resize enforces minimum dimensions (200x150)', () => {
    useWindowStore.getState().openWindow('notes');
    const windowId = useWindowStore.getState().windows[0].id;

    // Try to resize below minimum
    useWindowStore.getState().updateSize(windowId, { width: 50, height: 50 });

    const window = useWindowStore.getState().windows[0];
    expect(window.size.width).toBe(200);
    expect(window.size.height).toBe(150);
  });

  it('window close via UI button removes the window', () => {
    render(<App />);

    // Open a terminal window via dock
    const terminalIcon = getDockButton('Terminal');
    fireEvent.click(terminalIcon);
    expect(useWindowStore.getState().windows).toHaveLength(1);

    // Find and click the close button
    const closeButton = screen.getByTestId('window-close-terminal');
    fireEvent.click(closeButton);

    expect(useWindowStore.getState().windows).toHaveLength(0);
  });

  it('window minimize via UI button minimizes the window', () => {
    render(<App />);

    // Open a terminal window via dock
    const terminalIcon = getDockButton('Terminal');
    fireEvent.click(terminalIcon);
    expect(useWindowStore.getState().windows[0].isMinimized).toBe(false);

    // Click minimize button
    const minimizeButton = screen.getByTestId('window-minimize-terminal');
    fireEvent.click(minimizeButton);

    expect(useWindowStore.getState().windows[0].isMinimized).toBe(true);
  });
});

describe('Integration: Theme Switching', () => {
  beforeEach(() => {
    cleanup();
    sessionStorage.setItem('nebula-booted', 'true');
    localStorage.clear();
    useThemeStore.getState().setTheme('cyberpunk');
  });

  afterEach(() => {
    cleanup();
  });

  it('theme switching updates CSS custom properties on document root', () => {
    const root = document.documentElement;

    // Start with cyberpunk
    expect(root.style.getPropertyValue('--theme-primary')).toBe(themes.cyberpunk.colors.primary);
    expect(root.style.getPropertyValue('--theme-background')).toBe(themes.cyberpunk.colors.background);

    // Switch to matrix
    useThemeStore.getState().setTheme('matrix');
    expect(root.style.getPropertyValue('--theme-primary')).toBe(themes.matrix.colors.primary);
    expect(root.style.getPropertyValue('--theme-background')).toBe(themes.matrix.colors.background);
    expect(root.style.getPropertyValue('--theme-text')).toBe(themes.matrix.colors.text);

    // Switch to aurora
    useThemeStore.getState().setTheme('aurora');
    expect(root.style.getPropertyValue('--theme-primary')).toBe(themes.aurora.colors.primary);
    expect(root.style.getPropertyValue('--theme-background')).toBe(themes.aurora.colors.background);
  });

  it('theme switching via terminal command updates CSS custom properties', () => {
    const root = document.documentElement;

    useTerminalStore.getState().executeCommand('theme matrix');

    expect(useThemeStore.getState().activeTheme).toBe('matrix');
    expect(root.style.getPropertyValue('--theme-primary')).toBe('#22c55e');
    expect(root.style.getPropertyValue('--theme-secondary')).toBe('#16a34a');
    expect(root.style.getPropertyValue('--theme-accent')).toBe('#4ade80');
  });

  it('theme persists to localStorage', () => {
    useThemeStore.getState().setTheme('aurora');

    expect(localStorage.getItem('nebula-theme')).toBe('aurora');
  });

  it('all three themes apply their full color palette', () => {
    const root = document.documentElement;

    for (const [themeName, theme] of Object.entries(themes)) {
      useThemeStore.getState().setTheme(themeName as keyof typeof themes);

      expect(root.style.getPropertyValue('--theme-primary')).toBe(theme.colors.primary);
      expect(root.style.getPropertyValue('--theme-secondary')).toBe(theme.colors.secondary);
      expect(root.style.getPropertyValue('--theme-accent')).toBe(theme.colors.accent);
      expect(root.style.getPropertyValue('--theme-background')).toBe(theme.colors.background);
      expect(root.style.getPropertyValue('--theme-surface')).toBe(theme.colors.surface);
      expect(root.style.getPropertyValue('--theme-text')).toBe(theme.colors.text);
    }
  });
});

describe('Integration: Full Flow — Boot → Open App → Use Terminal → Switch Theme', () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
    sessionStorage.clear();
    localStorage.clear();
    useWindowStore.setState({ windows: [], activeWindowId: null });
    useTerminalStore.setState({ history: [], currentPath: [], hackActive: false, matrixRainActive: false });
    useMusicStore.setState({ isPlaying: false, currentTrackIndex: 0, progress: 0 });
    useThemeStore.getState().setTheme('cyberpunk');
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('complete user journey: boot → open terminal → run commands → switch theme', () => {
    // Ensure sessionStorage is clean (setTheme above may have triggered localStorage but not sessionStorage)
    sessionStorage.clear();

    render(<App />);

    // 1. Boot sequence
    expect(screen.getByTestId('boot-screen')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.getByTestId('desktop')).toBeInTheDocument();

    // 2. Open terminal via dock
    const terminalIcon = getDockButton('Terminal');
    fireEvent.click(terminalIcon);
    expect(useWindowStore.getState().windows).toHaveLength(1);
    expect(useWindowStore.getState().windows[0].appId).toBe('terminal');

    // 3. Execute terminal commands
    useTerminalStore.getState().executeCommand('help');
    const helpOutput = useTerminalStore.getState().history.find((e) => e.type === 'output');
    expect(helpOutput).toBeDefined();

    // 4. Open notes via terminal
    useTerminalStore.getState().executeCommand('notes');
    expect(useWindowStore.getState().windows).toHaveLength(2);

    // 5. Switch theme via terminal
    useTerminalStore.getState().executeCommand('theme matrix');
    expect(useThemeStore.getState().activeTheme).toBe('matrix');
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#22c55e');

    // 6. Start music via terminal
    useTerminalStore.getState().executeCommand('music');
    expect(useWindowStore.getState().windows).toHaveLength(3);
    expect(useMusicStore.getState().isPlaying).toBe(true);
  });
});
