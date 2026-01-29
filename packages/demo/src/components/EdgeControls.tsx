import type { ArrowShape, EdgeCurveStyle } from '@graphon/react';
import { SliderControl } from './SliderControl';

const CURVE_STYLES: EdgeCurveStyle[] = ['straight', 'bezier', 'arc', 'taxi'];
const ARROW_SHAPES: ArrowShape[] = [
  'none',
  'triangle',
  'triangle-cross',
  'vee',
  'tee',
  'circle',
  'circle-triangle',
  'diamond',
  'square',
  'chevron',
  'double-chevron',
  'bowtie',
];

interface EdgeControlsProps {
  edgeWidth: number;
  curveStyle: EdgeCurveStyle;
  curvature: number;
  targetArrow: ArrowShape;
  onEdgeWidthChange: (width: number) => void;
  onCurveStyleChange: (style: EdgeCurveStyle) => void;
  onCurvatureChange: (curvature: number) => void;
  onTargetArrowChange: (arrow: ArrowShape) => void;
}

export function EdgeControls(props: EdgeControlsProps): React.ReactElement {
  const {
    edgeWidth,
    curveStyle,
    curvature,
    targetArrow,
    onEdgeWidthChange,
    onCurveStyleChange,
    onCurvatureChange,
    onTargetArrowChange,
  } = props;

  return (
    <>
      <SliderControl
        label="Edge Width"
        min={0.5}
        max={5}
        step={0.5}
        value={edgeWidth}
        onChange={onEdgeWidthChange}
        formatValue={(v) => `${v}px`}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        Edge Curve:
        <select
          value={curveStyle}
          onChange={(e) => onCurveStyleChange(e.target.value as EdgeCurveStyle)}
          style={{ padding: '2px 8px' }}
        >
          {CURVE_STYLES.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </label>
      {curveStyle !== 'straight' && (
        <SliderControl
          label="Curvature"
          min={0.1}
          max={0.8}
          step={0.1}
          value={curvature}
          onChange={onCurvatureChange}
          formatValue={(v) => v.toFixed(1)}
        />
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        Arrow:
        <select
          value={targetArrow}
          onChange={(e) => onTargetArrowChange(e.target.value as ArrowShape)}
          style={{ padding: '2px 8px' }}
        >
          {ARROW_SHAPES.map((shape) => (
            <option key={shape} value={shape}>
              {shape}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
