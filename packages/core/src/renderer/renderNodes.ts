import type { Graphics } from 'pixi.js';
import type { Node, Position } from '../model/types';
import type { HighlightState, NodeStyle, RenderOptions, ResolvedNodeVisuals } from './types';
import { DEFAULT_NODE_VISUALS, type ExtendedNodeShape } from './shapes';
import { type VisualGroupKey, drawStyledNodeGroup, groupNodesByVisuals } from './renderHelpers';

interface RenderNodesParams<N, E> {
  graphics: Graphics;
  nodes: Node<N>[];
  positions: Map<string, Position>;
  nodeStyle: NodeStyle;
  largeGraphThreshold: number;
  options?: RenderOptions<N, E>;
}

interface EffectiveAlphaParams {
  nodeId: string;
  baseAlpha: number;
  highlightState: HighlightState | undefined;
  adjacency: Map<string, Set<string>> | undefined;
}

/** Checks if node is a neighbor of any highlighted node. */
function isNeighborOfHighlighted(
  nodeId: string,
  highlightState: HighlightState,
  adjacency: Map<string, Set<string>>
): boolean {
  const { hoveredNodeId, selectedNodeIds } = highlightState;
  if (hoveredNodeId !== undefined && adjacency.get(hoveredNodeId)?.has(nodeId)) return true;
  for (const selectedId of selectedNodeIds) {
    if (adjacency.get(selectedId)?.has(nodeId)) return true;
  }
  return false;
}

/** Computes the effective alpha for a node based on highlight state. */
function getEffectiveAlpha(params: EffectiveAlphaParams): number {
  const { nodeId, baseAlpha, highlightState, adjacency } = params;
  if (!highlightState) return baseAlpha;

  const { hoveredNodeId, selectedNodeIds, shouldHighlightNeighbors, dimOpacity } = highlightState;
  const hasHighlight = hoveredNodeId !== undefined || selectedNodeIds.size > 0;
  if (!hasHighlight) return baseAlpha;

  // Check if this node is highlighted
  const isHovered = nodeId === hoveredNodeId;
  const isSelected = selectedNodeIds.has(nodeId);
  if (isHovered || isSelected) return baseAlpha;

  // Check if this node is a neighbor of a highlighted node
  if (
    shouldHighlightNeighbors &&
    adjacency &&
    isNeighborOfHighlighted(nodeId, highlightState, adjacency)
  ) {
    return baseAlpha;
  }

  // Dim non-highlighted nodes
  return baseAlpha * dimOpacity;
}

export function renderNodes<N, E>(params: RenderNodesParams<N, E>): void {
  const { graphics, nodes, positions, nodeStyle, largeGraphThreshold, options } = params;

  graphics.clear();
  if (nodes.length === 0) return;

  const isLarge = nodes.length > largeGraphThreshold;
  const defaultRadius = isLarge ? Math.max(2, nodeStyle.radius * 0.6) : nodeStyle.radius;
  const defaults: ResolvedNodeVisuals = {
    ...DEFAULT_NODE_VISUALS,
    color: nodeStyle.fill,
    radius: defaultRadius,
  };

  const { highlightState, adjacency } = options ?? {};

  // Group nodes by full visual key (shape, color, radius, alpha)
  const styleGroups = groupNodesByVisuals({
    nodes,
    positions,
    styleFn: options?.nodeStyleFn,
    defaults,
    alphaModifier: (nodeId, baseAlpha) =>
      getEffectiveAlpha({ nodeId, baseAlpha, highlightState, adjacency }),
  });

  for (const [key, group] of styleGroups) {
    const { shape, color, radius, alpha } = parseVisualKey(key);
    drawStyledNodeGroup({
      graphics,
      positions: group.positions,
      radius,
      color,
      shape,
      isSimplified: isLarge,
      style: { ...nodeStyle, fillAlpha: alpha },
    });
  }
}

/** Parses a visual group key back to its components. */
function parseVisualKey(key: VisualGroupKey): {
  shape: ExtendedNodeShape;
  color: number;
  radius: number;
  alpha: number;
} {
  const parts = key.split(':') as [ExtendedNodeShape, string, string, string];
  return {
    shape: parts[0],
    color: parseInt(parts[1], 10),
    radius: parseFloat(parts[2]),
    alpha: parseFloat(parts[3]),
  };
}
