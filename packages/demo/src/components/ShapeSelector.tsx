import type { ExtendedNodeShape } from '@graphon/react';

const SHAPE_OPTIONS: ('community' | ExtendedNodeShape)[] = [
  'community',
  'circle',
  'ellipse',
  'square',
  'rectangle',
  'round-rectangle',
  'diamond',
  'round-diamond',
  'triangle',
  'round-triangle',
  'pentagon',
  'hexagon',
  'octagon',
  'star',
  'tag',
  'vee',
  'polygon',
];

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

interface ShapeSelectorProps {
  shapeMode: 'community' | ExtendedNodeShape;
  onShapeModeChange: (mode: 'community' | ExtendedNodeShape) => void;
}

export function ShapeSelector({
  shapeMode,
  onShapeModeChange,
}: ShapeSelectorProps): React.ReactElement {
  return (
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
  );
}
