import Graph from 'graphology';
import type { GraphEventMap, GraphEventType, GraphModel } from './GraphModel';
import type { Edge, GraphData, Node } from './types';

type Listener<N, E, K extends GraphEventType> = (payload: GraphEventMap<N, E>[K]) => void;

export class GraphologyAdapter<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> implements GraphModel<N, E> {
  private graph: Graph;
  private listeners = new Map<GraphEventType, Set<Listener<N, E, GraphEventType>>>();

  constructor() {
    this.graph = new Graph();
    this.setupGraphListeners();
  }

  get nodeCount(): number {
    return this.graph.order;
  }

  get edgeCount(): number {
    return this.graph.size;
  }

  addNode(node: Node<N>): void {
    this.graph.addNode(node.id, { data: node.data });
  }

  removeNode(id: string): void {
    this.graph.dropNode(id);
  }

  getNode(id: string): Node<N> | undefined {
    if (!this.graph.hasNode(id)) return undefined;
    return this.toNode(id);
  }

  hasNode(id: string): boolean {
    return this.graph.hasNode(id);
  }

  updateNode(id: string, updates: Partial<Node<N>>): void {
    if (updates.data !== undefined) this.graph.setNodeAttribute(id, 'data', updates.data);
  }

  addEdge(edge: Edge<E>): void {
    this.graph.addEdgeWithKey(edge.id, edge.source, edge.target, { data: edge.data });
  }

  removeEdge(id: string): void {
    this.graph.dropEdge(id);
  }

  getEdge(id: string): Edge<E> | undefined {
    if (!this.graph.hasEdge(id)) return undefined;
    return this.toEdge(id);
  }

  hasEdge(source: string, target: string): boolean {
    return this.graph.hasEdge(source, target);
  }

  updateEdge(id: string, updates: Partial<Edge<E>>): void {
    if (updates.data !== undefined) this.graph.setEdgeAttribute(id, 'data', updates.data);
  }

  getNodeEdges(nodeId: string): Edge<E>[] {
    const edges: Edge<E>[] = [];
    this.graph.forEachEdge(nodeId, (id) => {
      edges.push(this.toEdge(id));
    });
    return edges;
  }

  *nodes(): Iterable<Node<N>> {
    for (const id of this.graph.nodes()) {
      yield this.toNode(id);
    }
  }

  *edges(): Iterable<Edge<E>> {
    for (const id of this.graph.edges()) {
      yield this.toEdge(id);
    }
  }

  clear(): void {
    this.graph.clear();
  }

  import(graphData: GraphData<N, E>): void {
    this.graph.clear();
    for (const node of graphData.nodes) {
      this.addNode(node);
    }
    for (const edge of graphData.edges) {
      this.addEdge(edge);
    }
  }

  export(): GraphData<N, E> {
    const nodes: Node<N>[] = [];
    const edges: Edge<E>[] = [];
    for (const node of this.nodes()) nodes.push(node);
    for (const edge of this.edges()) edges.push(edge);
    return { nodes, edges };
  }

  on<K extends GraphEventType>(event: K, callback: Listener<N, E, K>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(callback as Listener<N, E, GraphEventType>);
    }
  }

  off<K extends GraphEventType>(event: K, callback: Listener<N, E, K>): void {
    this.listeners.get(event)?.delete(callback as Listener<N, E, GraphEventType>);
  }

  private emit<K extends GraphEventType>(event: K, payload: GraphEventMap<N, E>[K]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        cb(payload);
      }
    }
  }

  private toNode(id: string): Node<N> {
    const attrs = this.graph.getNodeAttributes(id);
    return {
      id,
      data: attrs.data as N,
    };
  }

  private toEdge(id: string): Edge<E> {
    const source = this.graph.source(id);
    const target = this.graph.target(id);
    const attrs = this.graph.getEdgeAttributes(id);
    return {
      id,
      source,
      target,
      data: attrs.data as E,
    };
  }

  private setupGraphListeners(): void {
    this.graph.on('nodeAdded', ({ key }) => {
      this.emit('nodeAdded', this.toNode(key));
    });

    this.graph.on('nodeDropped', ({ key }) => {
      this.emit('nodeRemoved', key);
    });

    this.graph.on('nodeAttributesUpdated', ({ key }) => {
      this.emit('nodeUpdated', this.toNode(key));
    });

    this.graph.on('edgeAdded', ({ key }) => {
      this.emit('edgeAdded', this.toEdge(key));
    });

    this.graph.on('edgeDropped', ({ key }) => {
      this.emit('edgeRemoved', key);
    });

    this.graph.on('cleared', () => {
      this.emit('cleared', undefined);
    });
  }
}

export function createGraphModel<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
>(): GraphModel<N, E> {
  return new GraphologyAdapter<N, E>();
}
