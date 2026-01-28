import type { PhysicsEngine, PixiRenderer, Position } from '@graphon/core';
import type { GraphonRefs } from './useGraphonRefs';

export interface DragCallbacks {
  onNodeDrag: ((nodeId: string, position: Position) => void) | undefined;
  onNodeDragEnd: ((nodeId: string, position: Position) => void) | undefined;
}

export interface DragMoveParams<N, E> {
  pos: Position;
  renderer: PixiRenderer<N, E>;
  physics: PhysicsEngine<N, E>;
  refs: GraphonRefs<N, E>;
  callbacks: DragCallbacks;
}

export function handleDragStart<N, E>(
  pos: Position,
  renderer: PixiRenderer<N, E>,
  physics: PhysicsEngine<N, E>,
  refs: GraphonRefs<N, E>
): boolean {
  const hit = renderer.hitTest(pos.x, pos.y);
  if (hit.type === 'node' && hit.node) {
    refs.dragState.current = { nodeId: hit.node.id };
    refs.isDragging.current = true;
    // Fire-and-forget for both sync and async physics
    void physics.pinNode(hit.node.id);
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
  // Fire-and-forget for both sync and async physics
  void physics.setNodePosition(nodeId, { x: worldX, y: worldY });
  callbacks.onNodeDrag?.(nodeId, { x: worldX, y: worldY });
}

export function handleDragEnd<N, E>(
  physics: PhysicsEngine<N, E>,
  refs: GraphonRefs<N, E>,
  callbacks: DragCallbacks
): void {
  const { nodeId } = refs.dragState.current ?? { nodeId: '' };
  if (!nodeId) return;

  const positions = physics.getPositions();
  const finalPos = positions.get(nodeId);
  // Fire-and-forget for both sync and async physics
  void physics.unpinNode(nodeId);
  if (finalPos) callbacks.onNodeDragEnd?.(nodeId, finalPos);
  refs.dragState.current = undefined;
  refs.isDragging.current = false;
}
