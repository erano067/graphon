import { useMemo } from 'react';
import type { ArrowShape, Edge, EdgeCurveStyle } from '@graphon/react';
import type { EdgeData } from '../generator';

interface EdgeStyleOptions {
  edgeWidth: number;
  curveStyle: EdgeCurveStyle;
  curvature: number;
  targetArrow: ArrowShape;
}

type EdgeStyleFn = (edge: Edge<EdgeData>) => {
  width: number;
  curveStyle: EdgeCurveStyle;
  curvature?: number;
  targetArrow?: { shape: ArrowShape };
};

export function useEdgeStyleFn(options: EdgeStyleOptions): EdgeStyleFn {
  const { edgeWidth, curveStyle, curvature, targetArrow } = options;

  return useMemo(() => {
    return (_edge: Edge<EdgeData>) => ({
      width: edgeWidth,
      curveStyle,
      ...(curveStyle !== 'straight' && { curvature }),
      ...(targetArrow !== 'none' && { targetArrow: { shape: targetArrow } }),
    });
  }, [edgeWidth, curveStyle, curvature, targetArrow]);
}
