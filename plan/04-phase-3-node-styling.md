# Phase 3: Node Styling

## Overview

Implement comprehensive node styling: shapes, colors, sizes, images, icons, and data-driven styles.

---

## Task 3.1: Style Resolver System

### Overview
Create a system that resolves style values from config (static or function).

### Dependencies
- Phase 2 complete

### Acceptance Criteria
- [ ] Resolves static values
- [ ] Resolves function values with node data
- [ ] Caches resolved values for performance
- [ ] Invalidates cache on node change

### Implementation Steps

```typescript
// packages/core/src/styles/StyleResolver.ts
import type { NodeData, EdgeData, NodeStyleConfig } from '../types';

type StyleValue<T> = T | ((data: NodeData | EdgeData) => T);

export interface ResolvedNodeStyle {
  shape: 'circle' | 'rectangle' | 'diamond' | 'triangle' | 'star';
  size: number;
  color: number;         // Hex color as number
  borderColor: number;
  borderWidth: number;
  opacity: number;
  image: string | null;
  icon: string | null;
  visible: boolean;
}

const DEFAULT_NODE_STYLE: ResolvedNodeStyle = {
  shape: 'circle',
  size: 10,
  color: 0x6366f1,
  borderColor: 0xffffff,
  borderWidth: 0,
  opacity: 1,
  image: null,
  icon: null,
  visible: true,
};

export class NodeStyleResolver {
  private config: NodeStyleConfig;
  private cache: Map<string, ResolvedNodeStyle> = new Map();
  
  constructor(config: NodeStyleConfig = {}) {
    this.config = config;
  }
  
  /**
   * Update style config
   */
  setConfig(config: NodeStyleConfig): void {
    this.config = config;
    this.cache.clear();
  }
  
  /**
   * Resolve style for a node
   */
  resolve(node: NodeData): ResolvedNodeStyle {
    const cached = this.cache.get(node.id);
    if (cached) return cached;
    
    const resolved: ResolvedNodeStyle = {
      shape: this.resolveValue(this.config.shape, node, DEFAULT_NODE_STYLE.shape),
      size: this.resolveValue(this.config.size, node, DEFAULT_NODE_STYLE.size),
      color: this.resolveColor(this.config.color, node, DEFAULT_NODE_STYLE.color),
      borderColor: this.resolveColor(this.config.borderColor, node, DEFAULT_NODE_STYLE.borderColor),
      borderWidth: this.resolveValue(this.config.borderWidth, node, DEFAULT_NODE_STYLE.borderWidth),
      opacity: this.resolveValue(this.config.opacity, node, DEFAULT_NODE_STYLE.opacity),
      image: this.resolveValue(this.config.image, node, DEFAULT_NODE_STYLE.image),
      icon: this.resolveValue(this.config.icon, node, DEFAULT_NODE_STYLE.icon),
      visible: this.resolveValue(this.config.visible, node, DEFAULT_NODE_STYLE.visible),
    };
    
    this.cache.set(node.id, resolved);
    return resolved;
  }
  
  /**
   * Invalidate cache for specific node
   */
  invalidate(nodeId: string): void {
    this.cache.delete(nodeId);
  }
  
  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  private resolveValue<T>(value: StyleValue<T> | undefined, node: NodeData, defaultValue: T): T {
    if (value === undefined) return defaultValue;
    if (typeof value === 'function') {
      return (value as (data: NodeData) => T)(node);
    }
    return value;
  }
  
  private resolveColor(value: StyleValue<string> | undefined, node: NodeData, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const colorStr = typeof value === 'function' ? value(node) : value;
    return this.parseColor(colorStr);
  }
  
  private parseColor(color: string): number {
    if (color.startsWith('#')) {
      return parseInt(color.slice(1), 16);
    }
    // Add more color parsing (rgb, named colors) as needed
    return 0x000000;
  }
}
```

### Files to Create
- `packages/core/src/styles/StyleResolver.ts`
- `packages/core/src/styles/index.ts`
- `packages/core/src/styles/__tests__/StyleResolver.test.ts`

