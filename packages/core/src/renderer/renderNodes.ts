import type { Graphics } from 'pixi.js';
import type { Node, Position } from '../model/types';
import type { NodeStyle, RenderOptions, ResolvedNodeVisuals } from './types';
import { DEFAULT_NODE_VISUALS } from './shapes';
import { drawStyledNodeGroup, groupNodesByStyle, parseStyleKey } from './renderHelpers';

interface RenderNodesParams<N> {
  graphics: Graphics;
  nodes: Node<N>[];
  positions: Map<string, Position>;
  nodeStyle: NodeStyle;
  largeGraphThreshold: number;
  options?: RenderOptions<N>;
}

export function renderNodes<N>(params: RenderNodesParams<N>): void {
  const { graphics, nodes, positions, nodeStyle, largeGraphThreshold, options } = params;

  graphics.clear();
  if (nodes.length === 0) return;

  const isLarge = nodes.length > largeGraphThreshold;
  const radius = isLarge ? Math.max(2, nodeStyle.radius * 0.6) : nodeStyle.radius;
  const defaults: ResolvedNodeVisuals = { ...DEFAULT_NODE_VISUALS, color: nodeStyle.fill };

  const styleGroups = groupNodesByStyle(nodes, positions, options?.nodeStyleFn, defaults);

  for (const [key, nodePositions] of styleGroups) {
    const { shape, color } = parseStyleKey(key);
    drawStyledNodeGroup({
      graphics,
      positions: nodePositions,
      radius,
      color,
      shape,
      isSimplified: isLarge,
      style: nodeStyle,
    });
  }
}
