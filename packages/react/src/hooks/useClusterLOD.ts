import { useCallback, useMemo, useRef, useState } from 'react';
import {
  type ClusterHierarchy,
  type Node,
  type PositionMap,
  buildClustersFromCommunity,
  createGraphModel,
} from '@graphon/core';

/** Configuration for cluster-based LOD. */
export interface ClusterLODConfig {
  /** Zoom level below which clusters are shown (default: 0.5) */
  clusterZoomThreshold: number;
  /** Minimum nodes to form a cluster (smaller communities show individual nodes) */
  minClusterSize: number;
}

const DEFAULT_CONFIG: ClusterLODConfig = {
  clusterZoomThreshold: 0.5,
  minClusterSize: 3,
};

/** Result from useClusterLOD hook. */
export interface ClusterLODResult<N> {
  /** Whether currently showing clusters (true) or individual nodes (false) */
  isClusterView: boolean;
  /** Nodes to render (either original nodes or cluster nodes) */
  nodesToRender: Node<N>[];
  /** Set of expanded cluster IDs (manually expanded even when zoomed out) */
  expandedClusters: Set<string>;
  /** Expand a cluster to show its children */
  expandCluster: (clusterId: string) => void;
  /** Collapse children back into a cluster */
  collapseCluster: (clusterId: string) => void;
  /** Update zoom and get cluster view state */
  updateZoom: (zoom: number) => void;
  /** Build cluster hierarchy from current positions */
  buildHierarchy: (positions: PositionMap) => void;
  /** Get cluster node IDs for a given cluster */
  getClusterChildren: (clusterId: string) => string[];
  /** Get which cluster a node belongs to */
  getNodeCluster: (nodeId: string) => string | undefined;
}

/** Build community map from nodes. */
function buildCommunityMap<N>(
  nodes: Node<N>[],
  communityFn: (node: Node<N>) => number | string
): Map<string, Node<N>[]> {
  const map = new Map<string, Node<N>[]>();
  for (const node of nodes) {
    const community = String(communityFn(node));
    let communityNodes = map.get(community);
    if (!communityNodes) {
      communityNodes = [];
      map.set(community, communityNodes);
    }
    communityNodes.push(node);
  }
  return map;
}

/** Add individual nodes from a community to the result. */
function addExpandedNodes<N>(
  communityNodes: Node<N>[],
  result: Node<N>[],
  renderedNodeIds: Set<string>
): void {
  for (const node of communityNodes) {
    if (!renderedNodeIds.has(node.id)) {
      result.push(node);
      renderedNodeIds.add(node.id);
    }
  }
}

/** Create a cluster super-node for rendering. */
function createClusterSuperNode<N>(
  clusterId: string,
  childCount: number,
  positions: Map<string, { x: number; y: number }>
): Node<N> {
  const clusterPos = positions.get(clusterId);
  return {
    id: clusterId,
    data: { __isCluster: true, __childCount: childCount } as unknown as N,
    x: clusterPos?.x ?? 0,
    y: clusterPos?.y ?? 0,
  };
}

interface HierarchyRefs {
  hierarchyRef: React.RefObject<ClusterHierarchy | null>;
  positionsRef: React.RefObject<Map<string, { x: number; y: number }>>;
}

/** Build and store hierarchy from positions. */
function buildAndStoreHierarchy<N>(
  nodes: Node<N>[],
  communityFn: (node: Node<N>) => number | string,
  positions: PositionMap,
  refs: HierarchyRefs
): void {
  const model = createGraphModel<N>();
  for (const node of nodes) {
    model.addNode(node);
  }
  const hierarchy = buildClustersFromCommunity(model, communityFn, positions);
  refs.hierarchyRef.current = hierarchy;

  const newPositions = new Map<string, { x: number; y: number }>();
  for (const cluster of hierarchy.clusters.values()) {
    newPositions.set(cluster.id, { x: cluster.x, y: cluster.y });
  }
  refs.positionsRef.current = newPositions;
}

interface RenderNodesParams<N> {
  communityMap: Map<string, Node<N>[]>;
  expandedClusters: Set<string>;
  minClusterSize: number;
  positions: Map<string, { x: number; y: number }>;
}

/** Compute nodes to render based on cluster state. */
function computeNodesToRender<N>(params: RenderNodesParams<N>): Node<N>[] {
  const { communityMap, expandedClusters, minClusterSize, positions } = params;
  const result: Node<N>[] = [];
  const renderedNodeIds = new Set<string>();

  for (const [community, communityNodes] of communityMap) {
    const clusterId = `cluster_${community}`;
    const shouldExpand = expandedClusters.has(clusterId) || communityNodes.length < minClusterSize;

    if (shouldExpand) {
      addExpandedNodes(communityNodes, result, renderedNodeIds);
    } else {
      result.push(createClusterSuperNode<N>(clusterId, communityNodes.length, positions));
    }
  }
  return result;
}

/** Remove a cluster from the expanded set. */
function removeFromSet(prev: Set<string>, clusterId: string): Set<string> {
  const next = new Set(prev);
  next.delete(clusterId);
  return next;
}

/** Hook for managing cluster-based LOD rendering. */
export function useClusterLOD<N>(
  nodes: Node<N>[],
  communityFn: (node: Node<N>) => number | string,
  config: Partial<ClusterLODConfig> = {}
): ClusterLODResult<N> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [currentZoom, setCurrentZoom] = useState(1);
  const hierarchyRef = useRef<ClusterHierarchy | null>(null);
  const clusterPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const communityMap = useMemo(() => buildCommunityMap(nodes, communityFn), [nodes, communityFn]);

  const buildHierarchy = useCallback(
    (positions: PositionMap): void => {
      const refs: HierarchyRefs = { hierarchyRef, positionsRef: clusterPositionsRef };
      buildAndStoreHierarchy(nodes, communityFn, positions, refs);
    },
    [nodes, communityFn]
  );

  const isClusterView = currentZoom < mergedConfig.clusterZoomThreshold;

  const nodesToRender = useMemo((): Node<N>[] => {
    if (!isClusterView) return nodes;
    return computeNodesToRender({
      communityMap,
      expandedClusters,
      minClusterSize: mergedConfig.minClusterSize,
      positions: clusterPositionsRef.current,
    });
  }, [isClusterView, nodes, communityMap, expandedClusters, mergedConfig.minClusterSize]);

  const expandCluster = useCallback(
    (clusterId: string): void => setExpandedClusters((prev) => new Set([...prev, clusterId])),
    []
  );
  const collapseCluster = useCallback(
    (clusterId: string): void => setExpandedClusters((prev) => removeFromSet(prev, clusterId)),
    []
  );
  const updateZoom = useCallback((zoom: number): void => setCurrentZoom(zoom), []);
  const getClusterChildren = useCallback(
    (clusterId: string): string[] => hierarchyRef.current?.clusters.get(clusterId)?.children ?? [],
    []
  );
  const getNodeCluster = useCallback(
    (nodeId: string): string | undefined => hierarchyRef.current?.nodeToCluster.get(nodeId)?.[0],
    []
  );

  return {
    isClusterView,
    nodesToRender,
    expandedClusters,
    expandCluster,
    collapseCluster,
    updateZoom,
    buildHierarchy,
    getClusterChildren,
    getNodeCluster,
  };
}
