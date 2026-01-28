export interface Node<T = Record<string, unknown>> {
  id: string;
  data: T;
}

export interface Edge<T = Record<string, unknown>> {
  id: string;
  source: string;
  target: string;
  data: T;
}

export interface GraphData<N = Record<string, unknown>, E = Record<string, unknown>> {
  nodes: Node<N>[];
  edges: Edge<E>[];
}

export interface Position {
  x: number;
  y: number;
}

export type PositionMap = Map<string, Position>;
