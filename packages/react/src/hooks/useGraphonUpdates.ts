import { useEffect } from 'react';
import type { Edge, Node, NodeStyleFn, PhysicsSimulation, PositionMap } from '@graphon/core';
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

interface UpdateOptions<N> {
  width: number;
  height: number;
  communityFn: ((node: { id: string; data: N }) => number) | undefined;
  nodeStyleFn: NodeStyleFn<N> | undefined;
}

export function useGraphonUpdates<N, E>(
  refs: GraphonRefs<N, E>,
  nodes: Node<N>[],
  edges: Edge<E>[],
  options: UpdateOptions<N>
): void {
  const { width, height, communityFn, nodeStyleFn } = options;

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

    // Handle both sync and async initialize
    const handlePositions = (positions: PositionMap): void => {
      renderer.render(nodes, edges, positions, {
        ...(nodeStyleFn && { nodeStyleFn }),
      });
    };

    if (initResult instanceof Promise) {
      void initResult.then(handlePositions);
    } else {
      handlePositions(initResult);
    }
  }, [nodes, edges, communityFn, nodeStyleFn, refs]);

  useEffect(() => {
    const physics = refs.physics.current;
    const renderer = refs.renderer.current;
    if (!physics || !renderer) return;

    void physics.resize(width, height);
    renderer.resize(width, height);
  }, [width, height, refs]);
}
