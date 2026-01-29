import { describe, expect, it } from 'vitest';
import { GraphologyAdapter } from '../model/GraphologyAdapter';
import type { Node, PositionMap } from '../model/types';
import { buildClustersFromAttributes, buildClustersFromCommunity } from './ClusterBuilder';

const createGraphModel = <N, E = Record<string, unknown>>(): GraphologyAdapter<N, E> =>
  new GraphologyAdapter<N, E>();

describe('ClusterBuilder functions', () => {
  describe('buildClustersFromCommunity', () => {
    it('should create clusters from community assignments', () => {
      const model = createGraphModel<{ community: number }>();
      model.addNode({ id: 'a', data: { community: 0 } });
      model.addNode({ id: 'b', data: { community: 0 } });
      model.addNode({ id: 'c', data: { community: 1 } });

      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );

      expect(hierarchy.clusters.size).toBe(2);
      expect(hierarchy.clusters.get('cluster_0')?.children).toEqual(['a', 'b']);
      expect(hierarchy.clusters.get('cluster_1')?.children).toEqual(['c']);
    });

    it('should compute cluster positions from node positions', () => {
      const model = createGraphModel<{ community: number }>();
      model.addNode({ id: 'a', data: { community: 0 } });
      model.addNode({ id: 'b', data: { community: 0 } });

      const positions: PositionMap = new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 100, y: 100 }],
      ]);

      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community,
        positions
      );

      const cluster = hierarchy.clusters.get('cluster_0');
      expect(cluster?.x).toBe(50); // Center of 0 and 100
      expect(cluster?.y).toBe(50);
    });

    it('should handle empty positions gracefully', () => {
      const model = createGraphModel<{ community: number }>();
      model.addNode({ id: 'a', data: { community: 0 } });

      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );

      const cluster = hierarchy.clusters.get('cluster_0');
      expect(cluster?.x).toBe(0);
      expect(cluster?.y).toBe(0);
    });

    it('should build cluster edges between communities', () => {
      const model = createGraphModel<{ community: number }>();
      model.addNode({ id: 'a', data: { community: 0 } });
      model.addNode({ id: 'b', data: { community: 1 } });
      model.addEdge({ id: 'e1', source: 'a', target: 'b', data: {} });

      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );

      const clusterEdges = hierarchy.clusterEdges.get(0);
      expect(clusterEdges).toBeDefined();
      expect(clusterEdges?.length).toBe(1);
      expect(clusterEdges?.[0]?.edges).toEqual(['e1']);
    });

    it('should not create cluster edges for internal edges', () => {
      const model = createGraphModel<{ community: number }>();
      model.addNode({ id: 'a', data: { community: 0 } });
      model.addNode({ id: 'b', data: { community: 0 } });
      model.addEdge({ id: 'e1', source: 'a', target: 'b', data: {} });

      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );

      const clusterEdges = hierarchy.clusterEdges.get(0);
      expect(clusterEdges?.length).toBe(0);
    });

    it('should map nodes to their clusters', () => {
      const model = createGraphModel<{ community: number }>();
      model.addNode({ id: 'a', data: { community: 0 } });
      model.addNode({ id: 'b', data: { community: 1 } });

      const hierarchy = buildClustersFromCommunity(
        model,
        (node: Node<{ community: number }>) => node.data.community
      );

      expect(hierarchy.nodeToCluster.get('a')).toEqual(['cluster_0']);
      expect(hierarchy.nodeToCluster.get('b')).toEqual(['cluster_1']);
    });
  });

  describe('buildClustersFromAttributes', () => {
    it('should create hierarchy from cluster attributes', () => {
      const model = createGraphModel<{ cluster_level_0: string }>();
      model.addNode({ id: 'a', data: { cluster_level_0: 'c0' } });
      model.addNode({ id: 'b', data: { cluster_level_0: 'c0' } });
      model.addNode({ id: 'c', data: { cluster_level_0: 'c1' } });

      const hierarchy = buildClustersFromAttributes(model, { maxLevel: 0 });

      expect(hierarchy.clusters.size).toBe(2);
      expect(hierarchy.clusters.get('c0')?.children).toEqual(['a', 'b']);
      expect(hierarchy.clusters.get('c1')?.children).toEqual(['c']);
    });

    it('should handle multi-level hierarchies', () => {
      const model = createGraphModel<{ cluster_level_0: string; cluster_level_1: string }>();
      model.addNode({ id: 'a', data: { cluster_level_0: 'region_a', cluster_level_1: 'city_1' } });
      model.addNode({ id: 'b', data: { cluster_level_0: 'region_a', cluster_level_1: 'city_2' } });

      const hierarchy = buildClustersFromAttributes(model, { maxLevel: 1 });

      expect(hierarchy.maxLevel).toBe(1);
      expect(hierarchy.clusters.get('region_a')?.children).toEqual(['a', 'b']);
      expect(hierarchy.clusters.get('city_1')?.children).toEqual(['a']);
      expect(hierarchy.clusters.get('city_2')?.children).toEqual(['b']);
    });

    it('should set parent cluster correctly', () => {
      const model = createGraphModel<{ cluster_level_0: string; cluster_level_1: string }>();
      model.addNode({ id: 'a', data: { cluster_level_0: 'region_a', cluster_level_1: 'city_1' } });

      const hierarchy = buildClustersFromAttributes(model, { maxLevel: 1 });

      const city = hierarchy.clusters.get('city_1');
      expect(city?.parent).toBe('region_a');
    });
  });
});
