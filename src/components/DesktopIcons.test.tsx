import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesktopIcons } from './DesktopIcons';
import { useWindowStore } from '../stores/windowStore';
import { useDesktopStore } from '../stores/desktopStore';
import { useRecycleBinStore } from '../stores/recycleBinStore';
import { useDockStore } from '../stores/dockStore';

describe('DesktopIcons', () => {
  beforeEach(() => {
    // Reset window store state before each test
    useWindowStore.setState({ windows: [], activeWindowId: null });
    useDesktopStore.setState({ hiddenApps: [] });
    useRecycleBinStore.setState({ items: [] });
    useDockStore.setState({ pinnedApps: ['browser', 'notes', 'ai-assistant', 'music-player', 'terminal', 'file-explorer', 'app-store', 'settings'] });
  });

  it('renders the desktop icons container', () => {
    render(<DesktopIcons />);
    expect(screen.getByTestId('desktop-icons')).toBeInTheDocument();
  });

  it('renders icons for Notes, Terminal, Music Player, and System Monitor', () => {
    render(<DesktopIcons />);
    expect(screen.getByTestId('desktop-icon-notes')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-icon-terminal')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-icon-music-player')).toBeInTheDocument();
    expect(screen.getByTestId('desktop-icon-system-monitor')).toBeInTheDocument();
  });

  it('displays text labels for each icon', () => {
    render(<DesktopIcons />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Music Player')).toBeInTheDocument();
    expect(screen.getByText('System Monitor')).toBeInTheDocument();
  });

  it('opens a window when an icon is double-clicked', () => {
    const openWindowSpy = vi.fn();
    useWindowStore.setState({ windows: [], activeWindowId: null });
    // Spy on the store's openWindow
    const originalOpenWindow = useWindowStore.getState().openWindow;
    useWindowStore.setState({ openWindow: openWindowSpy } as any);

    render(<DesktopIcons />);
    const notesIcon = screen.getByTestId('desktop-icon-notes');
    fireEvent.doubleClick(notesIcon);

    expect(openWindowSpy).toHaveBeenCalledWith('notes');

    // Restore
    useWindowStore.setState({ openWindow: originalOpenWindow });
  });

  it('has accessible labels for each icon', () => {
    render(<DesktopIcons />);
    expect(screen.getByLabelText('Open Notes')).toBeInTheDocument();
    expect(screen.getByLabelText('Open Terminal')).toBeInTheDocument();
    expect(screen.getByLabelText('Open Music Player')).toBeInTheDocument();
    expect(screen.getByLabelText('Open System Monitor')).toBeInTheDocument();
  });
});
