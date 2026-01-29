import type { Position } from '../model/types';

/** Supported node shapes (legacy - 3 shapes for backward compatibility). */
export type NodeShape = 'circle' | 'square' | 'diamond';

/** Extended node shapes (new API - 15+ shapes). */
export type ExtendedNodeShape =
  | NodeShape
  | 'ellipse'
  | 'rectangle'
  | 'round-rectangle'
  | 'triangle'
  | 'round-triangle'
  | 'round-diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon'
  | 'star'
  | 'tag'
  | 'vee'
  | 'polygon';

/** Style properties resolved for a single node. */
export interface ResolvedNodeVisuals {
  color: number;
  radius: number;
  shape: ExtendedNodeShape;
  /** Whether the node is visible (default: true) */
  visible?: boolean;
  /** Node opacity 0-1 (default: 1) */
  alpha?: number;
  /** Stroke/border color override */
  strokeColor?: number;
  /** Stroke width override */
  strokeWidth?: number;
}

/** Edge curve style. */
export type EdgeCurveStyle =
  | 'straight'
  | 'bezier'
  | 'unbundled-bezier'
  | 'segments'
  | 'taxi'
  | 'arc';

/** Edge line style. */
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
export interface ArrowConfig {
  shape: ArrowShape;
  size?: number;
  color?: number;
  fill?: ArrowFill;
}

/** Taxi direction for taxi-style edges. */
export type TaxiDirection = 'horizontal' | 'vertical' | 'auto';

/** Style properties resolved for a single edge. */
export interface ResolvedEdgeVisuals {
  /** Edge color as hex number */
  color: number;
  /** Edge line width in pixels */
  width: number;
  /** Edge opacity 0-1 (default: 1) */
  alpha?: number;
  /** Whether the edge is visible (default: true) */
  visible?: boolean;
  /** Curve style */
  curveStyle?: EdgeCurveStyle;
  /** Curvature amount for bezier/arc (0-1) */
  curvature?: number;
  /** Control points for unbundled-bezier or segments */
  controlPoints?: Position[];
  /** Direction for taxi edges */
  taxiDirection?: TaxiDirection;
  /** Turn position for taxi edges (0-1) */
  taxiTurn?: number;
  /** Corner radius for taxi edges */
  cornerRadius?: number;
  /** Line style (solid, dashed, dotted) */
  lineStyle?: EdgeLineStyle;
  /** Custom dash pattern [dashLength, gapLength] */
  dashPattern?: number[];
  /** Arrow at source end */
  sourceArrow?: ArrowConfig;
  /** Arrow at target end */
  targetArrow?: ArrowConfig;
  /** Arrow at midpoint */
  midArrow?: ArrowConfig;
}

/** Default node visuals when not specified. */
export const DEFAULT_NODE_VISUALS: ResolvedNodeVisuals = {
  color: 0x4a90d9,
  radius: 8,
  shape: 'circle',
  visible: true,
  alpha: 1,
};

/** Default edge visuals when not specified. */
export const DEFAULT_EDGE_VISUALS: ResolvedEdgeVisuals = {
  color: 0x999999,
  width: 1,
  alpha: 0.6,
  visible: true,
};

/** Options for rectangle shapes. */
export interface RectOptions {
  width: number;
  height: number;
  cornerRadius?: number;
}

/** Options for ellipse shapes. */
export interface EllipseOptions {
  radiusX: number;
  radiusY: number;
}

/** Options for polygon shapes. */
export interface PolygonOptions {
  sides: number;
  rotation?: number;
}

/** Options for star shapes. */
export interface StarOptions {
  points: number;
  innerRadiusRatio: number;
}

/** Options for tag shapes. */
export interface TagOptions {
  width: number;
  height: number;
  pointLength?: number;
}

/** Options for extended shape drawing. */
export interface ExtendedShapeOptions {
  /** Ellipse: horizontal radius multiplier (default: 1.5) */
  ellipseRatioX?: number;
  /** Ellipse: vertical radius multiplier (default: 1) */
  ellipseRatioY?: number;
  /** Rectangle: width multiplier (default: 1.5) */
  rectWidthRatio?: number;
  /** Rectangle: height multiplier (default: 1) */
  rectHeightRatio?: number;
  /** Round shapes: corner radius ratio (0-1, default: 0.2) */
  cornerRadius?: number;
  /** Star: number of points (default: 5) */
  starPoints?: number;
  /** Star: inner radius ratio (0-1, default: 0.4) */
  starInnerRadius?: number;
  /** Custom polygon: number of sides */
  polygonSides?: number;
}

/** Options for drawExtendedShape function. */
export interface DrawExtendedShapeOptions {
  /** Positions to draw shapes at */
  positions: Position[];
  /** Shape radius */
  radius: number;
  /** Shape type to draw */
  shape: ExtendedNodeShape;
  /** Additional shape options */
  shapeOptions?: ExtendedShapeOptions;
}

/** Options for drawSingleShape function. */
export interface DrawSingleShapeOptions {
  /** Position to draw shape at */
  position: Position;
  /** Shape radius */
  radius: number;
  /** Shape type to draw */
  shape: ExtendedNodeShape;
  /** Additional shape options */
  shapeOptions?: ExtendedShapeOptions;
}

/** Helper to generate regular polygon points. */
export function getRegularPolygonPoints(
  center: Position,
  radius: number,
  options: PolygonOptions
): Position[] {
  const { sides, rotation = -Math.PI / 2 } = options;
  const points: Position[] = [];
  const angleStep = (Math.PI * 2) / sides;
  for (let i = 0; i < sides; i++) {
    const angle = rotation + i * angleStep;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    });
  }
  return points;
}
