import type { Graphics } from 'pixi.js';
import type { Node, Position } from '../model/types';
import type { NodeStyle, NodeStyleFn, ResolvedNodeVisuals } from './types';
import { type ExtendedNodeShape, drawExtendedShape } from './shapes';

/** Default threshold above which we use simplified rendering for performance. */
export const DEFAULT_LARGE_GRAPH_THRESHOLD = 1000;

/**
 * Darkens a hex color by a factor.
 * @param color - Hex color as number (e.g., 0xff0000)
 * @param factor - Darkening factor (0-1, where 1 = black)
 * @returns Darkened hex color
 */
export function darkenColor(color: number, factor: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * (1 - factor));
  const g = Math.floor(((color >> 8) & 0xff) * (1 - factor));
  const b = Math.floor((color & 0xff) * (1 - factor));
  return (r << 16) | (g << 8) | b;
}

/** Key for grouping nodes by shape and color (legacy). */
export type StyleGroupKey = `${ExtendedNodeShape}:${number}`;

/** Key for grouping nodes by full visuals (shape, color, radius, alpha). */
export type VisualGroupKey = `${ExtendedNodeShape}:${number}:${number}:${number}`;

/** Creates a style group key from shape and color. */
function makeStyleKey(shape: ExtendedNodeShape, color: number): StyleGroupKey {
  return `${shape}:${color}`;
}

/** Creates a visual group key from shape, color, radius, and alpha. */
function makeVisualKey(
  shape: ExtendedNodeShape,
  color: number,
  radius: number,
  alpha: number
): VisualGroupKey {
  // Round radius and alpha to reduce unique keys
  const r = Math.round(radius * 10) / 10;
  const a = Math.round(alpha * 100) / 100;
  return `${shape}:${color}:${r}:${a}`;
}

/** Parses a style group key back to shape and color. */
export function parseStyleKey(key: StyleGroupKey): { shape: ExtendedNodeShape; color: number } {
  const [shape, colorStr] = key.split(':') as [ExtendedNodeShape, string];
  return { shape, color: parseInt(colorStr, 10) };
}

/** Groups nodes by their visual style (shape + color) for batched rendering. */
export function groupNodesByStyle<N>(
  nodes: Node<N>[],
  positions: Map<string, Position>,
  styleFn: NodeStyleFn<N> | undefined,
  defaults: ResolvedNodeVisuals
): Map<StyleGroupKey, Position[]> {
  const styleGroups = new Map<StyleGroupKey, Position[]>();

  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;

    const nodeStyle = styleFn ? styleFn(node) : {};
    const shape = nodeStyle.shape ?? defaults.shape;
    const color = nodeStyle.color ?? defaults.color;
    const key = makeStyleKey(shape, color);

    let group = styleGroups.get(key);
    if (!group) {
      group = [];
      styleGroups.set(key, group);
    }
    group.push(pos);
  }
  return styleGroups;
}

interface VisualGroup {
  positions: Position[];
}

/** Alpha modifier function that computes effective alpha for a node. */
type AlphaModifier = (nodeId: string, baseAlpha: number) => number;

interface GroupNodesByVisualsParams<N> {
  nodes: Node<N>[];
  positions: Map<string, Position>;
  styleFn: NodeStyleFn<N> | undefined;
  defaults: ResolvedNodeVisuals;
  alphaModifier?: AlphaModifier;
}

interface ResolvedNodeGroupVisuals {
  shape: ExtendedNodeShape;
  color: number;
  radius: number;
  alpha: number;
  isVisible: boolean;
}

/** Resolves node visuals by merging style function output with defaults. */
function resolveNodeVisuals<N>(
  node: Node<N>,
  styleFn: NodeStyleFn<N> | undefined,
  defaults: ResolvedNodeVisuals,
  alphaModifier: AlphaModifier | undefined
): ResolvedNodeGroupVisuals {
  const nodeStyle = styleFn ? styleFn(node) : {};
  const baseAlpha = nodeStyle.alpha ?? defaults.alpha ?? 1;

  return {
    shape: nodeStyle.shape ?? defaults.shape,
    color: nodeStyle.color ?? defaults.color,
    radius: nodeStyle.radius ?? defaults.radius,
    alpha: alphaModifier ? alphaModifier(node.id, baseAlpha) : baseAlpha,
    isVisible: nodeStyle.visible ?? defaults.visible ?? true,
  };
}

/** Adds a position to the appropriate visual group, creating it if needed. */
function addToVisualGroup(
  groups: Map<VisualGroupKey, VisualGroup>,
  key: VisualGroupKey,
  pos: Position
): void {
  let group = groups.get(key);
  if (!group) {
    group = { positions: [] };
    groups.set(key, group);
  }
  group.positions.push(pos);
}

/** Groups nodes by full visual properties (shape, color, radius, alpha) for batched rendering. */
export function groupNodesByVisuals<N>(
  params: GroupNodesByVisualsParams<N>
): Map<VisualGroupKey, VisualGroup> {
  const { nodes, positions, styleFn, defaults, alphaModifier } = params;
  const visualGroups = new Map<VisualGroupKey, VisualGroup>();

  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;

    const visuals = resolveNodeVisuals(node, styleFn, defaults, alphaModifier);
    if (!visuals.isVisible) continue;

    const key = makeVisualKey(visuals.shape, visuals.color, visuals.radius, visuals.alpha);
    addToVisualGroup(visualGroups, key, pos);
  }
  return visualGroups;
}

interface DrawNodeGroupOptions {
  graphics: Graphics;
  positions: Position[];
  radius: number;
  color: number;
  isSimplified: boolean;
  style: NodeStyle;
}

/**
 * Draws a group of nodes with the same color in a single batched operation.
 *
 * Note: PixiJS Graphics.fill() consumes the current path, so we must
 * re-draw circles before stroking. This is a known PixiJS behavior.
 */
export function drawNodeGroup(options: DrawNodeGroupOptions): void {
  const { graphics: g, positions, radius, color, isSimplified, style } = options;

  for (const pos of positions) {
    g.circle(pos.x, pos.y, radius);
  }
  g.fill({ color, alpha: style.fillAlpha });

  if (isSimplified) return;

  // Re-draw circles for stroke (PixiJS consumes path on fill)
  for (const pos of positions) {
    g.circle(pos.x, pos.y, radius);
  }
  g.stroke({
    width: style.strokeWidth,
    color: darkenColor(color, 0.3),
    alpha: style.strokeAlpha,
  });
}

interface DrawStyledNodeGroupOptions {
  graphics: Graphics;
  positions: Position[];
  radius: number;
  color: number;
  shape: ExtendedNodeShape;
  isSimplified: boolean;
  style: NodeStyle;
}

/**
 * Draws a group of nodes with the same shape and color in a single batched operation.
 */
export function drawStyledNodeGroup(options: DrawStyledNodeGroupOptions): void {
  const { graphics: g, positions, radius, color, shape, isSimplified, style } = options;

  drawExtendedShape(g, { positions, radius, shape });
  g.fill({ color, alpha: style.fillAlpha });

  if (isSimplified) return;

  // Re-draw shapes for stroke (PixiJS consumes path on fill)
  drawExtendedShape(g, { positions, radius, shape });
  g.stroke({
    width: style.strokeWidth,
    color: darkenColor(color, 0.3),
    alpha: style.strokeAlpha,
  });
}
