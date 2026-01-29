import { type Edge, type ExtendedNodeShape, Graphon, type Node } from '@graphon/react';
import type { EdgeData, NodeData } from '../generator';
import { LoadingOverlay } from './LoadingOverlay';

interface GraphContainerProps {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  isLoading: boolean;
  nodeStyleFn: (node: Node<NodeData>) => {
    color: number;
    radius: number;
    shape: ExtendedNodeShape;
  };
  edgeStyleFn: (edge: Edge<EdgeData>) => { width: number };
  communityFn: (node: Node<NodeData>) => number;
  shouldHighlightNeighbors: boolean;
  dimOpacity: number;
  createWorkerFn: () => Worker;
  onNodeClick: (node: Node<NodeData>) => void;
  onNodeHover: (node: Node<NodeData> | undefined) => void;
  onZoomChange?: (zoom: number) => void;
}

const containerStyle = {
  border: '1px solid #ccc',
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative' as const,
  width: 800,
  height: 600,
};

export function GraphContainer({
  nodes,
  edges,
  isLoading,
  nodeStyleFn,
  edgeStyleFn,
  communityFn,
  shouldHighlightNeighbors,
  dimOpacity,
  createWorkerFn,
  onNodeClick,
  onNodeHover,
  onZoomChange,
}: GraphContainerProps): React.ReactElement {
  return (
    <div style={containerStyle}>
      {isLoading && <LoadingOverlay />}
      <Graphon<NodeData, EdgeData>
        nodes={nodes}
        edges={edges}
        width={800}
        height={600}
        nodeStyleFn={nodeStyleFn}
        edgeStyleFn={edgeStyleFn}
        communityFn={communityFn}
        highlightNeighbors={shouldHighlightNeighbors}
        dimOpacity={dimOpacity}
        createWorkerFn={createWorkerFn}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
        onZoomChange={onZoomChange}
      />
    </div>
  );
}
