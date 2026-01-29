/**
 * Edge-related type definitions.
 */

import type { Gradient, HexColor, LabelStyle, Position } from './common';

/** Supported edge curve styles. */
export type EdgeCurveStyle =
  | 'straight'
  | 'bezier'
  | 'unbundled-bezier'
  | 'segments'
  | 'taxi'
  | 'arc';

/** Edge line styles. */
export type EdgeLineStyle = 'solid' | 'dashed' | 'dotted';

/** Arrow shape types. */
export type ArrowShape =
  | 'triangle'
  | 'triangle-tee'
  | 'triangle-cross'
  | 'vee'
  | 'chevron'
  | 'tee'
  | 'bar'
  | 'circle'
  | 'diamond'
  | 'square'
  | 'none';

/** Arrow fill style. */
export type ArrowFill = 'filled' | 'hollow';

/** Arrow configuration. */
export interface ArrowStyle {
  shape: ArrowShape;
  size?: number;
  color?: HexColor;
  fill?: ArrowFill;
}

/** Animated flow configuration for edges. */
export interface EdgeFlow {
  enabled: boolean;
  color?: HexColor;
  /** Speed in pixels per second. */
  speed?: number;
  width?: number;
  gap?: number;
  direction?: 'forward' | 'reverse';
}

/** Edge label position options. */
export type EdgeLabelPosition = 'center' | 'source' | 'target';

/** Edge label configuration. */
export interface EdgeLabelStyle extends Omit<LabelStyle, 'position'> {
  position?: EdgeLabelPosition;
  offset?: number;
}

/**
 * Complete visual style for an edge.
 */
export interface EdgeVisualStyle {
  // === Curve ===
  curveStyle?: EdgeCurveStyle;
  curvature?: number;
  /** Control points for unbundled-bezier or segments. */
  controlPoints?: Position[];
  /** Direction for taxi edges. */
  taxiDirection?: 'horizontal' | 'vertical' | 'auto';
  /** Turn distance for taxi edges (0-1). */
  taxiTurn?: number;
  /** Corner radius for taxi edges. */
  cornerRadius?: number;

  // === Line ===
  width?: number;
  color?: HexColor;
  style?: EdgeLineStyle;
  /** Custom dash pattern (e.g., [5, 3] for 5px dash, 3px gap). */
  dashPattern?: number[];

  // === Gradient ===
  gradient?: Gradient;

  // === Animated Flow ===
  flow?: EdgeFlow;

  // === Arrows ===
  sourceArrow?: ArrowStyle;
  targetArrow?: ArrowStyle;
  midArrow?: ArrowStyle;

  // === Label ===
  label?: EdgeLabelStyle;

  // === State ===
  opacity?: number;
  visible?: boolean;
  zIndex?: number;
}

/**
 * Represents an edge in the graph.
 */
export interface Edge<T = Record<string, unknown>> {
  id: string;
  source: string;
  target: string;
  data: T;
}

/**
 * State information for an edge during rendering.
 */
export interface EdgeRenderState {
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  sourceIsSelected: boolean;
  targetIsSelected: boolean;
  sourceIsHovered: boolean;
  targetIsHovered: boolean;
}

/**
 * Function that computes edge style based on edge data and render state.
 */
export type EdgeStyleFn<E = Record<string, unknown>> = (
  edge: Edge<E>,
  state: EdgeRenderState
) => EdgeVisualStyle;

/** Default edge visual style values. */
export const DEFAULT_EDGE_STYLE: Required<
  Pick<EdgeVisualStyle, 'curveStyle' | 'width' | 'color' | 'style' | 'opacity' | 'visible'>
> = {
  curveStyle: 'straight',
  width: 1,
  color: 0x999999,
  style: 'solid',
  opacity: 0.6,
  visible: true,
};
