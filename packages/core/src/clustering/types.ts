/**
 * Cluster node in the hierarchy.
 * Represents a group of nodes at a specific level of detail.
 */
export interface ClusterNode {
  /** Cluster ID */
  id: string;
  /** Child node IDs (leaf nodes in this cluster) */
  children: string[];
  /** Hierarchy level (0 = most zoomed out, higher = more detail) */
  level: number;
  /** Parent cluster ID (null for root-level clusters) */
  parent: string | null;
  /** Number of leaf nodes in this cluster */
  size: number;
  /** X position (center of mass of children) */
  x: number;
  /** Y position (center of mass of children) */
  y: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Edge between clusters, aggregating multiple underlying edges.
 */
export interface ClusterEdge {
  /** Source cluster ID */
  source: string;
  /** Target cluster ID */
  target: string;
  /** Number of underlying edges this represents */
  weight: number;
  /** IDs of the actual edges aggregated */
  edges: string[];
}

/**
 * Complete cluster hierarchy for a graph.
 */
export interface ClusterHierarchy {
  /** All clusters by ID */
  clusters: Map<string, ClusterNode>;
  /** Edges between clusters at each level */
  clusterEdges: Map<number, ClusterEdge[]>;
  /** Maximum hierarchy depth */
  maxLevel: number;
  /** Map node ID to its cluster ID at each level */
  nodeToCluster: Map<string, string[]>;
}

/**
 * Configuration for Level of Detail rendering.
 */
export interface LODConfig {
  /** Zoom thresholds to switch levels (zoom value -> LOD level) */
  zoomThresholds: number[];
  /** Minimum cluster size to show as cluster (smaller show individual nodes) */
  minClusterSize: number;
  /** Enable smooth transitions between LOD levels */
  animateTransitions: boolean;
  /** Transition duration in ms */
  transitionDuration: number;
}

/** Default LOD configuration with 4 levels */
export const DEFAULT_LOD_CONFIG: LODConfig = {
  zoomThresholds: [0.1, 0.3, 0.6, 1.0],
  minClusterSize: 5,
  animateTransitions: true,
  transitionDuration: 300,
};
