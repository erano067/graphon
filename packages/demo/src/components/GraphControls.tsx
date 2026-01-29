import type { ExtendedNodeShape } from '@graphon/react';
import { ShapeSelector } from './ShapeSelector';
import { SliderControl } from './SliderControl';

interface GraphControlsProps {
  nodeCount: number;
  communityCount: number;
  shapeMode: 'community' | ExtendedNodeShape;
  nodeSize: number;
  onNodeCountChange: (count: number) => void;
  onCommunityCountChange: (count: number) => void;
  onShapeModeChange: (mode: 'community' | ExtendedNodeShape) => void;
  onNodeSizeChange: (size: number) => void;
}

export function GraphControls(props: GraphControlsProps): React.ReactElement {
  const {
    nodeCount,
    communityCount,
    shapeMode,
    nodeSize,
    onNodeCountChange,
    onCommunityCountChange,
    onShapeModeChange,
    onNodeSizeChange,
  } = props;

  return (
    <>
      <SliderControl
        label="Nodes"
        min={20}
        max={20000}
        value={nodeCount}
        onChange={onNodeCountChange}
        formatValue={(v) => v.toLocaleString()}
      />
      <SliderControl
        label="Communities"
        min={2}
        max={8}
        value={communityCount}
        onChange={onCommunityCountChange}
      />
      <ShapeSelector shapeMode={shapeMode} onShapeModeChange={onShapeModeChange} />
      <SliderControl
        label="Node Size"
        min={2}
        max={20}
        value={nodeSize}
        onChange={onNodeSizeChange}
        formatValue={(v) => `${v}px`}
      />
    </>
  );
}
