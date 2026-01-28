import type { Edge, Node } from '@graphon/react';
import { DEFAULT_OPTIONS, type EdgeData, type GeneratorOptions, type NodeData } from './types';
import { addEdge, createNodeStates, groupByCommunity, makeEdgeKey } from './utils';
import { assignCommunities } from './communities';
import { closeTriangles, pickSourceNode, pickTargetNode, seedInitialConnections } from './edges';

export type { GeneratorOptions, NodeData, EdgeData };

export function generateLatentSpaceNetwork(options: Partial<GeneratorOptions> = {}): {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { nodeCount, communityCount, avgDegree, intraCommunityBias, triangleClosureRate } = opts;

  const communities = assignCommunities(nodeCount, communityCount);
  const nodeStates = createNodeStates(nodeCount, communities);
  const communityMembers = groupByCommunity(nodeStates, communityCount);

  const edges: Edge<EdgeData>[] = [];
  const edgeSet = new Set<string>();

  seedInitialConnections(nodeStates, communityMembers, edges, edgeSet);

  const targetEdges = Math.floor((nodeCount * avgDegree) / 2);
  const maxIterations = targetEdges * 10;

  for (let i = 0; i < maxIterations && edges.length < targetEdges; i++) {
    const source = pickSourceNode(nodeStates);
    const target = pickTargetNode(source, nodeStates, communityMembers, intraCommunityBias);

    if (target && !edgeSet.has(makeEdgeKey(source.index, target.index))) {
      addEdge(source, target, edges, edgeSet);
    }

    if (i % 5 === 0) {
      closeTriangles(nodeStates, edges, edgeSet, triangleClosureRate);
    }
  }

  for (let i = 0; i < 3; i++) {
    closeTriangles(nodeStates, edges, edgeSet, triangleClosureRate);
  }

  const nodes = nodeStates.map((state) => ({
    id: state.id,
    data: { label: `User ${state.index}`, community: state.community },
  }));

  return { nodes, edges };
}
