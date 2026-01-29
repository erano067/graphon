import type { Edge } from '@graphon/react';
import type { EdgeData, NodeState } from './types';
import { addEdge, pickRandom, pickWeighted, shuffleArray } from './utils';

export function seedInitialConnections(
  nodes: NodeState[],
  communityMembers: Map<number, NodeState[]>,
  edges: Edge<EdgeData>[],
  edgeSet: Set<string>
): void {
  for (const node of nodes) {
    if (node.degree > 0) continue;

    const sameComm = communityMembers.get(node.community) ?? [];
    const candidates = sameComm.filter((n) => n.index !== node.index);

    if (candidates.length > 0) {
      addEdge(node, pickRandom(candidates), edges, edgeSet);
    }
  }
}

export function pickSourceNode(nodes: NodeState[]): NodeState {
  if (Math.random() < 0.7) {
    return pickRandom(nodes);
  }

  const sorted = [...nodes].sort((a, b) => a.degree - b.degree);
  const bottomHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
  return pickRandom(bottomHalf);
}

export function pickTargetNode(
  source: NodeState,
  nodes: NodeState[],
  communityMembers: Map<number, NodeState[]>,
  intraCommunityBias: number
): NodeState | undefined {
  const isSameCommunity = Math.random() < intraCommunityBias;

  let candidates = isSameCommunity
    ? (communityMembers.get(source.community) ?? [])
    : nodes.filter((n) => n.community !== source.community);

  candidates = candidates.filter((n) => n.index !== source.index && !source.neighbors.has(n.index));

  if (candidates.length === 0) {
    candidates = nodes.filter((n) => n.index !== source.index && !source.neighbors.has(n.index));
  }

  if (candidates.length === 0) return undefined;

  const weights = candidates.map((n) => n.degree + 1);
  return pickWeighted(candidates, weights);
}

export function closeTriangles(
  nodes: NodeState[],
  edges: Edge<EdgeData>[],
  edgeSet: Set<string>,
  rate: number
): void {
  const sampleSize = Math.min(nodes.length, 20);
  const sampled = shuffleArray(nodes).slice(0, sampleSize);

  for (const node of sampled) {
    if (node.neighbors.size < 2) continue;

    const neighborList = Array.from(node.neighbors);
    const pairsToCheck = Math.min(3, Math.floor(neighborList.length / 2));

    for (let p = 0; p < pairsToCheck; p++) {
      tryCloseTriangle({ nodes, neighborList, edges, edgeSet, rate });
    }
  }
}

interface TriangleParams {
  nodes: NodeState[];
  neighborList: number[];
  edges: Edge<EdgeData>[];
  edgeSet: Set<string>;
  rate: number;
}

function tryCloseTriangle(params: TriangleParams): void {
  const { nodes, neighborList, edges, edgeSet, rate } = params;
  const i = Math.floor(Math.random() * neighborList.length);
  let j = Math.floor(Math.random() * neighborList.length);
  if (i === j) j = (j + 1) % neighborList.length;

  const neighborI = neighborList[i];
  const neighborJ = neighborList[j];
  if (neighborI === undefined || neighborJ === undefined) return;

  const a = nodes[neighborI];
  const b = nodes[neighborJ];

  if (a === undefined || b === undefined) return;
  if (a.neighbors.has(b.index)) return;
  if (Math.random() > rate) return;

  addEdge(a, b, edges, edgeSet);
}
