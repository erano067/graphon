/**
 * Common types used throughout the Graphon library.
 */

/** A 2D position coordinate. */
export interface Position {
  x: number;
  y: number;
}

/** A size with width and height. */
export interface Size {
  width: number;
  height: number;
}

/** A bounding box in 2D space. */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Maps node IDs to their positions. */
export type PositionMap = Map<string, Position>;

/** A color represented as a hex number (e.g., 0xff0000 for red). */
export type HexColor = number;

/** Gradient stop definition. */
export interface GradientStop {
  offset: number;
  color: HexColor;
}

/** Gradient configuration. */
export interface Gradient {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  /** Angle in degrees for linear gradients. */
  angle?: number;
}

/** Label configuration. */
export interface LabelStyle {
  text: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  color?: HexColor;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  /** Background behind the label. */
  background?: {
    color: HexColor;
    padding?: number;
    borderRadius?: number;
  };
  /** Maximum width before text wrapping. */
  maxWidth?: number;
  /** Whether label is visible. 'auto' = LOD-based visibility. */
  visible?: boolean | 'auto';
  /** Rotation in radians. 'auto' = align with edge. */
  rotation?: 'auto' | number;
}
