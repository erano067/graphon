/**
 * Arrow type definitions and transform utilities.
 */

import type { Graphics } from 'pixi.js';
import type { Position } from '../model/types';

/** Arrow shape types. */
export type ArrowShape =
  | 'triangle'
  | 'triangle-tee'
  | 'triangle-cross'
  | 'vee'
  | 'chevron'
  | 'tee'
  | 'bar'
  | 'circle'
  | 'diamond'
  | 'square'
  | 'none';

/** Arrow fill style. */
export type ArrowFill = 'filled' | 'hollow';

/** Arrow configuration options. */
export interface ArrowOptions {
  shape: ArrowShape;
  size: number;
  color: number;
  fill: ArrowFill;
}

/** Default arrow options. */
export const DEFAULT_ARROW_OPTIONS: ArrowOptions = {
  shape: 'triangle',
  size: 10,
  color: 0x999999,
  fill: 'filled',
};

/** Arrow drawing context with precomputed values. */
export interface ArrowContext {
  g: Graphics;
  pos: Position;
  angle: number;
  size: number;
  isHollow: boolean;
}

/** Rotate a point around origin by angle. */
function rotatePoint(x: number, y: number, angle: number): Position {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

/** Transform a point to position with rotation. */
export function transformPoint(local: Position, center: Position, angle: number): Position {
  const rotated = rotatePoint(local.x, local.y, angle);
  return {
    x: center.x + rotated.x,
    y: center.y + rotated.y,
  };
}

/** Compute the angle of a line between two points. */
export function computeAngle(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/** Compute arrow position at source end of edge. */
export function computeSourceArrowPosition(
  source: Position,
  target: Position,
  nodeRadius: number
): { position: Position; angle: number } {
  const angle = computeAngle(target, source);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  return {
    position: {
      x: source.x + dx * nodeRadius,
      y: source.y + dy * nodeRadius,
    },
    angle: angle + Math.PI,
  };
}

/** Compute arrow position at target end of edge. */
export function computeTargetArrowPosition(
  source: Position,
  target: Position,
  nodeRadius: number
): { position: Position; angle: number } {
  const angle = computeAngle(source, target);
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  return {
    position: {
      x: target.x - dx * nodeRadius,
      y: target.y - dy * nodeRadius,
    },
    angle,
  };
}

/** Compute arrow position at midpoint of edge. */
export function computeMidArrowPosition(
  source: Position,
  target: Position
): { position: Position; angle: number } {
  const angle = computeAngle(source, target);
  return {
    position: {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2,
    },
    angle,
  };
}
