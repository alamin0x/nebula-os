import { useState, useEffect, useCallback, useRef, memo } from 'react';

/**
 * Fake hacking log entries displayed during the hack sequence animation.
 * Each entry simulates a different stage of a "hacking operation".
 */
const HACK_LINES = [
  '[*] Scanning target network 192.168.1.0/24...',
  '[*] Found 3 active hosts: 192.168.1.1, 192.168.1.42, 192.168.1.100',
  '[*] Probing open ports on 192.168.1.42...',
  '[+] Port 22 (SSH) — OPEN',
  '[+] Port 443 (HTTPS) — OPEN',
  '[+] Port 8080 (HTTP-ALT) — OPEN',
  '[*] Attempting brute-force on SSH...',
  '[*] Trying credentials admin:admin... FAILED',
  '[*] Trying credentials root:toor... FAILED',
  '[*] Trying credentials nebula:quantum... SUCCESS',
  '[+] SSH session established on 192.168.1.42',
  '[*] Escalating privileges...',
  '[*] Injecting payload: 0xDEADBEEF → kernel_space',
  '[+] Root access obtained',
  '[*] Downloading /etc/shadow...',
  '[*] Decrypting hashes ████████████████ 100%',
  '[+] Firewall rules bypassed',
  '[*] Establishing reverse tunnel on port 4444...',
  '[+] Tunnel active — exfiltrating data...',
  '[*] Cleaning logs...',
];

const FINAL_MESSAGE = '>>> ACCESS GRANTED <<<';

interface HackSequenceProps {
  /** Called when the hack sequence finishes or is dismissed */
  onComplete: () => void;
}

/**
 * HackSequence — a full-screen overlay that displays a fake hacking animation.
 *
 * Shows rapidly appearing log entries with a typing effect, ending with
 * an "ACCESS GRANTED" message. Auto-dismisses after the sequence completes
 * or can be dismissed early via click or keypress.
 *
 * Uses requestAnimationFrame for smooth typing animation and CSS animations
 * for visual effects.
 */
const HackSequence = memo(function HackSequence({ onComplete }: HackSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Characters per second for the typing effect (40 chars/sec)
  const CHARS_PER_SECOND = 40;
  const MS_PER_CHAR = 1000 / CHARS_PER_SECOND;

  // Dismiss handler — click or keypress
  const handleDismiss = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (autoDismissRef.current !== null) {
      clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }
    onComplete();
  }, [onComplete]);

  // Listen for keypress to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      handleDismiss();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDismiss]);

  // Auto-scroll to bottom as lines appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLines, currentCharIndex]);

  // Main animation loop using requestAnimationFrame
  useEffect(() => {
    if (isComplete) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimeRef.current;

      if (elapsed >= MS_PER_CHAR) {
        lastTimeRef.current = timestamp;

        setCurrentCharIndex((prevChar) => {
          const currentLine = HACK_LINES[currentLineIndex];

          if (!currentLine) {
            // All lines done — show final message
            setIsComplete(true);
            setShowFinal(true);
            return prevChar;
          }

          if (prevChar >= currentLine.length) {
            // Line complete — move to next line
            setVisibleLines((prev) => [...prev, currentLine]);
            setCurrentLineIndex((prevLine) => prevLine + 1);
            return 0;
          }

          return prevChar + 1;
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [currentLineIndex, isComplete]);

  // Auto-dismiss 4 seconds after sequence completes
  useEffect(() => {
    if (showFinal) {
      autoDismissRef.current = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => {
        if (autoDismissRef.current !== null) {
          clearTimeout(autoDismissRef.current);
        }
      };
    }
  }, [showFinal, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (autoDismissRef.current !== null) {
        clearTimeout(autoDismissRef.current);
      }
    };
  }, []);

  // Get the currently typing line (partial text)
  const typingLine = !isComplete && currentLineIndex < HACK_LINES.length
    ? HACK_LINES[currentLineIndex].slice(0, currentCharIndex)
    : null;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      onClick={handleDismiss}
      role="dialog"
      aria-label="Hack sequence animation"
      data-testid="hack-sequence"
    >
      {/* Scanline overlay effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
          animation: 'hackScanline 8s linear infinite',
        }}
      />

      {/* Terminal-style output area */}
      <div
        ref={scrollRef}
        className="w-full max-w-3xl h-full max-h-[80vh] overflow-y-auto p-6 font-mono text-sm"
        style={{ color: '#00ff41' }}
      >
        {/* Header */}
        <div className="mb-4 text-center opacity-70" style={{ color: '#00ff41' }}>
          {'═'.repeat(50)}
          <div className="my-1">NEBULA INTRUSION FRAMEWORK v3.7.1</div>
          {'═'.repeat(50)}
        </div>

        {/* Completed lines */}
        {visibleLines.map((line, index) => (
          <div
            key={index}
            className="mb-1 opacity-90"
            style={{
              color: line.startsWith('[+]') ? '#00ff41' : line.startsWith('[*]') ? '#00cc33' : '#00ff41',
            }}
          >
            {line}
          </div>
        ))}

        {/* Currently typing line */}
        {typingLine !== null && (
          <div className="mb-1">
            <span style={{ color: '#00ff41' }}>{typingLine}</span>
            <span
              className="inline-block w-2 h-4 ml-0.5 align-middle"
              style={{
                backgroundColor: '#00ff41',
                animation: 'hackBlink 0.5s step-end infinite',
              }}
            />
          </div>
        )}

        {/* Final message */}
        {showFinal && (
          <div
            className="mt-6 text-center text-2xl font-bold"
            style={{
              color: '#00ff41',
              textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 40px #00ff41',
              animation: 'hackPulse 1s ease-in-out infinite',
            }}
          >
            {FINAL_MESSAGE}
            <div className="text-sm mt-2 opacity-60">
              Click or press any key to dismiss
            </div>
          </div>
        )}
      </div>

      {/* CSS animations injected via style tag */}
      <style>{`
        @keyframes hackBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes hackPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        @keyframes hackScanline {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
});

export default HackSequence;
