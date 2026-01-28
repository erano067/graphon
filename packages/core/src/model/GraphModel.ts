import type { Edge, GraphData, Node } from './types';

/**
 * Event payloads emitted by the GraphModel.
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 */
export interface GraphEventMap<N, E> {
  /** Emitted when a node is added to the graph */
  nodeAdded: Node<N>;
  /** Emitted when a node is removed, payload is the node ID */
  nodeRemoved: string;
  /** Emitted when a node's data is updated */
  nodeUpdated: Node<N>;
  /** Emitted when an edge is added to the graph */
  edgeAdded: Edge<E>;
  /** Emitted when an edge is removed, payload is the edge ID */
  edgeRemoved: string;
  /** Emitted when an edge's data is updated */
  edgeUpdated: Edge<E>;
  /** Emitted when the graph is cleared */
  cleared: undefined;
}

/** Union type of all graph event names */
export type GraphEventType = keyof GraphEventMap<unknown, unknown>;

/**
 * Abstract interface for graph storage and manipulation.
 *
 * This is the core abstraction that all Graphon code depends on.
 * Implementations can be swapped without changing upper layers.
 *
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 * @example
 * ```ts
 * const model = createGraphModel<{ label: string }, { weight: number }>();
 * model.addNode({ id: 'a', data: { label: 'Node A' } });
 * model.addNode({ id: 'b', data: { label: 'Node B' } });
 * model.addEdge({ id: 'e1', source: 'a', target: 'b', data: { weight: 1 } });
 * ```
 */
export interface GraphModel<N = Record<string, unknown>, E = Record<string, unknown>> {
  /** Total number of nodes in the graph */
  readonly nodeCount: number;
  /** Total number of edges in the graph */
  readonly edgeCount: number;

  // --- Node Operations ---

  /** Adds a node to the graph. Emits 'nodeAdded' event. */
  addNode(node: Node<N>): void;
  /** Removes a node and all connected edges. Emits 'nodeRemoved' event. */
  removeNode(id: string): void;
  /** Returns the node with the given ID, or undefined if not found. */
  getNode(id: string): Node<N> | undefined;
  /** Checks if a node with the given ID exists. */
  hasNode(id: string): boolean;
  /** Updates a node's data. Emits 'nodeUpdated' event. */
  updateNode(id: string, updates: Partial<Node<N>>): void;

  // --- Edge Operations ---

  /** Adds an edge to the graph. Emits 'edgeAdded' event. */
  addEdge(edge: Edge<E>): void;
  /** Removes an edge. Emits 'edgeRemoved' event. */
  removeEdge(id: string): void;
  /** Returns the edge with the given ID, or undefined if not found. */
  getEdge(id: string): Edge<E> | undefined;
  /** Checks if an edge exists between source and target nodes. */
  hasEdge(source: string, target: string): boolean;
  /** Updates an edge's data. Emits 'edgeUpdated' event. */
  updateEdge(id: string, updates: Partial<Edge<E>>): void;
  /** Returns all edges connected to the given node. */
  getNodeEdges(nodeId: string): Edge<E>[];

  // --- Iteration ---

  /** Returns an iterable of all nodes. */
  nodes(): Iterable<Node<N>>;
  /** Returns an iterable of all edges. */
  edges(): Iterable<Edge<E>>;

  // --- Bulk Operations ---

  /** Removes all nodes and edges. Emits 'cleared' event. */
  clear(): void;
  /** Imports graph data, replacing existing content. */
  import(data: GraphData<N, E>): void;
  /** Exports the graph to a serializable format. */
  export(): GraphData<N, E>;

  // --- Events ---

  /** Subscribes to a graph event. */
  on<K extends keyof GraphEventMap<N, E>>(
    event: K,
    callback: (payload: GraphEventMap<N, E>[K]) => void
  ): void;
  /** Unsubscribes from a graph event. */
  off<K extends keyof GraphEventMap<N, E>>(
    event: K,
    callback: (payload: GraphEventMap<N, E>[K]) => void
  ): void;
}
