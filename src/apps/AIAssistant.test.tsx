import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import AIAssistant from './AIAssistant';
import { useWindowStore } from '../stores/windowStore';
import { useMusicStore } from '../stores/musicStore';

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn();

describe('AIAssistant', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useWindowStore.setState({ windows: [], activeWindowId: null });
    useMusicStore.setState({ isPlaying: false, currentTrackIndex: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the welcome message on mount', () => {
    render(<AIAssistant />);
    expect(
      screen.getByText(/Welcome to Nebula OS! I'm your AI assistant/)
    ).toBeInTheDocument();
  });

  it('renders the input field and send button', () => {
    render(<AIAssistant />);
    expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('displays user message when submitted', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');
    const sendBtn = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(sendBtn);

    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('clears input after sending a message', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    expect(input.value).toBe('');
  });

  it('shows typing indicator after user sends a message', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // Input should be disabled while typing
    expect(input).toBeDisabled();
  });

  it('responds to "help" with available commands', async () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'help' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // Advance past the typing delay
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/Here are some things I can do/)).toBeInTheDocument();
  });

  it('responds to "about" with information', async () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'about' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/I'm Nebula AI, the built-in assistant/)).toBeInTheDocument();
  });

  it('responds to "commands" with a list of commands', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'commands' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/Available commands/)).toBeInTheDocument();
  });

  it('executes "open notes" command and opens notes window', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'open notes' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/Opening Notes app/)).toBeInTheDocument();
    const state = useWindowStore.getState();
    expect(state.windows.some((w) => w.appId === 'notes')).toBe(true);
  });

  it('executes "play music" command and starts playback', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'play music' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/Starting music playback/)).toBeInTheDocument();
    const musicState = useMusicStore.getState();
    expect(musicState.isPlaying).toBe(true);
  });

  it('provides a fallback response for unrecognized input', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'xyzzy random gibberish 12345' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Should show one of the fallback responses
    const fallbackPatterns = [
      /I'm not sure I understand/,
      /I don't have a response/,
      /I'm still learning/,
      /That's beyond my current capabilities/,
    ];

    const allText = document.body.textContent || '';
    const hasFallback = fallbackPatterns.some((pattern) => pattern.test(allText));
    expect(hasFallback).toBe(true);
  });

  it('executes "open terminal" command and opens terminal window', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'open terminal' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/Opening Terminal/)).toBeInTheDocument();
    const state = useWindowStore.getState();
    expect(state.windows.some((w) => w.appId === 'terminal')).toBe(true);
  });

  it('executes "open monitor" command and opens system monitor window', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'open monitor' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.getByText(/Opening System Monitor/)).toBeInTheDocument();
    const state = useWindowStore.getState();
    expect(state.windows.some((w) => w.appId === 'system-monitor')).toBe(true);
  });

  it('does not submit empty input', () => {
    render(<AIAssistant />);
    const sendBtn = screen.getByLabelText('Send message');

    // Button should be disabled when input is empty
    expect(sendBtn).toBeDisabled();
  });

  it('submits on Enter key press', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('disables input while assistant is typing', () => {
    render(<AIAssistant />);
    const input = screen.getByLabelText('Chat message input');

    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // Input should be disabled during typing animation
    expect(input).toBeDisabled();

    // After typing completes, input should be re-enabled
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(input).not.toBeDisabled();
  });
});
