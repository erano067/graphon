import { describe, expect, it } from 'vitest';
import { PhysicsSimulation, createPhysicsSimulation } from './PhysicsSimulation';
import type { Edge, Node } from '../model/types';

type TestNodeData = Record<string, unknown>;
type TestEdgeData = Record<string, unknown>;

function createTestNodes(count: number): Node<TestNodeData>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    data: { community: i % 3 },
  }));
}

function createTestEdges(nodes: Node<TestNodeData>[]): Edge<TestEdgeData>[] {
  const edges: Edge<TestEdgeData>[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const source = nodes[i];
    const target = nodes[i + 1];
    if (source && target) {
      edges.push({
        id: `edge-${i}`,
        source: source.id,
        target: target.id,
        data: {},
      });
    }
  }
  return edges;
}

describe('PhysicsSimulation', () => {
  describe('initialization', () => {
    it('creates a simulation with default config', () => {
      const sim = new PhysicsSimulation();
      expect(sim).toBeInstanceOf(PhysicsSimulation);
    });

    it('creates a simulation with custom config', () => {
      const sim = new PhysicsSimulation({ width: 1000, height: 800 });
      const nodes = createTestNodes(2);
      const positions = sim.initialize(nodes, []);

      for (const pos of positions.values()) {
        expect(pos.x).toBeLessThanOrEqual(1000);
        expect(pos.y).toBeLessThanOrEqual(800);
      }
    });

    it('initializes node positions within bounds', () => {
      const sim = new PhysicsSimulation({ width: 800, height: 600, padding: 50 });
      const nodes = createTestNodes(10);
      const positions = sim.initialize(nodes, []);

      expect(positions.size).toBe(10);
      for (const pos of positions.values()) {
        expect(pos.x).toBeGreaterThanOrEqual(50);
        expect(pos.x).toBeLessThanOrEqual(750);
        expect(pos.y).toBeGreaterThanOrEqual(50);
        expect(pos.y).toBeLessThanOrEqual(550);
      }
    });

    it('builds adjacency from edges and enables tick', () => {
      const sim = new PhysicsSimulation();
      const nodes = createTestNodes(3);
      const edges = createTestEdges(nodes);

      const initial = sim.initialize(nodes, edges);
      const updated = sim.tick();

      expect(updated.size).toBe(3);
      const pos0 = initial.get('node-0');
      const newPos0 = updated.get('node-0');
      const moved = pos0?.x !== newPos0?.x || pos0?.y !== newPos0?.y;
      expect(moved).toBe(true);
    });
  });

  describe('tick', () => {
    it('converges to stable state over many ticks', () => {
      const sim = new PhysicsSimulation({ damping: 0.5 });
      const nodes = createTestNodes(3);
      const edges = createTestEdges(nodes);

      sim.initialize(nodes, edges);

      for (let i = 0; i < 200; i++) {
        sim.tick();
      }
      const finalPositions = sim.getPositions();

      sim.tick();
      const afterFinal = sim.getPositions();

      let totalMovement = 0;
      for (const [id, pos] of finalPositions) {
        const after = afterFinal.get(id);
        if (after) {
          totalMovement += Math.abs(pos.x - after.x) + Math.abs(pos.y - after.y);
        }
      }

      expect(totalMovement).toBeLessThan(1);
    });
  });

  describe('pinning', () => {
    it('pins a node in place', () => {
      const sim = new PhysicsSimulation();
      const nodes = createTestNodes(2);
      const edges: Edge<TestEdgeData>[] = [
        { id: 'e1', source: 'node-0', target: 'node-1', data: {} },
      ];

      sim.initialize(nodes, edges);
      const pinnedPos = sim.getPositions().get('node-0');

      sim.pinNode('node-0');

      for (let i = 0; i < 10; i++) {
        sim.tick();
      }

      const afterTicks = sim.getPositions().get('node-0');
      expect(afterTicks?.x).toBe(pinnedPos?.x);
      expect(afterTicks?.y).toBe(pinnedPos?.y);
    });

    it('unpins a node allowing movement', () => {
      const sim = new PhysicsSimulation();
      const nodes = createTestNodes(2);
      const edges: Edge<TestEdgeData>[] = [
        { id: 'e1', source: 'node-0', target: 'node-1', data: {} },
      ];

      sim.initialize(nodes, edges);
      sim.pinNode('node-0');
      sim.unpinNode('node-0');

      const beforeTick = sim.getPositions().get('node-0');
      for (let i = 0; i < 5; i++) {
        sim.tick();
      }
      const afterTick = sim.getPositions().get('node-0');

      const moved = beforeTick?.x !== afterTick?.x || beforeTick?.y !== afterTick?.y;
      expect(moved).toBe(true);
    });

    it('sets a node to a specific position', () => {
      const sim = new PhysicsSimulation();
      const nodes = createTestNodes(1);

      sim.initialize(nodes, []);
      sim.setNodePosition('node-0', { x: 100, y: 200 });

      expect(sim.getPositions().get('node-0')).toEqual({ x: 100, y: 200 });
    });
  });

  describe('resize and community support', () => {
    it('updates simulation dimensions', () => {
      const sim = new PhysicsSimulation({ width: 800, height: 600 });
      sim.resize(1200, 900);
      sim.initialize(createTestNodes(5), []);

      for (let i = 0; i < 50; i++) sim.tick();

      for (const pos of sim.getPositions().values()) {
        expect(pos.x).toBeLessThanOrEqual(1200);
        expect(pos.y).toBeLessThanOrEqual(900);
      }
    });

    it('accepts a community getter function', () => {
      const sim = new PhysicsSimulation<TestNodeData>();
      sim.setCommunityGetter((node) => {
        const { community } = node.data;
        return typeof community === 'number' ? community : 0;
      });
      expect(sim.initialize(createTestNodes(6), []).size).toBe(6);
    });
  });

  describe('createPhysicsSimulation factory', () => {
    it('creates a simulation with config', () => {
      const sim = createPhysicsSimulation({ width: 500, height: 400 });
      expect(sim).toBeInstanceOf(PhysicsSimulation);

      const pos = sim.initialize(createTestNodes(1), []).get('node-0');
      expect(pos?.x).toBeLessThanOrEqual(500);
    });
  });
});
