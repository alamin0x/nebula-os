import type { Position } from '../types';

/**
 * Calculates the magnetic offset for a dock icon based on cursor proximity.
 *
 * When the cursor is within 80px of the icon center, the icon shifts
 * toward the cursor by up to 6px. Beyond 80px, the offset is zero.
 *
 * The offset magnitude scales linearly with proximity:
 * closer cursor = larger offset (max 6px at distance 0).
 */
export function magneticEffect(
  cursorPosition: Position,
  iconCenter: Position,
): Position {
  const dx = cursorPosition.x - iconCenter.x;
  const dy = cursorPosition.y - iconCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const maxDistance = 80;
  const maxOffset = 6;

  if (distance === 0 || distance > maxDistance) {
    return { x: 0, y: 0 };
  }

  // Scale offset: closer = larger offset, directed toward cursor
  const scale = (1 - distance / maxDistance) * maxOffset;

  // Normalize direction toward cursor and apply scale
  const offsetX = (dx / distance) * scale;
  const offsetY = (dy / distance) * scale;

  return { x: offsetX, y: offsetY };
}
