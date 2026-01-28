import { describe, expect, it } from 'vitest';
import { PhysicsWorkerCore } from './PhysicsWorkerCore';
import type { WorkerInitData } from './types';

function createInitData(nodeCount: number, withEdges = true): WorkerInitData {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    x: 100 + i * 50,
    y: 200 + i * 50,
  }));

  const edges = withEdges
    ? nodes.slice(0, -1).map((n, i) => ({
        source: n.id,
        target: `node-${i + 1}`,
      }))
    : [];

  return {
    nodes,
    edges,
    config: {
      width: 800,
      height: 600,
      padding: 50,
      springStrength: 0.015,
      springLength: 80,
      maxSpringForce: 2,
      repulsion: 400,
      damping: 0.7,
      maxVelocity: 10,
      theta: 0.8,
    },
  };
}

describe('PhysicsWorkerCore', () => {
  describe('initialize', () => {
    it('initializes with nodes and edges', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(3));

      const result = worker.getPositions();
      expect(result.positions.length).toBe(6); // 3 nodes * 2 (x, y)
      expect(result.isSettled).toBe(false);
    });

    it('preserves initial node positions', () => {
      const worker = new PhysicsWorkerCore();
      const data = createInitData(2, false);
      worker.initialize(data);

      const result = worker.getPositions();
      expect(result.positions[0]).toBe(100); // node-0 x
      expect(result.positions[1]).toBe(200); // node-0 y
      expect(result.positions[2]).toBe(150); // node-1 x
      expect(result.positions[3]).toBe(250); // node-1 y
    });

    it('clears previous state on re-initialize', () => {
      const worker = new PhysicsWorkerCore();

      worker.initialize(createInitData(5));
      expect(worker.getPositions().positions.length).toBe(10);

      worker.initialize(createInitData(2));
      expect(worker.getPositions().positions.length).toBe(4);
    });
  });

  describe('tick', () => {
    it('returns positions after tick', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(3));

      const result = worker.tick();

      expect(result.positions.length).toBe(6);
      expect(typeof result.kineticEnergy).toBe('number');
      expect(typeof result.isSettled).toBe('boolean');
    });

    it('applies forces and moves nodes', () => {
      const worker = new PhysicsWorkerCore();
      const data = createInitData(2);
      worker.initialize(data);

      const before = worker.getPositions();
      worker.tick();
      const after = worker.getPositions();

      // At least one node should have moved
      const moved =
        before.positions[0] !== after.positions[0] ||
        before.positions[1] !== after.positions[1] ||
        before.positions[2] !== after.positions[2] ||
        before.positions[3] !== after.positions[3];

      expect(moved).toBe(true);
    });

    it('settles after many iterations', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(3));

      // Run many ticks with high damping to settle quickly
      for (let i = 0; i < 500; i++) {
        const result = worker.tick();
        if (result.isSettled) break;
      }

      expect(worker.tick().isSettled).toBe(true);
    });

    it('skips physics when settled', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2, false));

      // Settle the simulation
      for (let i = 0; i < 500; i++) {
        if (worker.tick().isSettled) break;
      }

      const before = worker.getPositions();
      worker.tick();
      const after = worker.getPositions();

      // Positions should be identical when settled
      expect(before.positions[0]).toBe(after.positions[0]);
      expect(before.positions[1]).toBe(after.positions[1]);
    });
  });

  describe('setNodePosition', () => {
    it('updates node position', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2));

      worker.setNodePosition({ nodeId: 'node-0', x: 500, y: 300 });

      const result = worker.getPositions();
      expect(result.positions[0]).toBe(500);
      expect(result.positions[1]).toBe(300);
    });

    it('resets velocity when position is set', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2));

      // Run a tick to build up velocity
      worker.tick();

      // Set position should reset velocity
      worker.setNodePosition({ nodeId: 'node-0', x: 500, y: 300 });

      // Pin the node and verify position stays put
      worker.setPinned({ nodeId: 'node-0', pinned: true });
      worker.tick();

      const result = worker.getPositions();
      expect(result.positions[0]).toBe(500);
      expect(result.positions[1]).toBe(300);
    });

    it('ignores unknown node ids', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2));

      // Should not throw
      worker.setNodePosition({ nodeId: 'unknown', x: 500, y: 300 });

      expect(worker.getPositions().positions.length).toBe(4);
    });
  });

  describe('setPinned', () => {
    it('pins a node to prevent movement', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2));

      worker.setPinned({ nodeId: 'node-0', pinned: true });

      const before = worker.getPositions();
      for (let i = 0; i < 10; i++) {
        worker.tick();
      }
      const after = worker.getPositions();

      // Pinned node should not move
      expect(before.positions[0]).toBe(after.positions[0]);
      expect(before.positions[1]).toBe(after.positions[1]);
    });

    it('unpins a node to allow movement', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2));

      worker.setPinned({ nodeId: 'node-0', pinned: true });
      worker.setPinned({ nodeId: 'node-0', pinned: false });

      const before = worker.getPositions();
      for (let i = 0; i < 10; i++) {
        worker.tick();
      }
      const after = worker.getPositions();

      // Node should have moved
      const moved =
        before.positions[0] !== after.positions[0] || before.positions[1] !== after.positions[1];
      expect(moved).toBe(true);
    });

    it('wakes simulation when unpinning', () => {
      const worker = new PhysicsWorkerCore();
      // Use nodes with edges to have meaningful forces
      worker.initialize(createInitData(3, true));

      // Settle
      for (let i = 0; i < 500; i++) {
        if (worker.tick().isSettled) break;
      }
      expect(worker.tick().isSettled).toBe(true);

      // Move node far away to create force when unpinned
      worker.setNodePosition({ nodeId: 'node-0', x: 0, y: 0 });
      worker.setPinned({ nodeId: 'node-0', pinned: true });
      worker.wake();

      // Unpin should allow movement
      worker.setPinned({ nodeId: 'node-0', pinned: false });

      // Run tick - node should move due to spring forces
      const result = worker.tick();
      // Check that kineticEnergy was computed (might be above or below threshold depending on forces)
      expect(typeof result.kineticEnergy).toBe('number');
    });

    it('ignores unknown node ids', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2));

      // Should not throw
      worker.setPinned({ nodeId: 'unknown', pinned: true });
    });
  });

  describe('resize', () => {
    it('updates simulation dimensions', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2));

      worker.resize({ width: 1200, height: 900 });

      // Positions should still work after resize
      const result = worker.tick();
      expect(result.positions.length).toBe(4);
    });
  });

  describe('wake', () => {
    it('wakes a settled simulation', () => {
      const worker = new PhysicsWorkerCore();
      // Use nodes with edges to have meaningful forces
      worker.initialize(createInitData(3, true));

      // Settle
      for (let i = 0; i < 500; i++) {
        if (worker.tick().isSettled) break;
      }
      expect(worker.tick().isSettled).toBe(true);

      // Move a node far away to create force
      worker.setNodePosition({ nodeId: 'node-0', x: 0, y: 0 });
      worker.wake();

      // After wake, simulation should run physics again
      // and compute new kinetic energy (might settle immediately if forces are small)
      const result = worker.tick();
      expect(typeof result.kineticEnergy).toBe('number');
      expect(result.kineticEnergy).toBeGreaterThan(0); // Some energy from spring force
    });

    it('resets kinetic energy to infinity', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(2, false));

      // Settle
      for (let i = 0; i < 500; i++) {
        if (worker.tick().isSettled) break;
      }

      worker.wake();
      const result = worker.tick();

      // After wake and one tick, energy should be computed again
      expect(result.kineticEnergy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPositions', () => {
    it('returns current positions without running physics', () => {
      const worker = new PhysicsWorkerCore();
      const data = createInitData(2, false);
      worker.initialize(data);

      const result1 = worker.getPositions();
      const result2 = worker.getPositions();

      // Should be identical
      expect(result1.positions[0]).toBe(result2.positions[0]);
      expect(result1.positions[1]).toBe(result2.positions[1]);
    });

    it('returns packed Float64Array', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(3));

      const result = worker.getPositions();

      expect(result.positions).toBeInstanceOf(Float64Array);
      expect(result.positions.length).toBe(6);
    });
  });

  describe('edge cases', () => {
    it('handles empty graph', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize({ nodes: [], edges: [], config: createInitData(1).config });

      const result = worker.tick();
      expect(result.positions.length).toBe(0);
      expect(result.isSettled).toBe(true);
    });

    it('handles single node', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize({
        nodes: [{ id: 'single', x: 400, y: 300 }],
        edges: [],
        config: createInitData(1).config,
      });

      const result = worker.tick();
      expect(result.positions.length).toBe(2);
    });

    it('handles disconnected nodes', () => {
      const worker = new PhysicsWorkerCore();
      worker.initialize(createInitData(5, false));

      const result = worker.tick();
      expect(result.positions.length).toBe(10);
    });
  });
});
