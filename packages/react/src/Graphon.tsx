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
export function Graphon<N = Record<string, unknown>, E = Record<string, unknown>>({
  nodes,
  edges,
  width = 800,
  height = 600,
  className,
  style,
  animated = true,
  draggable = true,
  nodeColorFn,
  communityFn,
  onNodeClick,
  onNodeHover,
  onNodeDrag,
  onNodeDragEnd,
  onEdgeClick,
  onEdgeHover,
  onCanvasClick,
}: GraphonProps<N, E>) {
  const refs = useGraphonRefs(nodes, edges, nodeColorFn);

  useGraphonLifecycle(refs, { width, height, animated, communityFn });
  useGraphonUpdates(refs, nodes, edges, { width, height, communityFn, nodeColorFn });

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
    },
    draggable
  );

  return (
    <div
      ref={refs.container}
      className={className}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        cursor: refs.isDragging.current ? 'grabbing' : 'default',
        ...style,
      }}
      onMouseDown={handlers.handleMouseDown}
      onMouseMove={handlers.handleMouseMove}
      onMouseUp={handlers.handleMouseUp}
      onMouseLeave={handlers.handleMouseLeave}
    />
  );
}
