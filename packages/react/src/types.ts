import type { Edge, Node, Position } from '@graphon/core';

export interface GraphonProps<N = Record<string, unknown>, E = Record<string, unknown>> {
  nodes: Node<N>[];
  edges: Edge<E>[];
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
  draggable?: boolean;
  nodeColorFn?: (node: Node<N>) => number;
  communityFn?: (node: Node<N>) => number;
  onNodeClick?: (node: Node<N>) => void;
  onNodeHover?: (node: Node<N> | undefined) => void;
  onNodeDrag?: (nodeId: string, position: Position) => void;
  onNodeDragEnd?: (nodeId: string, position: Position) => void;
  onEdgeClick?: (edge: Edge<E>) => void;
  onEdgeHover?: (edge: Edge<E> | undefined) => void;
  onCanvasClick?: (position: Position) => void;
}
