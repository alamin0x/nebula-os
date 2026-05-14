import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WindowManager from './WindowManager';

const mockWindows = [
  {
    id: 'notes-123',
    appId: 'notes' as const,
    title: 'Notes',
    position: { x: 100, y: 100 },
    size: { width: 700, height: 500 },
    zIndex: 100,
    isMinimized: false,
    isMaximized: false,
  },
  {
    id: 'terminal-456',
    appId: 'terminal' as const,
    title: 'Terminal',
    position: { x: 200, y: 150 },
    size: { width: 700, height: 450 },
    zIndex: 101,
    isMinimized: false,
    isMaximized: false,
  },
  {
    id: 'music-789',
    appId: 'music-player' as const,
    title: 'Music Player',
    position: { x: 300, y: 200 },
    size: { width: 400, height: 500 },
    zIndex: 102,
    isMinimized: true,
    isMaximized: false,
  },
];

const mockUpdatePosition = vi.fn();
const mockUpdateSize = vi.fn();
const mockFocusWindow = vi.fn();

vi.mock('../stores/windowStore', () => ({
  useWindowStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      windows: mockWindows,
      updatePosition: mockUpdatePosition,
      updateSize: mockUpdateSize,
      focusWindow: mockFocusWindow,
    }),
}));

// Mock react-rnd to make testing easier
vi.mock('react-rnd', () => ({
  Rnd: ({
    children,
    size,
    position,
    style,
    onMouseDown,
    className,
    enableResizing,
    'data-testid': testId,
    'data-window-id': windowId,
  }: {
    children: React.ReactNode;
    size: { width: number; height: number };
    position: { x: number; y: number };
    style: React.CSSProperties;
    onMouseDown?: () => void;
    className?: string;
    enableResizing?: boolean;
    'data-testid'?: string;
    'data-window-id'?: string;
  }) => (
    <div
      data-testid={testId}
      data-window-id={windowId}
      data-enable-resizing={String(enableResizing !== false)}
      className={className}
      style={{
        ...style,
        width: `${size.width}px`,
        height: `${size.height}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'absolute',
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  ),
}));

describe('WindowManager', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    vi.clearAllMocks();
    originalInnerWidth = globalThis.innerWidth;
    originalInnerHeight = globalThis.innerHeight;
  });

  afterEach(() => {
    // Restore viewport
    Object.defineProperty(globalThis, 'innerWidth', { value: originalInnerWidth, writable: true });
    Object.defineProperty(globalThis, 'innerHeight', { value: originalInnerHeight, writable: true });
  });

  function setViewport(width: number, height: number) {
    Object.defineProperty(globalThis, 'innerWidth', { value: width, writable: true });
    Object.defineProperty(globalThis, 'innerHeight', { value: height, writable: true });
  }

  describe('Desktop mode (≥1024px)', () => {
    beforeEach(() => {
      setViewport(1440, 900);
    });

    it('renders the window workspace area', () => {
      render(<WindowManager />);
      expect(screen.getByTestId('window-area')).toBeInTheDocument();
    });

    it('renders non-minimized windows', () => {
      render(<WindowManager />);
      expect(screen.getByTestId('window-notes')).toBeInTheDocument();
      expect(screen.getByTestId('window-terminal')).toBeInTheDocument();
    });

    it('does not render minimized windows', () => {
      render(<WindowManager />);
      expect(screen.queryByTestId('window-music-player')).not.toBeInTheDocument();
    });

    it('applies z-index from window state', () => {
      render(<WindowManager />);
      const notesWindow = screen.getByTestId('window-notes');
      const terminalWindow = screen.getByTestId('window-terminal');
      expect(notesWindow).toHaveStyle({ zIndex: 100 });
      expect(terminalWindow).toHaveStyle({ zIndex: 101 });
    });

    it('displays window titles in the title bar', () => {
      render(<WindowManager />);
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Terminal')).toBeInTheDocument();
    });

    it('calls focusWindow on mousedown', () => {
      render(<WindowManager />);
      const notesWindow = screen.getByTestId('window-notes');
      fireEvent.mouseDown(notesWindow);
      expect(mockFocusWindow).toHaveBeenCalledWith('notes-123');
    });

    it('renders window control buttons (minimize, maximize, close)', () => {
      render(<WindowManager />);
      expect(screen.getByLabelText('Minimize Notes')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximize Notes')).toBeInTheDocument();
      expect(screen.getByLabelText('Close Notes')).toBeInTheDocument();
    });

    it('enables resizing on desktop', () => {
      render(<WindowManager />);
      const notesWindow = screen.getByTestId('window-notes');
      expect(notesWindow.getAttribute('data-enable-resizing')).toBe('true');
    });

    it('does not render mobile tab bar', () => {
      render(<WindowManager />);
      expect(screen.queryByTestId('mobile-tab-bar')).not.toBeInTheDocument();
    });
  });

  describe('Tablet mode (768–1023px)', () => {
    beforeEach(() => {
      setViewport(900, 700);
    });

    it('renders all visible windows', () => {
      render(<WindowManager />);
      expect(screen.getByTestId('window-notes')).toBeInTheDocument();
      expect(screen.getByTestId('window-terminal')).toBeInTheDocument();
    });

    it('constrains window size to 80% of viewport', () => {
      render(<WindowManager />);
      const notesWindow = screen.getByTestId('window-notes');
      // 80% of 900 = 720, window is 700 so it fits
      // 80% of 700 = 560, window is 500 so it fits
      expect(notesWindow).toHaveStyle({ width: '700px', height: '500px' });
    });

    it('centers windows in the viewport', () => {
      render(<WindowManager />);
      const notesWindow = screen.getByTestId('window-notes');
      // Window 700x500, viewport 900x700
      // centeredX = (900 - 700) / 2 = 100
      // centeredY = (700 - 500) / 2 = 100
      expect(notesWindow).toHaveStyle({ left: '100px', top: '100px' });
    });

    it('disables resizing on tablet', () => {
      render(<WindowManager />);
      const notesWindow = screen.getByTestId('window-notes');
      expect(notesWindow.getAttribute('data-enable-resizing')).toBe('false');
    });

    it('does not render mobile tab bar', () => {
      render(<WindowManager />);
      expect(screen.queryByTestId('mobile-tab-bar')).not.toBeInTheDocument();
    });
  });

  describe('Mobile mode (<768px)', () => {
    beforeEach(() => {
      setViewport(375, 667);
    });

    it('renders only the active (highest z-index) window', () => {
      render(<WindowManager />);
      // Terminal has zIndex 101 (highest among non-minimized)
      expect(screen.getByTestId('window-terminal')).toBeInTheDocument();
      expect(screen.queryByTestId('window-notes')).not.toBeInTheDocument();
    });

    it('renders mobile tab bar for switching between windows', () => {
      render(<WindowManager />);
      expect(screen.getByTestId('mobile-tab-bar')).toBeInTheDocument();
    });

    it('renders tab buttons for each visible window', () => {
      render(<WindowManager />);
      expect(screen.getByTestId('mobile-tab-notes')).toBeInTheDocument();
      expect(screen.getByTestId('mobile-tab-terminal')).toBeInTheDocument();
    });

    it('does not render tab for minimized windows', () => {
      render(<WindowManager />);
      expect(screen.queryByTestId('mobile-tab-music-player')).not.toBeInTheDocument();
    });

    it('calls focusWindow when tab is clicked', () => {
      render(<WindowManager />);
      const notesTab = screen.getByTestId('mobile-tab-notes');
      fireEvent.click(notesTab);
      expect(mockFocusWindow).toHaveBeenCalledWith('notes-123');
    });

    it('marks active tab with aria-current', () => {
      render(<WindowManager />);
      const terminalTab = screen.getByTestId('mobile-tab-terminal');
      expect(terminalTab).toHaveAttribute('aria-current', 'true');
    });

    it('renders full-screen window without Rnd wrapper', () => {
      render(<WindowManager />);
      const terminalWindow = screen.getByTestId('window-terminal');
      // In mobile mode, the window is rendered as a plain div, not Rnd
      // It should have inset-0 class for full-screen
      expect(terminalWindow.className).toContain('inset-0');
    });
  });

  describe('Viewport resize handling', () => {
    it('re-renders when viewport changes', () => {
      setViewport(1440, 900);
      const { rerender } = render(<WindowManager />);

      // Initially desktop mode - both windows visible
      expect(screen.getByTestId('window-notes')).toBeInTheDocument();
      expect(screen.getByTestId('window-terminal')).toBeInTheDocument();

      // Simulate resize to mobile
      setViewport(375, 667);
      act(() => {
        globalThis.dispatchEvent(new Event('resize'));
      });

      rerender(<WindowManager />);

      // Now in mobile mode - only active window shown
      expect(screen.getByTestId('window-terminal')).toBeInTheDocument();
      expect(screen.queryByTestId('window-notes')).not.toBeInTheDocument();
    });
  });
});
