/**
 * Layout-related type definitions.
 */

import type { Node } from './node';
import type { PositionMap } from './common';

/** Supported layout types. */
export type LayoutType =
  | 'none'
  | 'force'
  | 'circular'
  | 'grid'
  | 'hierarchical'
  | 'radial'
  | 'concentric';

/** Direction for hierarchical layouts. */
export type HierarchicalDirection = 'TB' | 'BT' | 'LR' | 'RL';

/** Base layout options shared by all layouts. */
export interface BaseLayoutOptions {
  /** Whether to fit viewport after layout. */
  fit?: boolean;
  /** Padding when fitting. */
  padding?: number;
  /** Whether to animate the transition. */
  animate?: boolean;
  /** Animation duration in ms. */
  animationDuration?: number;
}

/** Force layout options. */
export interface ForceLayoutOptions extends BaseLayoutOptions {
  type: 'force';
  /** Number of iterations. */
  iterations?: number;
  /** Overall force strength. */
  strength?: number;
  /** Ideal link distance. */
  linkDistance?: number;
  /** Node repulsion strength. */
  chargeStrength?: number;
  /** Center gravity strength. */
  centerStrength?: number;
}

/** Circular layout options. */
export interface CircularLayoutOptions extends BaseLayoutOptions {
  type: 'circular';
  /** Start angle in radians. */
  startAngle?: number;
  /** End angle in radians. */
  endAngle?: number;
  /** Circle radius. Auto-computed if not specified. */
  radius?: number;
  /** Sorting function for node order. */
  sort?: <N>(a: Node<N>, b: Node<N>) => number;
}

/** Grid layout options. */
export interface GridLayoutOptions extends BaseLayoutOptions {
  type: 'grid';
  /** Number of columns. Auto-computed if not specified. */
  columns?: number;
  /** Cell width. */
  cellWidth?: number;
  /** Cell height. */
  cellHeight?: number;
  /** Sorting function for node order. */
  sort?: <N>(a: Node<N>, b: Node<N>) => number;
}

/** Hierarchical (dagre-style) layout options. */
export interface HierarchicalLayoutOptions extends BaseLayoutOptions {
  type: 'hierarchical';
  /** Layout direction. */
  direction?: HierarchicalDirection;
  /** Vertical separation between levels. */
  levelSeparation?: number;
  /** Horizontal separation between nodes. */
  nodeSeparation?: number;
  /** Edge separation. */
  edgeSeparation?: number;
  /** Root node IDs. Auto-detected if not specified. */
  roots?: string[];
}

/** Radial layout options. */
export interface RadialLayoutOptions extends BaseLayoutOptions {
  type: 'radial';
  /** Center node ID. */
  center?: string;
  /** Start radius. */
  startRadius?: number;
  /** Radius increment per level. */
  levelRadius?: number;
}

/** Concentric layout options. */
export interface ConcentricLayoutOptions extends BaseLayoutOptions {
  type: 'concentric';
  /** Function to compute node's concentric level (higher = more central). */
  metric?: <N>(node: Node<N>) => number;
  /** Start angle in radians. */
  startAngle?: number;
  /** Minimum radius. */
  minRadius?: number;
  /** Level width (radius increment). */
  levelWidth?: number;
}

/** No layout (use node positions directly). */
export interface NoLayoutOptions extends BaseLayoutOptions {
  type: 'none';
}

/** Union of all layout options. */
export type LayoutOptions =
  | ForceLayoutOptions
  | CircularLayoutOptions
  | GridLayoutOptions
  | HierarchicalLayoutOptions
  | RadialLayoutOptions
  | ConcentricLayoutOptions
  | NoLayoutOptions;

/** Layout configuration (type string or full options). */
export type LayoutConfig = LayoutType | LayoutOptions;

/**
 * Layout interface for computing node positions.
 */
export interface Layout {
  /** Compute positions for nodes. */
  run<N>(nodes: Node<N>[], edges: { source: string; target: string }[]): PositionMap;
  /** Stop any running computation. */
  stop(): void;
}

/** Layout event callbacks. */
export interface LayoutCallbacks {
  onStart?: () => void;
  onProgress?: (progress: number) => void;
  onComplete?: (positions: PositionMap) => void;
}

/** Default force layout options. */
export const DEFAULT_FORCE_LAYOUT: ForceLayoutOptions = {
  type: 'force',
  iterations: 300,
  strength: 1,
  linkDistance: 30,
  chargeStrength: -30,
  centerStrength: 0.1,
  fit: true,
  padding: 50,
  animate: true,
  animationDuration: 500,
};
