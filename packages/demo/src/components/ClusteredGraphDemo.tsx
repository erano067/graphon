import { useCallback, useEffect, useRef } from 'react';
import { type Edge, type ExtendedNodeShape, Graphon, type Node } from '@graphon/react';
import type { EdgeData, NodeData } from '../generator';
import { type ClusterableNodeData, isClusterNode, useClustering } from '../hooks/useClustering';
import { getCommunityColor } from '../styleConfig';
import { LoadingOverlay } from './LoadingOverlay';
import { ClusterCircles } from './ClusterCircles';

interface ClusteredGraphDemoProps {
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
  onNodeClick?: (node: Node<NodeData>) => void;
  onNodeHover?: (node: Node<NodeData> | undefined) => void;
  onZoomChange?: (zoom: number) => void;
  isClusteringEnabled: boolean;
}

const containerStyle = {
  border: '1px solid #ccc',
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative' as const,
  width: 800,
  height: 600,
};

function createClusterNodeStyle(
  community: number,
  childCount: number
): { color: number; radius: number; shape: ExtendedNodeShape } {
  const colorNum = parseInt(getCommunityColor(community).slice(1), 16);
  return { color: colorNum, radius: Math.min(50, 20 + Math.sqrt(childCount) * 6), shape: 'circle' };
}

function getCombinedNodeStyleFn(nodeStyleFn: ClusteredGraphDemoProps['nodeStyleFn']) {
  return (
    node: Node<ClusterableNodeData>
  ): { color: number; radius: number; shape: ExtendedNodeShape } => {
    if (isClusterNode(node.data)) {
      return createClusterNodeStyle(node.data.community, node.data.childCount);
    }
    return nodeStyleFn(node as Node<NodeData>);
  };
}

function getCombinedCommunityFn(communityFn: (node: Node<NodeData>) => number) {
  return (node: Node<ClusterableNodeData>): number =>
    isClusterNode(node.data) ? node.data.community : communityFn(node as Node<NodeData>);
}

export function ClusteredGraphDemo(props: ClusteredGraphDemoProps): React.ReactElement {
  const {
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
    isClusteringEnabled,
  } = props;
  const viewportRef = useRef({ scale: 1, x: 0, y: 0 });
  const {
    nodesToRender,
    edgesToRender,
    expandedClusters,
    clusterPositions,
    handleNodeClick: handleClusterClick,
    handleClusterCircleClick,
    updatePositions,
  } = useClustering(nodes, edges, isClusteringEnabled);

  const combinedNodeStyleFn = useCallback(getCombinedNodeStyleFn(nodeStyleFn), [nodeStyleFn]);
  const combinedCommunityFn = useCallback(getCombinedCommunityFn(communityFn), [communityFn]);

  const handleNodeClickInternal = useCallback(
    (node: Node<ClusterableNodeData>): void => {
      handleClusterClick(node);
      if (!isClusterNode(node.data)) onNodeClick?.(node as Node<NodeData>);
    },
    [handleClusterClick, onNodeClick]
  );

  const handleNodeHoverInternal = useCallback(
    (node: Node<ClusterableNodeData> | undefined): void => {
      if (!onNodeHover) return;
      onNodeHover(!node || isClusterNode(node.data) ? undefined : (node as Node<NodeData>));
    },
    [onNodeHover]
  );

  const handleZoomChangeInternal = useCallback(
    (zoom: number): void => {
      viewportRef.current.scale = zoom;
      onZoomChange?.(zoom);
    },
    [onZoomChange]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const positions = new Map<string, { x: number; y: number }>();
      for (const node of nodesToRender) {
        if (!isClusterNode(node.data) && node.x !== undefined && node.y !== undefined) {
          positions.set(node.id, { x: node.x, y: node.y });
        }
      }
      if (positions.size > 0) updatePositions(positions);
    }, 500);
    return () => clearInterval(interval);
  }, [nodesToRender, updatePositions]);

  return (
    <div style={containerStyle}>
      {isLoading && <LoadingOverlay />}
      <Graphon<ClusterableNodeData, EdgeData>
        nodes={nodesToRender}
        edges={edgesToRender}
        width={800}
        height={600}
        nodeStyleFn={combinedNodeStyleFn}
        edgeStyleFn={edgeStyleFn}
        communityFn={combinedCommunityFn}
        highlightNeighbors={shouldHighlightNeighbors}
        dimOpacity={dimOpacity}
        createWorkerFn={createWorkerFn}
        onNodeClick={handleNodeClickInternal}
        onNodeHover={handleNodeHoverInternal}
        onZoomChange={handleZoomChangeInternal}
      />
      <ClusterCircles
        expandedClusters={expandedClusters}
        clusterPositions={clusterPositions}
        viewport={viewportRef.current}
        onCircleDoubleClick={handleClusterCircleClick}
      />
    </div>
  );
}
