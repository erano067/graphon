import type { Graphics } from 'pixi.js';
import type { Position } from '../model/types';

// Re-export types and defaults
export type { NodeShape, ExtendedNodeShape, ExtendedShapeOptions } from './shapeTypes';
export type { ResolvedNodeVisuals, ResolvedEdgeVisuals } from './shapeTypes';
export { DEFAULT_NODE_VISUALS, DEFAULT_EDGE_VISUALS } from './shapeTypes';

// Re-export extended shape functions
export {
  drawEllipses,
  drawRectangles,
  drawRoundRectangles,
  drawRoundDiamonds,
  drawTriangles,
  drawRoundTriangles,
  drawRegularPolygons,
  drawPentagons,
  drawHexagons,
  drawOctagons,
  drawStars,
  drawTags,
  drawVees,
  drawExtendedShape,
  drawSingleShape,
} from './extendedShapes';

import type { NodeShape } from './shapeTypes';

// ============================================================================
// Basic Shapes (original 3-shape API)
// ============================================================================

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

// ============================================================================
// Legacy Draw Function
// ============================================================================

/** Draws shapes based on the shape type (legacy 3-shape API). */
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
