import { useCallback } from 'react';
import type { PhysicsEngine, PixiRenderer } from '@graphon/core';
import type { GraphonRefs } from './useGraphonRefs';
import {
  type HandlerCallbacks,
  getMousePos,
  handleClick,
  handleDoubleClick,
  handleDragEnd,
  handleDragMove,
  handleDragStart,
  handleHover,
  handlePanEnd,
  handlePanMove,
  handlePanStart,
  handleZoom,
} from './mouseHandlers';

export type { HandlerCallbacks };

interface InteractionConfig {
  isDraggable: boolean;
  isPannable: boolean;
  isZoomable: boolean;
  minZoom: number;
  maxZoom: number;
}

interface GraphonHandlers {
  handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleDoubleClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: () => void;
  handleWheel: (event: WheelEvent) => void;
}

function getRendererAndPhysics<N, E>(
  refs: GraphonRefs<N, E>
): { renderer: PixiRenderer<N, E> | undefined; physics: PhysicsEngine<N, E> | undefined } {
  return { renderer: refs.renderer.current, physics: refs.physics.current };
}

function cleanupOnLeave<N, E>(refs: GraphonRefs<N, E>, callbacks: HandlerCallbacks<N, E>): void {
  const physics = refs.physics.current;
  if (refs.dragState.current && refs.isDragging.current && physics) {
    void physics.unpinNode(refs.dragState.current.nodeId);
    refs.dragState.current = undefined;
    refs.isDragging.current = false;
  }
  if (refs.isPanning.current) handlePanEnd(refs);
  if (callbacks.onNodeHover && refs.hoveredNode.current !== undefined) {
    refs.hoveredNode.current = undefined;
    callbacks.onNodeHover(undefined);
  }
  if (callbacks.onEdgeHover && refs.hoveredEdge.current !== undefined) {
    refs.hoveredEdge.current = undefined;
    callbacks.onEdgeHover(undefined);
  }
}

type MouseHandlerResult = Pick<
  GraphonHandlers,
  'handleMouseDown' | 'handleMouseMove' | 'handleMouseUp' | 'handleMouseLeave'
>;

function useMouseHandlers<N, E>(
  refs: GraphonRefs<N, E>,
  callbacks: HandlerCallbacks<N, E>,
  isDraggable: boolean,
  isPannable: boolean
): MouseHandlerResult {
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const { renderer, physics } = getRendererAndPhysics(refs);
      if (!renderer || !physics) return;
      const pos = getMousePos(event);
      if (isDraggable && handleDragStart(pos, renderer, physics, refs)) {
        event.preventDefault();
        return;
      }
      if (isPannable && handlePanStart(pos, renderer, refs)) event.preventDefault();
    },
    [refs, isDraggable, isPannable]
  );
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const { renderer, physics } = getRendererAndPhysics(refs);
      if (!renderer || !physics) return;
      const pos = getMousePos(event);
      if (refs.dragState.current && refs.isDragging.current) {
        handleDragMove({ pos, renderer, physics, refs, callbacks });
      } else if (refs.isPanning.current && refs.panState.current) {
        handlePanMove(pos, renderer, refs);
      } else handleHover(pos, renderer, refs, callbacks);
    },
    [refs, callbacks]
  );
  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const { renderer, physics } = getRendererAndPhysics(refs);
      if (!renderer || !physics) return;
      if (refs.dragState.current && refs.isDragging.current) {
        handleDragEnd(physics, refs, callbacks);
      } else if (refs.isPanning.current) {
        handlePanEnd(refs);
      } else handleClick(getMousePos(event), renderer, callbacks);
    },
    [refs, callbacks]
  );
  const handleMouseLeave = useCallback(() => cleanupOnLeave(refs, callbacks), [refs, callbacks]);
  return { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave };
}

export function useGraphonHandlers<N, E>(
  refs: GraphonRefs<N, E>,
  callbacks: HandlerCallbacks<N, E>,
  config: InteractionConfig
): GraphonHandlers {
  const { isDraggable, isPannable, isZoomable, minZoom, maxZoom } = config;
  const mouseHandlers = useMouseHandlers(refs, callbacks, isDraggable, isPannable);

  const handleDblClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const { renderer } = getRendererAndPhysics(refs);
      if (!renderer) return;
      handleDoubleClick(getMousePos(event), renderer, callbacks);
    },
    [refs, callbacks]
  );
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!refs.renderer.current || !isZoomable) return;
      handleZoom(event, refs.renderer.current, {
        config: { minZoom, maxZoom },
        refs,
        ...(callbacks.onZoomChange && { onZoomChange: callbacks.onZoomChange }),
      });
    },
    [refs, isZoomable, minZoom, maxZoom, callbacks.onZoomChange]
  );

  return {
    ...mouseHandlers,
    handleDoubleClick: handleDblClick,
    handleWheel,
  };
}
