/**
 * Node decorator rendering.
 *
 * Decorators are small visual elements drawn on or around nodes:
 * - Badges: Small circles/shapes with optional text
 * - Dots: Simple colored circles at corners
 * - Glyphs: Icons or symbols
 */

import type { Graphics } from 'pixi.js';
import type { Position } from '../model/types';

/** Corner positions for decorators. */
export type DecoratorPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center';

/** Badge decorator configuration. */
export interface BadgeDecorator {
  type: 'badge';
  position: DecoratorPosition;
  color: number;
  size?: number;
  text?: string;
  textColor?: number;
  borderColor?: number;
  borderWidth?: number;
}

/** Dot decorator configuration. */
export interface DotDecorator {
  type: 'dot';
  position: DecoratorPosition;
  color: number;
  size?: number;
  borderColor?: number;
  borderWidth?: number;
}

/** Ring decorator configuration. */
export interface RingDecorator {
  type: 'ring';
  color: number;
  width?: number;
  offset?: number;
  dashPattern?: number[];
}

/** Decorator configuration (union type). */
export type DecoratorConfig = BadgeDecorator | DotDecorator | RingDecorator;

/** Default decorator sizes. */
const DEFAULT_BADGE_SIZE = 8;
const DEFAULT_DOT_SIZE = 6;
const DEFAULT_RING_WIDTH = 2;
const DEFAULT_RING_OFFSET = 4;

/** Compute decorator position relative to node center. */
export function computeDecoratorPosition(
  nodeCenter: Position,
  nodeRadius: number,
  position: DecoratorPosition,
  decoratorSize: number
): Position {
  // Offset from node edge
  const offset = decoratorSize / 2;
  const edgeDist = nodeRadius + offset;
  const cornerDist = nodeRadius * 0.707 + offset; // 45-degree position

  switch (position) {
    case 'top-right':
      return { x: nodeCenter.x + cornerDist, y: nodeCenter.y - cornerDist };
    case 'top-left':
      return { x: nodeCenter.x - cornerDist, y: nodeCenter.y - cornerDist };
    case 'bottom-right':
      return { x: nodeCenter.x + cornerDist, y: nodeCenter.y + cornerDist };
    case 'bottom-left':
      return { x: nodeCenter.x - cornerDist, y: nodeCenter.y + cornerDist };
    case 'top':
      return { x: nodeCenter.x, y: nodeCenter.y - edgeDist };
    case 'bottom':
      return { x: nodeCenter.x, y: nodeCenter.y + edgeDist };
    case 'left':
      return { x: nodeCenter.x - edgeDist, y: nodeCenter.y };
    case 'right':
      return { x: nodeCenter.x + edgeDist, y: nodeCenter.y };
    case 'center':
      return { x: nodeCenter.x, y: nodeCenter.y };
  }
}

/** Draw a badge decorator. */
export function drawBadge(
  g: Graphics,
  center: Position,
  options: Omit<BadgeDecorator, 'type' | 'position'>
): void {
  const { color, size = DEFAULT_BADGE_SIZE, borderColor, borderWidth = 1 } = options;

  g.circle(center.x, center.y, size / 2);
  g.fill({ color });

  if (borderColor !== undefined) {
    g.circle(center.x, center.y, size / 2);
    g.stroke({ color: borderColor, width: borderWidth });
  }
}

/** Draw a dot decorator. */
export function drawDot(
  g: Graphics,
  center: Position,
  options: Omit<DotDecorator, 'type' | 'position'>
): void {
  const { color, size = DEFAULT_DOT_SIZE, borderColor, borderWidth = 1 } = options;

  g.circle(center.x, center.y, size / 2);
  g.fill({ color });

  if (borderColor !== undefined) {
    g.circle(center.x, center.y, size / 2);
    g.stroke({ color: borderColor, width: borderWidth });
  }
}

/** Draw a ring decorator around a node. */
export function drawRing(
  g: Graphics,
  nodeCenter: Position,
  nodeRadius: number,
  options: Omit<RingDecorator, 'type'>
): void {
  const { color, width = DEFAULT_RING_WIDTH, offset = DEFAULT_RING_OFFSET } = options;

  const ringRadius = nodeRadius + offset;
  g.circle(nodeCenter.x, nodeCenter.y, ringRadius);
  g.stroke({ color, width });
}

/** Draw a decorator on a node. */
export function drawDecorator(
  g: Graphics,
  nodeCenter: Position,
  nodeRadius: number,
  decorator: DecoratorConfig
): void {
  if (decorator.type === 'ring') {
    drawRing(g, nodeCenter, nodeRadius, decorator);
    return;
  }

  const size =
    decorator.size ?? (decorator.type === 'badge' ? DEFAULT_BADGE_SIZE : DEFAULT_DOT_SIZE);
  const pos = computeDecoratorPosition(nodeCenter, nodeRadius, decorator.position, size);

  if (decorator.type === 'badge') {
    drawBadge(g, pos, decorator);
  } else {
    drawDot(g, pos, decorator);
  }
}

/** Draw multiple decorators on a node. */
export function drawDecorators(
  g: Graphics,
  nodeCenter: Position,
  nodeRadius: number,
  decorators: DecoratorConfig[]
): void {
  for (const decorator of decorators) {
    drawDecorator(g, nodeCenter, nodeRadius, decorator);
  }
}

/** Create a simple status dot decorator. */
export function createStatusDot(
  color: number,
  position: DecoratorPosition = 'top-right'
): DotDecorator {
  return {
    type: 'dot',
    position,
    color,
    size: 6,
    borderColor: 0xffffff,
    borderWidth: 1,
  };
}

/** Compute badge size based on count. */
function computeBadgeSize(count: number): number {
  if (count > 99) return 14;
  if (count > 9) return 12;
  return 10;
}

/** Create a count badge decorator. */
export function createCountBadge(
  count: number,
  position: DecoratorPosition = 'top-right',
  color = 0xff4444
): BadgeDecorator {
  return {
    type: 'badge',
    position,
    color,
    size: computeBadgeSize(count),
    text: count > 99 ? '99+' : String(count),
    textColor: 0xffffff,
    borderColor: 0xffffff,
    borderWidth: 1,
  };
}

/** Create a selection ring decorator. */
export function createSelectionRing(color = 0x4a90d9): RingDecorator {
  return {
    type: 'ring',
    color,
    width: 2,
    offset: 3,
  };
}

/** Create a hover ring decorator. */
export function createHoverRing(color = 0x666666): RingDecorator {
  return {
    type: 'ring',
    color,
    width: 1,
    offset: 2,
  };
}
