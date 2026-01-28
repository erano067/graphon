import { describe, expect, it, vi } from 'vitest';
import { GraphologyAdapter, createGraphModel } from './GraphologyAdapter';
import type { Edge, Node } from './types';

interface TestNodeData {
  label: string;
}

interface TestEdgeData {
  weight: number;
}

describe('GraphologyAdapter', () => {
  it('creates an empty graph', () => {
    const model = new GraphologyAdapter();
    expect(model.nodeCount).toBe(0);
    expect(model.edgeCount).toBe(0);
  });

  it('adds and retrieves nodes', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    const node: Node<TestNodeData> = { id: 'a', data: { label: 'Node A' } };

    model.addNode(node);

    expect(model.nodeCount).toBe(1);
    expect(model.hasNode('a')).toBe(true);
    expect(model.getNode('a')).toEqual(node);
  });

  it('adds and retrieves edges', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });
    model.addNode({ id: 'b', data: { label: 'B' } });

    const edge: Edge<TestEdgeData> = { id: 'e1', source: 'a', target: 'b', data: { weight: 5 } };
    model.addEdge(edge);

    expect(model.edgeCount).toBe(1);
    expect(model.getEdge('e1')).toEqual(edge);
    expect(model.hasEdge('a', 'b')).toBe(true);
  });

  it('updates node properties', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });

    model.updateNode('a', { data: { label: 'Updated' } });

    const updated = model.getNode('a');
    expect(updated?.data.label).toBe('Updated');
  });

  it('removes nodes and connected edges', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });
    model.addNode({ id: 'b', data: { label: 'B' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'b', data: { weight: 1 } });

    model.removeNode('a');

    expect(model.nodeCount).toBe(1);
    expect(model.edgeCount).toBe(0);
  });

  it('iterates over nodes and edges', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });
    model.addNode({ id: 'b', data: { label: 'B' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'b', data: { weight: 1 } });

    const nodeIds = [...model.nodes()].map((n) => n.id);
    const edgeIds = [...model.edges()].map((e) => e.id);

    expect(nodeIds).toContain('a');
    expect(nodeIds).toContain('b');
    expect(edgeIds).toContain('e1');
  });

  it('exports and imports graph data', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });
    model.addNode({ id: 'b', data: { label: 'B' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'b', data: { weight: 5 } });

    const exported = model.export();

    const newModel = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    newModel.import(exported);

    expect(newModel.nodeCount).toBe(2);
    expect(newModel.edgeCount).toBe(1);
    expect(newModel.getNode('a')?.data.label).toBe('A');
  });

  it('emits events on node changes', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    const onNodeAdded = vi.fn();

    model.on('nodeAdded', onNodeAdded);
    model.addNode({ id: 'a', data: { label: 'A' } });

    expect(onNodeAdded).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a', data: { label: 'A' } })
    );
  });

  it('clears all nodes and edges', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });
    model.addNode({ id: 'b', data: { label: 'B' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'b', data: { weight: 1 } });

    model.clear();

    expect(model.nodeCount).toBe(0);
    expect(model.edgeCount).toBe(0);
  });

  it('removes edges', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });
    model.addNode({ id: 'b', data: { label: 'B' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'b', data: { weight: 1 } });

    model.removeEdge('e1');

    expect(model.edgeCount).toBe(0);
    expect(model.getEdge('e1')).toBeUndefined();
  });

  it('updates edge properties', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });
    model.addNode({ id: 'b', data: { label: 'B' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'b', data: { weight: 1 } });

    model.updateEdge('e1', { data: { weight: 10 } });

    const updated = model.getEdge('e1');
    expect(updated?.data.weight).toBe(10);
  });

  it('gets edges connected to a node', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    model.addNode({ id: 'a', data: { label: 'A' } });
    model.addNode({ id: 'b', data: { label: 'B' } });
    model.addNode({ id: 'c', data: { label: 'C' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'b', data: { weight: 1 } });
    model.addEdge({ id: 'e2', source: 'a', target: 'c', data: { weight: 2 } });

    const edges = model.getNodeEdges('a');

    expect(edges).toHaveLength(2);
    expect(edges.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
  });

  it('unsubscribes from events with off', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    const onNodeAdded = vi.fn();

    model.on('nodeAdded', onNodeAdded);
    model.addNode({ id: 'a', data: { label: 'A' } });
    expect(onNodeAdded).toHaveBeenCalledTimes(1);

    model.off('nodeAdded', onNodeAdded);
    model.addNode({ id: 'b', data: { label: 'B' } });
    expect(onNodeAdded).toHaveBeenCalledTimes(1);
  });

  it('returns undefined for non-existent edge', () => {
    const model = new GraphologyAdapter<TestNodeData, TestEdgeData>();
    expect(model.getEdge('nonexistent')).toBeUndefined();
  });
});

describe('createGraphModel', () => {
  it('creates a GraphologyAdapter instance', () => {
    const model = createGraphModel<TestNodeData, TestEdgeData>();

    model.addNode({ id: 'a', data: { label: 'A' } });
    expect(model.nodeCount).toBe(1);
    expect(model.getNode('a')?.data.label).toBe('A');
  });
});
