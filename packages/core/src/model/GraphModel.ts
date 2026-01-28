import type { Edge, GraphData, Node } from './types';

export interface GraphEventMap<N, E> {
  nodeAdded: Node<N>;
  nodeRemoved: string;
  nodeUpdated: Node<N>;
  edgeAdded: Edge<E>;
  edgeRemoved: string;
  edgeUpdated: Edge<E>;
  cleared: undefined;
}

export type GraphEventType = keyof GraphEventMap<unknown, unknown>;

export interface GraphModel<N = Record<string, unknown>, E = Record<string, unknown>> {
  readonly nodeCount: number;
  readonly edgeCount: number;

  addNode(node: Node<N>): void;
  removeNode(id: string): void;
  getNode(id: string): Node<N> | undefined;
  hasNode(id: string): boolean;
  updateNode(id: string, updates: Partial<Node<N>>): void;

  addEdge(edge: Edge<E>): void;
  removeEdge(id: string): void;
  getEdge(id: string): Edge<E> | undefined;
  hasEdge(source: string, target: string): boolean;
  updateEdge(id: string, updates: Partial<Edge<E>>): void;
  getNodeEdges(nodeId: string): Edge<E>[];

  nodes(): Iterable<Node<N>>;
  edges(): Iterable<Edge<E>>;

  clear(): void;
  import(data: GraphData<N, E>): void;
  export(): GraphData<N, E>;

  on<K extends keyof GraphEventMap<N, E>>(
    event: K,
    callback: (payload: GraphEventMap<N, E>[K]) => void
  ): void;
  off<K extends keyof GraphEventMap<N, E>>(
    event: K,
    callback: (payload: GraphEventMap<N, E>[K]) => void
  ): void;
}
