# Phase 4: Edge Styling

## Overview

Implement comprehensive edge styling: line types, arrows, colors, widths, and edge labels.

---

## Task 4.1: Edge Style Resolver

### Overview
Create style resolver for edges matching the node style resolver pattern.

### Dependencies
- Phase 3 complete

### Acceptance Criteria
- [ ] Static and function style values
- [ ] Caching for performance
- [ ] Edge data includes source/target info

### Implementation Steps

```typescript
// packages/core/src/styles/EdgeStyleResolver.ts
import type { EdgeData, EdgeStyleConfig } from '../types';

export interface ResolvedEdgeStyle {
  width: number;
  color: number;
  opacity: number;
  type: 'straight' | 'curved' | 'orthogonal';
  arrow: 'none' | 'target' | 'source' | 'both';
  arrowSize: number;
  dashPattern: number[] | null;
  visible: boolean;
}

const DEFAULT_EDGE_STYLE: ResolvedEdgeStyle = {
  width: 1,
  color: 0xcccccc,
  opacity: 1,
  type: 'straight',
  arrow: 'none',
  arrowSize: 8,
  dashPattern: null,
  visible: true,
};

export class EdgeStyleResolver {
  private config: EdgeStyleConfig;
  private cache: Map<string, ResolvedEdgeStyle> = new Map();
  
  constructor(config: EdgeStyleConfig = {}) {
    this.config = config;
  }
  
  setConfig(config: EdgeStyleConfig): void {
    this.config = config;
    this.cache.clear();
  }
  
  resolve(edge: EdgeData): ResolvedEdgeStyle {
    const cached = this.cache.get(edge.id);
    if (cached) return cached;
    
    const resolved: ResolvedEdgeStyle = {
      width: this.resolveValue(this.config.width, edge, DEFAULT_EDGE_STYLE.width),
      color: this.resolveColor(this.config.color, edge, DEFAULT_EDGE_STYLE.color),
      opacity: this.resolveValue(this.config.opacity, edge, DEFAULT_EDGE_STYLE.opacity),
      type: this.resolveValue(this.config.type, edge, DEFAULT_EDGE_STYLE.type),
      arrow: this.resolveValue(this.config.arrow, edge, DEFAULT_EDGE_STYLE.arrow),
      arrowSize: this.resolveValue(this.config.arrowSize, edge, DEFAULT_EDGE_STYLE.arrowSize),
      dashPattern: this.resolveValue(this.config.dashPattern, edge, DEFAULT_EDGE_STYLE.dashPattern),
      visible: this.resolveValue(this.config.visible, edge, DEFAULT_EDGE_STYLE.visible),
    };
    
    this.cache.set(edge.id, resolved);
    return resolved;
  }
  
  invalidate(edgeId: string): void {
    this.cache.delete(edgeId);
  }
  
  clearCache(): void {
    this.cache.clear();
  }
  
  private resolveValue<T>(
    value: T | ((data: EdgeData) => T) | undefined,
    edge: EdgeData,
    defaultValue: T
  ): T {
    if (value === undefined) return defaultValue;
    if (typeof value === 'function') {
      return (value as (data: EdgeData) => T)(edge);
    }
    return value;
  }
  
  private resolveColor(
    value: string | ((data: EdgeData) => string) | undefined,
    edge: EdgeData,
    defaultValue: number
  ): number {
    if (value === undefined) return defaultValue;
    const colorStr = typeof value === 'function' ? value(edge) : value;
    return this.parseColor(colorStr);
  }
  
  private parseColor(color: string): number {
    if (color.startsWith('#')) {
      return parseInt(color.slice(1), 16);
    }
    return 0x000000;
  }
}
```

### Files to Create
- `packages/core/src/styles/EdgeStyleResolver.ts`
- `packages/core/src/styles/__tests__/EdgeStyleResolver.test.ts`

### Tests Required
- Unit: Static values resolve
- Unit: Function values with edge data
- Unit: Cache works correctly

### Demo Addition
None (infrastructure)

---

## Task 4.2: Edge Types (Straight, Curved, Orthogonal)

### Overview
Implement different edge line types with proper geometry.

### Dependencies
- Task 4.1

### Acceptance Criteria
- [ ] Straight lines
- [ ] Curved edges (quadratic bezier)
- [ ] Orthogonal edges (right angles)
- [ ] Multi-edge support (offset parallel edges)

