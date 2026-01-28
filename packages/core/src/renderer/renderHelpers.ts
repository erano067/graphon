import type { Graphics } from 'pixi.js';
import type { Node, Position } from '../model/types';
import type { NodeStyle } from './types';

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

/** Groups nodes by their color for batched rendering. */
export function groupNodesByColor<N>(
  nodes: Node<N>[],
  positions: Map<string, Position>,
  colorFn: ((node: { id: string; data: N }) => number) | undefined,
  defaultColor: number
): Map<number, Position[]> {
  const colorGroups = new Map<number, Position[]>();

  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;

    const color = colorFn ? colorFn(node) : defaultColor;
    let group = colorGroups.get(color);
    if (!group) {
      group = [];
      colorGroups.set(color, group);
    }
    group.push(pos);
  }
  return colorGroups;
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
