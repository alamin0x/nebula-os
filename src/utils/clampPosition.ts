import type { Position, Size } from '../types';

/**
 * Clamps a window position to ensure at least 50px of the title bar
 * remains visible within the viewport boundaries.
 *
 * The title bar is assumed to be at the top of the window spanning its full width.
 * We ensure:
 * - The window's right edge is at least 50px into the viewport from the left
 * - The window's left edge is at most (viewport width - 50px) from the left
 * - The window's top edge is at least 0 (can't go above viewport)
 * - The window's top edge is at most (viewport height - 50px) so title bar stays visible
 */
export function clampPosition(
  position: Position,
  windowSize: Size,
  viewport: Size,
): Position {
  // Ensure at least 50px of the window width is visible horizontally
  const minX = -(windowSize.width - 50);
  const maxX = viewport.width - 50;

  // Ensure at least 50px of the title bar is visible vertically
  const minY = 0;
  const maxY = viewport.height - 50;

  return {
    x: Math.max(minX, Math.min(maxX, position.x)),
    y: Math.max(minY, Math.min(maxY, position.y)),
  };
}
