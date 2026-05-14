import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useTerminalStore } from '../stores/terminalStore';

/**
 * Terminal — a command-line interface application.
 * Uses terminalStore for state (executeCommand, clear, history, currentPath).
 * Supports command history navigation (up/down arrows) and auto-scrolls on new entries.
 * Exported as default for React.lazy compatibility.
 */
const Terminal = memo(function Terminal() {
  const history = useTerminalStore((state) => state.history);
  const currentPath = useTerminalStore((state) => state.currentPath);
  const executeCommand = useTerminalStore((state) => state.executeCommand);

  const [input, setInput] = useState('');
  const [commandHistoryIndex, setCommandHistoryIndex] = useState(-1);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive the list of previously entered commands for up/down navigation (memoized)
  const commandHistory = useMemo(
    () => history.filter((entry) => entry.type === 'input').map((entry) => entry.content),
    [history]
  );

  // Build the prompt string from currentPath
  const prompt = currentPath.length === 0
    ? 'nebula:~ $'
    : `nebula:~/${currentPath.join('/')} $`;

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on mount and when clicking the terminal area
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() === '') return;
      executeCommand(input);
      setInput('');
      setCommandHistoryIndex(-1);
    },
    [input, executeCommand]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length === 0) return;
        const newIndex =
          commandHistoryIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, commandHistoryIndex - 1);
        setCommandHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (commandHistoryIndex === -1) return;
        const newIndex = commandHistoryIndex + 1;
        if (newIndex >= commandHistory.length) {
          setCommandHistoryIndex(-1);
          setInput('');
        } else {
          setCommandHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    },
    [commandHistory, commandHistoryIndex]
  );

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden rounded-b-lg"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'var(--theme-text)',
        fontFamily: "'Courier New', Courier, monospace",
      }}
      onClick={handleContainerClick}
    >
      {/* Scrollable history area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 text-sm"
      >
        {history.map((entry) => (
          <div key={entry.id} className="whitespace-pre-wrap break-words">
            {entry.type === 'input' && (
              <span>
                <span
                  className="font-bold"
                  style={{ color: 'var(--theme-secondary)' }}
                >
                  {prompt}{' '}
                </span>
                <span style={{ color: 'var(--theme-text)' }}>
                  {entry.content}
                </span>
              </span>
            )}
            {entry.type === 'output' && (
              <span style={{ color: 'var(--theme-primary)', opacity: 0.9 }}>
                {entry.content}
              </span>
            )}
            {entry.type === 'error' && (
              <span style={{ color: 'var(--theme-accent)' }}>
                {entry.content}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Input line */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center px-3 py-2 border-t"
        style={{ borderColor: 'var(--theme-surface)' }}
      >
        <span
          className="font-bold text-sm mr-2 shrink-0"
          style={{ color: 'var(--theme-secondary)' }}
        >
          {prompt}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            color: 'var(--theme-text)',
            fontFamily: "'Courier New', Courier, monospace",
            caretColor: 'var(--theme-primary)',
          }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal input"
        />
      </form>
    </div>
  );
});

export default Terminal;
