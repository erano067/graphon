/**
 * Cluster-related type definitions.
 */

import type { HexColor, LabelStyle } from './common';

/** Supported cluster shapes. */
export type ClusterShape = 'rectangle' | 'round-rectangle' | 'ellipse' | 'circle';

/** Badge configuration for showing node count. */
export interface ClusterCountBadge {
  visible: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  color?: HexColor;
  textColor?: HexColor;
}

/**
 * Visual style for a cluster.
 */
export interface ClusterVisualStyle {
  shape?: ClusterShape;
  padding?: number;
  color?: HexColor;
  borderColor?: HexColor;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  label?: LabelStyle;
  countBadge?: ClusterCountBadge;
  opacity?: number;
}

/**
 * Represents a cluster (group of nodes).
 */
export interface Cluster {
  id: string;
  label?: string;
  /** Parent cluster ID for nested clusters. */
  parent?: string;
  /** Node IDs in this cluster (computed for auto-clusters). */
  nodeIds?: string[];
}

/**
 * State information for a cluster during rendering.
 */
export interface ClusterRenderState {
  isExpanded: boolean;
  isCollapsed: boolean;
  isSelected: boolean;
  isHovered: boolean;
  nodeCount: number;
  edgeCount: number;
}

/**
 * Function that computes cluster style based on cluster data and render state.
 */
export type ClusterStyleFn = (cluster: Cluster, state: ClusterRenderState) => ClusterVisualStyle;

/**
 * Clustering configuration.
 */
export interface ClusteringConfig<N = Record<string, unknown>> {
  enabled: boolean;
  /** Field name or function to group nodes. */
  groupBy: 'communityId' | ((node: { id: string; data: N; communityId?: string }) => string | null);
  /** Whether clusters start expanded. */
  defaultExpanded?: boolean;
  /** Minimum nodes to form a cluster. */
  minSize?: number;
  /** Show node count badge on collapsed clusters. */
  showCount?: boolean;
}

/** Default cluster visual style. */
export const DEFAULT_CLUSTER_STYLE: Required<
  Pick<
    ClusterVisualStyle,
    'shape' | 'padding' | 'color' | 'borderColor' | 'borderWidth' | 'opacity'
  >
> = {
  shape: 'round-rectangle',
  padding: 20,
  color: 0xf3f4f6,
  borderColor: 0xd1d5db,
  borderWidth: 2,
  opacity: 1,
};
