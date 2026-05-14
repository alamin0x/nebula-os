import { useState, useCallback, useEffect, useRef, memo } from 'react';

/**
 * SecretRoom — A hidden easter egg application accessible only via the "secret" terminal command.
 * Displays mysterious ASCII art, a hidden message, and an interactive mini-game (click the stars).
 * Styled with theme CSS custom properties for a mysterious atmosphere.
 * Exported as default for React.lazy() compatibility.
 */

const ASCII_ART = `
    ★  ·  ✦     ·    ★
  ·    ╔═══════════════════╗    ·
 ★     ║  Y O U  F O U N D ║     ✦
  ·    ║   T H E  S E C R E T   ║    ·
 ✦     ║      R O O M      ║     ★
  ·    ╚═══════════════════╝    ·
    ✦  ·  ★     ·    ✦
`;

const HIDDEN_MESSAGES = [
  '> The universe is not only queerer than we suppose, but queerer than we can suppose.',
  '> In the beginning there was nothing, which exploded.',
  '> We are all made of star stuff.',
  '> The cosmos is within us. We are made of star-stuff.',
  '> Somewhere, something incredible is waiting to be known.',
  '> The only true wisdom is in knowing you know nothing.',
  '> Reality is merely an illusion, albeit a very persistent one.',
  '> Not all those who wander are lost.',
];

interface Star {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

const SecretRoom = memo(function SecretRoom() {
  const [revealedMessage, setRevealedMessage] = useState<string | null>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [score, setScore] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate random stars for the mini-game
  useEffect(() => {
    const newStars: Star[] = Array.from({ length: 7 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      collected: false,
    }));
    setStars(newStars);
  }, []);

  const handleRevealMessage = useCallback(() => {
    setGlitchActive(true);
    setTimeout(() => {
      const msg = HIDDEN_MESSAGES[Math.floor(Math.random() * HIDDEN_MESSAGES.length)];
      setRevealedMessage(msg);
      setGlitchActive(false);
    }, 400);
  }, []);

  const handleStarClick = useCallback((starId: number) => {
    setStars((prev) =>
      prev.map((s) => (s.id === starId ? { ...s, collected: true } : s))
    );
    setScore((prev) => prev + 1);
  }, []);

  const allCollected = stars.length > 0 && stars.every((s) => s.collected);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full overflow-hidden rounded-b-lg relative"
      style={{
        backgroundColor: 'rgba(5, 5, 20, 0.95)',
        color: 'var(--theme-text)',
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      {/* Mysterious ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--theme-primary) 8%, transparent), transparent 70%)`,
        }}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 relative z-10 space-y-6">
        {/* ASCII Art Header */}
        <pre
          className="text-center text-xs sm:text-sm leading-relaxed select-none"
          style={{ color: 'var(--theme-primary)', textShadow: '0 0 8px var(--theme-primary)' }}
          aria-label="Secret room ASCII art"
        >
          {ASCII_ART}
        </pre>

        {/* Welcome text */}
        <div className="text-center space-y-2">
          <p
            className="text-sm opacity-70"
            style={{ color: 'var(--theme-secondary)' }}
          >
            You've discovered the hidden chamber of Nebula OS.
          </p>
          <p
            className="text-xs opacity-50"
            style={{ color: 'var(--theme-text)' }}
          >
            Few have ventured this deep into the system...
          </p>
        </div>

        {/* Interactive: Reveal a hidden message */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleRevealMessage}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              backgroundColor: 'var(--theme-surface)',
              color: 'var(--theme-accent)',
              border: '1px solid var(--theme-accent)',
              boxShadow: '0 0 12px color-mix(in srgb, var(--theme-accent) 25%, transparent)',
            }}
            aria-label="Reveal a hidden message"
          >
            ✦ Decode Transmission ✦
          </button>

          {revealedMessage && (
            <p
              className={`text-sm text-center max-w-md italic transition-opacity duration-500 ${
                glitchActive ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                color: 'var(--theme-accent)',
                textShadow: '0 0 6px var(--theme-accent)',
              }}
            >
              {revealedMessage}
            </p>
          )}
        </div>

        {/* Mini-game: Collect the stars */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3
              className="text-xs uppercase tracking-widest"
              style={{ color: 'var(--theme-secondary)' }}
            >
              ★ Star Collector
            </h3>
            <span
              className="text-xs"
              style={{ color: 'var(--theme-primary)' }}
            >
              {score} / {stars.length}
            </span>
          </div>

          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{
              height: '180px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid var(--theme-surface)',
            }}
            aria-label="Star collector mini-game area"
          >
            {stars.map((star) => (
              <button
                key={star.id}
                onClick={() => !star.collected && handleStarClick(star.id)}
                disabled={star.collected}
                className="absolute transition-all duration-300 text-lg"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  transform: star.collected ? 'scale(0)' : 'scale(1)',
                  opacity: star.collected ? 0 : 1,
                  color: 'var(--theme-primary)',
                  textShadow: '0 0 10px var(--theme-primary)',
                  cursor: star.collected ? 'default' : 'pointer',
                  filter: `hue-rotate(${star.id * 40}deg)`,
                }}
                aria-label={`Collect star ${star.id + 1}`}
              >
                ✦
              </button>
            ))}

            {allCollected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p
                  className="text-sm font-bold animate-pulse"
                  style={{
                    color: 'var(--theme-accent)',
                    textShadow: '0 0 12px var(--theme-accent)',
                  }}
                >
                  ★ All stars collected! You are one with the nebula. ★
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Credits */}
        <div className="text-center space-y-1 pt-4 border-t" style={{ borderColor: 'var(--theme-surface)' }}>
          <p className="text-xs opacity-40" style={{ color: 'var(--theme-text)' }}>
            NEBULA OS v1.0.0 — SECRET CHAMBER
          </p>
          <p className="text-xs opacity-30" style={{ color: 'var(--theme-secondary)' }}>
            Built with ♥ using React, Vite & TailwindCSS
          </p>
          <p className="text-xs opacity-20" style={{ color: 'var(--theme-text)' }}>
            "The secret to getting ahead is getting started."
          </p>
        </div>
      </div>

      {/* Glitch overlay effect */}
      {glitchActive && (
        <div
          className="absolute inset-0 z-50 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(139, 92, 246, 0.03) 2px,
              rgba(139, 92, 246, 0.03) 4px
            )`,
            animation: 'secret-glitch 0.4s steps(4) forwards',
          }}
        />
      )}

      <style>{`
        @keyframes secret-glitch {
          0% { opacity: 1; transform: translateX(-2px); }
          25% { opacity: 0.8; transform: translateX(2px); }
          50% { opacity: 1; transform: translateX(-1px); }
          75% { opacity: 0.9; transform: translateX(1px); }
          100% { opacity: 0; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
});

export default SecretRoom;