### Tests Required
- Unit: Static values resolve correctly
- Unit: Function values called with node data
- Unit: Cache returns same object
- Unit: Invalidate clears specific node
- Unit: Color parsing works

### Demo Addition
None (infrastructure)

---

## Task 3.2: Node Shapes

### Overview
Implement multiple node shapes: circle, rectangle, diamond, triangle, star.

### Dependencies
- Task 3.1

### Acceptance Criteria
- [ ] All 5 shapes render correctly
- [ ] Shapes sized consistently (bounding box)
- [ ] Shapes support fill and border
- [ ] Custom polygon support (future)

### Implementation Steps

```typescript
// packages/core/src/nodes/shapes/index.ts
import { Graphics } from 'pixi.js';

export type ShapeType = 'circle' | 'rectangle' | 'diamond' | 'triangle' | 'star';

export interface ShapeConfig {
  size: number;
  color: number;
  borderColor: number;
  borderWidth: number;
}

export function drawShape(
  graphics: Graphics,
  shape: ShapeType,
  config: ShapeConfig
): void {
  const { size, color, borderColor, borderWidth } = config;
  
  graphics.clear();
  
  switch (shape) {
    case 'circle':
      drawCircle(graphics, size, color, borderColor, borderWidth);
      break;
    case 'rectangle':
      drawRectangle(graphics, size, color, borderColor, borderWidth);
      break;
    case 'diamond':
      drawDiamond(graphics, size, color, borderColor, borderWidth);
      break;
    case 'triangle':
      drawTriangle(graphics, size, color, borderColor, borderWidth);
      break;
    case 'star':
      drawStar(graphics, size, color, borderColor, borderWidth);
      break;
  }
}

function drawCircle(g: Graphics, size: number, fill: number, stroke: number, strokeWidth: number): void {
  g.circle(0, 0, size);
  g.fill({ color: fill });
  if (strokeWidth > 0) {
    g.stroke({ color: stroke, width: strokeWidth });
  }
}

function drawRectangle(g: Graphics, size: number, fill: number, stroke: number, strokeWidth: number): void {
  const s = size * 1.6; // Adjust to match circle area roughly
  g.rect(-s / 2, -s / 2, s, s);
  g.fill({ color: fill });
  if (strokeWidth > 0) {
    g.stroke({ color: stroke, width: strokeWidth });
  }
}

function drawDiamond(g: Graphics, size: number, fill: number, stroke: number, strokeWidth: number): void {
  const s = size * 1.4;
  g.moveTo(0, -s);
  g.lineTo(s, 0);
  g.lineTo(0, s);
  g.lineTo(-s, 0);
  g.closePath();
  g.fill({ color: fill });
  if (strokeWidth > 0) {
    g.stroke({ color: stroke, width: strokeWidth });
  }
}

function drawTriangle(g: Graphics, size: number, fill: number, stroke: number, strokeWidth: number): void {
  const s = size * 1.5;
  const h = s * Math.sqrt(3) / 2;
  g.moveTo(0, -h * 0.6);
  g.lineTo(s, h * 0.4);
  g.lineTo(-s, h * 0.4);
  g.closePath();
  g.fill({ color: fill });
  if (strokeWidth > 0) {
    g.stroke({ color: stroke, width: strokeWidth });
  }
}

function drawStar(g: Graphics, size: number, fill: number, stroke: number, strokeWidth: number): void {
  const points = 5;
  const outerRadius = size * 1.3;
  const innerRadius = outerRadius * 0.4;
  
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      g.moveTo(x, y);
    } else {
      g.lineTo(x, y);
    }
  }
  g.closePath();
  g.fill({ color: fill });
  if (strokeWidth > 0) {
    g.stroke({ color: stroke, width: strokeWidth });
  }
}

export { drawCircle, drawRectangle, drawDiamond, drawTriangle, drawStar };
```

### Files to Create
- `packages/core/src/nodes/shapes/index.ts`
- `packages/core/src/nodes/shapes/__tests__/shapes.test.ts`

