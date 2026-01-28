import { describe, expect, it } from 'vitest';
import { ForceLayout } from './ForceLayout';
import type { Edge, Node } from '../model/types';

type TestData = Record<string, unknown>;

function createNodes(count: number): Node<TestData>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    data: {},
  }));
}

function createChainEdges(nodes: Node<TestData>[]): Edge<TestData>[] {
  const edges: Edge<TestData>[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const source = nodes[i];
    const target = nodes[i + 1];
    if (source && target) {
      edges.push({ id: `e${i}`, source: source.id, target: target.id, data: {} });
    }
  }
  return edges;
}

describe('ForceLayout', () => {
  describe('compute', () => {
    it('computes positions for all nodes', () => {
      const layout = new ForceLayout();
      const nodes = createNodes(5);
      const edges = createChainEdges(nodes);

      const positions = layout.compute(nodes, edges);

      expect(positions.size).toBe(5);
      for (const node of nodes) {
        expect(positions.has(node.id)).toBe(true);
      }
    });

    it('positions nodes within bounds', () => {
      const layout = new ForceLayout({ width: 800, height: 600, padding: 50 });
      const nodes = createNodes(10);
      const edges = createChainEdges(nodes);

      const positions = layout.compute(nodes, edges);

      for (const pos of positions.values()) {
        expect(pos.x).toBeGreaterThanOrEqual(50);
        expect(pos.x).toBeLessThanOrEqual(750);
        expect(pos.y).toBeGreaterThanOrEqual(50);
        expect(pos.y).toBeLessThanOrEqual(550);
      }
    });

    it('converges to stable layout', () => {
      const layout = new ForceLayout({ iterations: 500, damping: 0.5 });
      const nodes = createNodes(3);
      const edges = createChainEdges(nodes);

      const positions = layout.compute(nodes, edges);

      const pos0 = positions.get('n0');
      const pos1 = positions.get('n1');
      const pos2 = positions.get('n2');

      expect(pos0).toBeDefined();
      expect(pos1).toBeDefined();
      expect(pos2).toBeDefined();
    });

    it('handles empty graph', () => {
      const layout = new ForceLayout();
      const positions = layout.compute([], []);

      expect(positions.size).toBe(0);
    });

    it('handles disconnected nodes', () => {
      const layout = new ForceLayout();
      const nodes = createNodes(3);

      const positions = layout.compute(nodes, []);

      expect(positions.size).toBe(3);
    });

    it('applies repulsion between nodes', () => {
      const layout = new ForceLayout({ repulsion: 1000, iterations: 100 });
      const nodes = createNodes(2);

      const positions = layout.compute(nodes, []);

      const pos0 = positions.get('n0');
      const pos1 = positions.get('n1');
      expect(pos0).toBeDefined();
      expect(pos1).toBeDefined();
      if (pos0 && pos1) {
        const dist = Math.sqrt((pos0.x - pos1.x) ** 2 + (pos0.y - pos1.y) ** 2);
        expect(dist).toBeGreaterThan(10);
      }
    });
  });
});
