import { useCallback, useMemo, useRef, useState } from 'react';
import type { Edge, Node } from '@graphon/react';
import type { EdgeData, NodeData } from '../generator';

/** Marker for cluster super-nodes. */
export interface ClusterNodeData {
  __isCluster: true;
  community: number;
  childCount: number;
  childIds: string[];
}

export type ClusterableNodeData = NodeData | ClusterNodeData;

export function isClusterNode(data: ClusterableNodeData): data is ClusterNodeData {
  return '__isCluster' in data && data.__isCluster;
}

interface ClusterPosition {
  x: number;
  y: number;
  radius: number;
}

interface ClusteringState {
  expandedClusters: Set<number>;
  clusterPositions: Map<number, ClusterPosition>;
}

interface ClusteringResult {
  nodesToRender: Node<ClusterableNodeData>[];
  edgesToRender: Edge<EdgeData>[];
  expandedClusters: Set<number>;
  clusterPositions: Map<number, ClusterPosition>;
  handleNodeClick: (node: Node<ClusterableNodeData>) => void;
  handleClusterCircleClick: (community: number) => void;
  updatePositions: (positions: Map<string, { x: number; y: number }>) => void;
}

const DOUBLE_CLICK_THRESHOLD_MS = 300;

/** Group nodes by community. */
function groupByCommunity(nodes: Node<NodeData>[]): Map<number, Node<NodeData>[]> {
  const groups = new Map<number, Node<NodeData>[]>();
  for (const node of nodes) {
    const { community } = node.data;
    const group = groups.get(community) ?? [];
    group.push(node);
    groups.set(community, group);
  }
  return groups;
}

/** Create a cluster super-node for a community. */
function createClusterNode(community: number, members: Node<NodeData>[]): Node<ClusterNodeData> {
  return {
    id: `__cluster_${community}`,
    data: {
      __isCluster: true,
      community,
      childCount: members.length,
      childIds: members.map((n) => n.id),
    },
  };
}

/** Compute center and radius of a cluster from member positions. */
function computeClusterBounds(
  memberIds: string[],
  positions: Map<string, { x: number; y: number }>
): ClusterPosition | undefined {
  const memberPositions = memberIds
    .map((id) => positions.get(id))
    .filter((p): p is { x: number; y: number } => p !== undefined);

  if (memberPositions.length === 0) return undefined;

  const sumX = memberPositions.reduce((acc, p) => acc + p.x, 0);
  const sumY = memberPositions.reduce((acc, p) => acc + p.y, 0);
  const centerX = sumX / memberPositions.length;
  const centerY = sumY / memberPositions.length;

  const maxDist = memberPositions.reduce((max, p) => {
    const dist = Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2);
    return Math.max(max, dist);
  }, 0);

  return { x: centerX, y: centerY, radius: maxDist + 40 };
}

function toggleClusterInSet(set: Set<number>, community: number): Set<number> {
  const next = new Set(set);
  if (next.has(community)) {
    next.delete(community);
  } else {
    next.add(community);
  }
  return next;
}

function computeClusterPositionsForExpanded(
  communityGroups: Map<number, Node<NodeData>[]>,
  expandedClusters: Set<number>,
  positions: Map<string, { x: number; y: number }>
): Map<number, ClusterPosition> {
  const result = new Map<number, ClusterPosition>();
  for (const [community, members] of communityGroups) {
    if (!expandedClusters.has(community)) continue;
    const bounds = computeClusterBounds(
      members.map((n) => n.id),
      positions
    );
    if (bounds) result.set(community, bounds);
  }
  return result;
}

function computeNodesToRender(
  communityGroups: Map<number, Node<NodeData>[]>,
  expandedClusters: Set<number>
): { nodes: Node<ClusterableNodeData>[]; visibleIds: Set<string> } {
  const nodes: Node<ClusterableNodeData>[] = [];
  const visibleIds = new Set<string>();

  for (const [community, members] of communityGroups) {
    if (expandedClusters.has(community)) {
      for (const node of members) {
        nodes.push(node);
        visibleIds.add(node.id);
      }
    } else {
      nodes.push(createClusterNode(community, members));
    }
  }
  return { nodes, visibleIds };
}

export function useClustering(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[],
  isEnabled: boolean
): ClusteringResult {
  const [state, setState] = useState<ClusteringState>({
    expandedClusters: new Set(),
    clusterPositions: new Map(),
  });
  const lastClickRef = useRef<{ nodeId: string; time: number } | null>(null);
  const communityGroups = useMemo(() => groupByCommunity(nodes), [nodes]);

  const toggleCluster = useCallback((community: number): void => {
    setState((prev) => ({
      ...prev,
      expandedClusters: toggleClusterInSet(prev.expandedClusters, community),
    }));
  }, []);

  const handleNodeClick = useCallback(
    (node: Node<ClusterableNodeData>): void => {
      const now = Date.now();
      const last = lastClickRef.current;
      if (last?.nodeId === node.id && now - last.time < DOUBLE_CLICK_THRESHOLD_MS) {
        lastClickRef.current = null;
        if (isClusterNode(node.data)) toggleCluster(node.data.community);
        return;
      }
      lastClickRef.current = { nodeId: node.id, time: now };
    },
    [toggleCluster]
  );

  const updatePositions = useCallback(
    (positions: Map<string, { x: number; y: number }>): void => {
      const newPositions = computeClusterPositionsForExpanded(
        communityGroups,
        state.expandedClusters,
        positions
      );
      if (newPositions.size > 0) setState((prev) => ({ ...prev, clusterPositions: newPositions }));
    },
    [communityGroups, state.expandedClusters]
  );

  const { nodesToRender, edgesToRender } = useMemo(() => {
    if (!isEnabled) {
      return { nodesToRender: nodes as Node<ClusterableNodeData>[], edgesToRender: edges };
    }
    const { nodes: renderNodes, visibleIds } = computeNodesToRender(
      communityGroups,
      state.expandedClusters
    );
    const renderEdges = edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
    return { nodesToRender: renderNodes, edgesToRender: renderEdges };
  }, [isEnabled, nodes, edges, communityGroups, state.expandedClusters]);

  return {
    nodesToRender,
    edgesToRender,
    expandedClusters: state.expandedClusters,
    clusterPositions: state.clusterPositions,
    handleNodeClick,
    handleClusterCircleClick: toggleCluster,
    updatePositions,
  };
}
