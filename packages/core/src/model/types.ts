/**
 * Represents a node in the graph.
 * @typeParam T - The type of data attached to the node
 * @example
 * ```ts
 * const node: Node<{ label: string }> = {
 *   id: 'node-1',
 *   data: { label: 'My Node' }
 * };
 * ```
 */
export interface Node<T = Record<string, unknown>> {
  /** Unique identifier for the node */
  id: string;
  /** User-defined data attached to the node */
  data: T;
}

/**
 * Represents an edge (connection) between two nodes.
 * @typeParam T - The type of data attached to the edge
 * @example
 * ```ts
 * const edge: Edge<{ weight: number }> = {
 *   id: 'edge-1',
 *   source: 'node-1',
 *   target: 'node-2',
 *   data: { weight: 1.5 }
 * };
 * ```
 */
export interface Edge<T = Record<string, unknown>> {
  /** Unique identifier for the edge */
  id: string;
  /** ID of the source node */
  source: string;
  /** ID of the target node */
  target: string;
  /** User-defined data attached to the edge */
  data: T;
}

/**
 * Serializable graph data format for import/export operations.
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 */
export interface GraphData<N = Record<string, unknown>, E = Record<string, unknown>> {
  /** Array of all nodes in the graph */
  nodes: Node<N>[];
  /** Array of all edges in the graph */
  edges: Edge<E>[];
}

/**
 * A 2D position coordinate.
 */
export interface Position {
  /** X coordinate in pixels */
  x: number;
  /** Y coordinate in pixels */
  y: number;
}

/**
 * Maps node IDs to their positions.
 * Used for layout algorithms and rendering.
 */
export type PositionMap = Map<string, Position>;