### Tests Required
- Unit: Each shape draws without error
- Visual: Screenshot of each shape

### Demo Addition
Shape selector in demo

---

## Task 3.3: Node Images and Icons

### Overview
Support images (URLs) and icons (font icons) in nodes.

### Dependencies
- Task 3.2

### Acceptance Criteria
- [ ] Image URLs load and display
- [ ] Images clip to node shape
- [ ] Font icons render (FontAwesome)
- [ ] Fallback to shape if image fails
- [ ] Image caching

### Implementation Steps

```typescript
// packages/core/src/nodes/NodeImageRenderer.ts
import { Sprite, Texture, Assets, Container, Graphics } from 'pixi.js';

export class NodeImageRenderer {
  private imageCache: Map<string, Texture> = new Map();
  private loadingPromises: Map<string, Promise<Texture>> = new Map();
  
  /**
   * Get or load texture for URL
   */
  async getTexture(url: string): Promise<Texture | null> {
    // Check cache
    const cached = this.imageCache.get(url);
    if (cached) return cached;
    
    // Check if already loading
    const loading = this.loadingPromises.get(url);
    if (loading) return loading;
    
    // Start loading
    const promise = this.loadTexture(url);
    this.loadingPromises.set(url, promise);
    
    try {
      const texture = await promise;
      this.imageCache.set(url, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load image: ${url}`, error);
      return null;
    } finally {
      this.loadingPromises.delete(url);
    }
  }
  
  private async loadTexture(url: string): Promise<Texture> {
    return Assets.load(url);
  }
  
  /**
   * Create sprite with circular mask
   */
  createMaskedSprite(
    texture: Texture,
    size: number,
    shape: 'circle' | 'rectangle'
  ): Container {
    const container = new Container();
    
    // Create sprite
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    
    // Scale to fit
    const scale = (size * 2) / Math.max(texture.width, texture.height);
    sprite.scale.set(scale);
    
    // Create mask
    const mask = new Graphics();
    if (shape === 'circle') {
      mask.circle(0, 0, size);
    } else {
      mask.rect(-size, -size, size * 2, size * 2);
    }
    mask.fill({ color: 0xffffff });
    
    sprite.mask = mask;
    container.addChild(mask);
    container.addChild(sprite);
    
    return container;
  }
  
  /**
   * Clean up
   */
  destroy(): void {
    // Textures are managed by Assets, don't destroy manually
    this.imageCache.clear();
  }
}
```

```typescript
// packages/core/src/nodes/NodeIconRenderer.ts
import { Text, TextStyle } from 'pixi.js';

// FontAwesome Unicode mappings (subset)
const ICON_MAP: Record<string, string> = {
  'user': '\uf007',
  'home': '\uf015',
  'star': '\uf005',
  'heart': '\uf004',
  'cog': '\uf013',
  'search': '\uf002',
  'folder': '\uf07b',
  'file': '\uf15b',
  // Add more as needed
};

export class NodeIconRenderer {
  private style: TextStyle;
  
  constructor() {
    this.style = new TextStyle({
      fontFamily: 'Font Awesome 6 Free',
      fontWeight: '900',
      fill: 0xffffff,
    });
  }
  
