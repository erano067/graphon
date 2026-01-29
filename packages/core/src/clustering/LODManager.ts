import type { GraphModel } from '../model/GraphModel';
import {
  type ClusterEdge,
  type ClusterHierarchy,
  type ClusterNode,
  DEFAULT_LOD_CONFIG,
  type LODConfig,
} from './types';

/**
 * Set of elements to render at a given LOD level.
 */
export interface LODRenderSet {
  /** Individual node IDs to render */
  nodes: string[];
  /** Individual edge IDs to render */
  edges: string[];
  /** Clusters to render as super-nodes */
  clusters: ClusterNode[];
  /** Cluster edges to render */
  clusterEdges: ClusterEdge[];
  /** Current LOD level (0 = most zoomed out) */
  level: number;
}

/**
 * Manages Level of Detail rendering based on zoom level.
 *
 * At low zoom (zoomed out), shows cluster super-nodes.
 * At high zoom (zoomed in), shows individual nodes.
 */
export class LODManager<N = Record<string, unknown>, E = Record<string, unknown>> {
  private model: GraphModel<N, E>;
  private hierarchy: ClusterHierarchy | null = null;
  private config: LODConfig;
  private currentZoom = 1;
  private currentLevel = -1;

  constructor(model: GraphModel<N, E>, config?: Partial<LODConfig>) {
    this.model = model;
    this.config = { ...DEFAULT_LOD_CONFIG, ...config };
  }

  /** Set the cluster hierarchy */
  setHierarchy(hierarchy: ClusterHierarchy): void {
    this.hierarchy = hierarchy;
    this.currentLevel = -1;
  }

  /** Clear hierarchy (render all nodes individually) */
  clearHierarchy(): void {
    this.hierarchy = null;
    this.currentLevel = -1;
  }

  /** Get current hierarchy */
  getHierarchy(): ClusterHierarchy | null {
    return this.hierarchy;
  }

  /** Get current LOD level */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /** Get current zoom */
  getCurrentZoom(): number {
    return this.currentZoom;
  }

  /** Update zoom level and get what should be rendered */
  updateZoom(zoom: number): LODRenderSet {
    this.currentZoom = zoom;

    if (!this.hierarchy) {
      return this.getAllElements();
    }

    const level = this.zoomToLevel(zoom);
    this.currentLevel = level;

    return this.getRenderSet(level);
  }

  /** Get current render set without changing zoom */
  getCurrentRenderSet(): LODRenderSet {
    if (!this.hierarchy) {
      return this.getAllElements();
    }
    return this.getRenderSet(this.currentLevel);
  }

  /** Check if zoom change would trigger LOD change */
  wouldLevelChange(newZoom: number): boolean {
    return this.zoomToLevel(newZoom) !== this.currentLevel;
  }

  private zoomToLevel(zoom: number): number {
    const thresholds = this.config.zoomThresholds;

    for (const [i, threshold] of thresholds.entries()) {
      if (zoom < threshold) {
        return i;
      }
    }

    return thresholds.length; // Max detail
  }

  private getRenderSet(level: number): LODRenderSet {
    const { hierarchy } = this;
    if (!hierarchy || level > hierarchy.maxLevel) {
      return this.getAllElements();
    }

    const { clusters, expandedNodes, expandedNodeSet } = this.partitionClusters(hierarchy, level);
    const edges = this.getEdgesBetweenNodes(expandedNodeSet);
    const clusterEdges = hierarchy.clusterEdges.get(level) ?? [];

    return { nodes: expandedNodes, edges, clusters, clusterEdges, level };
  }

  private partitionClusters(
    hierarchy: ClusterHierarchy,
    level: number
  ): { clusters: ClusterNode[]; expandedNodes: string[]; expandedNodeSet: Set<string> } {
    const clusters: ClusterNode[] = [];
    const expandedNodes: string[] = [];
    const expandedNodeSet = new Set<string>();

    for (const cluster of hierarchy.clusters.values()) {
      if (cluster.level !== level) continue;
      if (cluster.size < this.config.minClusterSize) {
        this.expandClusterChildren(cluster, expandedNodes, expandedNodeSet);
      } else {
        clusters.push(cluster);
      }
    }

    return { clusters, expandedNodes, expandedNodeSet };
  }

  private expandClusterChildren(
    cluster: ClusterNode,
    expandedNodes: string[],
    expandedNodeSet: Set<string>
  ): void {
    for (const nodeId of cluster.children) {
      if (!expandedNodeSet.has(nodeId)) {
        expandedNodes.push(nodeId);
        expandedNodeSet.add(nodeId);
      }
    }
  }

  private getEdgesBetweenNodes(nodeSet: Set<string>): string[] {
    const edges: string[] = [];
    for (const edge of this.model.edges()) {
      if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
        edges.push(edge.id);
      }
    }
    return edges;
  }

  private getAllElements(): LODRenderSet {
    const nodes: string[] = [];
    const edges: string[] = [];

    for (const node of this.model.nodes()) {
      nodes.push(node.id);
    }
    for (const edge of this.model.edges()) {
      edges.push(edge.id);
    }

    return {
      nodes,
      edges,
      clusters: [],
      clusterEdges: [],
      level: this.hierarchy?.maxLevel ?? 0,
    };
  }
}
