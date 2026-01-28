import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge, Node } from '../../model/types';
import { PhysicsWorkerClient, supportsWebWorkers } from './PhysicsWorkerClient';
import type { PhysicsWorkerAPI, WorkerPositionUpdate, WorkerTickResult } from './types';

// Mock Comlink
vi.mock('comlink', () => ({
  wrap: vi.fn(),
}));

import * as Comlink from 'comlink';

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
      edges.push({ id: `edge-${i}`, source: source.id, target: target.id, data: {} });
    }
  }
  return edges;
}

function createMockTickResult(nodeCount: number, isSettled = false): WorkerTickResult {
  const positions = new Float64Array(nodeCount * 2);
  for (let i = 0; i < nodeCount; i++) {
    positions[i * 2] = 100 + i * 10;
    positions[i * 2 + 1] = 200 + i * 10;
  }
  return { positions, kineticEnergy: isSettled ? 0.1 : 10, isSettled };
}

function createMockWorkerApi(nodeCount: number): PhysicsWorkerAPI {
  let settled = false;
  let tickCount = 0;
  const positions = new Map<string, { x: number; y: number }>();

  return {
    initialize: vi.fn(() => {
      for (let i = 0; i < nodeCount; i++) {
        positions.set(`node-${i}`, { x: 100 + i * 10, y: 200 + i * 10 });
      }
    }),
    tick: vi.fn(() => {
      tickCount++;
      if (tickCount > 5) settled = true;
      return createMockTickResult(nodeCount, settled);
    }),
    setNodePosition: vi.fn((update: WorkerPositionUpdate) => {
      positions.set(update.nodeId, { x: update.x, y: update.y });
    }),
    setPinned: vi.fn(),
    resize: vi.fn(),
    wake: vi.fn(() => {
      settled = false;
      tickCount = 0;
    }),
    getPositions: vi.fn(() => createMockTickResult(nodeCount, false)),
  };
}

describe('PhysicsWorkerClient', () => {
  let mockWorker: { terminate: ReturnType<typeof vi.fn> };
  let mockApi: PhysicsWorkerAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorker = { terminate: vi.fn() };
    mockApi = createMockWorkerApi(3);
    vi.mocked(Comlink.wrap).mockReturnValue(mockApi as unknown as ReturnType<typeof Comlink.wrap>);
  });

  describe('initialization', () => {
    it('creates client with default config', () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });
      expect(client).toBeInstanceOf(PhysicsWorkerClient);
    });

    it('creates client with custom config', () => {
      const client = new PhysicsWorkerClient({
        config: { width: 1000, height: 800 },
        createWorker: () => mockWorker as unknown as Worker,
      });
      expect(client).toBeInstanceOf(PhysicsWorkerClient);
    });

    it('initializes with nodes and edges', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      const nodes = createTestNodes(3);
      const edges = createTestEdges(nodes);

      const positions = await client.initialize(nodes, edges);

      expect(mockApi.initialize).toHaveBeenCalledTimes(1);
      expect(positions.size).toBe(3);
    });

    it('initializes positions within bounds', async () => {
      const client = new PhysicsWorkerClient({
        config: { width: 800, height: 600 },
        createWorker: () => mockWorker as unknown as Worker,
      });

      const positions = await client.initialize(createTestNodes(3), []);

      for (const pos of positions.values()) {
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
      }
    });

    it('accepts community function', async () => {
      const communityFn = vi.fn((node: Node<TestNodeData>) => {
        const { community } = node.data;
        return typeof community === 'number' ? community : 0;
      });
      const client = new PhysicsWorkerClient({
        communityFn,
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(6), []);

      expect(communityFn).toHaveBeenCalled();
    });
  });

  describe('tick', () => {
    it('throws if called before initialize', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await expect(client.tick()).rejects.toThrow('not initialized');
    });

    it('returns positions after tick', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(3), []);
      const positions = await client.tick();

      expect(mockApi.tick).toHaveBeenCalled();
      expect(positions.size).toBe(3);
    });

    it('updates settled state based on tick result', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(3), []);
      expect(client.hasSettled()).toBe(false);

      // Tick until settled (mock settles after 5 ticks)
      for (let i = 0; i < 10; i++) {
        await client.tick();
      }

      expect(client.hasSettled()).toBe(true);
    });

    it('updates kinetic energy from tick result', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(3), []);
      await client.tick();

      expect(typeof client.getKineticEnergy()).toBe('number');
    });
  });

  describe('node manipulation', () => {
    it('sets node position', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(3), []);
      await client.setNodePosition('node-0', { x: 500, y: 300 });

      expect(mockApi.setNodePosition).toHaveBeenCalledWith({
        nodeId: 'node-0',
        x: 500,
        y: 300,
      });

      // Should update local cache
      const positions = client.getPositions();
      expect(positions.get('node-0')).toEqual({ x: 500, y: 300 });
    });

    it('pins a node', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(3), []);
      await client.pinNode('node-0');

      expect(mockApi.setPinned).toHaveBeenCalledWith({ nodeId: 'node-0', pinned: true });
    });

    it('unpins a node and resets settled state', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(3), []);

      // Settle the simulation
      for (let i = 0; i < 10; i++) await client.tick();
      expect(client.hasSettled()).toBe(true);

      await client.unpinNode('node-0');

      expect(mockApi.setPinned).toHaveBeenCalledWith({ nodeId: 'node-0', pinned: false });
      expect(client.hasSettled()).toBe(false);
    });

    it('gracefully handles operations when not initialized', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      // These should not throw when api is null
      await client.setNodePosition('node-0', { x: 100, y: 100 });
      await client.pinNode('node-0');
      await client.unpinNode('node-0');
      await client.wake();
      await client.resize(1000, 800);

      expect(mockApi.setNodePosition).not.toHaveBeenCalled();
    });
  });

  describe('resize', () => {
    it('updates config and calls worker', async () => {
      const client = new PhysicsWorkerClient({
        config: { width: 800, height: 600 },
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(1), []);
      await client.resize(1200, 900);

      expect(mockApi.resize).toHaveBeenCalledWith({ width: 1200, height: 900 });
    });
  });

  describe('wake', () => {
    it('wakes simulation and resets settled state', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(3), []);

      // Settle
      for (let i = 0; i < 10; i++) await client.tick();
      expect(client.hasSettled()).toBe(true);

      await client.wake();

      expect(mockApi.wake).toHaveBeenCalled();
      expect(client.hasSettled()).toBe(false);
    });
  });

  describe('getPositions', () => {
    it('returns a copy of cached positions', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(3), []);

      const positions1 = client.getPositions();
      const positions2 = client.getPositions();

      expect(positions1).not.toBe(positions2);
      expect(Array.from(positions1.entries())).toEqual(Array.from(positions2.entries()));
    });

    it('returns empty map before initialization', () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      const positions = client.getPositions();
      expect(positions.size).toBe(0);
    });
  });

  describe('terminate', () => {
    it('terminates the worker', async () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      await client.initialize(createTestNodes(1), []);
      client.terminate();

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('can be called multiple times safely', () => {
      const client = new PhysicsWorkerClient({
        createWorker: () => mockWorker as unknown as Worker,
      });

      client.terminate();
      client.terminate();

      // Should not throw
      expect(mockWorker.terminate).not.toHaveBeenCalled();
    });
  });
});

describe('supportsWebWorkers', () => {
  it('returns false in Node.js environment (no Worker)', () => {
    // In Node.js test environment, Worker is not defined
    expect(supportsWebWorkers()).toBe(false);
  });
});
