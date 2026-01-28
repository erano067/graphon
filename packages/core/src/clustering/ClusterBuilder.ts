import type { GraphModel } from '../model/GraphModel';
import type { PositionMap } from '../model/types';
import type { ClusterEdge, ClusterHierarchy, ClusterNode } from './types';

/** Options for building cluster hierarchy. */
export interface ClusterBuilderOptions {
  /** Maximum hierarchy depth to extract (default 3) */
  maxLevel?: number;
  /** Position map for calculating cluster centers (optional) */
  positions?: PositionMap;
}

type LevelClusters = Map<number, Map<string, string[]>>;
type NodeToClusterMap = Map<string, string[]>;

function collectNodeClusters<N, E>(
  model: GraphModel<N, E>,
  maxLevel: number
): { levelClusters: LevelClusters; nodeToCluster: NodeToClusterMap } {
  const levelClusters: LevelClusters = new Map();
  const nodeToCluster: NodeToClusterMap = new Map();

  for (let level = 0; level <= maxLevel; level++) {
    levelClusters.set(level, new Map());
  }

  for (const node of model.nodes()) {
    const nodeClusters: string[] = [];
    const nodeData = node.data as Record<string, unknown>;

    for (let level = 0; level <= maxLevel; level++) {
      const clusterId = nodeData[`cluster_level_${level}`];
      if (typeof clusterId !== 'string' || clusterId.length === 0) continue;

      nodeClusters.push(clusterId);
      const clusterNodes = levelClusters.get(level);
      if (!clusterNodes) continue;

      const existing = clusterNodes.get(clusterId) ?? [];
      existing.push(node.id);
      clusterNodes.set(clusterId, existing);
    }
    nodeToCluster.set(node.id, nodeClusters);
  }

  return { levelClusters, nodeToCluster };
}

function calculateClusterPosition(
  nodeIds: string[],
  positions?: PositionMap
): { x: number; y: number } {
  let sumX = 0;
  let sumY = 0;
  let posCount = 0;

  for (const nodeId of nodeIds) {
    const pos = positions?.get(nodeId);
    if (pos) {
      sumX += pos.x;
      sumY += pos.y;
      posCount++;
    }
  }

  return {
    x: posCount > 0 ? sumX / posCount : 0,
    y: posCount > 0 ? sumY / posCount : 0,
  };
}

function findParentCluster(
  level: number,
  nodeIds: string[],
  nodeToCluster: NodeToClusterMap
): string | null {
  if (level === 0 || nodeIds.length === 0) return null;
  const sampleNode = nodeIds[0];
  if (sampleNode === undefined) return null;
  const nodeClustersForSample = nodeToCluster.get(sampleNode);
  return nodeClustersForSample?.[level - 1] ?? null;
}

function buildClusters(
  levelClusters: LevelClusters,
  nodeToCluster: NodeToClusterMap,
  maxLevel: number,
  positions?: PositionMap
): Map<string, ClusterNode> {
  const clusters = new Map<string, ClusterNode>();

  for (let level = 0; level <= maxLevel; level++) {
    const clusterNodesAtLevel = levelClusters.get(level);
    if (!clusterNodesAtLevel) continue;

    for (const [clusterId, nodeIds] of clusterNodesAtLevel.entries()) {
      const { x, y } = calculateClusterPosition(nodeIds, positions);
      const parent = findParentCluster(level, nodeIds, nodeToCluster);

      clusters.set(clusterId, {
        id: clusterId,
        children: nodeIds,
        level,
        parent,
        size: nodeIds.length,
        x,
        y,
      });
    }
  }

  return clusters;
}

function buildClusterEdges<N, E>(
  model: GraphModel<N, E>,
  nodeToCluster: NodeToClusterMap,
  maxLevel: number
): Map<number, ClusterEdge[]> {
  const clusterEdges = new Map<number, ClusterEdge[]>();

  for (let level = 0; level <= maxLevel; level++) {
    const edgeMap = new Map<string, ClusterEdge>();

    for (const edge of model.edges()) {
      const sourceClusters = nodeToCluster.get(edge.source);
      const targetClusters = nodeToCluster.get(edge.target);
      if (!sourceClusters || !targetClusters) continue;

      const sourceCluster = sourceClusters[level];
      const targetCluster = targetClusters[level];
      if (
        sourceCluster === undefined ||
        targetCluster === undefined ||
        sourceCluster === targetCluster
      ) {
        continue;
      }

      const key = [sourceCluster, targetCluster].sort().join('__');
      const existing = edgeMap.get(key) ?? {
        source: sourceCluster,
        target: targetCluster,
        weight: 0,
        edges: [] as string[],
      };
      existing.weight++;
      existing.edges.push(edge.id);
      edgeMap.set(key, existing);
    }

    clusterEdges.set(level, Array.from(edgeMap.values()));
  }

  return clusterEdges;
}

/**
 * Builds cluster hierarchy from node cluster attributes.
 * Expects nodes to have `cluster_level_N` attributes in their data.
 */
export const ClusterBuilder = {
  buildFromAttributes<N, E>(
    model: GraphModel<N, E>,
    options: ClusterBuilderOptions = {}
  ): ClusterHierarchy {
    const { maxLevel = 3, positions } = options;
    const { levelClusters, nodeToCluster } = collectNodeClusters(model, maxLevel);
    const clusters = buildClusters(levelClusters, nodeToCluster, maxLevel, positions);
    const clusterEdges = buildClusterEdges(model, nodeToCluster, maxLevel);

    return { clusters, clusterEdges, maxLevel, nodeToCluster };
  },
};
