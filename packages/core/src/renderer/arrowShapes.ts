/**
 * Arrow shape drawing functions.
 */

import { type ArrowContext, transformPoint } from './arrowTypes';

/** Draw a triangle arrow. */
export function drawTriangleArrow(ctx: ArrowContext): void {
  const { g, pos, angle, size, isHollow } = ctx;
  const halfHeight = size * 0.6;
  const p1 = transformPoint({ x: 0, y: 0 }, pos, angle);
  const p2 = transformPoint({ x: -size, y: -halfHeight }, pos, angle);
  const p3 = transformPoint({ x: -size, y: halfHeight }, pos, angle);

  g.moveTo(p1.x, p1.y);
  g.lineTo(p2.x, p2.y);
  g.lineTo(p3.x, p3.y);
  g.closePath();

  if (isHollow) {
    g.stroke();
  } else {
    g.fill();
  }
}

/** Draw a triangle with tee (bar at base). */
export function drawTriangleTeeArrow(ctx: ArrowContext): void {
  drawTriangleArrow(ctx);

  const { g, pos, angle, size } = ctx;
  const teeOffset = -size;
  const teeHeight = size * 0.8;
  const t1 = transformPoint({ x: teeOffset, y: -teeHeight }, pos, angle);
  const t2 = transformPoint({ x: teeOffset, y: teeHeight }, pos, angle);

  g.moveTo(t1.x, t1.y);
  g.lineTo(t2.x, t2.y);
  g.stroke();
}

/** Draw a triangle with cross at base. */
export function drawTriangleCrossArrow(ctx: ArrowContext): void {
  drawTriangleArrow(ctx);

  const { g, pos, angle, size } = ctx;
  const crossOffset = -size * 0.7;
  const crossSize = size * 0.4;
  const c1 = transformPoint({ x: crossOffset - crossSize, y: -crossSize }, pos, angle);
  const c2 = transformPoint({ x: crossOffset + crossSize, y: crossSize }, pos, angle);
  const c3 = transformPoint({ x: crossOffset - crossSize, y: crossSize }, pos, angle);
  const c4 = transformPoint({ x: crossOffset + crossSize, y: -crossSize }, pos, angle);

  g.moveTo(c1.x, c1.y);
  g.lineTo(c2.x, c2.y);
  g.moveTo(c3.x, c3.y);
  g.lineTo(c4.x, c4.y);
  g.stroke();
}

/** Draw a vee (open) arrow. */
export function drawVeeArrow(ctx: ArrowContext): void {
  const { g, pos, angle, size } = ctx;
  const halfHeight = size * 0.6;
  const p1 = transformPoint({ x: -size, y: -halfHeight }, pos, angle);
  const tip = transformPoint({ x: 0, y: 0 }, pos, angle);
  const p2 = transformPoint({ x: -size, y: halfHeight }, pos, angle);

  g.moveTo(p1.x, p1.y);
  g.lineTo(tip.x, tip.y);
  g.lineTo(p2.x, p2.y);
  g.stroke();
}

/** Draw a chevron (wider vee) arrow. */
export function drawChevronArrow(ctx: ArrowContext): void {
  const { g, pos, angle, size } = ctx;
  const halfHeight = size * 0.8;
  const p1 = transformPoint({ x: -size, y: -halfHeight }, pos, angle);
  const tip = transformPoint({ x: 0, y: 0 }, pos, angle);
  const p2 = transformPoint({ x: -size, y: halfHeight }, pos, angle);

  g.moveTo(p1.x, p1.y);
  g.lineTo(tip.x, tip.y);
  g.lineTo(p2.x, p2.y);
  g.stroke();
}

/** Draw a tee (bar) arrow. */
export function drawTeeArrow(ctx: ArrowContext): void {
  const { g, pos, angle, size } = ctx;
  const halfHeight = size * 0.6;
  const t1 = transformPoint({ x: 0, y: -halfHeight }, pos, angle);
  const t2 = transformPoint({ x: 0, y: halfHeight }, pos, angle);

  g.moveTo(t1.x, t1.y);
  g.lineTo(t2.x, t2.y);
  g.stroke();
}

/** Draw a circle arrow. */
export function drawCircleArrow(ctx: ArrowContext): void {
  const { g, pos, size, isHollow } = ctx;
  const radius = size * 0.4;
  g.circle(pos.x, pos.y, radius);

  if (isHollow) {
    g.stroke();
  } else {
    g.fill();
  }
}

/** Draw a diamond arrow. */
export function drawDiamondArrow(ctx: ArrowContext): void {
  const { g, pos, angle, size, isHollow } = ctx;
  const halfSize = size * 0.5;
  const p1 = transformPoint({ x: halfSize, y: 0 }, pos, angle);
  const p2 = transformPoint({ x: 0, y: -halfSize }, pos, angle);
  const p3 = transformPoint({ x: -halfSize, y: 0 }, pos, angle);
  const p4 = transformPoint({ x: 0, y: halfSize }, pos, angle);

  g.moveTo(p1.x, p1.y);
  g.lineTo(p2.x, p2.y);
  g.lineTo(p3.x, p3.y);
  g.lineTo(p4.x, p4.y);
  g.closePath();

  if (isHollow) {
    g.stroke();
  } else {
    g.fill();
  }
}

/** Draw a square arrow. */
export function drawSquareArrow(ctx: ArrowContext): void {
  const { g, pos, angle, size, isHollow } = ctx;
  const halfSize = size * 0.4;
  const p1 = transformPoint({ x: halfSize, y: -halfSize }, pos, angle);
  const p2 = transformPoint({ x: -halfSize, y: -halfSize }, pos, angle);
  const p3 = transformPoint({ x: -halfSize, y: halfSize }, pos, angle);
  const p4 = transformPoint({ x: halfSize, y: halfSize }, pos, angle);

  g.moveTo(p1.x, p1.y);
  g.lineTo(p2.x, p2.y);
  g.lineTo(p3.x, p3.y);
  g.lineTo(p4.x, p4.y);
  g.closePath();

  if (isHollow) {
    g.stroke();
  } else {
    g.fill();
  }
}
