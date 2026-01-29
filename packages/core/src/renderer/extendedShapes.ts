import type { Graphics } from 'pixi.js';
import type { Position } from '../model/types';
import {
  type DrawExtendedShapeOptions,
  type DrawSingleShapeOptions,
  type EllipseOptions,
  type ExtendedNodeShape,
  type ExtendedShapeOptions,
  type RectOptions,
} from './shapeTypes';
import {
  drawHexagons,
  drawOctagons,
  drawPentagons,
  drawRegularPolygons,
  drawRoundDiamonds,
  drawRoundTriangles,
  drawStars,
  drawTags,
  drawTriangles,
  drawVees,
} from './polygonShapes';

// Re-export polygon shapes
export {
  drawHexagons,
  drawOctagons,
  drawPentagons,
  drawRegularPolygons,
  drawRoundDiamonds,
  drawRoundTriangles,
  drawStars,
  drawTags,
  drawTriangles,
  drawVees,
} from './polygonShapes';

// ============================================================================
// Ellipse and Rectangle Shapes
// ============================================================================

/** Draws ellipses at the given positions. */
export function drawEllipses(g: Graphics, positions: Position[], options: EllipseOptions): void {
  const { radiusX, radiusY } = options;
  for (const pos of positions) {
    g.ellipse(pos.x, pos.y, radiusX, radiusY);
  }
}

/** Draws rectangles (centered) at the given positions. */
export function drawRectangles(g: Graphics, positions: Position[], options: RectOptions): void {
  const { width, height } = options;
  const halfW = width / 2;
  const halfH = height / 2;
  for (const pos of positions) {
    g.rect(pos.x - halfW, pos.y - halfH, width, height);
  }
}

/** Draws rounded rectangles (centered) at the given positions. */
export function drawRoundRectangles(
  g: Graphics,
  positions: Position[],
  options: RectOptions
): void {
  const { width, height, cornerRadius = 0 } = options;
  const halfW = width / 2;
  const halfH = height / 2;
  for (const pos of positions) {
    g.roundRect(pos.x - halfW, pos.y - halfH, width, height, cornerRadius);
  }
}

// ============================================================================
// Extended Shape Drawing
// ============================================================================

/** Shape drawing function type. */
type ShapeDrawer = (
  g: Graphics,
  positions: Position[],
  radius: number,
  opts: ExtendedShapeOptions
) => void;

/** Map of shape names to drawing functions. */
const shapeDrawers: Record<ExtendedNodeShape, ShapeDrawer> = {
  circle: (g, positions, radius) => {
    for (const pos of positions) g.circle(pos.x, pos.y, radius);
  },
  ellipse: (g, positions, radius, opts) => {
    const rx = radius * (opts.ellipseRatioX ?? 1.5);
    const ry = radius * (opts.ellipseRatioY ?? 1);
    drawEllipses(g, positions, { radiusX: rx, radiusY: ry });
  },
  square: (g, positions, radius) => {
    const size = radius * 2;
    for (const pos of positions) g.rect(pos.x - radius, pos.y - radius, size, size);
  },
  rectangle: (g, positions, radius, opts) => {
    const w = radius * 2 * (opts.rectWidthRatio ?? 1.5);
    const h = radius * 2 * (opts.rectHeightRatio ?? 1);
    drawRectangles(g, positions, { width: w, height: h });
  },
  'round-rectangle': (g, positions, radius, opts) => {
    const w = radius * 2 * (opts.rectWidthRatio ?? 1.5);
    const h = radius * 2 * (opts.rectHeightRatio ?? 1);
    const cr = radius * (opts.cornerRadius ?? 0.2);
    drawRoundRectangles(g, positions, { width: w, height: h, cornerRadius: cr });
  },
  diamond: (g, positions, radius) => {
    for (const pos of positions) {
      g.moveTo(pos.x, pos.y - radius);
      g.lineTo(pos.x + radius, pos.y);
      g.lineTo(pos.x, pos.y + radius);
      g.lineTo(pos.x - radius, pos.y);
      g.closePath();
    }
  },
  'round-diamond': (g, positions, radius) => drawRoundDiamonds(g, positions, radius),
  triangle: (g, positions, radius) => drawTriangles(g, positions, radius),
  'round-triangle': (g, positions, radius) => drawRoundTriangles(g, positions, radius),
  pentagon: (g, positions, radius) => drawPentagons(g, positions, radius),
  hexagon: (g, positions, radius) => drawHexagons(g, positions, radius),
  octagon: (g, positions, radius) => drawOctagons(g, positions, radius),
  star: (g, positions, radius, opts) => {
    drawStars(g, positions, radius, {
      points: opts.starPoints ?? 5,
      innerRadiusRatio: opts.starInnerRadius ?? 0.4,
    });
  },
  tag: (g, positions, radius) => {
    drawTags(g, positions, { width: radius * 2.5, height: radius * 1.5 });
  },
  vee: (g, positions, radius) => drawVees(g, positions, radius),
  polygon: (g, positions, radius, opts) => {
    drawRegularPolygons(g, positions, radius, { sides: opts.polygonSides ?? 6 });
  },
};

/** Draws extended shapes based on the shape type with options. */
export function drawExtendedShape(g: Graphics, options: DrawExtendedShapeOptions): void {
  const { positions, radius, shape, shapeOptions = {} } = options;
  const drawer = shapeDrawers[shape];
  drawer(g, positions, radius, shapeOptions);
}

/** Draws a single shape at the given position. */
export function drawSingleShape(g: Graphics, options: DrawSingleShapeOptions): void {
  const { position, radius, shape, shapeOptions } = options;
  drawExtendedShape(g, {
    positions: [position],
    radius,
    shape,
    ...(shapeOptions && { shapeOptions }),
  });
}
