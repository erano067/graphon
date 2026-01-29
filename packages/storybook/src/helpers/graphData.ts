import type { Edge, Node } from '@graphon/core';

interface NodeData {
  label: string;
  category: string;
  value?: number;
}

interface EdgeData {
  weight?: number;
}

export function generateSimpleGraph(): {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
} {
  const nodes: Node<NodeData>[] = [
    { id: 'a', data: { label: 'Node A', category: 'primary' } },
    { id: 'b', data: { label: 'Node B', category: 'primary' } },
    { id: 'c', data: { label: 'Node C', category: 'secondary' } },
    { id: 'd', data: { label: 'Node D', category: 'secondary' } },
    { id: 'e', data: { label: 'Node E', category: 'tertiary' } },
  ];

  const edges: Edge<EdgeData>[] = [
    { id: 'ab', source: 'a', target: 'b', data: { weight: 1 } },
    { id: 'ac', source: 'a', target: 'c', data: { weight: 2 } },
    { id: 'bd', source: 'b', target: 'd', data: { weight: 1 } },
    { id: 'cd', source: 'c', target: 'd', data: { weight: 3 } },
    { id: 'de', source: 'd', target: 'e', data: { weight: 1 } },
    { id: 'ce', source: 'c', target: 'e', data: { weight: 2 } },
  ];

  return { nodes, edges };
}

export function generateNetworkGraph(
  nodeCount = 30,
  edgeDensity = 0.1
): {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
} {
  const categories = ['primary', 'secondary', 'tertiary', 'quaternary'];
  const nodes: Node<NodeData>[] = [];
  const edges: Edge<EdgeData>[] = [];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      data: {
        label: `Node ${i}`,
        category: categories[i % categories.length] ?? 'primary',
        value: Math.random() * 100,
      },
    });
  }

  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < edgeDensity) {
        edges.push({
          id: `edge-${i}-${j}`,
          source: `node-${i}`,
          target: `node-${j}`,
          data: { weight: Math.random() * 5 },
        });
      }
    }
  }

  return { nodes, edges };
}

export const COLORS = {
  primary: 0x3498db,
  secondary: 0xe74c3c,
  tertiary: 0x2ecc71,
  quaternary: 0xf39c12,
  highlight: 0x9b59b6,
  muted: 0x95a5a6,
};
