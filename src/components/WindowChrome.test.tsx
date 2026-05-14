import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnimatePresence } from 'framer-motion';
import WindowChrome from './WindowChrome';

const mockCloseWindow = vi.fn();
const mockMinimizeWindow = vi.fn();
const mockMaximizeWindow = vi.fn();
const mockRestoreWindow = vi.fn();

vi.mock('../stores/windowStore', () => ({
  useWindowStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      closeWindow: mockCloseWindow,
      minimizeWindow: mockMinimizeWindow,
      maximizeWindow: mockMaximizeWindow,
      restoreWindow: mockRestoreWindow,
    }),
}));

describe('WindowChrome', () => {
  beforeEach(() => {
    mockCloseWindow.mockClear();
    mockMinimizeWindow.mockClear();
    mockMaximizeWindow.mockClear();
    mockRestoreWindow.mockClear();
  });

  const defaultProps = {
    windowId: 'test-window-1',
    appId: 'notes' as const,
    title: 'Notes',
    isMaximized: false,
    dragHandleClassName: 'drag-handle',
  };

  it('renders the window title and app icon', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps}>
          <p>Content</p>
        </WindowChrome>
      </AnimatePresence>
    );
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  it('renders traffic light control buttons', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} />
      </AnimatePresence>
    );
    expect(screen.getByLabelText('Minimize Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximize Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Close Notes')).toBeInTheDocument();
  });

  it('calls closeWindow with windowId when close button is clicked', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} />
      </AnimatePresence>
    );
    fireEvent.click(screen.getByLabelText('Close Notes'));
    expect(mockCloseWindow).toHaveBeenCalledWith('test-window-1');
  });

  it('calls minimizeWindow with windowId when minimize button is clicked', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} />
      </AnimatePresence>
    );
    fireEvent.click(screen.getByLabelText('Minimize Notes'));
    expect(mockMinimizeWindow).toHaveBeenCalledWith('test-window-1');
  });

  it('calls maximizeWindow when maximize button is clicked and window is not maximized', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} isMaximized={false} />
      </AnimatePresence>
    );
    fireEvent.click(screen.getByLabelText('Maximize Notes'));
    expect(mockMaximizeWindow).toHaveBeenCalledWith('test-window-1');
  });

  it('calls restoreWindow when maximize button is clicked and window is maximized', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} isMaximized={true} />
      </AnimatePresence>
    );
    fireEvent.click(screen.getByLabelText('Restore Notes'));
    expect(mockRestoreWindow).toHaveBeenCalledWith('test-window-1');
  });

  it('renders children in the content area', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps}>
          <p data-testid="child-content">Hello World</p>
        </WindowChrome>
      </AnimatePresence>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies the drag handle class to the title bar', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} dragHandleClassName="my-drag-handle" />
      </AnimatePresence>
    );
    const titleBar = screen.getByTestId('window-titlebar-notes');
    expect(titleBar.classList.contains('my-drag-handle')).toBe(true);
  });

  it('applies glassmorphism styling via the glass class', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} />
      </AnimatePresence>
    );
    const chrome = screen.getByTestId('window-chrome-notes');
    expect(chrome.classList.contains('glass')).toBe(true);
  });

  it('shows correct aria-label for maximize button based on isMaximized state', () => {
    const { rerender } = render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} isMaximized={false} />
      </AnimatePresence>
    );
    expect(screen.getByLabelText('Maximize Notes')).toBeInTheDocument();

    rerender(
      <AnimatePresence>
        <WindowChrome {...defaultProps} isMaximized={true} />
      </AnimatePresence>
    );
    expect(screen.getByLabelText('Restore Notes')).toBeInTheDocument();
  });

  it('renders different app icons for different appIds', () => {
    render(
      <AnimatePresence>
        <WindowChrome {...defaultProps} appId="terminal" title="Terminal" />
      </AnimatePresence>
    );
    expect(screen.getByText('💻')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
  });
});
