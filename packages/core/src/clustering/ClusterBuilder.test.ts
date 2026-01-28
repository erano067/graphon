import { describe, expect, it } from 'vitest';
import { createGraphModel } from '../model/GraphologyAdapter';
import type { PositionMap } from '../model/types';
import { ClusterBuilder } from './ClusterBuilder';

interface ClusterNodeData {
  cluster_level_0: string;
  cluster_level_1?: string;
  [key: string]: unknown;
}

describe('ClusterBuilder', () => {
  it('builds hierarchy from node cluster attributes', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'c0', cluster_level_1: 'c1a' } });
    model.addNode({ id: 'b', data: { cluster_level_0: 'c0', cluster_level_1: 'c1a' } });
    model.addNode({ id: 'c', data: { cluster_level_0: 'c0', cluster_level_1: 'c1b' } });
    model.addNode({ id: 'd', data: { cluster_level_0: 'c2' } });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });

    expect(hierarchy.maxLevel).toBe(1);
    expect(hierarchy.clusters.size).toBe(4); // c0, c1a, c1b, c2 across levels
  });

  it('calculates cluster positions as center of mass', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'c0' } });
    model.addNode({ id: 'b', data: { cluster_level_0: 'c0' } });

    const positions: PositionMap = new Map([
      ['a', { x: 0, y: 0 }],
      ['b', { x: 10, y: 20 }],
    ]);

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 0, positions });
    const cluster = hierarchy.clusters.get('c0');

    expect(cluster?.x).toBe(5);
    expect(cluster?.y).toBe(10);
  });

  it('sets correct cluster sizes', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'c0' } });
    model.addNode({ id: 'b', data: { cluster_level_0: 'c0' } });
    model.addNode({ id: 'c', data: { cluster_level_0: 'c0' } });
    model.addNode({ id: 'd', data: { cluster_level_0: 'c1' } });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 0 });

    expect(hierarchy.clusters.get('c0')?.size).toBe(3);
    expect(hierarchy.clusters.get('c1')?.size).toBe(1);
  });

  it('maps nodes to clusters correctly', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'c0', cluster_level_1: 'c1' } });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });
    const nodeClusters = hierarchy.nodeToCluster.get('a');

    expect(nodeClusters).toEqual(['c0', 'c1']);
  });

  it('builds cluster edges between different clusters', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'c0' } });
    model.addNode({ id: 'b', data: { cluster_level_0: 'c0' } });
    model.addNode({ id: 'c', data: { cluster_level_0: 'c1' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'c', data: {} });
    model.addEdge({ id: 'e2', source: 'b', target: 'c', data: {} });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 0 });
    const clusterEdges = hierarchy.clusterEdges.get(0) ?? [];
    const firstEdge = clusterEdges[0];

    expect(clusterEdges.length).toBe(1);
    expect(firstEdge?.weight).toBe(2);
    expect(firstEdge?.edges).toContain('e1');
    expect(firstEdge?.edges).toContain('e2');
  });

  it('excludes internal edges from cluster edges', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'c0' } });
    model.addNode({ id: 'b', data: { cluster_level_0: 'c0' } });
    model.addEdge({ id: 'e1', source: 'a', target: 'b', data: {} });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 0 });
    const clusterEdges = hierarchy.clusterEdges.get(0) ?? [];

    expect(clusterEdges.length).toBe(0);
  });

  it('sets parent cluster correctly', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'region', cluster_level_1: 'city' } });
    model.addNode({ id: 'b', data: { cluster_level_0: 'region', cluster_level_1: 'city' } });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });
    const cityCluster = hierarchy.clusters.get('city');

    expect(cityCluster?.parent).toBe('region');
  });

  it('handles nodes without cluster attributes', () => {
    const model = createGraphModel<Partial<ClusterNodeData>>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'c0' } });
    model.addNode({ id: 'b', data: {} });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 0 });

    expect(hierarchy.nodeToCluster.get('a')).toEqual(['c0']);
    expect(hierarchy.nodeToCluster.get('b')).toEqual([]);
  });

  it('sets position to 0,0 when no positions provided', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a', data: { cluster_level_0: 'c0' } });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 0 });
    const cluster = hierarchy.clusters.get('c0');

    expect(cluster?.x).toBe(0);
    expect(cluster?.y).toBe(0);
  });
});