### Implementation Steps

```typescript
// packages/core/src/edges/EdgeGeometry.ts
export interface Point {
  x: number;
  y: number;
}

export interface EdgePath {
  type: 'line' | 'quadratic' | 'segments';
  points: Point[];
  controlPoint?: Point;  // For quadratic
}

/**
 * Calculate edge path based on type
 */
export function calculateEdgePath(
  source: Point,
  target: Point,
  type: 'straight' | 'curved' | 'orthogonal',
  offset = 0  // For multi-edges
): EdgePath {
  switch (type) {
    case 'straight':
      return calculateStraightPath(source, target, offset);
    case 'curved':
      return calculateCurvedPath(source, target, offset);
    case 'orthogonal':
      return calculateOrthogonalPath(source, target);
  }
}

function calculateStraightPath(source: Point, target: Point, offset: number): EdgePath {
  if (offset === 0) {
    return {
      type: 'line',
      points: [source, target],
    };
  }
  
  // Calculate perpendicular offset for multi-edges
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len * offset;
  const ny = dx / len * offset;
  
  return {
    type: 'line',
    points: [
      { x: source.x + nx, y: source.y + ny },
      { x: target.x + nx, y: target.y + ny },
    ],
  };
}

function calculateCurvedPath(source: Point, target: Point, offset: number): EdgePath {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  
  // Calculate perpendicular offset for control point
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.hypot(dx, dy);
  
  // Default curvature + offset for multi-edges
  const curvature = Math.min(len * 0.2, 50) + Math.abs(offset);
  const direction = offset >= 0 ? 1 : -1;
  
  const controlPoint: Point = {
    x: midX - (dy / len) * curvature * direction,
    y: midY + (dx / len) * curvature * direction,
  };
  
  return {
    type: 'quadratic',
    points: [source, target],
    controlPoint,
  };
}

function calculateOrthogonalPath(source: Point, target: Point): EdgePath {
  // Simple orthogonal: go horizontal first, then vertical
  const midX = (source.x + target.x) / 2;
  
  return {
    type: 'segments',
    points: [
      source,
      { x: midX, y: source.y },
      { x: midX, y: target.y },
      target,
    ],
  };
}

/**
 * Calculate offset for multi-edges between same nodes
 */
export function calculateMultiEdgeOffset(
  edgeIndex: number,
  totalEdges: number,
  spacing = 10
): number {
  if (totalEdges <= 1) return 0;
  const middle = (totalEdges - 1) / 2;
  return (edgeIndex - middle) * spacing;
}
```

### Files to Create
- `packages/core/src/edges/EdgeGeometry.ts`
- `packages/core/src/edges/__tests__/EdgeGeometry.test.ts`

### Tests Required
- Unit: Straight path calculation
- Unit: Curved path control point
- Unit: Orthogonal path segments
- Unit: Multi-edge offsets

### Demo Addition
None yet (Task 4.4)

---

## Task 4.3: Edge Arrows

### Overview
Implement arrow heads at source and/or target ends.

### Dependencies
- Task 4.2

### Acceptance Criteria
- [ ] Arrow at target end
- [ ] Arrow at source end
- [ ] Both arrows
- [ ] Arrow size configurable
- [ ] Arrow follows edge angle

### Implementation Steps

