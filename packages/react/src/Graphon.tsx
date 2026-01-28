import { useEffect } from 'react';
import type { GraphonProps } from './types';
import { useGraphonRefs } from './hooks/useGraphonRefs';
import { useGraphonHandlers } from './hooks/useGraphonHandlers';
import { useGraphonLifecycle } from './hooks/useGraphonLifecycle';
import { useGraphonUpdates } from './hooks/useGraphonUpdates';

/**
 * High-performance graph visualization component.
 *
 * Renders nodes and edges using WebGL (PixiJS) with force-directed layout.
 * Supports interactive features like node dragging, hover, and click events.
 *
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 *
 * @example
 * ```tsx
 * import { Graphon } from '@graphon/react';
 *
 * function App() {
 *   const nodes = [
 *     { id: 'a', data: { label: 'Node A' } },
 *     { id: 'b', data: { label: 'Node B' } },
 *   ];
 *   const edges = [
 *     { id: 'e1', source: 'a', target: 'b', data: {} },
 *   ];
 *
 *   return (
 *     <Graphon
 *       nodes={nodes}
 *       edges={edges}
 *       width={800}
 *       height={600}
 *       onNodeClick={(node) => console.log('Clicked:', node.id)}
 *     />
 *   );
 * }
 * ```
 */
// eslint-disable-next-line complexity -- many props are standard for a component API
export function Graphon<N = Record<string, unknown>, E = Record<string, unknown>>(
  props: GraphonProps<N, E>
) {
  const {
    nodes,
    edges,
    width = 800,
    height = 600,
    className,
    style,
    isAnimated = true,
    isDraggable = true,
    isPannable = true,
    isZoomable = true,
    minZoom = 0.1,
    maxZoom = 4,
    nodeStyleFn,
    communityFn,
    createWorkerFn,
    onNodeClick,
    onNodeHover,
    onNodeDrag,
    onNodeDragEnd,
    onEdgeClick,
    onEdgeHover,
    onCanvasClick,
    onZoomChange,
  } = props;

  const refs = useGraphonRefs(nodes, edges, nodeStyleFn);

  useGraphonLifecycle(refs, {
    width,
    height,
    isAnimated,
    ...(communityFn && { communityFn }),
    ...(createWorkerFn && { createWorkerFn }),
  });
  useGraphonUpdates(refs, nodes, edges, { width, height, communityFn, nodeStyleFn });

  const handlers = useGraphonHandlers(
    refs,
    {
      onNodeClick,
      onNodeHover,
      onNodeDrag,
      onNodeDragEnd,
      onEdgeClick,
      onEdgeHover,
      onCanvasClick,
      onZoomChange,
    },
    { isDraggable, isPannable, isZoomable, minZoom, maxZoom }
  );

  // Attach wheel listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = refs.container.current;
    if (!container) return;
    container.addEventListener('wheel', handlers.handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handlers.handleWheel);
  }, [refs.container, handlers.handleWheel]);

  const cursor = refs.isDragging.current || refs.isPanning.current ? 'grabbing' : 'default';

  return (
    <div
      ref={refs.container}
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        cursor,
        ...style,
      }}
      onMouseDown={handlers.handleMouseDown}
      onMouseMove={handlers.handleMouseMove}
      onMouseUp={handlers.handleMouseUp}
      onMouseLeave={handlers.handleMouseLeave}
    />
  );
}
