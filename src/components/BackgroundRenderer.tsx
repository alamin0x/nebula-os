import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { themes } from '../utils/themes';

/** Maximum number of particle elements allowed in the DOM */
const MAX_PARTICLES = 50;

/** Number of animated blob elements */
const BLOB_COUNT = 3;

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  angle: number;
}

/**
 * BackgroundRenderer renders an animated nebula/star field background.
 * - 3 semi-transparent blob elements with CSS keyframe animations (translate + scale)
 * - Up to 50 particle elements (small dots with opacity animation)
 * - Pauses on visibilitychange hidden, resumes on visible
 * - All elements use pointer-events: none and sit below the desktop layer (z-index: 0)
 * - Only uses transform and opacity for animations
 * - Responds to the active theme color palette
 */
const BackgroundRenderer = memo(function BackgroundRenderer() {
  const activeTheme = useThemeStore((state) => state.activeTheme);
  const themeColors = themes[activeTheme].colors;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  /**
   * Initialize particles with random positions and properties.
   */
  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  /**
   * Animate particles on canvas using requestAnimationFrame.
   * Uses only opacity-like fading and positional transforms for performance.
   */
  const animate = useCallback(() => {
    if (isPausedRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const particles = particlesRef.current;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Update position
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;

      // Oscillate opacity
      p.opacity = 0.3 + Math.sin(Date.now() * 0.001 + p.id) * 0.3;

      // Wrap around viewport
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${themeColors.primary}${Math.round(p.opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [themeColors.primary]);

  /**
   * Handle canvas resize to match viewport.
   */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  /**
   * Handle visibility change — pause/resume animations.
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      isPausedRef.current = true;
      setIsPaused(true);
      cancelAnimationFrame(animationFrameRef.current);
    } else {
      isPausedRef.current = false;
      setIsPaused(false);
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Initialize and start animation
  useEffect(() => {
    handleResize();
    initParticles();
    animationFrameRef.current = requestAnimationFrame(animate);

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [animate, handleResize, handleVisibilityChange, initParticles]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
      data-testid="background-renderer"
    >
      {/* Animated blob elements */}
      {Array.from({ length: BLOB_COUNT }, (_, i) => (
        <Blob key={i} index={i} themeColors={themeColors} isPaused={isPaused} />
      ))}

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 1 }}
        data-testid="particle-canvas"
      />
    </div>
  );
});

/**
 * Blob component — a semi-transparent animated element that translates and scales.
 * Uses CSS keyframe animations with only transform and opacity properties.
 */
interface BlobProps {
  index: number;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  isPaused: boolean;
}

const Blob = memo(function Blob({ index, themeColors, isPaused }: BlobProps) {
  // Each blob gets different animation parameters for visual variety
  const blobConfigs = [
    {
      color: themeColors.primary,
      size: '40vw',
      initialX: '10%',
      initialY: '20%',
      duration: '20s',
      delay: '0s',
    },
    {
      color: themeColors.secondary,
      size: '35vw',
      initialX: '60%',
      initialY: '50%',
      duration: '25s',
      delay: '-5s',
    },
    {
      color: themeColors.accent,
      size: '30vw',
      initialX: '30%',
      initialY: '70%',
      duration: '22s',
      delay: '-10s',
    },
  ];

  const config = blobConfigs[index];

  return (
    <div
      className="absolute rounded-full"
      data-testid={`blob-${index}`}
      style={{
        width: config.size,
        height: config.size,
        left: config.initialX,
        top: config.initialY,
        background: `radial-gradient(circle, ${config.color}20 0%, transparent 70%)`,
        opacity: 0.6,
        animation: `blob-move-${index} ${config.duration} ease-in-out infinite`,
        animationDelay: config.delay,
        animationPlayState: isPaused ? 'paused' : 'running',
        willChange: 'transform, opacity',
      }}
    />
  );
});

export default BackgroundRenderer;
