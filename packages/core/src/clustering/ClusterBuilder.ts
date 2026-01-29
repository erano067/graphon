import type { GraphModel } from '../model/GraphModel';
import type { Node, PositionMap } from '../model/types';
import type { ClusterEdge, ClusterHierarchy, ClusterNode } from './types';

/**
 * Options for building a cluster hierarchy.
 */
export interface ClusterBuilderOptions {
  /** Maximum hierarchy depth (default: 3) */
  maxLevel?: number;
  /** Node positions for computing cluster centers */
  positions?: PositionMap;
}

/**
 * Build hierarchy from community assignments using a function.
 * This creates a single-level hierarchy based on community membership.
 *
 * @example
 * ```ts
 * const hierarchy = buildClustersFromCommunity(model, node => node.data.community);
 * ```
 */
export function buildClustersFromCommunity<N, E = Record<string, unknown>>(
  model: GraphModel<N, E>,
  communityFn: (node: Node<N>) => number | string,
  positions?: PositionMap
): ClusterHierarchy {
  const clusters = new Map<string, ClusterNode>();
  const nodeToCluster = new Map<string, string[]>();
  const clusterEdges = new Map<number, ClusterEdge[]>();
  const communityNodes = new Map<string, string[]>();

  // First pass: group nodes by community
  for (const node of model.nodes()) {
    const community = String(communityFn(node));
    const clusterId = `cluster_${community}`;

    let nodeIds = communityNodes.get(clusterId);
    if (!nodeIds) {
      nodeIds = [];
      communityNodes.set(clusterId, nodeIds);
    }
    nodeIds.push(node.id);
    nodeToCluster.set(node.id, [clusterId]);
  }

  // Second pass: create cluster nodes with positions (center of mass)
  for (const [clusterId, nodeIds] of communityNodes) {
    const center = computeCenter(nodeIds, positions);

    clusters.set(clusterId, {
      id: clusterId,
      children: nodeIds,
      level: 0,
      parent: null,
      size: nodeIds.length,
      x: center.x,
      y: center.y,
    });
  }

  // Third pass: build cluster edges
  const edgeMap = buildClusterEdges(model, nodeToCluster, 0);
  clusterEdges.set(0, Array.from(edgeMap.values()));

  return { clusters, clusterEdges, maxLevel: 0, nodeToCluster };
}

/**
 * Build hierarchy from node cluster attributes.
 * Nodes should have `cluster_level_0`, `cluster_level_1`, etc. in their data.
 *
 * @example
 * ```ts
 * const hierarchy = buildClustersFromAttributes(model, { maxLevel: 2 });
 * ```
 */
export function buildClustersFromAttributes<N, E = Record<string, unknown>>(
  model: GraphModel<N, E>,
  options: ClusterBuilderOptions = {}
): ClusterHierarchy {
  const { maxLevel = 3, positions } = options;

  const clusters = new Map<string, ClusterNode>();
  const nodeToCluster = new Map<string, string[]>();
  const clusterEdges = new Map<number, ClusterEdge[]>();
  const levelClusters = new Map<number, Map<string, string[]>>();

  // Initialize level maps
  for (let level = 0; level <= maxLevel; level++) {
    levelClusters.set(level, new Map());
  }

  // First pass: collect all clusters at each level
  collectClustersAtEachLevel(model, maxLevel, levelClusters, nodeToCluster);

  // Second pass: create cluster nodes
  createClusterNodes({ levelClusters, maxLevel, positions, nodeToCluster, clusters });

  // Third pass: build cluster edges at each level
  for (let level = 0; level <= maxLevel; level++) {
    const edgeMap = buildClusterEdges(model, nodeToCluster, level);
    clusterEdges.set(level, Array.from(edgeMap.values()));
  }

  return { clusters, clusterEdges, maxLevel, nodeToCluster };
}