  /**
   * Create icon text
   */
  createIcon(iconName: string, size: number, color: number): Text {
    const char = ICON_MAP[iconName] || iconName;
    
    const text = new Text({
      text: char,
      style: {
        ...this.style,
        fontSize: size * 1.2,
        fill: color,
      },
    });
    
    text.anchor.set(0.5);
    return text;
  }
}
```

### Files to Create
- `packages/core/src/nodes/NodeImageRenderer.ts`
- `packages/core/src/nodes/NodeIconRenderer.ts`
- Tests for both

### Tests Required
- Unit: Image loads and caches
- Unit: Icon maps correctly
- Integration: Node with image renders
- Integration: Node with icon renders

### Demo Addition
- Image URL input
- Icon selector dropdown

---

## Task 3.4: Update NodeRenderer for Full Styling

### Overview
Integrate style resolver, shapes, images, and icons into NodeRenderer.

**Note:** NodeRenderer works with `GraphModel` interface, NOT graphology directly.

### Dependencies
- Task 3.3

### Acceptance Criteria
- [ ] NodeRenderer uses StyleResolver
- [ ] All shapes render correctly
- [ ] Images load and display
- [ ] Icons display
- [ ] Style changes trigger re-render
- [ ] **No graphology imports**

### Implementation Steps

```typescript
// packages/core/src/nodes/NodeRenderer.ts (updated)
import { Container, Graphics } from 'pixi.js';
import type { GraphModel, NodeModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import { NodeStyleResolver, type ResolvedNodeStyle } from '../styles/StyleResolver';
import { drawShape } from './shapes';
import { NodeImageRenderer } from './NodeImageRenderer';
import { NodeIconRenderer } from './NodeIconRenderer';
import type { NodeData, NodeStyleConfig } from '../types';

export class NodeRenderer {
  private container: Container;
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private styleResolver: NodeStyleResolver;
  private imageRenderer: NodeImageRenderer;
  private iconRenderer: NodeIconRenderer;
  
  private nodeContainers: Map<string, Container> = new Map();
  private visibleNodes: Set<string> = new Set();
  
  constructor(container: Container, model: GraphModel, styleConfig?: NodeStyleConfig) {
    this.container = container;
    this.model = model;
    this.styleResolver = new NodeStyleResolver(styleConfig);
    this.imageRenderer = new NodeImageRenderer();
    this.iconRenderer = new NodeIconRenderer();
  }
  
  /**
   * Update style configuration
   */
  setStyleConfig(config: NodeStyleConfig): void {
    this.styleResolver.setConfig(config);
    this.styleResolver.clearCache();
    this.renderAll();
  }
  
  /**
   * Render all visible nodes
   */
  renderAll(): void {
    for (const nodeId of this.visibleNodes) {
      this.renderNode(nodeId);
    }
  }
  
  /**
   * Render a single node
   */
  private renderNode(nodeId: string): void {
    const node = this.model.getNode(nodeId);  // Use GraphModel
    if (!node) return;
    
    // Convert NodeModel to NodeData for StyleResolver
    const nodeData: NodeData = {
      id: node.id,
      attributes: node.data ?? {},
      x: node.x,
      y: node.y,
    };
    
    const style = this.styleResolver.resolve(nodeData);
    
    // Get or create container
    let nodeContainer = this.nodeContainers.get(nodeId);
    if (!nodeContainer) {
      nodeContainer = new Container();
      nodeContainer.label = nodeId;
      this.nodeContainers.set(nodeId, nodeContainer);
      this.container.addChild(nodeContainer);
    }
    
    // Clear existing children
    nodeContainer.removeChildren();
    
    if (!style.visible) {
      nodeContainer.visible = false;
      return;
    }
    
    nodeContainer.visible = true;
    nodeContainer.position.set(nodeData.x, nodeData.y);
    nodeContainer.alpha = style.opacity;
    
    // Draw base shape
    const shapeGraphics = new Graphics();
    drawShape(shapeGraphics, style.shape, {
      size: style.size,
      color: style.color,
      borderColor: style.borderColor,
      borderWidth: style.borderWidth,
    });
    nodeContainer.addChild(shapeGraphics);
    
    // Add image if specified
    if (style.image) {
      this.addImage(nodeContainer, style.image, style.size, style.shape);
    }
    
    // Add icon if specified (and no image)
    if (style.icon && !style.image) {
      const icon = this.iconRenderer.createIcon(style.icon, style.size, 0xffffff);
      nodeContainer.addChild(icon);
    }
  }
  
  private async addImage(
    container: Container,
    url: string,
    size: number,
    shape: ResolvedNodeStyle['shape']
  ): Promise<void> {
    const texture = await this.imageRenderer.getTexture(url);
    if (texture) {
      const maskShape = shape === 'circle' ? 'circle' : 'rectangle';
      const sprite = this.imageRenderer.createMaskedSprite(texture, size, maskShape);
      container.addChild(sprite);
    }
  }
  
  /**
   * Set visible nodes (culling)
   */
  setVisibleNodes(nodeIds: Set<string>): void {
    // Hide removed nodes
    for (const nodeId of this.visibleNodes) {
      if (!nodeIds.has(nodeId)) {
        const container = this.nodeContainers.get(nodeId);
        if (container) container.visible = false;
      }
    }
    
    // Show/render new visible nodes
    for (const nodeId of nodeIds) {
      if (!this.visibleNodes.has(nodeId)) {
        this.renderNode(nodeId);
      }
      const container = this.nodeContainers.get(nodeId);
      if (container) container.visible = true;
    }
    
    this.visibleNodes = new Set(nodeIds);
  }
  
  /**
   * Update single node
   */
  updateNode(nodeId: string): void {
    this.styleResolver.invalidate(nodeId);
    if (this.visibleNodes.has(nodeId)) {
      this.renderNode(nodeId);
    }
  }
  
  /**
   * Get container for hit testing
   */
  getNodeContainer(nodeId: string): Container | undefined {
    return this.nodeContainers.get(nodeId);
  }
  
  destroy(): void {
    for (const container of this.nodeContainers.values()) {
      container.destroy({ children: true });
    }
    this.nodeContainers.clear();
    this.imageRenderer.destroy();
  }
}
```

### Files to Modify
- `packages/core/src/nodes/NodeRenderer.ts`
- `packages/core/src/Graphon.ts` (pass style config)

### Tests Required
- Unit: Style config updates trigger re-render
- Integration: Different shapes render
- Integration: Function styles resolve per node

### Demo Addition
None yet (Task 3.5)

---

## Task 3.5: Demo - Node Styling

### Overview
Interactive demo for all node styling options.

**Note:** Demo uses `GraphonProvider` + `useGraph()` pattern. NO graphology imports!

### Dependencies
- Task 3.4

### Acceptance Criteria
- [ ] Shape selector (all 5 shapes)
- [ ] Size slider
- [ ] Color picker
- [ ] Border controls
- [ ] Data-driven styles demo
- [ ] Image URL input
- [ ] Icon selector
- [ ] **No graphology imports**

### Implementation Steps

```tsx
// apps/demo/src/demos/NodeStyling.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  GraphonProvider, 
  Graphon, 
  useGraph,
  type NodeStyleConfig, 
  type NodeData 
} from '@graphon/react';  // NO graphology import!

