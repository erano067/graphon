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

export interface ClusterPosition {
  x: number;
  y: number;
  radius: number;
}

/** Group nodes by community. */
export function groupByCommunity(nodes: Node<NodeData>[]): Map<number, Node<NodeData>[]> {
  const groups = new Map<number, Node<NodeData>[]>();
  for (const node of nodes) {
    const { community } = node.data;
    const group = groups.get(community) ?? [];
    group.push(node);
    groups.set(community, group);
  }
  return groups;
}

/** Compute center position for a community from member positions. */
function computeCommunityCenter(
  members: Node<NodeData>[],
  positions?: Map<string, { x: number; y: number }>
): { x: number; y: number } {
  const coords: { x: number; y: number }[] = [];
  for (const node of members) {
    const pos = positions?.get(node.id);
    if (pos) coords.push(pos);
    else if (node.x !== undefined && node.y !== undefined) coords.push({ x: node.x, y: node.y });
  }
  if (coords.length === 0) return { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 };
  const sumX = coords.reduce((acc, p) => acc + p.x, 0);
  const sumY = coords.reduce((acc, p) => acc + p.y, 0);
  return { x: sumX / coords.length, y: sumY / coords.length };
}

/** Create a cluster super-node for a community. */
export function createClusterNode(
  community: number,
  members: Node<NodeData>[],
  positions?: Map<string, { x: number; y: number }>
): Node<ClusterNodeData> {
  const center = computeCommunityCenter(members, positions);
  return {
    id: `__cluster_${community}`,
    x: center.x,
    y: center.y,
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

export function toggleClusterInSet(set: Set<number>, community: number): Set<number> {
  const next = new Set(set);
  if (next.has(community)) {
    next.delete(community);
  } else {
    next.add(community);
  }
  return next;
}

export function computeClusterPositionsForExpanded(
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

export interface NodesToRenderResult {
  nodes: Node<ClusterableNodeData>[];
  nodeIdToCommunity: Map<string, number>;
  collapsedCommunities: Set<number>;
}

export function computeNodesToRender(
  communityGroups: Map<number, Node<NodeData>[]>,
  expandedClusters: Set<number>,
  positions?: Map<string, { x: number; y: number }>
): NodesToRenderResult {
  const nodes: Node<ClusterableNodeData>[] = [];
  const nodeIdToCommunity = new Map<string, number>();
  const collapsedCommunities = new Set<number>();

  for (const [community, members] of communityGroups) {
    for (const m of members) nodeIdToCommunity.set(m.id, community);

    if (expandedClusters.has(community)) {
      for (const node of members) nodes.push(node);
    } else {
      collapsedCommunities.add(community);
      nodes.push(createClusterNode(community, members, positions));
    }
  }
  return { nodes, nodeIdToCommunity, collapsedCommunities };
}

export function computeEdgesToRender(
  edges: Edge<EdgeData>[],
  nodeIdToCommunity: Map<string, number>,
  collapsedCommunities: Set<number>
): Edge<EdgeData>[] {
  const result: Edge<EdgeData>[] = [];
  const clusterEdgeSet = new Set<string>();

  for (const edge of edges) {
    const srcComm = nodeIdToCommunity.get(edge.source);
    const tgtComm = nodeIdToCommunity.get(edge.target);
    const isSrcCollapsed = srcComm !== undefined && collapsedCommunities.has(srcComm);
    const isTgtCollapsed = tgtComm !== undefined && collapsedCommunities.has(tgtComm);

    if (!isSrcCollapsed && !isTgtCollapsed) {
      result.push(edge);
      continue;
    }

    const newSource = isSrcCollapsed ? `__cluster_${srcComm}` : edge.source;
    const newTarget = isTgtCollapsed ? `__cluster_${tgtComm}` : edge.target;

    if (newSource === newTarget) continue;

    const key = [newSource, newTarget].sort().join('|');
    if (clusterEdgeSet.has(key)) continue;
    clusterEdgeSet.add(key);

    result.push({ ...edge, id: `cluster_edge_${key}`, source: newSource, target: newTarget });
  }
  return result;
}
