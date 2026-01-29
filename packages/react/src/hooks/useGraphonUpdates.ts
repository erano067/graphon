import { useEffect } from 'react';
import type {
  Edge,
  EdgeStyleFn,
  Node,
  NodeStyleFn,
  PhysicsSimulation,
  PositionMap,
} from '@graphon/core';
import type { GraphonRefs } from './useGraphonRefs';

function computeGraphKey(nodes: { id: string }[], edges: { id: string }[]): string {
  const nodeIds = nodes
    .map((n) => n.id)
    .sort()
    .join(',');
  const edgeIds = edges
    .map((e) => e.id)
    .sort()
    .join(',');
  return `${nodeIds}:${edgeIds}`;
}

interface UpdateOptions<N, E> {
  width: number;
  height: number;
  communityFn: ((node: { id: string; data: N }) => number) | undefined;
  nodeStyleFn: NodeStyleFn<N> | undefined;
  edgeStyleFn: EdgeStyleFn<E> | undefined;
}

export function useGraphonUpdates<N, E>(
  refs: GraphonRefs<N, E>,
  nodes: Node<N>[],
  edges: Edge<E>[],
  options: UpdateOptions<N, E>
): void {
  const { width, height, communityFn, nodeStyleFn, edgeStyleFn } = options;

  useEffect(() => {
    const physics = refs.physics.current;
    const renderer = refs.renderer.current;
    if (!physics || !renderer) return;

    const newKey = computeGraphKey(nodes, edges);
    if (newKey === refs.graphKey.current) return;

    refs.graphKey.current = newKey;

    // setCommunityGetter only exists on main-thread PhysicsSimulation
    if (communityFn && 'setCommunityGetter' in physics) {
      (physics as PhysicsSimulation<N, E>).setCommunityGetter(communityFn);
    }

    const initResult = physics.initialize(nodes, edges);
    const { highlightNeighbors: shouldHighlightNeighbors, dimOpacity } =
      refs.highlightOptions.current;

    // Handle both sync and async initialize
    const handlePositions = (positions: PositionMap): void => {
      const hoveredNodeId = refs.hoveredNode.current;
      renderer.render(nodes, edges, positions, {
        ...(nodeStyleFn && { nodeStyleFn }),
        ...(edgeStyleFn && { edgeStyleFn }),
        highlightState: {
          ...(hoveredNodeId !== undefined && { hoveredNodeId }),
          selectedNodeIds: refs.selectedNodes.current,
          shouldHighlightNeighbors,
          dimOpacity,
        },
        adjacency: refs.adjacency.current,
      });
    };

    if (initResult instanceof Promise) {
      void initResult.then(handlePositions);
    } else {
      handlePositions(initResult);
    }
  }, [nodes, edges, communityFn, nodeStyleFn, edgeStyleFn, refs]);

  useEffect(() => {
    const physics = refs.physics.current;
    const renderer = refs.renderer.current;
    if (!physics || !renderer) return;

    void physics.resize(width, height);
    renderer.resize(width, height);
  }, [width, height, refs]);
}
