/**
 * Node-related type definitions.
 */

import type { Gradient, HexColor, LabelStyle, Size } from './common';

/** Supported node shapes. */
export type NodeShape =
  // Basic
  | 'circle'
  | 'ellipse'
  | 'rectangle'
  | 'round-rectangle'
  // Triangular
  | 'triangle'
  | 'round-triangle'
  // Diamond/Rhombus
  | 'diamond'
  | 'round-diamond'
  // Polygons
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  // Special
  | 'star'
  | 'tag'
  | 'vee'
  // Custom
  | 'polygon';

/** Node decorator types. */
export type DecoratorType = 'badge' | 'dot' | 'icon' | 'spinner';

/** Decorator position on a node. */
export type DecoratorPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** A decorator displayed on a node (badge, dot, icon). */
export interface NodeDecorator {
  position: DecoratorPosition;
  type: DecoratorType;
  content?: string;
  color?: HexColor;
  size?: number;
}

/** Pie/donut slice definition. */
export interface PieSlice {
  value: number;
  color: HexColor;
}

/** Pie/donut chart configuration for a node. */
export interface PieChart {
  slices: PieSlice[];
  /** Inner radius for donut chart. 0 = pie, >0 = donut. */
  innerRadius?: number;
}

/** Image configuration for a node. */
export interface NodeImage {
  src: string;
  fit?: 'contain' | 'cover' | 'none';
  clip?: boolean;
  opacity?: number;
}

/** Icon configuration for a node. */
export interface NodeIcon {
  /** Unicode character or font icon code. */
  content: string;
  fontFamily?: string;
  color?: HexColor;
  size?: number;
}

/**
 * Complete visual style for a node.
 */
export interface NodeVisualStyle {
  // === Shape ===
  shape?: NodeShape;
  /** Custom polygon points for shape: 'polygon'. Array of [x, y] normalized to [-1, 1]. */
  polygonPoints?: [number, number][];

  // === Size ===
  size?: number | Size;

  // === Colors ===
  color?: HexColor;
  borderColor?: HexColor;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';

  // === Gradient ===
  gradient?: Gradient;

  // === Image & Icon ===
  image?: NodeImage;
  icon?: NodeIcon;

  // === Decorators ===
  decorators?: NodeDecorator[];

  // === Pie/Donut Chart ===
  pie?: PieChart;

  // === Label ===
  label?: LabelStyle;

  // === State ===
  opacity?: number;
  visible?: boolean;
  cursor?: string;
  zIndex?: number;
}

/**
 * Represents a node in the graph.
 */
export interface Node<T = Record<string, unknown>> {
  id: string;
  data: T;
  /** Initial or fixed x position. */
  x?: number;
  /** Initial or fixed y position. */
  y?: number;
  /** Parent cluster/combo ID for grouping. */
  parent?: string;
  /** Community ID for auto-clustering. */
  communityId?: string;
}

/**
 * State information for a node during rendering.
 * Passed to style functions to enable state-based styling.
 */
export interface NodeRenderState {
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  isFocused: boolean;
  isNeighborOfSelected: boolean;
  isNeighborOfHovered: boolean;
  isExpanded: boolean;
  isCollapsed: boolean;
  isLoading: boolean;
  isExpandable: boolean;
}

/**
 * Function that computes node style based on node data and render state.
 */
export type NodeStyleFn<N = Record<string, unknown>> = (
  node: Node<N>,
  state: NodeRenderState
) => NodeVisualStyle;

/** Default node visual style values. */
export const DEFAULT_NODE_STYLE: Required<
  Pick<NodeVisualStyle, 'shape' | 'size' | 'color' | 'opacity' | 'visible'>
> = {
  shape: 'circle',
  size: 16,
  color: 0x4a90d9,
  opacity: 1,
  visible: true,
};
