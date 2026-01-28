import { useEffect } from 'react';
import type { Edge, Node, NodeColorFn } from '@graphon/core';
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
  nodeColorFn: NodeColorFn<N> | undefined;
}

export function useGraphonUpdates<N, E>(
  refs: GraphonRefs<N, E>,
  nodes: Node<N>[],
  edges: Edge<E>[],
  options: UpdateOptions<N>
): void {
  const { width, height, communityFn, nodeColorFn } = options;

  useEffect(() => {
    const physics = refs.physics.current;
    const renderer = refs.renderer.current;
    if (!physics || !renderer) return;

    const newKey = computeGraphKey(nodes, edges);
    if (newKey === refs.graphKey.current) return;

    refs.graphKey.current = newKey;
    if (communityFn) physics.setCommunityGetter(communityFn);

    const positions = physics.initialize(nodes, edges);
    renderer.render(nodes, edges, positions, { nodeColorFn });
  }, [nodes, edges, communityFn, nodeColorFn, refs]);

  useEffect(() => {
    const physics = refs.physics.current;
    const renderer = refs.renderer.current;
    if (!physics || !renderer) return;

    physics.resize(width, height);
    renderer.resize(width, height);
  }, [width, height, refs]);
}
