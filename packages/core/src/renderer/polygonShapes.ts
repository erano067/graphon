import type { Graphics } from 'pixi.js';
import type { Position } from '../model/types';
import {
  type PolygonOptions,
  type StarOptions,
  type TagOptions,
  getRegularPolygonPoints,
} from './shapeTypes';

// ============================================================================
// Rounded Diamond Shape
// ============================================================================

/** Draws rounded diamonds at the given positions using bezier curves. */
export function drawRoundDiamonds(g: Graphics, positions: Position[], radius: number): void {
  const cr = radius * 0.2;
  for (const pos of positions) {
    const top = { x: pos.x, y: pos.y - radius };
    const right = { x: pos.x + radius, y: pos.y };
    const bottom = { x: pos.x, y: pos.y + radius };
    const left = { x: pos.x - radius, y: pos.y };

    g.moveTo(top.x + cr, top.y + cr);
    g.quadraticCurveTo(right.x, right.y - cr, right.x - cr, right.y);
    g.lineTo(right.x - cr, right.y);
    g.quadraticCurveTo(right.x, right.y + cr, bottom.x + cr, bottom.y - cr);
    g.lineTo(bottom.x - cr, bottom.y - cr);
    g.quadraticCurveTo(left.x, left.y + cr, left.x + cr, left.y);
    g.lineTo(left.x + cr, left.y);
    g.quadraticCurveTo(left.x, left.y - cr, top.x - cr, top.y + cr);
    g.closePath();
  }
}

// ============================================================================
// Triangular Shapes
// ============================================================================

/** Draws equilateral triangles at the given positions. */
export function drawTriangles(g: Graphics, positions: Position[], radius: number): void {
  const height = radius * Math.sqrt(3);
  const halfBase = radius;
  for (const pos of positions) {
    g.moveTo(pos.x, pos.y - radius);
    g.lineTo(pos.x + halfBase, pos.y + height / 2 - radius / 2);
    g.lineTo(pos.x - halfBase, pos.y + height / 2 - radius / 2);
    g.closePath();
  }
}

/** Draws rounded triangles at the given positions. */
export function drawRoundTriangles(g: Graphics, positions: Position[], radius: number): void {
  const cr = radius * 0.15;
  const height = radius * Math.sqrt(3);
  const halfBase = radius;

  for (const pos of positions) {
    const top = { x: pos.x, y: pos.y - radius };
    const bottomRight = { x: pos.x + halfBase, y: pos.y + height / 2 - radius / 2 };
    const bottomLeft = { x: pos.x - halfBase, y: pos.y + height / 2 - radius / 2 };

    g.moveTo(top.x, top.y + cr);
    g.quadraticCurveTo(top.x + cr * 0.5, top.y, top.x + cr, top.y + cr * 0.5);
    g.lineTo(bottomRight.x - cr, bottomRight.y - cr * 0.5);
    g.quadraticCurveTo(bottomRight.x, bottomRight.y - cr, bottomRight.x, bottomRight.y);
    g.lineTo(bottomLeft.x, bottomLeft.y);
    g.quadraticCurveTo(bottomLeft.x, bottomLeft.y - cr, bottomLeft.x + cr, bottomLeft.y - cr * 0.5);
    g.lineTo(top.x - cr, top.y + cr * 0.5);
    g.quadraticCurveTo(top.x - cr * 0.5, top.y, top.x, top.y + cr);
    g.closePath();
  }
}

// ============================================================================
// Polygon Shapes
// ============================================================================

/** Draws regular polygons at the given positions. */
export function drawRegularPolygons(
  g: Graphics,
  positions: Position[],
  radius: number,
  options: PolygonOptions
): void {
  for (const pos of positions) {
    const points = getRegularPolygonPoints(pos, radius, options);
    if (points.length === 0) continue;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- length check above
    const firstPoint = points[0]!;
    g.moveTo(firstPoint.x, firstPoint.y);
    for (let i = 1; i < points.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- loop bounds
      const point = points[i]!;
      g.lineTo(point.x, point.y);
    }
    g.closePath();
  }
}

/** Draws pentagons at the given positions. */
export function drawPentagons(g: Graphics, positions: Position[], radius: number): void {
  drawRegularPolygons(g, positions, radius, { sides: 5 });
}

/** Draws hexagons at the given positions. */
export function drawHexagons(g: Graphics, positions: Position[], radius: number): void {
  drawRegularPolygons(g, positions, radius, { sides: 6 });
}

/** Draws octagons at the given positions. */
export function drawOctagons(g: Graphics, positions: Position[], radius: number): void {
  drawRegularPolygons(g, positions, radius, { sides: 8 });
}

// ============================================================================
// Special Shapes
// ============================================================================

/** Draws stars at the given positions. */
export function drawStars(
  g: Graphics,
  positions: Position[],
  radius: number,
  opts: StarOptions
): void {
  const { points, innerRadiusRatio } = opts;
  const innerRadius = radius * innerRadiusRatio;
  const totalPoints = points * 2;
  const angleStep = Math.PI / points;
  const startAngle = -Math.PI / 2;

  for (const pos of positions) {
    for (let i = 0; i < totalPoints; i++) {
      const angle = startAngle + i * angleStep;
      const r = i % 2 === 0 ? radius : innerRadius;
      const x = pos.x + r * Math.cos(angle);
      const y = pos.y + r * Math.sin(angle);
      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    }
    g.closePath();
  }
}

/** Draws tag shapes (rectangle with arrow point) at the given positions. */
export function drawTags(g: Graphics, positions: Position[], opts: TagOptions): void {
  const { width, height, pointLength = 0.3 } = opts;
  const halfH = height / 2;
  const bodyWidth = width * (1 - pointLength);
  const halfBodyW = bodyWidth / 2;

  for (const pos of positions) {
    g.moveTo(pos.x - halfBodyW, pos.y - halfH);
    g.lineTo(pos.x + halfBodyW, pos.y - halfH);
    g.lineTo(pos.x + halfBodyW + width * pointLength, pos.y);
    g.lineTo(pos.x + halfBodyW, pos.y + halfH);
    g.lineTo(pos.x - halfBodyW, pos.y + halfH);
    g.closePath();
  }
}

/** Draws vee (chevron/arrow) shapes at the given positions. */
export function drawVees(g: Graphics, positions: Position[], radius: number): void {
  const thickness = 0.4;
  const innerOffset = radius * thickness;

  for (const pos of positions) {
    g.moveTo(pos.x, pos.y - radius);
    g.lineTo(pos.x + radius, pos.y);
    g.lineTo(pos.x, pos.y + radius);
    g.lineTo(pos.x, pos.y + radius - innerOffset);
    g.lineTo(pos.x + radius - innerOffset, pos.y);
    g.lineTo(pos.x, pos.y - radius + innerOffset);
    g.closePath();
  }
}
