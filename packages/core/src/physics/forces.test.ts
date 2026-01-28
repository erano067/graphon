import { describe, expect, it } from 'vitest';
import { applyForce, applyVelocities, computeForces } from './forces';
import { buildQuadtree } from './Quadtree';
import { DEFAULT_PHYSICS_CONFIG, type NodeState, type PhysicsConfig } from './types';

function createNodeState(id: string, x: number, y: number): NodeState {
  return { id, x, y, vx: 0, vy: 0, pinned: false };
}

function createConfig(overrides: Partial<PhysicsConfig> = {}): PhysicsConfig {
  return { ...DEFAULT_PHYSICS_CONFIG, ...overrides };
}

describe('forces', () => {
  describe('computeForces', () => {
    it('computes repulsion between unconnected nodes', () => {
      const states: NodeState[] = [createNodeState('a', 100, 100), createNodeState('b', 110, 100)];
      const nodeStates = new Map(states.map((s) => [s.id, s]));
      const adjacency = new Map([
        ['a', new Set<string>()],
        ['b', new Set<string>()],
      ]);
      const config = createConfig();
      const quadtree = buildQuadtree(states, config.width, config.height);
      const state = states[0];
      if (!state) throw new Error('Missing state');

      const force = computeForces({ state, adjacency, nodeStates, quadtree, config });

      expect(force.fx).toBeLessThan(0);
    });

    it('computes spring attraction for connected nodes', () => {
      const states: NodeState[] = [createNodeState('a', 100, 100), createNodeState('b', 300, 100)];
      const nodeStates = new Map(states.map((s) => [s.id, s]));
      const adjacency = new Map([
        ['a', new Set(['b'])],
        ['b', new Set(['a'])],
      ]);
      const config = createConfig({ springStrength: 0.1 });
      const quadtree = buildQuadtree(states, config.width, config.height);
      const state = states[0];
      if (!state) throw new Error('Missing state');

      const force = computeForces({ state, adjacency, nodeStates, quadtree, config });

      expect(force.fx).toBeGreaterThan(0);
    });

    it('computes center gravity pull', () => {
      const states: NodeState[] = [createNodeState('a', 50, 50)];
      const nodeStates = new Map(states.map((s) => [s.id, s]));
      const adjacency = new Map([['a', new Set<string>()]]);
      const config = createConfig({ width: 800, height: 600 });
      const quadtree = buildQuadtree(states, config.width, config.height);
      const state = states[0];
      if (!state) throw new Error('Missing state');

      const force = computeForces({ state, adjacency, nodeStates, quadtree, config });

      expect(force.fx).toBeGreaterThan(0);
      expect(force.fy).toBeGreaterThan(0);
    });
  });

  describe('applyForce', () => {
    it('updates velocity with force and damping', () => {
      const state = createNodeState('a', 100, 100);
      state.vx = 5;
      state.vy = 5;
      const config = createConfig({ damping: 0.5 });

      applyForce(state, { fx: 2, fy: 3 }, config);

      expect(state.vx).toBe(5 * 0.5 + 2);
      expect(state.vy).toBe(5 * 0.5 + 3);
    });

    it('applies velocity cutoff for small speeds', () => {
      const state = createNodeState('a', 100, 100);
      state.vx = 0.001;
      state.vy = 0.001;
      const config = createConfig({ damping: 0.9 });

      applyForce(state, { fx: 0, fy: 0 }, config);

      expect(state.vx).toBe(0);
      expect(state.vy).toBe(0);
    });

    it('preserves velocity above cutoff threshold', () => {
      const state = createNodeState('a', 100, 100);
      state.vx = 5;
      state.vy = 0;
      const config = createConfig({ damping: 0.9 });

      applyForce(state, { fx: 0, fy: 0 }, config);

      expect(state.vx).toBe(4.5);
    });

    it('clamps velocity to maxVelocity when exceeded', () => {
      const state = createNodeState('a', 100, 100);
      state.vx = 100;
      state.vy = 100;
      const config = createConfig({ damping: 1.0, maxVelocity: 10 });

      applyForce(state, { fx: 50, fy: 50 }, config);

      const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
      expect(speed).toBeCloseTo(10, 5);
    });
  });

  describe('applyVelocities', () => {
    it('updates positions based on velocity', () => {
      const state = createNodeState('a', 100, 100);
      state.vx = 10;
      state.vy = -5;
      const config = createConfig();

      applyVelocities([state], config);

      expect(state.x).toBe(110);
      expect(state.y).toBe(95);
    });

    it('constrains positions within bounds', () => {
      const state = createNodeState('a', 10, 10);
      state.vx = -100;
      state.vy = -100;
      const config = createConfig({ width: 800, height: 600, padding: 50 });

      applyVelocities([state], config);

      expect(state.x).toBeGreaterThanOrEqual(50);
      expect(state.y).toBeGreaterThanOrEqual(50);
    });

    it('constrains positions at max bounds', () => {
      const state = createNodeState('a', 790, 590);
      state.vx = 100;
      state.vy = 100;
      const config = createConfig({ width: 800, height: 600, padding: 50 });

      applyVelocities([state], config);

      expect(state.x).toBeLessThanOrEqual(750);
      expect(state.y).toBeLessThanOrEqual(550);
    });
  });
});
