import { describe, expect, it } from 'vitest';
import { findEdgeAt, findNodeAt, screenToWorld } from './hitTesting';
import type { Edge, Node } from '../model/types';

interface TestData {
  label: string;
}

function createNode(id: string): Node<TestData> {
  return { id, data: { label: id } };
}

function createEdge(id: string, source: string, target: string): Edge<TestData> {
  return { id, source, target, data: { label: id } };
}

describe('hitTesting', () => {
  describe('findNodeAt', () => {
    it('finds a node at exact position', () => {
      const nodes = [createNode('a'), createNode('b')];
      const positions = new Map([
        ['a', { x: 100, y: 100 }],
        ['b', { x: 200, y: 200 }],
      ]);

      const found = findNodeAt({ x: 100, y: 100 }, nodes, positions, 10);

      expect(found?.id).toBe('a');
    });

    it('finds a node within radius', () => {
      const nodes = [createNode('a')];
      const positions = new Map([['a', { x: 100, y: 100 }]]);

      const found = findNodeAt({ x: 105, y: 105 }, nodes, positions, 10);

      expect(found?.id).toBe('a');
    });

    it('returns undefined when no node in range', () => {
      const nodes = [createNode('a')];
      const positions = new Map([['a', { x: 100, y: 100 }]]);

      const found = findNodeAt({ x: 200, y: 200 }, nodes, positions, 10);

      expect(found).toBeUndefined();
    });

    it('returns undefined for empty node list', () => {
      const found = findNodeAt({ x: 100, y: 100 }, [], new Map(), 10);

      expect(found).toBeUndefined();
    });

    it('returns first node when multiple overlap', () => {
      const nodes = [createNode('a'), createNode('b')];
      const positions = new Map([
        ['a', { x: 100, y: 100 }],
        ['b', { x: 105, y: 100 }],
      ]);

      const found = findNodeAt({ x: 102, y: 100 }, nodes, positions, 10);

      expect(found?.id).toBe('a');
    });
  });

  describe('findEdgeAt', () => {
    it('finds an edge at midpoint', () => {
      const edges = [createEdge('e1', 'a', 'b')];
      const positions = new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 100, y: 0 }],
      ]);

      const found = findEdgeAt({ x: 50, y: 0 }, edges, positions, 5);

      expect(found?.id).toBe('e1');
    });

    it('finds an edge near the line', () => {
      const edges = [createEdge('e1', 'a', 'b')];
      const positions = new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 100, y: 0 }],
      ]);

      const found = findEdgeAt({ x: 50, y: 3 }, edges, positions, 5);

      expect(found?.id).toBe('e1');
    });

    it('returns undefined when too far from edge', () => {
      const edges = [createEdge('e1', 'a', 'b')];
      const positions = new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 100, y: 0 }],
      ]);

      const found = findEdgeAt({ x: 50, y: 20 }, edges, positions, 5);

      expect(found).toBeUndefined();
    });

    it('returns undefined for empty edge list', () => {
      const found = findEdgeAt({ x: 50, y: 0 }, [], new Map(), 5);

      expect(found).toBeUndefined();
    });

    it('handles diagonal edges', () => {
      const edges = [createEdge('e1', 'a', 'b')];
      const positions = new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 100, y: 100 }],
      ]);

      const found = findEdgeAt({ x: 50, y: 50 }, edges, positions, 5);

      expect(found?.id).toBe('e1');
    });

    it('handles zero-length edges', () => {
      const edges = [createEdge('e1', 'a', 'b')];
      const positions = new Map([
        ['a', { x: 50, y: 50 }],
        ['b', { x: 50, y: 50 }],
      ]);

      const found = findEdgeAt({ x: 50, y: 50 }, edges, positions, 5);

      expect(found?.id).toBe('e1');
    });
  });

  describe('screenToWorld', () => {
    it('converts screen coordinates with no transform', () => {
      const world = screenToWorld(100, 200, { x: 0, y: 0, scale: 1 });

      expect(world).toEqual({ x: 100, y: 200 });
    });

    it('applies viewport translation', () => {
      const world = screenToWorld(150, 250, { x: 50, y: 50, scale: 1 });

      expect(world).toEqual({ x: 100, y: 200 });
    });

    it('applies viewport scale', () => {
      const world = screenToWorld(200, 400, { x: 0, y: 0, scale: 2 });

      expect(world).toEqual({ x: 100, y: 200 });
    });

    it('applies both translation and scale', () => {
      const world = screenToWorld(250, 450, { x: 50, y: 50, scale: 2 });

      expect(world).toEqual({ x: 100, y: 200 });
    });

    it('handles fractional scale', () => {
      const world = screenToWorld(50, 100, { x: 0, y: 0, scale: 0.5 });

      expect(world).toEqual({ x: 100, y: 200 });
    });
  });
});
