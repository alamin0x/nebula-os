import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dock } from './Dock';

const mockOpenWindow = vi.fn();
const mockWindows: unknown[] = [];

vi.mock('../stores/windowStore', () => ({
  useWindowStore: (selector: (state: { openWindow: typeof mockOpenWindow; windows: unknown[] }) => unknown) =>
    selector({ openWindow: mockOpenWindow, windows: mockWindows }),
}));

describe('Dock', () => {
  beforeEach(() => {
    mockOpenWindow.mockClear();
    mockWindows.length = 0;
  });

  it('renders all five application icons', () => {
    render(<Dock />);
    expect(screen.getByLabelText('Open Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Open AI Assistant')).toBeInTheDocument();
    expect(screen.getByLabelText('Open Music Player')).toBeInTheDocument();
    expect(screen.getByLabelText('Open System Monitor')).toBeInTheDocument();
    expect(screen.getByLabelText('Open Terminal')).toBeInTheDocument();
  });

  it('calls openWindow with correct appId when an icon is clicked', () => {
    render(<Dock />);
    fireEvent.click(screen.getByLabelText('Open Notes'));
    expect(mockOpenWindow).toHaveBeenCalledWith('notes');
  });

  it('calls openWindow for AI Assistant', () => {
    render(<Dock />);
    fireEvent.click(screen.getByLabelText('Open AI Assistant'));
    expect(mockOpenWindow).toHaveBeenCalledWith('ai-assistant');
  });

  it('calls openWindow for Music Player', () => {
    render(<Dock />);
    fireEvent.click(screen.getByLabelText('Open Music Player'));
    expect(mockOpenWindow).toHaveBeenCalledWith('music-player');
  });

  it('calls openWindow for Terminal', () => {
    render(<Dock />);
    fireEvent.click(screen.getByLabelText('Open Terminal'));
    expect(mockOpenWindow).toHaveBeenCalledWith('terminal');
  });

  it('renders the dock navigation element with correct aria-label', () => {
    render(<Dock />);
    expect(screen.getByRole('navigation', { name: 'Application dock' })).toBeInTheDocument();
  });

  it('renders with data-testid dock', () => {
    render(<Dock />);
    expect(screen.getByTestId('dock')).toBeInTheDocument();
  });
});
