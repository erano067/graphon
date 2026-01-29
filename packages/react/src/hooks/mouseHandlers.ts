import type { Edge, Node, PixiRenderer, Position } from '@graphon/core';
import type { GraphonRefs } from './useGraphonRefs';

// Re-export from split modules for convenience
export {
  handleDragStart,
  handleDragMove,
  handleDragEnd,
  type DragCallbacks,
  type DragMoveParams,
} from './dragHandlers';
export {
  handlePanStart,
  handlePanMove,
  handlePanEnd,
  handleZoom,
  type ZoomConfig,
  type ZoomOptions,
} from './panZoomHandlers';

export interface HandlerCallbacks<N, E> {
  onNodeClick: ((node: Node<N>) => void) | undefined;
  onNodeDoubleClick: ((node: Node<N>) => void) | undefined;
  onNodeHover: ((node: Node<N> | undefined) => void) | undefined;
  onNodeDrag: ((nodeId: string, position: Position) => void) | undefined;
  onNodeDragEnd: ((nodeId: string, position: Position) => void) | undefined;
  onEdgeClick: ((edge: Edge<E>) => void) | undefined;
  onEdgeHover: ((edge: Edge<E> | undefined) => void) | undefined;
  onCanvasClick: ((position: Position) => void) | undefined;
  onZoomChange: ((zoom: number) => void) | undefined;
}

export function getMousePos(event: React.MouseEvent<HTMLDivElement>): Position {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

export function handleClick<N, E>(
  pos: Position,
  renderer: PixiRenderer<N, E>,
  callbacks: HandlerCallbacks<N, E>
): void {
  const hit = renderer.hitTest(pos.x, pos.y);
  if (hit.type === 'node' && hit.node) callbacks.onNodeClick?.(hit.node);
  else if (hit.type === 'edge' && hit.edge) callbacks.onEdgeClick?.(hit.edge);
  else if (hit.type === 'canvas') callbacks.onCanvasClick?.(hit.position);
}

export function handleDoubleClick<N, E>(
  pos: Position,
  renderer: PixiRenderer<N, E>,
  callbacks: HandlerCallbacks<N, E>
): void {
  const hit = renderer.hitTest(pos.x, pos.y);
  if (hit.type === 'node' && hit.node) callbacks.onNodeDoubleClick?.(hit.node);
}

function updateNodeHover<N, E>(
  hit: ReturnType<PixiRenderer<N, E>['hitTest']>,
  refs: GraphonRefs<N, E>,
  callback: (node: Node<N> | undefined) => void
): void {
  const hoveredNode = hit.type === 'node' ? hit.node : undefined;
  const newNodeId = hoveredNode?.id;
  if (newNodeId === refs.hoveredNode.current) return;
  refs.hoveredNode.current = newNodeId;
  callback(hoveredNode);
}

function updateEdgeHover<N, E>(
  hit: ReturnType<PixiRenderer<N, E>['hitTest']>,
  refs: GraphonRefs<N, E>,
  callback: (edge: Edge<E> | undefined) => void
): void {
  const hoveredEdge = hit.type === 'edge' ? hit.edge : undefined;
  const newEdgeId = hoveredEdge?.id;
  if (newEdgeId === refs.hoveredEdge.current) return;
  refs.hoveredEdge.current = newEdgeId;
  callback(hoveredEdge);
}

export function handleHover<N, E>(
  pos: Position,
  renderer: PixiRenderer<N, E>,
  refs: GraphonRefs<N, E>,
  callbacks: HandlerCallbacks<N, E>
): void {
  const hasHoverCallbacks = callbacks.onNodeHover ?? callbacks.onEdgeHover;
  if (!hasHoverCallbacks) return;

  const hit = renderer.hitTest(pos.x, pos.y);

  if (callbacks.onNodeHover) updateNodeHover(hit, refs, callbacks.onNodeHover);
  if (callbacks.onEdgeHover) updateEdgeHover(hit, refs, callbacks.onEdgeHover);
}
