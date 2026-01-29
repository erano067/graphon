import { useCallback } from 'react';
import type { Node } from '@graphon/react';
import { ClusteredGraphDemo } from './components/ClusteredGraphDemo';
import { ClusteringControls } from './components/ClusteringControls';
import { Controls } from './components/Controls';
import { GraphContainer } from './components/GraphContainer';
import { Sidebar } from './components/Sidebar';
import type { NodeData } from './generator';
import { useAppState } from './hooks/useAppState';
import { useEdgeStyleFn } from './hooks/useEdgeStyleFn';
import { useGraphGenerator } from './hooks/useGraphGenerator';
import { useNodeStyleFn } from './hooks/useNodeStyleFn';
import PhysicsWorker from './physics.worker?worker';
import { getCommunityColor } from './styleConfig';

const createPhysicsWorker = (): Worker => new (PhysicsWorker as new () => Worker)();

export function App(): React.ReactElement {
  const state = useAppState();
  const {
    nodeCount,
    communityCount,
    seed,
    shapeMode,
    nodeSize,
    edgeWidth,
    curveStyle,
    curvature,
    targetArrow,
    isClusteringEnabled,
    currentZoom,
  } = state;
  const { nodes, edges, isLoading } = useGraphGenerator({ nodeCount, communityCount, seed });
  const avgDegree = nodes.length > 0 ? ((edges.length * 2) / nodes.length).toFixed(1) : 0;
  const nodeStyleFn = useNodeStyleFn({ shapeMode, nodeSize });
  const edgeStyleFn = useEdgeStyleFn({ edgeWidth, curveStyle, curvature, targetArrow });
  const communityFn = useCallback((node: Node<NodeData>) => node.data.community, []);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 16 }}>Graphon Demo</h1>

      <Controls
        nodeCount={nodeCount}
        communityCount={communityCount}
        shapeMode={shapeMode}
        nodeSize={nodeSize}
        edgeWidth={edgeWidth}
        highlightNeighbors={state.shouldHighlightNeighbors}
        dimOpacity={state.dimOpacity}
        curveStyle={curveStyle}
        curvature={curvature}
        targetArrow={targetArrow}
        onNodeCountChange={state.setNodeCount}
        onCommunityCountChange={state.setCommunityCount}
        onShapeModeChange={state.setShapeMode}
        onNodeSizeChange={state.setNodeSize}
        onEdgeWidthChange={state.setEdgeWidth}
        onHighlightNeighborsChange={state.setShouldHighlightNeighbors}
        onDimOpacityChange={state.setDimOpacity}
        onCurveStyleChange={state.setCurveStyle}
        onCurvatureChange={state.setCurvature}
        onTargetArrowChange={state.setTargetArrow}
        onRegenerate={state.regenerate}
      />

      <ClusteringControls
        isClusteringEnabled={isClusteringEnabled}
        currentZoom={currentZoom}
        communityCount={communityCount}
        onToggle={(checked) => state.setEnableClustering(checked)}
      />

      <div style={{ display: 'flex', gap: 20 }}>
        {isClusteringEnabled ? (
          <ClusteredGraphDemo
            nodes={nodes}
            edges={edges}
            isLoading={isLoading}
            nodeStyleFn={nodeStyleFn}
            edgeStyleFn={edgeStyleFn}
            communityFn={communityFn}
            shouldHighlightNeighbors={state.shouldHighlightNeighbors}
            dimOpacity={state.dimOpacity}
            createWorkerFn={createPhysicsWorker}
            onNodeClick={state.setSelectedNode}
            onNodeHover={state.setHoveredNode}
            onZoomChange={state.setCurrentZoom}
            isClusteringEnabled={isClusteringEnabled}
          />
        ) : (
          <GraphContainer
            nodes={nodes}
            edges={edges}
            isLoading={isLoading}
            nodeStyleFn={nodeStyleFn}
            edgeStyleFn={edgeStyleFn}
            communityFn={communityFn}
            shouldHighlightNeighbors={state.shouldHighlightNeighbors}
            dimOpacity={state.dimOpacity}
            createWorkerFn={createPhysicsWorker}
            onNodeClick={state.setSelectedNode}
            onNodeHover={state.setHoveredNode}
            onZoomChange={state.setCurrentZoom}
          />
        )}

        <Sidebar
          nodes={nodes}
          edges={edges}
          avgDegree={avgDegree}
          communityCount={communityCount}
          hoveredNode={state.hoveredNode}
          selectedNode={state.selectedNode}
          getCommunityColor={getCommunityColor}
        />
      </div>
    </div>
  );
}
