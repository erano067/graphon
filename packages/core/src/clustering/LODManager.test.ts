import { describe, expect, it } from 'vitest';
import { GraphologyAdapter } from '../model/GraphologyAdapter';
import type { Node } from '../model/types';
import { buildClustersFromCommunity } from './ClusterBuilder';
import { LODManager } from './LODManager';

const createGraphModel = <N, E = Record<string, unknown>>(): GraphologyAdapter<N, E> =>
  new GraphologyAdapter<N, E>();

function createTestModel(): ReturnType<typeof createGraphModel<{ community: number }>> {
  const model = createGraphModel<{ community: number }>();
  // Community 0: 5 nodes
  model.addNode({ id: 'a1', data: { community: 0 } });
  model.addNode({ id: 'a2', data: { community: 0 } });
  model.addNode({ id: 'a3', data: { community: 0 } });
  model.addNode({ id: 'a4', data: { community: 0 } });
  model.addNode({ id: 'a5', data: { community: 0 } });
  // Community 1: 3 nodes
  model.addNode({ id: 'b1', data: { community: 1 } });
  model.addNode({ id: 'b2', data: { community: 1 } });
  model.addNode({ id: 'b3', data: { community: 1 } });
  // Community 2: 2 nodes (too small for clustering with minClusterSize=3)
  model.addNode({ id: 'c1', data: { community: 2 } });
  model.addNode({ id: 'c2', data: { community: 2 } });
  // Edges
  model.addEdge({ id: 'e1', source: 'a1', target: 'a2', data: {} });
  model.addEdge({ id: 'e2', source: 'a1', target: 'b1', data: {} });
  model.addEdge({ id: 'e3', source: 'b1', target: 'c1', data: {} });
  return model;
}

describe('LODManager', () => {
  describe('without hierarchy', () => {
    it('should return all nodes and edges', () => {
      const model = createTestModel();
      const lod = new LODManager(model);

      const renderSet = lod.updateZoom(1.0);

      expect(renderSet.nodes.length).toBe(10);
      expect(renderSet.edges.length).toBe(3);
      expect(renderSet.clusters.length).toBe(0);
    });
  });

  describe('with hierarchy', () => {
    it('should return clusters at low zoom', () => {
      const model = createTestModel();
      const lod = new LODManager(model, { zoomThresholds: [0.5, 1.0], minClusterSize: 3 });
      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );
      lod.setHierarchy(hierarchy);

      const renderSet = lod.updateZoom(0.3); // Below first threshold

      // Should have 2 clusters (community 0 and 1 have >= 3 nodes)
      // Community 2 has only 2 nodes, so should show individual nodes
      expect(renderSet.clusters.length).toBe(2);
      expect(renderSet.nodes).toContain('c1');
      expect(renderSet.nodes).toContain('c2');
      expect(renderSet.level).toBe(0);
    });

    it('should return all nodes at high zoom', () => {
      const model = createTestModel();
      const lod = new LODManager(model, { zoomThresholds: [0.5, 1.0], minClusterSize: 3 });
      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );
      lod.setHierarchy(hierarchy);

      const renderSet = lod.updateZoom(1.5); // Above all thresholds

      expect(renderSet.nodes.length).toBe(10);
      expect(renderSet.clusters.length).toBe(0);
    });

    it('should detect when zoom would change LOD level', () => {
      const model = createTestModel();
      const lod = new LODManager(model, { zoomThresholds: [0.5, 1.0] });
      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );
      lod.setHierarchy(hierarchy);

      lod.updateZoom(0.3); // Level 0

      expect(lod.wouldLevelChange(0.6)).toBe(true); // Would go to level 1
      expect(lod.wouldLevelChange(0.4)).toBe(false); // Still level 0
    });

    it('should clear hierarchy and show all nodes', () => {
      const model = createTestModel();
      const lod = new LODManager(model, { zoomThresholds: [0.5, 1.0], minClusterSize: 3 });
      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );
      lod.setHierarchy(hierarchy);
      lod.updateZoom(0.3);

      lod.clearHierarchy();
      const renderSet = lod.getCurrentRenderSet();

      expect(renderSet.nodes.length).toBe(10);
      expect(renderSet.clusters.length).toBe(0);
    });
  });

  describe('zoomToLevel mapping', () => {
    it('should map zoom to correct LOD level', () => {
      const model = createTestModel();
      const lod = new LODManager(model, { zoomThresholds: [0.2, 0.5, 0.8, 1.0] });
      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );
      lod.setHierarchy(hierarchy);

      lod.updateZoom(0.1);
      expect(lod.getCurrentLevel()).toBe(0);

      lod.updateZoom(0.3);
      expect(lod.getCurrentLevel()).toBe(1);

      lod.updateZoom(0.6);
      expect(lod.getCurrentLevel()).toBe(2);

      lod.updateZoom(0.9);
      expect(lod.getCurrentLevel()).toBe(3);

      lod.updateZoom(1.5);
      expect(lod.getCurrentLevel()).toBe(4); // Beyond all thresholds
    });
  });

  describe('cluster edges', () => {
    it('should include cluster edges at cluster level', () => {
      const model = createTestModel();
      const lod = new LODManager(model, { zoomThresholds: [0.5, 1.0], minClusterSize: 3 });
      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );
      lod.setHierarchy(hierarchy);

      const renderSet = lod.updateZoom(0.3);

      // Should have cluster edges between the clusters
      expect(renderSet.clusterEdges.length).toBeGreaterThan(0);
    });

    it('should include only edges between visible nodes', () => {
      const model = createTestModel();
      const lod = new LODManager(model, { zoomThresholds: [0.5, 1.0], minClusterSize: 3 });
      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );
      lod.setHierarchy(hierarchy);

      const renderSet = lod.updateZoom(0.3);

      // Only edges between expanded nodes (c1 and c2)
      // e3 connects b1 to c1, but b1 is in a cluster
      expect(renderSet.edges.length).toBe(0);
    });
  });
});
