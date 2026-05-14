import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatusBar } from './StatusBar';

// Mock the stores
vi.mock('../stores/themeStore', () => ({
  useThemeStore: (selector: (state: { activeTheme: string }) => unknown) =>
    selector({ activeTheme: 'cyberpunk' }),
}));

vi.mock('../stores/windowStore', () => ({
  useWindowStore: (selector: (state: { windows: unknown[] }) => unknown) =>
    selector({ windows: [{}, {}, {}] }),
}));

describe('StatusBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15, 14, 30, 45)); // June 15, 2024 14:30:45
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the current time in HH:MM:SS format', () => {
    render(<StatusBar />);
    expect(screen.getByText('14:30:45')).toBeInTheDocument();
  });

  it('renders the current date in weekday, month day format', () => {
    render(<StatusBar />);
    expect(screen.getByText('Saturday, June 15')).toBeInTheDocument();
  });

  it('displays the active theme name', () => {
    render(<StatusBar />);
    expect(screen.getByText('cyberpunk')).toBeInTheDocument();
  });

  it('displays the open window count', () => {
    render(<StatusBar />);
    expect(screen.getByText('3 windows')).toBeInTheDocument();
  });

  it('updates the clock every second', () => {
    render(<StatusBar />);
    expect(screen.getByText('14:30:45')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
      vi.setSystemTime(new Date(2024, 5, 15, 14, 30, 46));
    });

    expect(screen.getByText('14:30:46')).toBeInTheDocument();
  });
});
