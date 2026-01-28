import type { NodeShape } from '@graphon/react';

interface ControlsProps {
  nodeCount: number;
  communityCount: number;
  shapeMode: 'community' | NodeShape;
  onNodeCountChange: (count: number) => void;
  onCommunityCountChange: (count: number) => void;
  onShapeModeChange: (mode: 'community' | NodeShape) => void;
  onRegenerate: () => void;
}

const SHAPE_OPTIONS: ('community' | NodeShape)[] = ['community', 'circle', 'square', 'diamond'];

const buttonStyle = {
  padding: '4px 12px',
  cursor: 'pointer',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#ccc',
  borderRadius: 4,
  background: '#fff',
};

const activeButtonStyle = {
  ...buttonStyle,
  background: '#4a90d9',
  color: '#fff',
  borderColor: '#4a90d9',
};

export function Controls({
  nodeCount,
  communityCount,
  shapeMode,
  onNodeCountChange,
  onCommunityCountChange,
  onShapeModeChange,
  onRegenerate,
}: ControlsProps): React.ReactElement {
  return (
    <div
      style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
    >
      <label>
        Nodes:
        <input
          type="range"
          min={20}
          max={20000}
          value={nodeCount}
          onChange={(e) => onNodeCountChange(Number(e.target.value))}
          style={{ marginLeft: 8 }}
        />
        <span style={{ marginLeft: 8 }}>{nodeCount.toLocaleString()}</span>
      </label>

      <label>
        Communities:
        <input
          type="range"
          min={2}
          max={8}
          value={communityCount}
          onChange={(e) => onCommunityCountChange(Number(e.target.value))}
          style={{ marginLeft: 8 }}
        />
        <span style={{ marginLeft: 8 }}>{communityCount}</span>
      </label>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span>Shape:</span>
        {SHAPE_OPTIONS.map((shape) => (
          <button
            key={shape}
            onClick={() => onShapeModeChange(shape)}
            style={shapeMode === shape ? activeButtonStyle : buttonStyle}
          >
            {shape}
          </button>
        ))}
      </div>

      <button onClick={onRegenerate} style={buttonStyle}>
        Regenerate
      </button>
    </div>
  );
}
