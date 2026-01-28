import type { Graphics } from 'pixi.js';
import type { Position } from '../model/types';

/** Supported node shapes. */
export type NodeShape = 'circle' | 'square' | 'diamond';

/** Style properties resolved for a single node. */
export interface ResolvedNodeVisuals {
  color: number;
  radius: number;
  shape: NodeShape;
}

/** Default visuals when not specified. */
export const DEFAULT_NODE_VISUALS: ResolvedNodeVisuals = {
  color: 0x4a90d9,
  radius: 8,
  shape: 'circle',
};

/** Draws circles at the given positions. */
export function drawCircles(g: Graphics, positions: Position[], radius: number): void {
  for (const pos of positions) {
    g.circle(pos.x, pos.y, radius);
  }
}

/** Draws squares (centered) at the given positions. */
export function drawSquares(g: Graphics, positions: Position[], radius: number): void {
  const size = radius * 2;
  for (const pos of positions) {
    g.rect(pos.x - radius, pos.y - radius, size, size);
  }
}

/** Draws diamonds (rotated squares) at the given positions. */
export function drawDiamonds(g: Graphics, positions: Position[], radius: number): void {
  for (const pos of positions) {
    g.moveTo(pos.x, pos.y - radius);
    g.lineTo(pos.x + radius, pos.y);
    g.lineTo(pos.x, pos.y + radius);
    g.lineTo(pos.x - radius, pos.y);
    g.closePath();
  }
}

/** Draws shapes based on the shape type. */
export function drawShape(
  g: Graphics,
  positions: Position[],
  radius: number,
  shape: NodeShape
): void {
  switch (shape) {
    case 'circle':
      drawCircles(g, positions, radius);
      break;
    case 'square':
      drawSquares(g, positions, radius);
      break;
    case 'diamond':
      drawDiamonds(g, positions, radius);
      break;
  }
}
