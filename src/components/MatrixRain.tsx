import { useEffect, useRef, useCallback, memo } from 'react';

/**
 * MatrixRain — full-screen canvas overlay rendering falling green characters.
 *
 * Renders a matrix-style rain effect with a mix of katakana and latin characters
 * falling down the screen. The overlay covers the entire viewport with a
 * semi-transparent black background.
 *
 * - Triggered via the "matrix" terminal command
 * - Auto-dismisses after 5 seconds or on click/keypress
 * - Uses requestAnimationFrame for smooth 60fps animation
 * - Cleans up animation frame and event listeners on unmount
 * - Canvas uses pointer-events: none so windows beneath remain interactive
 *
 * Requirements: 10.1, 10.5
 */

// Katakana + Latin character set for the rain
const CHARACTERS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const FONT_SIZE = 14;
const FADE_OPACITY = 0.05;
const AUTO_DISMISS_MS = 5000;

interface MatrixRainProps {
  onDismiss: () => void;
}

const MatrixRain = memo(function MatrixRain({ onDismiss }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const columnsRef = useRef<number[]>([]);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full viewport size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Initialize columns based on new width
      const columnCount = Math.floor(canvas.width / FONT_SIZE);
      columnsRef.current = Array.from({ length: columnCount }, () =>
        Math.floor(Math.random() * canvas.height / FONT_SIZE)
      );
    };

    resize();
    window.addEventListener('resize', resize);

    // Animation loop
    const draw = () => {
      // Semi-transparent black to create fade trail effect
      ctx.fillStyle = `rgba(0, 0, 0, ${FADE_OPACITY})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Green text
      ctx.fillStyle = '#00ff41';
      ctx.font = `${FONT_SIZE}px monospace`;

      const columns = columnsRef.current;
      for (let i = 0; i < columns.length; i++) {
        // Pick a random character
        const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const x = i * FONT_SIZE;
        const y = columns[i] * FONT_SIZE;

        // Occasionally draw a brighter "head" character
        if (Math.random() > 0.95) {
          ctx.fillStyle = '#ffffff';
          ctx.fillText(char, x, y);
          ctx.fillStyle = '#00ff41';
        } else {
          ctx.fillText(char, x, y);
        }

        // Reset column to top randomly or when it goes off screen
        if (y > canvas.height && Math.random() > 0.975) {
          columns[i] = 0;
        } else {
          columns[i]++;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(draw);

    // Auto-dismiss after 5 seconds
    dismissTimerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [dismiss]);

  // Dismiss on click or keypress
  useEffect(() => {
    const handleClick = () => dismiss();
    const handleKeyDown = () => dismiss();

    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismiss]);

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 1000 }}
      data-testid="matrix-rain-overlay"
    >
      {/* Semi-transparent black background */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      />
      {/* Canvas for the rain animation — pointer-events: none allows interaction beneath */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
});

export default MatrixRain;