const SHAPES = ['circle', 'rectangle', 'diamond', 'triangle', 'star'] as const;
const ICONS = ['user', 'home', 'star', 'heart', 'cog', 'search', 'folder', 'file'];

const CLUSTERS = ['A', 'B', 'C', 'D'];
const CLUSTER_COLORS: Record<string, string> = {
  A: '#ef4444',
  B: '#22c55e',
  C: '#3b82f6',
  D: '#f59e0b',
};

// Hook to generate clustered graph using useGraph()
function useGenerateClusteredGraph() {
  const { addNode, addEdge, batch } = useGraph();
  
  useEffect(() => {
    // Generate nodes in a batch for performance
    const nodeData: Array<{ id: string; cluster: string }> = [];
    
    batch(() => {
      for (let i = 0; i < 100; i++) {
        const cluster = CLUSTERS[Math.floor(Math.random() * CLUSTERS.length)];
        const clusterIndex = CLUSTERS.indexOf(cluster);
        const angle = Math.random() * Math.PI * 2;
        const radius = 50 + Math.random() * 50;
        const centerX = (clusterIndex % 2) * 300 - 150;
        const centerY = Math.floor(clusterIndex / 2) * 300 - 150;
        
        const id = `node-${i}`;
        addNode(id, 
          centerX + Math.cos(angle) * radius, 
          centerY + Math.sin(angle) * radius, 
          {
            cluster,
            clusterColor: CLUSTER_COLORS[cluster],
            weight: Math.random(),
          }
        );
        nodeData.push({ id, cluster });
      }
      
      // Add edges within clusters
      for (let i = 0; i < nodeData.length; i++) {
        for (let j = i + 1; j < nodeData.length; j++) {
          if (nodeData[i].cluster === nodeData[j].cluster && Math.random() < 0.1) {
            addEdge(nodeData[i].id, nodeData[j].id);
          }
        }
      }
    });
  }, [addNode, addEdge, batch]);
}

