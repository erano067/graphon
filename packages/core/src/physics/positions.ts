import type { Node } from '../model/types';
import type { NodeState, PhysicsConfig } from './types';

interface CommunityCenter {
  cx: number;
  cy: number;
}

export function computeCommunityPositions<N>(
  nodes: Node<N>[],
  config: PhysicsConfig,
  communityGetter?: (node: Node<N>) => number
): Map<number, CommunityCenter> {
  if (!communityGetter) return new Map();

  const communities = groupNodesByCommunity(nodes, communityGetter);
  if (communities.size <= 1) return new Map();

  return arrangeCommunityCircle(communities, config);
}

export function createInitialNodeState<N>(
  node: Node<N>,
  config: PhysicsConfig,
  communityPositions: Map<number, CommunityCenter>,
  communityGetter?: (node: Node<N>) => number
): NodeState {
  const pos = getInitialPosition(node, config, communityPositions, communityGetter);
  return {
    id: node.id,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    pinned: false,
  };
}

function groupNodesByCommunity<N>(
  nodes: Node<N>[],
  communityGetter: (node: Node<N>) => number
): Map<number, Node<N>[]> {
  const communities = new Map<number, Node<N>[]>();
  for (const node of nodes) {
    const c = communityGetter(node);
    const group = communities.get(c) ?? [];
    group.push(node);
    communities.set(c, group);
  }
  return communities;
}

function arrangeCommunityCircle<N>(
  communities: Map<number, Node<N>[]>,
  config: PhysicsConfig
): Map<number, CommunityCenter> {
  const { width, height, padding } = config;
  const usableSize = Math.min(width, height) - padding * 2;
  const radius = usableSize * 0.35;

  const positions = new Map<number, CommunityCenter>();
  let i = 0;
  for (const c of communities.keys()) {
    const angle = (2 * Math.PI * i) / communities.size - Math.PI / 2;
    positions.set(c, {
      cx: width / 2 + radius * Math.cos(angle),
      cy: height / 2 + radius * Math.sin(angle),
    });
    i++;
  }
  return positions;
}

function getInitialPosition<N>(
  node: Node<N>,
  config: PhysicsConfig,
  communityPositions: Map<number, CommunityCenter>,
  communityGetter?: (node: Node<N>) => number
): { x: number; y: number } {
  const { width, height, padding } = config;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const spread = 60;

  if (communityGetter && communityPositions.size > 0) {
    const c = communityGetter(node);
    const center = communityPositions.get(c) ?? { cx: width / 2, cy: height / 2 };
    return {
      x: center.cx + (Math.random() - 0.5) * spread * 2,
      y: center.cy + (Math.random() - 0.5) * spread * 2,
    };
  }

  return {
    x: padding + Math.random() * usableWidth,
    y: padding + Math.random() * usableHeight,
  };
}