```typescript
// packages/core/src/edges/EdgeArrows.ts
import { Graphics } from 'pixi.js';
import type { Point, EdgePath } from './EdgeGeometry';

export interface ArrowConfig {
  size: number;
  color: number;
}

/**
 * Draw arrow head at a point
 */
export function drawArrow(
  graphics: Graphics,
  position: Point,
  angle: number,
  config: ArrowConfig
): void {
  const { size, color } = config;
  
  // Arrow points
  const tipX = position.x;
  const tipY = position.y;
  
  const baseAngle1 = angle + Math.PI * 0.85;
  const baseAngle2 = angle - Math.PI * 0.85;
  
  const base1X = tipX + Math.cos(baseAngle1) * size;
  const base1Y = tipY + Math.sin(baseAngle1) * size;
  const base2X = tipX + Math.cos(baseAngle2) * size;
  const base2Y = tipY + Math.sin(baseAngle2) * size;
  
  graphics.moveTo(tipX, tipY);
  graphics.lineTo(base1X, base1Y);
  graphics.lineTo(base2X, base2Y);
  graphics.closePath();
  graphics.fill({ color });
}

/**
 * Calculate angle at edge endpoint
 */
export function getEdgeAngleAtPoint(
  path: EdgePath,
  atTarget: boolean
): number {
  if (path.type === 'quadratic' && path.controlPoint) {
    // For curved edges, angle is from control point to endpoint
    const cp = path.controlPoint;
    const endpoint = atTarget ? path.points[1] : path.points[0];
    return Math.atan2(endpoint.y - cp.y, endpoint.x - cp.x);
  }
  
  // For straight/segments, angle is along the line
  const points = path.points;
  if (atTarget) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    return Math.atan2(last.y - prev.y, last.x - prev.x);
  } else {
    const first = points[0];
    const next = points[1];
    return Math.atan2(first.y - next.y, first.x - next.x);
  }
}

/**
 * Shorten edge to make room for arrow
 */
export function shortenEdgeForArrow(
  point: Point,
  angle: number,
  arrowSize: number,
  nodeSize: number
): Point {
  const totalOffset = arrowSize + nodeSize;
  return {
    x: point.x - Math.cos(angle) * totalOffset,
    y: point.y - Math.sin(angle) * totalOffset,
  };
}
```

### Files to Create
- `packages/core/src/edges/EdgeArrows.ts`
- `packages/core/src/edges/__tests__/EdgeArrows.test.ts`

### Tests Required
- Unit: Arrow angle calculation
- Unit: Arrow points calculation
- Unit: Edge shortening

### Demo Addition
None yet (Task 4.4)

---

## Task 4.4: Updated EdgeRenderer

### Overview
Full edge renderer with all styling options.

### Dependencies
- Task 4.3

### Acceptance Criteria
- [ ] Uses EdgeStyleResolver
- [ ] Renders all edge types
- [ ] Renders arrows
- [ ] Supports dash patterns
- [ ] Multi-edge support

### Implementation Steps

