import type { Edge } from '@graphon/react';
import type { EdgeData, NodeState } from './types';

export function createNodeStates(nodeCount: number, communities: number[]): NodeState[] {
  return Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    index: i,
    community: communities[i] ?? 0,
    degree: 0,
    neighbors: new Set<number>(),
  }));
}

export function groupByCommunity(
  nodes: NodeState[],
  communityCount: number
): Map<number, NodeState[]> {
  const groups = new Map<number, NodeState[]>();
  for (let c = 0; c < communityCount; c++) {
    groups.set(c, []);
  }
  for (const node of nodes) {
    groups.get(node.community)?.push(node);
  }
  return groups;
}

export function makeEdgeKey(i: number, j: number): string {
  return i < j ? `${i}-${j}` : `${j}-${i}`;
}

export function addEdge(
  source: NodeState,
  target: NodeState,
  edges: Edge<EdgeData>[],
  edgeSet: Set<string>
): void {
  const key = makeEdgeKey(source.index, target.index);
  if (edgeSet.has(key)) return;

  edgeSet.add(key);
  edges.push({
    id: `edge-${edges.length}`,
    source: source.id,
    target: target.id,
    data: { weight: 1 },
  });

  source.neighbors.add(target.index);
  target.neighbors.add(source.index);
  source.degree++;
  target.degree++;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    const swap = result[j];
    if (temp !== undefined && swap !== undefined) {
      result[i] = swap;
      result[j] = temp;
    }
  }
  return result;
}

export function pickRandom<T>(array: T[]): T {
  const item = array[Math.floor(Math.random() * array.length)];
  if (item === undefined) throw new Error('Cannot pick from empty array');
  return item;
}

export function pickWeighted<T>(items: T[], weights: number[]): T {
  if (items.length === 0) throw new Error('Cannot pick from empty array');
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    const weight = weights[i] ?? 0;
    r -= weight;
    const item = items[i];
    if (r <= 0 && item !== undefined) return item;
  }
  const last = items[items.length - 1];
  if (last === undefined) throw new Error('Cannot pick from empty array');
  return last;
}
