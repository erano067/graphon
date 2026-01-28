import type { Edge, Node, PhysicsSimulation, PixiRenderer, Position } from '@graphon/core';
import type { GraphonRefs } from './useGraphonRefs';

export interface HandlerCallbacks<N, E> {
  onNodeClick: ((node: Node<N>) => void) | undefined;
  onNodeHover: ((node: Node<N> | undefined) => void) | undefined;
  onNodeDrag: ((nodeId: string, position: Position) => void) | undefined;
  onNodeDragEnd: ((nodeId: string, position: Position) => void) | undefined;
  onEdgeClick: ((edge: Edge<E>) => void) | undefined;
  onEdgeHover: ((edge: Edge<E> | undefined) => void) | undefined;
  onCanvasClick: ((position: Position) => void) | undefined;
}

export interface DragMoveParams<N, E> {
  pos: Position;
  renderer: PixiRenderer<N, E>;
  physics: PhysicsSimulation<N, E>;
  refs: GraphonRefs<N, E>;
  callbacks: HandlerCallbacks<N, E>;
}

export function getMousePos(event: React.MouseEvent<HTMLDivElement>): Position {
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

export function handleDragStart<N, E>(
  pos: Position,
  renderer: PixiRenderer<N, E>,
  physics: PhysicsSimulation<N, E>,
  refs: GraphonRefs<N, E>
): boolean {
  const hit = renderer.hitTest(pos.x, pos.y);
  if (hit.type === 'node' && hit.node) {
    refs.dragState.current = { nodeId: hit.node.id };
    refs.isDragging.current = true;
    physics.pinNode(hit.node.id);
    return true;
  }
  return false;
}

export function handleDragMove<N, E>(params: DragMoveParams<N, E>): void {
  const { pos, renderer, physics, refs, callbacks } = params;
  const { nodeId } = refs.dragState.current ?? { nodeId: '' };
  if (!nodeId) return;

  const viewport = renderer.getViewport();
  const worldX = (pos.x - viewport.x) / viewport.scale;
  const worldY = (pos.y - viewport.y) / viewport.scale;
  physics.setNodePosition(nodeId, { x: worldX, y: worldY });
  callbacks.onNodeDrag?.(nodeId, { x: worldX, y: worldY });
}

export function handleDragEnd<N, E>(
  physics: PhysicsSimulation<N, E>,
  refs: GraphonRefs<N, E>,
  callbacks: HandlerCallbacks<N, E>
): void {
  const { nodeId } = refs.dragState.current ?? { nodeId: '' };
  if (!nodeId) return;

  const positions = physics.getPositions();
  const finalPos = positions.get(nodeId);
  physics.unpinNode(nodeId);
  if (finalPos) callbacks.onNodeDragEnd?.(nodeId, finalPos);
  refs.dragState.current = undefined;
  refs.isDragging.current = false;
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