**Note:** EdgeRenderer works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/edges/EdgeRenderer.ts (complete rewrite)
import { Container, Graphics } from 'pixi.js';
import type { GraphModel, EdgeModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import { EdgeStyleResolver, type ResolvedEdgeStyle } from '../styles/EdgeStyleResolver';
import { calculateEdgePath, calculateMultiEdgeOffset, type EdgePath } from './EdgeGeometry';
import { drawArrow, getEdgeAngleAtPoint, shortenEdgeForArrow } from './EdgeArrows';
import type { EdgeData, EdgeStyleConfig } from '../types';

export class EdgeRenderer {
  private container: Container;
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private styleResolver: EdgeStyleResolver;
  
  // Track edges between same node pairs for multi-edge offset
  private edgePairs: Map<string, string[]> = new Map();
  
  // Graphics for edges (batched by style for performance)
  private graphics: Graphics;
  
  constructor(container: Container, model: GraphModel, styleConfig?: EdgeStyleConfig) {
    this.container = container;
    this.model = model;
    this.styleResolver = new EdgeStyleResolver(styleConfig);
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }
  
  setStyleConfig(config: EdgeStyleConfig): void {
    this.styleResolver.setConfig(config);
    this.render();
  }
  
  /**
   * Render all edges
   */
  render(): void {
    this.graphics.clear();
    this.buildEdgePairs();
    
    // Use GraphModel iterator
    for (const edge of this.model.edges()) {
      this.renderEdge(edge);
    }
  }
  
  private buildEdgePairs(): void {
    this.edgePairs.clear();
    
    // Use GraphModel iterator
    for (const edge of this.model.edges()) {
      // Normalize pair key (alphabetically sorted)
      const pairKey = edge.source < edge.target 
        ? `${edge.source}:${edge.target}` 
        : `${edge.target}:${edge.source}`;
      
      if (!this.edgePairs.has(pairKey)) {
        this.edgePairs.set(pairKey, []);
      }
      this.edgePairs.get(pairKey)!.push(edge.id);
    }
  }
  
  private renderEdge(edge: EdgeModel): void {
    const sourceNode = this.model.getNode(edge.source);
    const targetNode = this.model.getNode(edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    const sourcePos = { x: sourceNode.x, y: sourceNode.y };
    const targetPos = { x: targetNode.x, y: targetNode.y };
    
    // Convert EdgeModel to EdgeData for StyleResolver
    const edgeData: EdgeData = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      attributes: edge.data ?? {},
    };
    
    const style = this.styleResolver.resolve(edgeData);
    
    if (!style.visible || style.opacity === 0) return;
    
    // Calculate multi-edge offset
    const pairKey = sourceId < targetId ? `${sourceId}:${targetId}` : `${targetId}:${sourceId}`;
    const pairEdges = this.edgePairs.get(pairKey) || [];
    const edgeIndex = pairEdges.indexOf(edgeId);
    const offset = calculateMultiEdgeOffset(edgeIndex, pairEdges.length);
    
    // Calculate path
    const path = calculateEdgePath(sourcePos, targetPos, style.type, offset);
    
    // Get node sizes for arrow positioning
    const sourceSize = (sourceAttrs.size as number) ?? 10;
    const targetSize = (targetAttrs.size as number) ?? 10;
    
    // Draw edge
    this.drawEdgePath(path, style, sourceSize, targetSize);
  }
  
  private drawEdgePath(
    path: EdgePath,
    style: ResolvedEdgeStyle,
    sourceSize: number,
    targetSize: number
  ): void {
    const { width, color, opacity, arrow, arrowSize, dashPattern } = style;
    
    // Prepare stroke style
    const strokeStyle: { width: number; color: number; alpha: number } = {
      width,
      color,
      alpha: opacity,
    };
    
    // Modify endpoints for arrows
    let startPoint = path.points[0];
    let endPoint = path.points[path.points.length - 1];
    
    if (arrow === 'source' || arrow === 'both') {
      const angle = getEdgeAngleAtPoint(path, false);
      startPoint = shortenEdgeForArrow(startPoint, angle + Math.PI, arrowSize * 0.5, sourceSize);
      drawArrow(this.graphics, path.points[0], angle, { size: arrowSize, color });
    }
    
    if (arrow === 'target' || arrow === 'both') {
      const angle = getEdgeAngleAtPoint(path, true);
      endPoint = shortenEdgeForArrow(endPoint, angle, arrowSize * 0.5, targetSize);
      drawArrow(this.graphics, path.points[path.points.length - 1], angle, { size: arrowSize, color });
    }
    
    // Draw the line
    if (path.type === 'line') {
      this.graphics.moveTo(startPoint.x, startPoint.y);
      this.graphics.lineTo(endPoint.x, endPoint.y);
    } else if (path.type === 'quadratic' && path.controlPoint) {
      this.graphics.moveTo(startPoint.x, startPoint.y);
      this.graphics.quadraticCurveTo(
        path.controlPoint.x,
        path.controlPoint.y,
        endPoint.x,
        endPoint.y
      );
    } else if (path.type === 'segments') {
      this.graphics.moveTo(startPoint.x, startPoint.y);
      for (let i = 1; i < path.points.length - 1; i++) {
        this.graphics.lineTo(path.points[i].x, path.points[i].y);
      }
      this.graphics.lineTo(endPoint.x, endPoint.y);
    }
    
    this.graphics.stroke(strokeStyle);
  }
  
  destroy(): void {
    this.graphics.destroy();
  }
}
```

### Files to Modify
- `packages/core/src/edges/EdgeRenderer.ts`

### Tests Required
- Unit: Multi-edge offset calculation
- Integration: All edge types render
- Integration: Arrows render correctly

### Demo Addition
See Task 4.5

---

## Task 4.5: Edge Labels

### Overview
Add text labels to edges.

### Dependencies
- Task 4.4

### Acceptance Criteria
- [ ] Labels render at edge center
- [ ] Labels follow edge angle (optional)
- [ ] Background for readability
- [ ] LOD: hide labels at low zoom

### Implementation Steps

**Note:** EdgeLabelRenderer works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/labels/EdgeLabelRenderer.ts
import { Container, Text, Graphics, TextStyle } from 'pixi.js';
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { EdgePath } from '../edges/EdgeGeometry';

export interface EdgeLabelConfig {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  followAngle?: boolean;
  minZoomToShow?: number;
}

export class EdgeLabelRenderer {
  private container: Container;
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private config: EdgeLabelConfig;
  
  private labels: Map<string, Container> = new Map();
  
  constructor(container: Container, model: GraphModel, config?: EdgeLabelConfig) {
    this.container = container;
    this.model = model;
    this.config = {
      fontSize: config?.fontSize ?? 12,
      fontFamily: config?.fontFamily ?? 'Arial',
      color: config?.color ?? '#333333',
      backgroundColor: config?.backgroundColor ?? '#ffffff',
      padding: config?.padding ?? 4,
      followAngle: config?.followAngle ?? false,
      minZoomToShow: config?.minZoomToShow ?? 0.5,
    };
  }
  
  /**
   * Render label for an edge
   */
  renderLabel(
    edgeId: string,
    path: EdgePath,
    labelText: string | undefined
  ): void {
    if (!labelText) {
      this.removeLabel(edgeId);
      return;
    }
    
    let labelContainer = this.labels.get(edgeId);
    
    if (!labelContainer) {
      labelContainer = this.createLabel(labelText);
      this.labels.set(edgeId, labelContainer);
      this.container.addChild(labelContainer);
    }
    
    // Position at edge center
    const center = this.getPathCenter(path);
    labelContainer.position.set(center.x, center.y);
    
    // Optionally rotate to follow edge
    if (this.config.followAngle) {
      const angle = this.getPathAngle(path);
      // Flip if pointing left for readability
      const adjustedAngle = Math.abs(angle) > Math.PI / 2
        ? angle + Math.PI
        : angle;
      labelContainer.rotation = adjustedAngle;
    }
  }
  
  /**
   * Update visibility based on zoom
   */
  setZoom(zoom: number): void {
    const visible = zoom >= (this.config.minZoomToShow ?? 0);
    for (const label of this.labels.values()) {
      label.visible = visible;
    }
  }
  
  private createLabel(text: string): Container {
    const container = new Container();
    
    // Create text
    const textObj = new Text({
      text,
      style: new TextStyle({
        fontSize: this.config.fontSize,
        fontFamily: this.config.fontFamily,
        fill: this.config.color,
      }),
    });
    textObj.anchor.set(0.5);
    
    // Create background
    const padding = this.config.padding ?? 4;
    const bg = new Graphics();
    bg.roundRect(
      -textObj.width / 2 - padding,
      -textObj.height / 2 - padding,
      textObj.width + padding * 2,
      textObj.height + padding * 2,
      4
    );
    bg.fill({ color: this.config.backgroundColor ? parseInt(this.config.backgroundColor.slice(1), 16) : 0xffffff });
    
    container.addChild(bg);
    container.addChild(textObj);
    
    return container;
  }
  
  private removeLabel(edgeId: string): void {
    const label = this.labels.get(edgeId);
    if (label) {
      this.container.removeChild(label);
      label.destroy({ children: true });
      this.labels.delete(edgeId);
    }
  }
  
  private getPathCenter(path: EdgePath): { x: number; y: number } {
    if (path.type === 'quadratic' && path.controlPoint) {
      // For bezier, calculate point at t=0.5
      const t = 0.5;
      const p0 = path.points[0];
      const p1 = path.controlPoint;
      const p2 = path.points[1];
      return {
        x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
        y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
      };
    }
    
    // For straight lines, just midpoint
    const p0 = path.points[0];
    const p1 = path.points[path.points.length - 1];
    return {
      x: (p0.x + p1.x) / 2,
      y: (p0.y + p1.y) / 2,
    };
  }
  
  private getPathAngle(path: EdgePath): number {
    const p0 = path.points[0];
    const p1 = path.points[path.points.length - 1];
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
  }
  
  destroy(): void {
    for (const label of this.labels.values()) {
      label.destroy({ children: true });
    }
    this.labels.clear();
  }
}
```

### Files to Create
- `packages/core/src/labels/EdgeLabelRenderer.ts`
- `packages/core/src/labels/__tests__/EdgeLabelRenderer.test.ts`

### Tests Required
- Unit: Label positioning
- Unit: Angle calculation
- Integration: Labels render

### Demo Addition
Label input in edge styling demo

---

## Task 4.6: Demo - Edge Styling

### Overview
Interactive demo for all edge styling options.

### Dependencies
- Task 4.5

### Acceptance Criteria
- [ ] Edge type selector
- [ ] Width slider
- [ ] Color picker
- [ ] Arrow configuration
- [ ] Dash pattern toggle
- [ ] Label input

### Implementation Steps

**Note:** Demo uses `GraphonProvider` + `useGraph()` pattern. NO graphology imports!

```tsx
// apps/demo/src/demos/EdgeStyling.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  GraphonProvider, 
  Graphon, 
  useGraph, 
  type EdgeStyleConfig 
} from '@graphon/react';  // NO graphology import!

const EDGE_TYPES = ['straight', 'curved', 'orthogonal'] as const;
const ARROW_TYPES = ['none', 'target', 'source', 'both'] as const;

// Hook to generate demo graph using useGraph()
function useGenerateDemoGraph() {
  const { addNode, addEdge, batch } = useGraph();
  
  useEffect(() => {
    batch(() => {
      // Create nodes in a grid
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          addNode(`${i}-${j}`, i * 100 - 150, j * 100 - 150, { size: 15 });
        }
      }
      
      // Add various edges
      addEdge('0-0', '1-1', { label: 'A→B' });
      addEdge('1-1', '2-2', { label: 'B→C' });
      addEdge('2-2', '3-3', { label: 'C→D' });
      
      // Multi-edges
      addEdge('0-1', '1-1');
      addEdge('0-1', '1-1');
      addEdge('0-1', '1-1');
      
      // Self-loop
      addEdge('2-0', '2-0');
    });
  }, [addNode, addEdge, batch]);
}

export function EdgeStyling() {
  return (
    <GraphonProvider>
      <EdgeStylingContent />
    </GraphonProvider>
  );
}

function EdgeStylingContent() {
  useGenerateDemoGraph();
  
  // Style controls
  const [edgeType, setEdgeType] = useState<typeof EDGE_TYPES[number]>('straight');
  const [width, setWidth] = useState(2);
  const [color, setColor] = useState('#6b7280');
  const [arrow, setArrow] = useState<typeof ARROW_TYPES[number]>('target');
  const [arrowSize, setArrowSize] = useState(10);
  const [useDash, setUseDash] = useState(false);
  
  const edgeStyle: EdgeStyleConfig = useMemo(() => ({
    type: edgeType,
    width,
    color,
    arrow,
    arrowSize,
    dashPattern: useDash ? [5, 5] : null,
  }), [edgeType, width, color, arrow, arrowSize, useDash]);
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Edge Styling</h1>
        <p>Customize edge appearance with line types, arrows, and more.</p>
      </header>
      
      <div className="demo-controls">
        <div className="control-group">
          <label>Type:</label>
          <select value={edgeType} onChange={(e) => setEdgeType(e.target.value as any)}>
            {EDGE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Width: {width}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        
        <div className="control-group">
          <label>Arrow:</label>
          <select value={arrow} onChange={(e) => setArrow(e.target.value as any)}>
            {ARROW_TYPES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label>Arrow Size: {arrowSize}</label>
          <input
            type="range"
            min="5"
            max="20"
            value={arrowSize}
            onChange={(e) => setArrowSize(Number(e.target.value))}
          />
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={useDash}
              onChange={(e) => setUseDash(e.target.checked)}
            />
            Dashed
          </label>
        </div>
        
        <button onClick={() => fitToView()}>Fit to View</button>
      </div>
      
      <div className="demo-info">
        <p>This demo shows multi-edges (3 parallel edges) and different styling options.</p>
      </div>
      
      <div className="demo-canvas">
        <Graphon
          ref={ref}
          graph={graph}
          edgeStyle={edgeStyle}
          nodeStyle={{ size: 15, color: '#6366f1' }}
          onReady={() => fitToView(false)}
        />
      </div>
    </div>
  );
}
```

### Files to Create
- `apps/demo/src/demos/EdgeStyling.tsx`

### Tests Required
- Visual: Screenshot with each edge type
- Visual: Screenshot with arrows
- Visual: Screenshot with multi-edges

### Demo Addition
- Full edge styling demo page

---

## Phase 4 Checklist

- [ ] Edge style resolver works
- [ ] All edge types (straight, curved, orthogonal) render
- [ ] Arrows render at correct angles
- [ ] Multi-edge support works
- [ ] Edge labels render
- [ ] Demo shows all options
- [ ] All tests pass

**Estimated time:** 2 days
