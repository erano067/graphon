import { describe, expect, it } from 'vitest';
import { createGraphModel } from '../model/GraphologyAdapter';
import { ClusterBuilder } from './ClusterBuilder';
import { LODManager } from './LODManager';

interface ClusterNodeData {
  cluster_level_0: string;
  cluster_level_1?: string;
  [key: string]: unknown;
}

function createTestGraph() {
  const model = createGraphModel<ClusterNodeData>();

  // Create 10 nodes in 2 clusters at level 0
  for (let i = 0; i < 5; i++) {
    model.addNode({
      id: `a${i}`,
      data: { cluster_level_0: 'cluster_a', cluster_level_1: `sub_a${i % 2}` },
    });
  }
  for (let i = 0; i < 5; i++) {
    model.addNode({
      id: `b${i}`,
      data: { cluster_level_0: 'cluster_b', cluster_level_1: `sub_b${i % 2}` },
    });
  }

  // Add edges within and between clusters
  model.addEdge({ id: 'e1', source: 'a0', target: 'a1', data: {} });
  model.addEdge({ id: 'e2', source: 'b0', target: 'b1', data: {} });
  model.addEdge({ id: 'e3', source: 'a0', target: 'b0', data: {} });

  return model;
}

describe('LODManager', () => {
  it('returns all elements when no hierarchy is set', () => {
    const model = createTestGraph();
    const lod = new LODManager(model);

    const renderSet = lod.updateZoom(1);

    expect(renderSet.nodes.length).toBe(10);
    expect(renderSet.edges.length).toBe(3);
    expect(renderSet.clusters.length).toBe(0);
  });

  it('maps zoom to LOD level correctly', () => {
    const model = createTestGraph();
    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });
    const lod = new LODManager(model, { zoomThresholds: [0.2, 0.5, 0.8, 1.0] });
    lod.setHierarchy(hierarchy);

    lod.updateZoom(0.1);
    expect(lod.getCurrentLevel()).toBe(0);

    lod.updateZoom(0.3);
    expect(lod.getCurrentLevel()).toBe(1);

    lod.updateZoom(0.6);
    expect(lod.getCurrentLevel()).toBe(2);

    lod.updateZoom(1.5);
    expect(lod.getCurrentLevel()).toBe(4);
  });

  it('detects when level would change', () => {
    const model = createTestGraph();
    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });
    const lod = new LODManager(model, { zoomThresholds: [0.5, 1.0] });
    lod.setHierarchy(hierarchy);

    lod.updateZoom(0.3);
    expect(lod.wouldLevelChange(0.6)).toBe(true);
    expect(lod.wouldLevelChange(0.4)).toBe(false);
  });

  it('expands small clusters to individual nodes', () => {
    const model = createGraphModel<ClusterNodeData>();

    // Create a small cluster (2 nodes) and a large cluster (6 nodes)
    model.addNode({ id: 'a1', data: { cluster_level_0: 'small' } });
    model.addNode({ id: 'a2', data: { cluster_level_0: 'small' } });
    for (let i = 0; i < 6; i++) {
      model.addNode({ id: `b${i}`, data: { cluster_level_0: 'large' } });
    }

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 0 });
    const lod = new LODManager(model, { minClusterSize: 5 });
    lod.setHierarchy(hierarchy);

    const renderSet = lod.updateZoom(0.05);

    // Small cluster expanded to nodes, large cluster stays as cluster
    expect(renderSet.nodes).toContain('a1');
    expect(renderSet.nodes).toContain('a2');
    expect(renderSet.clusters.length).toBe(1);
    expect(renderSet.clusters[0]?.id).toBe('large');
  });

  it('includes edges between expanded nodes', () => {
    const model = createGraphModel<ClusterNodeData>();

    model.addNode({ id: 'a1', data: { cluster_level_0: 'small' } });
    model.addNode({ id: 'a2', data: { cluster_level_0: 'small' } });
    model.addEdge({ id: 'e1', source: 'a1', target: 'a2', data: {} });

    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 0 });
    const lod = new LODManager(model, { minClusterSize: 5 });
    lod.setHierarchy(hierarchy);

    const renderSet = lod.updateZoom(0.05);

    expect(renderSet.edges).toContain('e1');
  });

  it('returns cluster edges at current level', () => {
    const model = createTestGraph();
    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });
    const lod = new LODManager(model, { minClusterSize: 3 });
    lod.setHierarchy(hierarchy);

    const renderSet = lod.updateZoom(0.05);

    // Should have cluster edge between cluster_a and cluster_b
    expect(renderSet.clusterEdges.length).toBeGreaterThan(0);
  });

  it('returns all elements at max detail level', () => {
    const model = createTestGraph();
    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });
    const lod = new LODManager(model);
    lod.setHierarchy(hierarchy);

    const renderSet = lod.updateZoom(2.0);

    expect(renderSet.nodes.length).toBe(10);
    expect(renderSet.edges.length).toBe(3);
    expect(renderSet.clusters.length).toBe(0);
  });

  it('clears hierarchy and returns all elements', () => {
    const model = createTestGraph();
    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });
    const lod = new LODManager(model);

    lod.setHierarchy(hierarchy);
    lod.clearHierarchy();

    const renderSet = lod.updateZoom(0.05);

    expect(renderSet.nodes.length).toBe(10);
    expect(renderSet.clusters.length).toBe(0);
  });

  it('getCurrentRenderSet returns last computed set', () => {
    const model = createTestGraph();
    const hierarchy = ClusterBuilder.buildFromAttributes(model, { maxLevel: 1 });
    const lod = new LODManager(model);
    lod.setHierarchy(hierarchy);

    const first = lod.updateZoom(1.5);
    const second = lod.getCurrentRenderSet();

    expect(second).toEqual(first);
  });

  it('tracks zoom and level state', () => {
    const model = createTestGraph();
    const lod = new LODManager(model);

    lod.updateZoom(0.75);

    expect(lod.getCurrentZoom()).toBe(0.75);
  });
});
