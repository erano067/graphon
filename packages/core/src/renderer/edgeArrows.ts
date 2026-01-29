/**
 * Edge arrow drawing - main entry point.
 */

import type { Graphics } from 'pixi.js';
import type { Position } from '../model/types';
import {
  type ArrowContext,
  type ArrowOptions,
  type ArrowShape,
  DEFAULT_ARROW_OPTIONS,
  computeMidArrowPosition,
  computeSourceArrowPosition,
  computeTargetArrowPosition,
} from './arrowTypes';
import {
  drawChevronArrow,
  drawCircleArrow,
  drawDiamondArrow,
  drawSquareArrow,
  drawTeeArrow,
  drawTriangleArrow,
  drawTriangleCrossArrow,
  drawTriangleTeeArrow,
  drawVeeArrow,
} from './arrowShapes';

// Re-export types and utilities
export type { ArrowContext, ArrowFill, ArrowOptions, ArrowShape } from './arrowTypes';
export {
  computeMidArrowPosition,
  computeSourceArrowPosition,
  computeTargetArrowPosition,
  DEFAULT_ARROW_OPTIONS,
};

/** Arrow shape draw function type. */
type ArrowDrawFn = (ctx: ArrowContext) => void;

/** Map of arrow shapes to their draw functions. */
const ARROW_DRAW_MAP: Record<ArrowShape, ArrowDrawFn | null> = {
  none: null,
  triangle: drawTriangleArrow,
  'triangle-tee': drawTriangleTeeArrow,
  'triangle-cross': drawTriangleCrossArrow,
  vee: drawVeeArrow,
  chevron: drawChevronArrow,
  tee: drawTeeArrow,
  bar: drawTeeArrow,
  circle: drawCircleArrow,
  diamond: drawDiamondArrow,
  square: drawSquareArrow,
};

/** Draw an arrow shape at a position pointing in a direction. */
export function drawArrowShape(
  g: Graphics,
  pos: Position,
  angle: number,
  options: Partial<ArrowOptions> = {}
): void {
  const { shape, size, fill } = { ...DEFAULT_ARROW_OPTIONS, ...options };
  const drawFn = ARROW_DRAW_MAP[shape];
  if (!drawFn) return;

  const ctx: ArrowContext = {
    g,
    pos,
    angle,
    size,
    isHollow: fill === 'hollow',
  };

  drawFn(ctx);
}
