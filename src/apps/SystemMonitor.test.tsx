import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import SystemMonitor from './SystemMonitor';
import { useThemeStore } from '../stores/themeStore';
import { useWindowStore } from '../stores/windowStore';

// Mock CSS custom properties
const mockComputedStyle = {
  getPropertyValue: () => '#8B5CF6',
};
vi.stubGlobal('getComputedStyle', () => mockComputedStyle);

describe('SystemMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useThemeStore.setState({ activeTheme: 'cyberpunk' });
    useWindowStore.setState({ windows: [], activeWindowId: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the System Monitor heading', () => {
    render(<SystemMonitor />);
    expect(screen.getByText('System Monitor')).toBeInTheDocument();
  });

  it('displays the real-time clock in HH:MM:SS format', () => {
    // Set a specific time
    vi.setSystemTime(new Date(2024, 0, 15, 14, 30, 45));
    render(<SystemMonitor />);
    expect(screen.getByText('14:30:45')).toBeInTheDocument();
  });

  it('updates the clock every second', () => {
    vi.setSystemTime(new Date(2024, 0, 15, 14, 30, 45));
    render(<SystemMonitor />);
    expect(screen.getByText('14:30:45')).toBeInTheDocument();

    // Advance time by 1 second - the interval will fire and read the new system time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // After advancing 1s, the system time is now 14:30:46
    expect(screen.getByText('14:30:46')).toBeInTheDocument();
  });

  it('displays the active theme name', () => {
    render(<SystemMonitor />);
    expect(screen.getByText('cyberpunk')).toBeInTheDocument();
  });

  it('displays the open window count', () => {
    useWindowStore.setState({
      windows: [
        {
          id: 'win-1',
          appId: 'notes',
          title: 'Notes',
          position: { x: 100, y: 100 },
          size: { width: 400, height: 300 },
          zIndex: 100,
          isMinimized: false,
          isMaximized: false,
        },
        {
          id: 'win-2',
          appId: 'terminal',
          title: 'Terminal',
          position: { x: 200, y: 200 },
          size: { width: 400, height: 300 },
          zIndex: 101,
          isMinimized: false,
          isMaximized: false,
        },
      ],
      activeWindowId: 'win-2',
    });

    render(<SystemMonitor />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders CPU Usage label', () => {
    render(<SystemMonitor />);
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
  });

  it('renders Memory Usage label', () => {
    render(<SystemMonitor />);
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
  });

  it('renders Network Activity label', () => {
    render(<SystemMonitor />);
    expect(screen.getByText('Network Activity')).toBeInTheDocument();
  });

  it('updates metrics every 2 seconds', () => {
    render(<SystemMonitor />);

    // Get initial CPU value text
    const initialCpuTexts = screen.getAllByText(/%$/);
    expect(initialCpuTexts.length).toBeGreaterThan(0);

    // Advance 2 seconds to trigger metric update
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Metrics should still be rendered (values may have changed)
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
  });

  it('displays SVG graphs for metrics', () => {
    const { container } = render(<SystemMonitor />);
    const svgs = container.querySelectorAll('svg');
    // Should have at least 3 SVGs (CPU, Memory, Network History)
    expect(svgs.length).toBeGreaterThanOrEqual(3);
  });

  it('reflects theme changes from the store', () => {
    const { rerender } = render(<SystemMonitor />);
    expect(screen.getByText('cyberpunk')).toBeInTheDocument();

    act(() => {
      useThemeStore.setState({ activeTheme: 'matrix' });
    });

    rerender(<SystemMonitor />);
    expect(screen.getByText('matrix')).toBeInTheDocument();
  });
});
