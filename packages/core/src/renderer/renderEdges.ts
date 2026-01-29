import type { Graphics } from 'pixi.js';
import type { Edge, Position } from '../model/types';
import type { EdgeStyle, EdgeStyleFn, HighlightState, ResolvedEdgeVisuals } from './types';
import { drawCurvedEdge } from './edgeCurves';
import {
  type ArrowShape,
  computeMidArrowPosition,
  computeSourceArrowPosition,
  computeTargetArrowPosition,
  drawArrowShape,
} from './edgeArrows';

interface RenderEdgesParams<E> {
  graphics: Graphics;
  edges: Edge<E>[];
  positions: Map<string, Position>;
  defaultStyle: EdgeStyle;
  edgeStyleFn?: EdgeStyleFn<E>;
  highlightState?: HighlightState;
  /** Node radius for arrow offset calculations */
  nodeRadius?: number;
}

/** Compute the edge alpha considering highlight state. */
function computeEdgeAlpha<E>(
  edge: Edge<E>,
  baseAlpha: number,
  highlightState: HighlightState | undefined
): number {
  if (!highlightState) return baseAlpha;

  const { hoveredNodeId, selectedNodeIds, dimOpacity } = highlightState;
  const hasHighlight = hoveredNodeId !== undefined || selectedNodeIds.size > 0;
  if (!hasHighlight) return baseAlpha;

  const isConnectedToHovered =
    hoveredNodeId !== undefined && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
  const isConnectedToSelected =
    selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target);

  if (isConnectedToHovered || isConnectedToSelected) return baseAlpha;
  return baseAlpha * dimOpacity;
}

/** Build optional curve properties from style. */
function buildCurveOptions(style: Partial<ResolvedEdgeVisuals>): Partial<ResolvedEdgeVisuals> {
  return {
    ...(style.curvature !== undefined && { curvature: style.curvature }),
    ...(style.controlPoints && { controlPoints: style.controlPoints }),
    ...(style.taxiDirection && { taxiDirection: style.taxiDirection }),
    ...(style.taxiTurn !== undefined && { taxiTurn: style.taxiTurn }),
    ...(style.cornerRadius !== undefined && { cornerRadius: style.cornerRadius }),
  };
}

/** Build optional arrow and dash properties from style. */
function buildArrowOptions(style: Partial<ResolvedEdgeVisuals>): Partial<ResolvedEdgeVisuals> {
  return {
    ...(style.dashPattern && { dashPattern: style.dashPattern }),
    ...(style.sourceArrow && { sourceArrow: style.sourceArrow }),
    ...(style.targetArrow && { targetArrow: style.targetArrow }),
    ...(style.midArrow && { midArrow: style.midArrow }),
  };
}

/** Compute full edge visuals from style function and defaults. */
function resolveEdgeVisuals<E>(
  edge: Edge<E>,
  defaultStyle: EdgeStyle,
  edgeStyleFn: EdgeStyleFn<E> | undefined,
  highlightState: HighlightState | undefined
): ResolvedEdgeVisuals | null {
  const customStyle = edgeStyleFn ? edgeStyleFn(edge) : {};
  if (customStyle.visible === false) return null;

  const baseAlpha = customStyle.alpha ?? defaultStyle.alpha;
  const alpha = computeEdgeAlpha(edge, baseAlpha, highlightState);

  return {
    color: customStyle.color ?? defaultStyle.color,
    width: customStyle.width ?? defaultStyle.width,
    alpha,
    visible: true,
    curveStyle: customStyle.curveStyle ?? 'straight',
    lineStyle: customStyle.lineStyle ?? 'solid',
    ...buildCurveOptions(customStyle),
    ...buildArrowOptions(customStyle),
  };
}

/** Edge render context. */
interface EdgeRenderContext {
  graphics: Graphics;
  source: Position;
  target: Position;
  visuals: ResolvedEdgeVisuals;
  nodeRadius: number;
}

/** Draw the edge curve. */
function drawEdgeCurve(ctx: EdgeRenderContext): void {
  const { graphics, source, target, visuals } = ctx;
  const curveOptions = {
    style: visuals.curveStyle ?? 'straight',
    ...buildCurveOptions(visuals),
  } as const;
  drawCurvedEdge(graphics, source, target, curveOptions);
  graphics.stroke({ width: visuals.width, color: visuals.color, alpha: visuals.alpha ?? 1 });
}

/** Arrow configuration from visuals. */
interface ArrowConfig {
  shape?: ArrowShape;
  size?: number;
  color?: number;
  fill?: 'filled' | 'hollow';
}

/** Check if arrow should be rendered. */
function shouldRenderArrow(
  arrow: ArrowConfig | undefined
): arrow is ArrowConfig & { shape: ArrowShape } {
  return arrow?.shape !== undefined && arrow.shape !== 'none';
}

/** Render a single arrow if configured. */
function renderArrowIfPresent(
  graphics: Graphics,
  arrow: ArrowConfig | undefined,
  positionInfo: { position: Position; angle: number },
  defaultColor: number
): void {
  if (!shouldRenderArrow(arrow)) return;
  drawArrowShape(graphics, positionInfo.position, positionInfo.angle, {
    shape: arrow.shape,
    size: arrow.size ?? 10,
    color: arrow.color ?? defaultColor,
    fill: arrow.fill ?? 'filled',
  });
}

/** Draw edge arrows. */
function drawEdgeArrows(ctx: EdgeRenderContext): void {
  const { graphics, source, target, visuals, nodeRadius } = ctx;
  const { color } = visuals;

  renderArrowIfPresent(
    graphics,
    visuals.sourceArrow,
    computeSourceArrowPosition(source, target, nodeRadius),
    color
  );

  renderArrowIfPresent(
    graphics,
    visuals.targetArrow,
    computeTargetArrowPosition(source, target, nodeRadius),
    color
  );

  renderArrowIfPresent(graphics, visuals.midArrow, computeMidArrowPosition(source, target), color);
}

/** Render a single edge. */
function renderSingleEdge(ctx: EdgeRenderContext): void {
  drawEdgeCurve(ctx);
  drawEdgeArrows(ctx);
}

/** Render all edges with curve, arrow, and dash support. */
export function renderEdges<E>(params: RenderEdgesParams<E>): void {
  const {
    graphics,
    edges,
    positions,
    defaultStyle,
    edgeStyleFn,
    highlightState,
    nodeRadius = 8,
  } = params;
  graphics.clear();
  if (edges.length === 0) return;

  for (const edge of edges) {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (!source || !target) continue;

    const visuals = resolveEdgeVisuals(edge, defaultStyle, edgeStyleFn, highlightState);
    if (!visuals) continue;

    renderSingleEdge({ graphics, source, target, visuals, nodeRadius });
  }
}
