import type { Edge, Node, Position, ResolvedNodeVisuals } from '@graphon/core';

/**
 * Props for the Graphon React component.
 *
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 *
 * @example
 * ```tsx
 * <Graphon
 *   nodes={[{ id: 'a', data: { label: 'A' } }]}
 *   edges={[{ id: 'e1', source: 'a', target: 'b', data: {} }]}
 *   width={800}
 *   height={600}
 *   onNodeClick={(node) => console.log('Clicked:', node.id)}
 * />
 * ```
 */
export interface GraphonProps<N = Record<string, unknown>, E = Record<string, unknown>> {
  /** Array of nodes to render */
  nodes: Node<N>[];
  /** Array of edges connecting nodes */
  edges: Edge<E>[];
  /** Canvas width in pixels @default 800 */
  width?: number;
  /** Canvas height in pixels @default 600 */
  height?: number;
  /** CSS class name for the container */
  className?: string;
  /** Inline styles for the container */
  style?: React.CSSProperties;
  /** Enable physics animation @default true */
  isAnimated?: boolean;
  /** Enable node dragging @default true */
  isDraggable?: boolean;
  /** Enable canvas panning (drag on empty space) @default true */
  isPannable?: boolean;
  /** Enable mouse wheel zooming @default true */
  isZoomable?: boolean;
  /** Minimum zoom scale @default 0.1 */
  minZoom?: number;
  /** Maximum zoom scale @default 4 */
  maxZoom?: number;
  /** Function to determine node visual style (color, shape, radius). */
  nodeStyleFn?: (node: Node<N>) => Partial<ResolvedNodeVisuals>;
  /** Function to determine node community for clustering */
  communityFn?: (node: Node<N>) => number;
  /**
   * Factory function to create the physics web worker.
   * Required for Vite and other bundlers that need explicit worker imports.
   * @example
   * ```tsx
   * import PhysicsWorker from '@graphon/core/physics.worker?worker';
   * <Graphon createWorkerFn={() => new PhysicsWorker()} ... />
   * ```
   */
  createWorkerFn?: () => Worker;
  /** Callback when a node is clicked */
  onNodeClick?: (node: Node<N>) => void;
  /** Callback when mouse hovers over/leaves a node */
  onNodeHover?: (node: Node<N> | undefined) => void;
  /** Callback while a node is being dragged */
  onNodeDrag?: (nodeId: string, position: Position) => void;
  /** Callback when node dragging ends */
  onNodeDragEnd?: (nodeId: string, position: Position) => void;
  /** Callback when an edge is clicked */
  onEdgeClick?: (edge: Edge<E>) => void;
  /** Callback when mouse hovers over/leaves an edge */
  onEdgeHover?: (edge: Edge<E> | undefined) => void;
  /** Callback when canvas (not node/edge) is clicked */
  onCanvasClick?: (position: Position) => void;
  /** Callback when zoom level changes (useful for LOD integration) */
  onZoomChange?: (zoom: number) => void;
}
