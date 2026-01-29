/**
 * Curve type definitions and basic utilities.
 */

import type { Position } from '../model/types';

/** Curve style types supported by the edge renderer. */
export type CurveStyle = 'straight' | 'bezier' | 'arc' | 'taxi' | 'segments' | 'unbundled-bezier';

/** Direction for taxi-style edges. */
export type TaxiDirection = 'horizontal' | 'vertical' | 'auto';

/** Options for drawing a curved edge. */
export interface CurveOptions {
  style: CurveStyle;
  curvature?: number;
  controlPoints?: Position[];
  taxiDirection?: TaxiDirection;
  taxiTurn?: number;
  cornerRadius?: number;
}

/** Default curve options. */
export const DEFAULT_CURVE_OPTIONS: Required<Omit<CurveOptions, 'controlPoints'>> & {
  controlPoints: Position[];
} = {
  style: 'straight',
  curvature: 0.3,
  controlPoints: [],
  taxiDirection: 'auto',
  taxiTurn: 0.5,
  cornerRadius: 0,
};

/** Compute perpendicular offset for curve control point. */
export function computeBezierControlPoint(
  source: Position,
  target: Position,
  curvature: number
): Position {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return { x: midX, y: midY };

  const perpX = -dy / dist;
  const perpY = dx / dist;
  const offset = dist * curvature;

  return {
    x: midX + perpX * offset,
    y: midY + perpY * offset,
  };
}

/** Determine auto direction for taxi edges. */
export function computeTaxiDirection(
  source: Position,
  target: Position,
  direction: TaxiDirection
): 'horizontal' | 'vertical' {
  if (direction !== 'auto') return direction;
  const dx = Math.abs(target.x - source.x);
  const dy = Math.abs(target.y - source.y);
  return dx >= dy ? 'horizontal' : 'vertical';
}
