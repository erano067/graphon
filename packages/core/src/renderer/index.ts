export type {
  Renderer,
  Viewport,
  HitTestResult,
  RenderConfig,
  NodeStyle,
  EdgeStyle,
  NodeStyleFn,
  EdgeStyleFn,
  NodeShape,
  ResolvedNodeVisuals,
  ResolvedEdgeVisuals,
  RenderOptions,
  HighlightState,
} from './types';
export type {
  ExtendedNodeShape,
  ExtendedShapeOptions,
  EdgeCurveStyle,
  EdgeLineStyle,
  ArrowShape,
  ArrowFill,
  ArrowConfig,
  TaxiDirection,
} from './shapeTypes';
export { DEFAULT_NODE_STYLE, DEFAULT_EDGE_STYLE, DEFAULT_RENDER_CONFIG } from './types';
export {
  DEFAULT_NODE_VISUALS,
  DEFAULT_EDGE_VISUALS,
  // Shape drawing functions
  drawShape,
  drawExtendedShape,
  drawSingleShape,
  // Individual shape functions
  drawCircles,
  drawEllipses,
  drawSquares,
  drawRectangles,
  drawRoundRectangles,
  drawDiamonds,
  drawRoundDiamonds,
  drawTriangles,
  drawRoundTriangles,
  drawRegularPolygons,
  drawPentagons,
  drawHexagons,
  drawOctagons,
  drawStars,
  drawTags,
  drawVees,
} from './shapes';
export { PixiRenderer, createRenderer } from './PixiRenderer';

// Edge curves
export type { CurveStyle, CurveOptions } from './edgeCurves';
export {
  drawStraightEdge,
  drawBezierEdge,
  drawArcEdge,
  drawTaxiEdge,
  drawSegmentsEdge,
  drawUnbundledBezierEdge,
  drawCurvedEdge,
} from './edgeCurves';

// Edge arrows
export type { ArrowOptions } from './edgeArrows';
export {
  DEFAULT_ARROW_OPTIONS,
  drawArrowShape,
  computeSourceArrowPosition,
  computeTargetArrowPosition,
  computeMidArrowPosition,
} from './edgeArrows';

// Node gradients
export type {
  GradientDirection,
  ColorStop,
  LinearGradient,
  RadialGradient,
  GradientConfig,
} from './nodeGradients';
export {
  createTwoColorGradient,
  interpolateColor,
  getGradientColorAtOffset,
  sampleGradientColor,
  getPrimaryGradientColor,
  gradientsEqual,
} from './nodeGradients';

// Node decorators
export type {
  DecoratorPosition,
  BadgeDecorator,
  DotDecorator,
  RingDecorator,
  DecoratorConfig,
} from './nodeDecorators';
export {
  computeDecoratorPosition,
  drawBadge,
  drawDot,
  drawRing,
  drawDecorator,
  drawDecorators,
  createStatusDot,
  createCountBadge,
  createSelectionRing,
  createHoverRing,
} from './nodeDecorators';
