/**
 * Node gradient support.
 *
 * Provides gradient definitions and color interpolation for nodes.
 * PixiJS v8 doesn't have native gradient support in Graphics,
 * so we implement gradients by computing interpolated colors.
 */

import type { Position } from '../model/types';

/** Direction for linear gradients. */
export type GradientDirection =
  | 'to-bottom'
  | 'to-top'
  | 'to-right'
  | 'to-left'
  | 'to-bottom-right'
  | 'to-bottom-left'
  | 'to-top-right'
  | 'to-top-left';

/** Color stop in a gradient. */
export interface ColorStop {
  /** Position in gradient (0-1). */
  offset: number;
  /** Color as hex number. */
  color: number;
}

/** Linear gradient configuration. */
export interface LinearGradient {
  type: 'linear';
  direction: GradientDirection;
  stops: ColorStop[];
}

/** Radial gradient configuration. */
export interface RadialGradient {
  type: 'radial';
  /** Position of center (0-1, 0-1), default (0.5, 0.5). */
  center?: { x: number; y: number };
  stops: ColorStop[];
}

/** Gradient configuration. */
export type GradientConfig = LinearGradient | RadialGradient;

/** Default gradient stops for a two-color gradient. */
export function createTwoColorGradient(
  startColor: number,
  endColor: number,
  type: 'linear' | 'radial' = 'linear',
  direction: GradientDirection = 'to-bottom'
): GradientConfig {
  const stops: ColorStop[] = [
    { offset: 0, color: startColor },
    { offset: 1, color: endColor },
  ];

  if (type === 'radial') {
    return { type: 'radial', stops };
  }
  return { type: 'linear', direction, stops };
}

/** Extract RGB components from hex color. */
function hexToRgb(color: number): { r: number; g: number; b: number } {
  return {
    r: (color >> 16) & 0xff,
    g: (color >> 8) & 0xff,
    b: color & 0xff,
  };
}

/** Combine RGB to hex color. */
function rgbToHex(r: number, g: number, b: number): number {
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}

/** Interpolate between two colors. */
export function interpolateColor(color1: number, color2: number, t: number): number {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = c1.r + (c2.r - c1.r) * t;
  const g = c1.g + (c2.g - c1.g) * t;
  const b = c1.b + (c2.b - c1.b) * t;

  return rgbToHex(r, g, b);
}

/** Get color at a position in a gradient. */
export function getGradientColorAtOffset(stops: ColorStop[], offset: number): number {
  const [first] = stops;
  if (!first) return 0x000000;

  const last = stops[stops.length - 1];
  if (!last || stops.length === 1) return first.color;

  // Clamp offset to 0-1
  const t = Math.max(0, Math.min(1, offset));

  // Find surrounding stops
  const bounds = findGradientBounds(stops, t, first, last);

  // Interpolate between stops
  const range = bounds.upper.offset - bounds.lower.offset;
  if (range === 0) return bounds.lower.color;

  const localT = (t - bounds.lower.offset) / range;
  return interpolateColor(bounds.lower.color, bounds.upper.color, localT);
}

/** Find lower and upper bounds for gradient interpolation. */
function findGradientBounds(
  stops: ColorStop[],
  t: number,
  defaultLower: ColorStop,
  defaultUpper: ColorStop
): { lower: ColorStop; upper: ColorStop } {
  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i];
    const next = stops[i + 1];
    if (current && next && t >= current.offset && t <= next.offset) {
      return { lower: current, upper: next };
    }
  }
  return { lower: defaultLower, upper: defaultUpper };
}

/** Compute direction vector from gradient direction. */
function directionToVector(direction: GradientDirection): { x: number; y: number } {
  switch (direction) {
    case 'to-bottom':
      return { x: 0, y: 1 };
    case 'to-top':
      return { x: 0, y: -1 };
    case 'to-right':
      return { x: 1, y: 0 };
    case 'to-left':
      return { x: -1, y: 0 };
    case 'to-bottom-right':
      return { x: 0.707, y: 0.707 };
    case 'to-bottom-left':
      return { x: -0.707, y: 0.707 };
    case 'to-top-right':
      return { x: 0.707, y: -0.707 };
    case 'to-top-left':
      return { x: -0.707, y: -0.707 };
  }
}

/** Compute offset for linear gradient at a point within a node. */
export function computeLinearGradientOffset(
  point: Position,
  center: Position,
  radius: number,
  direction: GradientDirection
): number {
  const dir = directionToVector(direction);
  const dx = (point.x - center.x) / radius;
  const dy = (point.y - center.y) / radius;

  // Project point onto direction vector
  const projection = dx * dir.x + dy * dir.y;

  // Map from [-1, 1] to [0, 1]
  return (projection + 1) / 2;
}

/** Compute offset for radial gradient at a point within a node. */
export function computeRadialGradientOffset(
  point: Position,
  center: Position,
  radius: number,
  gradientCenter: { x: number; y: number } = { x: 0.5, y: 0.5 }
): number {
  // Convert gradient center from 0-1 to actual position
  const gcx = center.x + (gradientCenter.x - 0.5) * radius * 2;
  const gcy = center.y + (gradientCenter.y - 0.5) * radius * 2;

  const dx = point.x - gcx;
  const dy = point.y - gcy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return Math.min(1, dist / radius);
}

/** Sample gradient color for a node position. */
export function sampleGradientColor(
  gradient: GradientConfig,
  point: Position,
  center: Position,
  radius: number
): number {
  let offset: number;

  if (gradient.type === 'linear') {
    offset = computeLinearGradientOffset(point, center, radius, gradient.direction);
  } else {
    offset = computeRadialGradientOffset(point, center, radius, gradient.center);
  }

  return getGradientColorAtOffset(gradient.stops, offset);
}

/** Compute primary color for a gradient (used for solid fallback). */
export function getPrimaryGradientColor(gradient: GradientConfig): number {
  if (gradient.stops.length === 0) return 0x000000;

  // For radial, use center color (offset 0)
  if (gradient.type === 'radial') {
    return gradient.stops[0]?.color ?? 0x000000;
  }

  // For linear, use middle color
  return getGradientColorAtOffset(gradient.stops, 0.5);
}

/** Check if color stops are equal. */
function stopsEqual(a: ColorStop[], b: ColorStop[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((stop, i) => {
    const other = b[i];
    return stop.offset === other?.offset && stop.color === other.color;
  });
}

/** Check if two gradients are equivalent. */
export function gradientsEqual(
  a: GradientConfig | undefined,
  b: GradientConfig | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === 'linear' && b.type === 'linear' && a.direction !== b.direction) return false;
  return stopsEqual(a.stops, b.stops);
}