function computeCenter(nodeIds: string[], positions?: PositionMap): { x: number; y: number } {
  if (!positions || nodeIds.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (const nodeId of nodeIds) {
    const pos = positions.get(nodeId);
    if (pos) {
      sumX += pos.x;
      sumY += pos.y;
      count++;
    }
  }

  return count > 0 ? { x: sumX / count, y: sumY / count } : { x: 0, y: 0 };
}

function collectClustersAtEachLevel<N, E>(
  model: GraphModel<N, E>,
  maxLevel: number,
  levelClusters: Map<number, Map<string, string[]>>,
  nodeToCluster: Map<string, string[]>
): void {
  for (const node of model.nodes()) {
    const nodeClusters: string[] = [];
    const data = node.data as Record<string, unknown>;

    for (let level = 0; level <= maxLevel; level++) {
      const clusterId = data[`cluster_level_${level}`];
      if (typeof clusterId !== 'string') continue;

      nodeClusters.push(clusterId);
      addNodeToClusterLevel(levelClusters, level, clusterId, node.id);
    }

    nodeToCluster.set(node.id, nodeClusters);
  }
}

function addNodeToClusterLevel(
  levelClusters: Map<number, Map<string, string[]>>,
  level: number,
  clusterId: string,
  nodeId: string
): void {
  const clusterNodes = levelClusters.get(level);
  if (!clusterNodes) return;

  let nodeIds = clusterNodes.get(clusterId);
  if (!nodeIds) {
    nodeIds = [];
    clusterNodes.set(clusterId, nodeIds);
  }
  nodeIds.push(nodeId);
}

interface CreateClusterNodesParams {
  levelClusters: Map<number, Map<string, string[]>>;
  maxLevel: number;
  positions: PositionMap | undefined;
  nodeToCluster: Map<string, string[]>;
  clusters: Map<string, ClusterNode>;
}

function createClusterNodes(params: CreateClusterNodesParams): void {
  const { levelClusters, maxLevel, positions, nodeToCluster, clusters } = params;

  for (let level = 0; level <= maxLevel; level++) {
    const clusterNodes = levelClusters.get(level);
    if (!clusterNodes) continue;

    for (const [clusterId, nodeIds] of clusterNodes) {
      const center = computeCenter(nodeIds, positions);
      const parent = findParentCluster(nodeIds[0], level, nodeToCluster);

      clusters.set(clusterId, {
        id: clusterId,
        children: nodeIds,
        level,
        parent,
        size: nodeIds.length,
        x: center.x,
        y: center.y,
      });
    }
  }
}

function findParentCluster(
  nodeId: string | undefined,
  level: number,
  nodeToCluster: Map<string, string[]>
): string | null {
  if (level === 0 || nodeId === undefined) return null;

  const nodeClusters = nodeToCluster.get(nodeId);
  return nodeClusters?.[level - 1] ?? null;
}

function buildClusterEdges<N, E>(
  model: GraphModel<N, E>,
  nodeToCluster: Map<string, string[]>,
  level: number
): Map<string, ClusterEdge> {
  const edgeMap = new Map<string, ClusterEdge>();

  for (const edge of model.edges()) {
    const sourceClusters = nodeToCluster.get(edge.source);
    const targetClusters = nodeToCluster.get(edge.target);

    if (sourceClusters === undefined || targetClusters === undefined) continue;

    const sourceCluster = sourceClusters[level];
    const targetCluster = targetClusters[level];

    if (sourceCluster === undefined || targetCluster === undefined) continue;
    if (sourceCluster === targetCluster) continue; // Internal edge

    const key = [sourceCluster, targetCluster].sort().join('__');

    let clusterEdge = edgeMap.get(key);
    if (!clusterEdge) {
      clusterEdge = {
        source: sourceCluster,
        target: targetCluster,
        weight: 0,
        edges: [],
      };
      edgeMap.set(key, clusterEdge);
    }

    clusterEdge.weight++;
    clusterEdge.edges.push(edge.id);
  }

  return edgeMap;
}
