import { useCallback } from 'react';
import type { GraphonRefs } from './useGraphonRefs';
import {
  type HandlerCallbacks,
  getMousePos,
  handleClick,
  handleDragEnd,
  handleDragMove,
  handleDragStart,
  handleHover,
} from './mouseHandlers';

export type { HandlerCallbacks };

interface GraphonHandlers {
  handleMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: (event: React.MouseEvent<HTMLDivElement>) => void;
  handleMouseLeave: () => void;
}

export function useGraphonHandlers<N, E>(
  refs: GraphonRefs<N, E>,
  callbacks: HandlerCallbacks<N, E>,
  draggable: boolean
): GraphonHandlers {
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const renderer = refs.renderer.current;
      const physics = refs.physics.current;
      if (!renderer || !physics || !draggable) return;

      const pos = getMousePos(event);
      if (handleDragStart(pos, renderer, physics, refs)) {
        event.preventDefault();
      }
    },
    [refs, draggable]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const renderer = refs.renderer.current;
      const physics = refs.physics.current;
      if (!renderer || !physics) return;

      const pos = getMousePos(event);

      if (refs.dragState.current && refs.isDragging.current) {
        handleDragMove({ pos, renderer, physics, refs, callbacks });
        return;
      }

      handleHover(pos, renderer, refs, callbacks);
    },
    [refs, callbacks]
  );

  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const renderer = refs.renderer.current;
      const physics = refs.physics.current;
      if (!renderer || !physics) return;

      if (refs.dragState.current && refs.isDragging.current) {
        handleDragEnd(physics, refs, callbacks);
        return;
      }

      handleClick(getMousePos(event), renderer, callbacks);
    },
    [refs, callbacks]
  );

  const handleMouseLeave = useCallback(() => {
    const physics = refs.physics.current;

    if (refs.dragState.current && refs.isDragging.current && physics) {
      physics.unpinNode(refs.dragState.current.nodeId);
      refs.dragState.current = undefined;
      refs.isDragging.current = false;
    }

    if (callbacks.onNodeHover && refs.hoveredNode.current !== undefined) {
      refs.hoveredNode.current = undefined;
      callbacks.onNodeHover(undefined);
    }
    if (callbacks.onEdgeHover && refs.hoveredEdge.current !== undefined) {
      refs.hoveredEdge.current = undefined;
      callbacks.onEdgeHover(undefined);
    }
  }, [refs, callbacks]);

  return { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave };
}
