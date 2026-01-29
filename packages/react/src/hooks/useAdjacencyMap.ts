import { type RefObject, useEffect, useRef } from 'react';
import type { Edge } from '@graphon/core';

/** Builds an adjacency map from edges for efficient neighbor lookup. */
function buildAdjacencyMap<E>(edges: Edge<E>[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const edge of edges) {
    let sourceSet = adj.get(edge.source);
    if (!sourceSet) {
      sourceSet = new Set();
      adj.set(edge.source, sourceSet);
    }
    let targetSet = adj.get(edge.target);
    if (!targetSet) {
      targetSet = new Set();
      adj.set(edge.target, targetSet);
    }
    sourceSet.add(edge.target);
    targetSet.add(edge.source);
  }
  return adj;
}

/** Hook that maintains an adjacency map ref that updates when edges change. */
export function useAdjacencyMap<E>(edges: Edge<E>[]): RefObject<Map<string, Set<string>>> {
  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    adjacencyRef.current = buildAdjacencyMap(edges);
  }, [edges]);

  return adjacencyRef;
}
