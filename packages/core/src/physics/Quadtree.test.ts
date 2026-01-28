import { describe, expect, it } from 'vitest';
import { buildQuadtree, calculateRepulsion } from './Quadtree';
import type { NodeState } from './types';

function createNodeState(id: string, x: number, y: number): NodeState {
  return { id, x, y, vx: 0, vy: 0, pinned: false };
}

describe('Quadtree', () => {
  describe('buildQuadtree', () => {
    it('creates a quadtree from node states', () => {
      const states: NodeState[] = [
        createNodeState('a', 100, 100),
        createNodeState('b', 200, 200),
        createNodeState('c', 300, 300),
      ];

      const tree = buildQuadtree(states, 800, 600);

      expect(tree).toBeDefined();
      expect(tree.x).toBe(0);
      expect(tree.y).toBe(0);
      expect(tree.width).toBe(800);
    });

    it('handles empty node list', () => {
      const tree = buildQuadtree([], 800, 600);

      expect(tree).toBeDefined();
      expect(tree.mass).toBe(0);
    });

    it('handles single node', () => {
      const states: NodeState[] = [createNodeState('a', 400, 300)];
      const tree = buildQuadtree(states, 800, 600);

      expect(tree).toBeDefined();
      expect(tree.mass).toBe(1);
      expect(tree.cx).toBe(400);
      expect(tree.cy).toBe(300);
    });

    it('calculates center of mass correctly', () => {
      const states: NodeState[] = [
        createNodeState('a', 0, 0),
        createNodeState('b', 100, 0),
        createNodeState('c', 0, 100),
        createNodeState('d', 100, 100),
      ];

      const tree = buildQuadtree(states, 200, 200);

      expect(tree.mass).toBe(4);
      expect(tree.cx).toBe(50);
      expect(tree.cy).toBe(50);
    });

    it('subdivides when multiple nodes in same region', () => {
      const states: NodeState[] = [
        createNodeState('a', 10, 10),
        createNodeState('b', 20, 20),
        createNodeState('c', 15, 15),
      ];

      const tree = buildQuadtree(states, 800, 600);

      expect(tree.mass).toBe(3);
      const hasChildren = tree.children.some((c) => c !== undefined);
      expect(hasChildren).toBe(true);
    });
  });

  describe('calculateRepulsion', () => {
    it('calculates repulsion force between nodes', () => {
      const stateA = createNodeState('a', 100, 100);
      const stateB = createNodeState('b', 200, 100);
      const states = [stateA, stateB];

      const tree = buildQuadtree(states, 800, 600);
      const force = calculateRepulsion({
        position: { x: stateA.x, y: stateA.y },
        node: tree,
        repulsion: 1000,
        theta: 0.5,
      });

      expect(force.fx).toBeLessThan(0);
      expect(Math.abs(force.fy)).toBeLessThan(Math.abs(force.fx));
    });

    it('returns zero force for isolated node', () => {
      const state = createNodeState('a', 400, 300);
      const tree = buildQuadtree([state], 800, 600);
      const force = calculateRepulsion({
        position: { x: state.x, y: state.y },
        node: tree,
        repulsion: 1000,
        theta: 0.5,
      });

      expect(force.fx).toBe(0);
      expect(force.fy).toBe(0);
    });

    it('increases force when nodes are closer', () => {
      const closeA = createNodeState('a', 100, 100);
      const closeB = createNodeState('b', 110, 100);
      const farA = createNodeState('a', 100, 100);
      const farB = createNodeState('b', 500, 100);

      const closeTree = buildQuadtree([closeA, closeB], 800, 600);
      const farTree = buildQuadtree([farA, farB], 800, 600);

      const closeForce = calculateRepulsion({
        position: { x: closeA.x, y: closeA.y },
        node: closeTree,
        repulsion: 1000,
        theta: 0.5,
      });
      const farForce = calculateRepulsion({
        position: { x: farA.x, y: farA.y },
        node: farTree,
        repulsion: 1000,
        theta: 0.5,
      });

      expect(Math.abs(closeForce.fx)).toBeGreaterThan(Math.abs(farForce.fx));
    });

    it('respects theta parameter for approximation', () => {
      const firstState = createNodeState('n0', Math.random() * 800, Math.random() * 600);
      const states: NodeState[] = [firstState];
      for (let i = 1; i < 100; i++) {
        states.push(createNodeState(`n${i}`, Math.random() * 800, Math.random() * 600));
      }

      const tree = buildQuadtree(states, 800, 600);

      const preciseForce = calculateRepulsion({
        position: { x: firstState.x, y: firstState.y },
        node: tree,
        repulsion: 1000,
        theta: 0.1,
      });
      const approxForce = calculateRepulsion({
        position: { x: firstState.x, y: firstState.y },
        node: tree,
        repulsion: 1000,
        theta: 2.0,
      });

      expect(preciseForce.fx).not.toBe(approxForce.fx);
    });
  });
});