export function NodeStyling() {
  return (
    <GraphonProvider>
      <NodeStylingContent />
    </GraphonProvider>
  );
}

function NodeStylingContent() {
  useGenerateClusteredGraph();
  
  // Style controls
  const [shape, setShape] = useState<typeof SHAPES[number]>('circle');
  const [size, setSize] = useState(12);
  const [color, setColor] = useState('#6366f1');
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [useDataDriven, setUseDataDriven] = useState(false);
  
  const nodeStyle: NodeStyleConfig = useMemo(() => {
    if (useDataDriven) {
      return {
        shape: (node: NodeData) => {
          const cluster = node.attributes?.cluster as string;
          const shapes: Record<string, typeof SHAPES[number]> = {
            A: 'circle', B: 'rectangle', C: 'diamond', D: 'star',
          };
          return shapes[cluster] || 'circle';
        },
        size: (node: NodeData) => 8 + ((node.attributes?.weight as number) ?? 0.5) * 12,
        color: (node: NodeData) => node.attributes?.clusterColor as string,
        borderWidth: 2,
        borderColor: '#ffffff',
      };
    }
    return {
      shape,
      size,
      color,
      borderWidth,
      borderColor,
    };
  }, [shape, size, color, borderWidth, borderColor, useDataDriven]);
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Node Styling</h1>
        <p>Customize node appearance with shapes, colors, sizes, and data-driven styles.</p>
      </header>
      
      <div className="demo-controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={useDataDriven}
              onChange={(e) => setUseDataDriven(e.target.checked)}
            />
            Data-Driven Styles
          </label>
        </div>
        
        {!useDataDriven && (
          <>
            <div className="control-group">
              <label>Shape:</label>
              <select value={shape} onChange={(e) => setShape(e.target.value as typeof SHAPES[number])}>
                {SHAPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div className="control-group">
              <label>Size: {size}</label>
              <input
                type="range"
                min="4"
                max="30"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
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
              <label>Border Width: {borderWidth}</label>
              <input
                type="range"
                min="0"
                max="5"
                value={borderWidth}
                onChange={(e) => setBorderWidth(Number(e.target.value))}
              />
            </div>
            
            <div className="control-group">
              <label>Border Color:</label>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
              />
            </div>
          </>
        )}
      </div>
      
      {useDataDriven && (
        <div className="demo-info">
          <p><strong>Data-Driven Mode:</strong></p>
          <ul>
            <li>Shape is based on cluster (A=circle, B=rectangle, C=diamond, D=star)</li>
            <li>Size is based on node weight</li>
            <li>Color is based on cluster color</li>
          </ul>
        </div>
      )}
      
      <div className="demo-canvas">
        {/* No graph prop needed - gets model from GraphonProvider */}
        <Graphon nodeStyle={nodeStyle} />
      </div>
    </div>
  );
}
```

### Files to Create
- `apps/demo/src/demos/NodeStyling.tsx`
- Update `apps/demo/src/App.tsx` to add route

### Tests Required
- Visual: Screenshot with each shape
- Visual: Screenshot with data-driven styles
- Visual: Screenshot with images

### Demo Addition
- Full node styling demo page

---

## Phase 3 Checklist

After completing all tasks:

- [ ] Style resolver system works
- [ ] All 5 shapes render correctly
- [ ] Images load and display
- [ ] Icons display
- [ ] Data-driven styles work
- [ ] Demo shows all styling options
- [ ] All tests pass

**Estimated time:** 2 days
