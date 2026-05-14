import { useEffect, useRef, useCallback, memo } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { themes } from '../utils/themes';

/**
 * MouseGlow renders a subtle radial gradient glow that follows the mouse cursor.
 * It uses CSS transforms for smooth positioning (no layout thrashing) and
 * the current theme's accent color for the glow effect.
 */
const MouseGlow = memo(function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const activeTheme = useThemeStore((state) => state.activeTheme);
  const accentColor = themes[activeTheme].colors.accent;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <div
      ref={glowRef}
      className="fixed top-0 left-0 pointer-events-none"
      style={{
        width: '600px',
        height: '600px',
        marginLeft: '-300px',
        marginTop: '-300px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}26 0%, transparent 70%)`,
        opacity: 0.15,
        zIndex: 1,
        willChange: 'transform',
      }}
      aria-hidden="true"
    />
  );
});

export { MouseGlow };
export default MouseGlow;
