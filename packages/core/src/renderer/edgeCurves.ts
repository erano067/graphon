/**
 * Edge curve drawing functions.
 */

import type { Graphics } from 'pixi.js';
import type { Position } from '../model/types';
import {
  type CurveOptions,
  type CurveStyle,
  DEFAULT_CURVE_OPTIONS,
  type TaxiDirection,
  computeBezierControlPoint,
  computeTaxiDirection,
} from './curveTypes';

// Re-export types
export type { CurveOptions, CurveStyle, TaxiDirection } from './curveTypes';
export { DEFAULT_CURVE_OPTIONS } from './curveTypes';

/** Draw a straight line between two points. */
export function drawStraightEdge(g: Graphics, source: Position, target: Position): void {
  g.moveTo(source.x, source.y);
  g.lineTo(target.x, target.y);
}

/** Draw a quadratic bezier curve between two points. */
export function drawBezierEdge(
  g: Graphics,
  source: Position,
  target: Position,
  curvature: number = DEFAULT_CURVE_OPTIONS.curvature
): void {
  const control = computeBezierControlPoint(source, target, curvature);
  g.moveTo(source.x, source.y);
  g.quadraticCurveTo(control.x, control.y, target.x, target.y);
}

/** Draw a circular arc between two points. */
export function drawArcEdge(
  g: Graphics,
  source: Position,
  target: Position,
  curvature: number = DEFAULT_CURVE_OPTIONS.curvature
): void {
  const control = computeBezierControlPoint(source, target, curvature);
  g.moveTo(source.x, source.y);
  g.quadraticCurveTo(control.x, control.y, target.x, target.y);
}

/** Taxi edge drawing options. */
interface TaxiEdgeOptions {
  direction?: TaxiDirection;
  turn?: number;
  cornerRadius?: number;
}

/** Draw a taxi (right-angle) path between two points. */
export function drawTaxiEdge(
  g: Graphics,
  source: Position,
  target: Position,
  options: TaxiEdgeOptions = {}
): void {
  const {
    direction = DEFAULT_CURVE_OPTIONS.taxiDirection,
    turn = DEFAULT_CURVE_OPTIONS.taxiTurn,
    cornerRadius = DEFAULT_CURVE_OPTIONS.cornerRadius,
  } = options;

  const resolvedDirection = computeTaxiDirection(source, target, direction);
  g.moveTo(source.x, source.y);

  if (resolvedDirection === 'horizontal') {
    const turnX = source.x + (target.x - source.x) * turn;
    drawTaxiPath(g, target, {
      corner1: { x: turnX, y: source.y },
      corner2: { x: turnX, y: target.y },
      cornerRadius,
    });
  } else {
    const turnY = source.y + (target.y - source.y) * turn;
    drawTaxiPath(g, target, {
      corner1: { x: source.x, y: turnY },
      corner2: { x: target.x, y: turnY },
      cornerRadius,
    });
  }
}

/** Taxi path segment options. */
interface TaxiPathSegment {
  corner1: Position;
  corner2: Position;
  cornerRadius: number;
}

/** Draw taxi path with optional rounded corners. */
function drawTaxiPath(g: Graphics, target: Position, segment: TaxiPathSegment): void {
  const { corner1, corner2, cornerRadius } = segment;
  if (cornerRadius <= 0) {
    g.lineTo(corner1.x, corner1.y);
    g.lineTo(corner2.x, corner2.y);
  } else {
    drawRoundedCorner(g, { corner: corner1, toward: corner2, radius: cornerRadius });
    drawRoundedCorner(g, { corner: corner2, toward: target, radius: cornerRadius });
  }
  g.lineTo(target.x, target.y);
}

/** Rounded corner options. */
interface RoundedCornerOptions {
  corner: Position;
  toward: Position;
  radius: number;
}

/** Draw a rounded corner. */
function drawRoundedCorner(g: Graphics, options: RoundedCornerOptions): void {
  const { corner, toward, radius } = options;
  // Use the current pen position as "prev" - we just came from there
  // This simplifies the API since we're always drawing from current position
  const dx2 = toward.x - corner.x;
  const dy2 = toward.y - corner.y;
  const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  const actualRadius = Math.min(radius, len2 / 2);

  if (actualRadius <= 0 || len2 === 0) {
    g.lineTo(corner.x, corner.y);
    return;
  }

  const arcEnd = {
    x: corner.x + (dx2 / len2) * actualRadius,
    y: corner.y + (dy2 / len2) * actualRadius,
  };

  g.lineTo(corner.x, corner.y);
  g.quadraticCurveTo(corner.x, corner.y, arcEnd.x, arcEnd.y);
}

/** Draw a multi-segment polyline through control points. */
export function drawSegmentsEdge(
  g: Graphics,
  source: Position,
  target: Position,
  controlPoints: Position[]
): void {
  g.moveTo(source.x, source.y);
  for (const point of controlPoints) {
    g.lineTo(point.x, point.y);
  }
  g.lineTo(target.x, target.y);
}

/** Draw a cubic bezier with explicit control points. */
export function drawUnbundledBezierEdge(
  g: Graphics,
  source: Position,
  target: Position,
  controlPoints: Position[]
): void {
  g.moveTo(source.x, source.y);

  const [cp1, cp2] = controlPoints;
  if (!cp1) {
    g.lineTo(target.x, target.y);
  } else if (!cp2) {
    g.quadraticCurveTo(cp1.x, cp1.y, target.x, target.y);
  } else {
    g.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, target.x, target.y);
  }
}

/** Curve draw function type. */
type CurveDrawFn = (g: Graphics, source: Position, target: Position, opts: CurveOptions) => void;

/** Map of curve styles to draw functions. */
const CURVE_DRAW_MAP: Record<CurveStyle, CurveDrawFn> = {
  straight: (g, s, t) => drawStraightEdge(g, s, t),
  bezier: (g, s, t, o) => drawBezierEdge(g, s, t, o.curvature),
  arc: (g, s, t, o) => drawArcEdge(g, s, t, o.curvature),
  taxi: (g, s, t, o) =>
    drawTaxiEdge(g, s, t, {
      ...(o.taxiDirection && { direction: o.taxiDirection }),
      ...(o.taxiTurn !== undefined && { turn: o.taxiTurn }),
      ...(o.cornerRadius !== undefined && { cornerRadius: o.cornerRadius }),
    }),
  segments: (g, s, t, o) => drawSegmentsEdge(g, s, t, o.controlPoints ?? []),
  'unbundled-bezier': (g, s, t, o) => drawUnbundledBezierEdge(g, s, t, o.controlPoints ?? []),
};

/** Draw an edge with the specified curve style. */
export function drawCurvedEdge(
  g: Graphics,
  source: Position,
  target: Position,
  options: CurveOptions = { style: 'straight' }
): void {
  const opts = { ...DEFAULT_CURVE_OPTIONS, ...options };
  CURVE_DRAW_MAP[opts.style](g, source, target, opts);
}
