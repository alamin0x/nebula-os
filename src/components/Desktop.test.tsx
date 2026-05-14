import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Desktop from './Desktop';

// Mock child components to isolate Desktop layout logic
vi.mock('./BackgroundRenderer', () => ({
  default: () => <div data-testid="background-renderer" />,
}));

vi.mock('./MouseGlow', () => ({
  default: () => <div data-testid="mouse-glow" />,
}));

vi.mock('./StatusBar', () => ({
  StatusBar: () => <div data-testid="status-bar" />,
}));

vi.mock('./Dock', () => ({
  Dock: () => <nav data-testid="dock" aria-label="Application dock" />,
}));

vi.mock('./WindowManager', () => ({
  default: () => (
    <main data-testid="window-area" aria-label="Window workspace" />
  ),
}));

describe('Desktop', () => {
  it('renders the desktop container', () => {
    render(<Desktop />);
    expect(screen.getByTestId('desktop')).toBeInTheDocument();
  });

  it('renders the BackgroundRenderer', () => {
    render(<Desktop />);
    expect(screen.getByTestId('background-renderer')).toBeInTheDocument();
  });

  it('renders the MouseGlow', () => {
    render(<Desktop />);
    expect(screen.getByTestId('mouse-glow')).toBeInTheDocument();
  });

  it('renders the StatusBar', () => {
    render(<Desktop />);
    expect(screen.getByTestId('status-bar')).toBeInTheDocument();
  });

  it('renders the Dock placeholder', () => {
    render(<Desktop />);
    expect(screen.getByTestId('dock')).toBeInTheDocument();
  });

  it('renders the WindowManager (window workspace area)', () => {
    render(<Desktop />);
    expect(screen.getByTestId('window-area')).toBeInTheDocument();
  });
});
