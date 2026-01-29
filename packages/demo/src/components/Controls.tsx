import type { ArrowShape, EdgeCurveStyle, ExtendedNodeShape } from '@graphon/react';
import { EdgeControls } from './EdgeControls';
import { GraphControls } from './GraphControls';
import { SliderControl } from './SliderControl';

interface ControlsProps {
  nodeCount: number;
  communityCount: number;
  shapeMode: 'community' | ExtendedNodeShape;
  nodeSize: number;
  edgeWidth: number;
  highlightNeighbors: boolean;
  dimOpacity: number;
  curveStyle: EdgeCurveStyle;
  curvature: number;
  targetArrow: ArrowShape;
  onNodeCountChange: (count: number) => void;
  onCommunityCountChange: (count: number) => void;
  onShapeModeChange: (mode: 'community' | ExtendedNodeShape) => void;
  onNodeSizeChange: (size: number) => void;
  onEdgeWidthChange: (width: number) => void;
  onHighlightNeighborsChange: (enabled: boolean) => void;
  onDimOpacityChange: (opacity: number) => void;
  onCurveStyleChange: (style: EdgeCurveStyle) => void;
  onCurvatureChange: (curvature: number) => void;
  onTargetArrowChange: (arrow: ArrowShape) => void;
  onRegenerate: () => void;
}

const buttonStyle = {
  padding: '4px 12px',
  cursor: 'pointer',
  border: '1px solid #ccc',
  borderRadius: 4,
  background: '#fff',
};

export function Controls(props: ControlsProps): React.ReactElement {
  const {
    nodeCount,
    communityCount,
    shapeMode,
    nodeSize,
    edgeWidth,
    highlightNeighbors: shouldHighlightNeighbors,
    dimOpacity,
    curveStyle,
    curvature,
    targetArrow,
    onNodeCountChange,
    onCommunityCountChange,
    onShapeModeChange,
    onNodeSizeChange,
    onEdgeWidthChange,
    onHighlightNeighborsChange,
    onDimOpacityChange,
    onCurveStyleChange,
    onCurvatureChange,
    onTargetArrowChange,
    onRegenerate,
  } = props;

  return (
    <div
      style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
    >
      <GraphControls
        nodeCount={nodeCount}
        communityCount={communityCount}
        shapeMode={shapeMode}
        nodeSize={nodeSize}
        onNodeCountChange={onNodeCountChange}
        onCommunityCountChange={onCommunityCountChange}
        onShapeModeChange={onShapeModeChange}
        onNodeSizeChange={onNodeSizeChange}
      />
      <EdgeControls
        edgeWidth={edgeWidth}
        curveStyle={curveStyle}
        curvature={curvature}
        targetArrow={targetArrow}
        onEdgeWidthChange={onEdgeWidthChange}
        onCurveStyleChange={onCurveStyleChange}
        onCurvatureChange={onCurvatureChange}
        onTargetArrowChange={onTargetArrowChange}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="checkbox"
          checked={shouldHighlightNeighbors}
          onChange={(e) => onHighlightNeighborsChange(e.target.checked)}
        />
        Highlight Neighbors
      </label>
      <SliderControl
        label="Dim Opacity"
        min={0.05}
        max={0.5}
        step={0.05}
        value={dimOpacity}
        onChange={onDimOpacityChange}
        formatValue={(v) => `${(v * 100).toFixed(0)}%`}
      />
      <button onClick={onRegenerate} style={buttonStyle}>
        Regenerate
      </button>
    </div>
  );
}
