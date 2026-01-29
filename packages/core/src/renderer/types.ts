import type { Edge, Node, PositionMap } from '../model/types';
import type { NodeShape, ResolvedEdgeVisuals, ResolvedNodeVisuals } from './shapes';

/**
 * Visual styling options for nodes.
 */
export interface NodeStyle {
  /** Node radius in pixels */
  radius: number;
  /** Fill color as hex number (e.g., 0x4a90d9) */
  fill: number;
  /** Fill opacity (0-1) */
  fillAlpha: number;
  /** Stroke/border color as hex number */
  stroke: number;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Stroke opacity (0-1) */
  strokeAlpha: number;
}

/**
 * Visual styling options for edges.
 */
export interface EdgeStyle {
  /** Edge line width in pixels */
  width: number;
  /** Edge color as hex number (e.g., 0x999999) */
  color: number;
  /** Edge opacity (0-1) */
  alpha: number;
}

/**
 * Configuration options for the renderer.
 */
export interface RenderConfig {
  /** Default style applied to all nodes */
  nodeStyle: NodeStyle;
  /** Default style applied to all edges */
  edgeStyle: EdgeStyle;
  /** Canvas background color as hex number */
  backgroundColor: number;
  /**
   * Node count threshold for simplified rendering mode.
   * Above this threshold, nodes render without strokes and at 60% radius.
   * @default 1000
   */
  largeGraphThreshold: number;
}

/**
 * Function that determines a node's visual style based on its data.
 * Return partial styles - unspecified properties use defaults.
 * @typeParam N - Node data type
 */
export type NodeStyleFn<N> = (node: { id: string; data: N }) => Partial<ResolvedNodeVisuals>;

/**
 * Function that determines an edge's visual style based on its data.
 * Return partial styles - unspecified properties use defaults.
 * @typeParam E - Edge data type
 */
export type EdgeStyleFn<E> = (edge: Edge<E>) => Partial<ResolvedEdgeVisuals>;

/**
 * State for highlight effects during hover/selection.
 */
export interface HighlightState {
  /** ID of the currently hovered node */
  hoveredNodeId?: string;
  /** IDs of currently selected nodes */
  selectedNodeIds: Set<string>;
  /** Whether to highlight neighbors of hovered/selected nodes */
  shouldHighlightNeighbors: boolean;
  /** Opacity for non-highlighted (dimmed) elements (0-1) */
  dimOpacity: number;
}

export type { NodeShape, ResolvedNodeVisuals, ResolvedEdgeVisuals };

/**
 * Represents the current viewport state (pan and zoom).
 */
export interface Viewport {
  /** Horizontal pan offset in pixels */
  x: number;
  /** Vertical pan offset in pixels */
  y: number;
  /** Zoom scale (1 = 100%, 2 = 200%) */
  scale: number;
}

/**
 * Result of a hit test operation.
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 */
export interface HitTestResult<N, E> {
  /** What type of element was hit */
  type: 'node' | 'edge' | 'canvas';
  /** The node that was hit (if type is 'node') */
  node?: Node<N>;
  /** The edge that was hit (if type is 'edge') */
  edge?: Edge<E>;
  /** World coordinates of the hit position */
  position: { x: number; y: number };
}

/**
 * Options for rendering operations.
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 */
export interface RenderOptions<N, E = Record<string, unknown>> {
  /** Function to customize node visuals (color, shape, size). */
  nodeStyleFn?: NodeStyleFn<N>;
  /** Function to customize edge visuals (color, width). */
  edgeStyleFn?: EdgeStyleFn<E>;
  /** Highlight state for hover/selection effects. */
  highlightState?: HighlightState;
  /** Map of node IDs to their neighbor IDs (for highlight effects). */
  adjacency?: Map<string, Set<string>>;
  /**
   * If true, user is actively interacting (panning/zooming).
   * Used for frame rate throttling during continuous interactions.
   */
  isInteracting?: boolean;
}

/**
 * Interface for graph rendering implementations.
 *
 * The Renderer is responsible for drawing nodes and edges to a canvas.
 * Implementations can use different rendering backends (WebGL, Canvas2D, SVG).
 *
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 */
export interface Renderer<N, E> {
  /** Mounts the renderer to a DOM container. */
  mount(container: HTMLElement): void | Promise<void>;
  /** Unmounts the renderer from its container. */
  unmount(): void;
  /** Resizes the rendering canvas. */
  resize(width: number, height: number): void;
  /** Renders all nodes and edges at their current positions. */
  render(
    nodes: Node<N>[],
    edges: Edge<E>[],
    positions: PositionMap,
    options?: RenderOptions<N, E>
  ): void;
  /** Updates the viewport (pan/zoom). */
  setViewport(viewport: Viewport): void;
  /** Returns the current viewport state. */
  getViewport(): Viewport;
  /** Performs hit testing at screen coordinates. */
  hitTest(x: number, y: number): HitTestResult<N, E>;
  /** Destroys the renderer and releases resources. */
  destroy(): void;
}

export const DEFAULT_NODE_STYLE: NodeStyle = {
  radius: 8,
  fill: 0x4a90d9,
  fillAlpha: 1,
  stroke: 0x2d5a87,
  strokeWidth: 2,
  strokeAlpha: 1,
};

export const DEFAULT_EDGE_STYLE: EdgeStyle = {
  width: 1,
  color: 0x999999,
  alpha: 0.8,
};

export const DEFAULT_RENDER_CONFIG: RenderConfig = {
  nodeStyle: DEFAULT_NODE_STYLE,
  edgeStyle: DEFAULT_EDGE_STYLE,
  backgroundColor: 0xffffff,
  largeGraphThreshold: 1000,
};
