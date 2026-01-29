import { useCallback, useMemo, useState } from 'react';
import type { Edge, Node } from '@graphon/react';
import type { EdgeData, NodeData } from '../generator';
import {
  type ClusterPosition,
  type ClusterableNodeData,
  computeClusterPositionsForExpanded,
  computeEdgesToRender,
  computeNodesToRender,
  groupByCommunity,
  isClusterNode,
  toggleClusterInSet,
} from './clusteringUtils';

export { type ClusterableNodeData, type ClusterNodeData, isClusterNode } from './clusteringUtils';

interface ClusteringState {
  expandedClusters: Set<number>;
  clusterPositions: Map<number, ClusterPosition>;
  nodePositions: Map<string, { x: number; y: number }>;
}

interface ClusteringResult {
  nodesToRender: Node<ClusterableNodeData>[];
  edgesToRender: Edge<EdgeData>[];
  expandedClusters: Set<number>;
  clusterPositions: Map<number, ClusterPosition>;
  handleNodeDoubleClick: (node: Node<ClusterableNodeData>) => void;
  handleClusterCircleClick: (community: number) => void;
  updatePositions: (positions: Map<string, { x: number; y: number }>) => void;
}

export function useClustering(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  isEnabled: boolean
): ClusteringResult {
  const [state, setState] = useState<ClusteringState>({
    expandedClusters: new Set(),
    clusterPositions: new Map(),
    nodePositions: new Map(),
  });
  const communityGroups = useMemo(() => groupByCommunity(nodes), [nodes]);

  const toggleCluster = useCallback((community: number): void => {
    setState((prev) => ({
      ...prev,
      expandedClusters: toggleClusterInSet(prev.expandedClusters, community),
    }));
  }, []);

  const handleNodeDoubleClick = useCallback(
    (node: Node<ClusterableNodeData>): void => {
      const community = isClusterNode(node.data) ? node.data.community : node.data.community;
      toggleCluster(community);
    },
    [toggleCluster]
  );

  const updatePositions = useCallback(
    (positions: Map<string, { x: number; y: number }>): void => {
      const clusterPos = computeClusterPositionsForExpanded(
        communityGroups,
        state.expandedClusters,
        positions
      );
      setState((prev) => ({
        ...prev,
        nodePositions: new Map([...prev.nodePositions, ...positions]),
        clusterPositions: clusterPos.size > 0 ? clusterPos : prev.clusterPositions,
      }));
    },
    [communityGroups, state.expandedClusters]
  );

  const { nodesToRender, edgesToRender } = useMemo(() => {
    if (!isEnabled) {
      return { nodesToRender: nodes as Node<ClusterableNodeData>[], edgesToRender: edges };
    }
    const {
      nodes: renderNodes,
      nodeIdToCommunity,
      collapsedCommunities,
    } = computeNodesToRender(communityGroups, state.expandedClusters, state.nodePositions);
    const renderEdges = computeEdgesToRender(edges, nodeIdToCommunity, collapsedCommunities);
    return { nodesToRender: renderNodes, edgesToRender: renderEdges };
  }, [isEnabled, nodes, edges, communityGroups, state.expandedClusters, state.nodePositions]);

  return {
    nodesToRender,
    edgesToRender,
    expandedClusters: state.expandedClusters,
    clusterPositions: state.clusterPositions,
    handleNodeDoubleClick,
    handleClusterCircleClick: toggleCluster,
    updatePositions,
  };
}
