# Phase 1: Core Infrastructure

## Overview

Build the foundational infrastructure: domain model interfaces, adapters, and rendering system.

**Key Architecture Principle:** graphology is an implementation detail. Users interact with our `GraphModel` abstraction. See [Architecture Review](13-architecture-review.md).

---

## Task 1.1: GraphModel Interface (Domain Layer)

### Overview
Define the core `GraphModel` interface that abstracts graph storage. This is the foundation of our clean architecture - all other code depends on this interface, not on graphology directly.

### Dependencies
- Phase 0 complete

### Acceptance Criteria
- [ ] `GraphModel` interface defined
- [ ] `NodeModel`, `EdgeModel` types defined
- [ ] Event types defined
- [ ] NO imports from graphology in this file

### Implementation Steps

1. Create domain model interfaces:
```typescript
// packages/core/src/model/types.ts

/**
 * Data attached to a node (user-defined properties)
 */
export interface NodeData {
  label?: string;
  size?: number;
  color?: string;
  shape?: 'circle' | 'rect' | 'diamond' | 'triangle';
  icon?: string;
  image?: string;
  [key: string]: unknown;
}

/**
 * Data attached to an edge (user-defined properties)
 */
export interface EdgeData {
  label?: string;
  width?: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  [key: string]: unknown;
}

/**
 * Immutable view of a node
 */
export interface NodeModel {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly data: Readonly<NodeData>;
}

/**
 * Immutable view of an edge
 */
export interface EdgeModel {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly data: Readonly<EdgeData>;
}

/**
 * Serializable graph format for import/export
 */
export interface SerializedGraph {
  nodes: Array<{ id: string; x: number; y: number; data?: NodeData }>;
  edges: Array<{ id: string; source: string; target: string; data?: EdgeData }>;
}
```

```typescript
// packages/core/src/model/GraphModel.ts

import type { NodeModel, EdgeModel, NodeData, EdgeData, SerializedGraph } from './types';

/**
 * Events emitted by GraphModel.
 * These are domain events, not implementation events.
 */
export interface GraphModelEvents {
  nodeAdded: (node: NodeModel) => void;
  nodeRemoved: (nodeId: string) => void;
  nodeUpdated: (node: NodeModel, changes: Partial<NodeData & { x: number; y: number }>) => void;
  edgeAdded: (edge: EdgeModel) => void;
  edgeRemoved: (edgeId: string) => void;
  edgeUpdated: (edge: EdgeModel, changes: Partial<EdgeData>) => void;
  cleared: () => void;
  batchComplete: () => void;
}

/**
 * Abstract interface for graph storage.
 * 
 * This is what all Graphon code depends on - NOT graphology.
 * Implementation can be swapped (graphology, custom, IndexedDB, etc.)
 */
export interface GraphModel {
  // --- Node Operations ---
  addNode(id: string, x: number, y: number, data?: NodeData): void;
  removeNode(id: string): void;
  hasNode(id: string): boolean;
  getNode(id: string): NodeModel | undefined;
  updateNode(id: string, updates: Partial<NodeData & { x: number; y: number }>): void;
  
  // --- Edge Operations ---
  addEdge(source: string, target: string, data?: EdgeData): string;
  addEdgeWithId(id: string, source: string, target: string, data?: EdgeData): void;
  removeEdge(id: string): void;
  hasEdge(id: string): boolean;
  getEdge(id: string): EdgeModel | undefined;
  
  // --- Iteration ---
  getNodeCount(): number;
  getEdgeCount(): number;
  forEachNode(callback: (node: NodeModel) => void): void;
  forEachEdge(callback: (edge: EdgeModel) => void): void;
  getNodeEdges(nodeId: string): EdgeModel[];
  getNeighbors(nodeId: string): string[];
  
  // --- Bulk Operations ---
  clear(): void;
  import(data: SerializedGraph): void;
  export(): SerializedGraph;
  
  // --- Batching ---
  batch(fn: () => void): void;
  
  // --- Events ---
  on<K extends keyof GraphModelEvents>(event: K, handler: GraphModelEvents[K]): void;
  off<K extends keyof GraphModelEvents>(event: K, handler: GraphModelEvents[K]): void;
}
```

### Files to Create
- `packages/core/src/model/types.ts`
- `packages/core/src/model/GraphModel.ts`
- `packages/core/src/model/index.ts`

### Tests Required
- Type tests (ensure types compile correctly)

---

## Task 1.2: GraphologyAdapter (Infrastructure Layer)

### Overview
Implement `GraphModel` using graphology. This is the ONLY file that imports graphology.

### Dependencies
- Task 1.1

### Acceptance Criteria
- [ ] Implements `GraphModel` interface
- [ ] All graphology imports isolated here
- [ ] Events properly mapped
- [ ] Batch operations work

### Implementation Steps

```typescript
// packages/core/src/adapters/GraphologyAdapter.ts

import Graph from 'graphology';
import type { 
  GraphModel, 
  GraphModelEvents, 
  NodeModel, 
  EdgeModel, 
  NodeData, 
  EdgeData, 
  SerializedGraph 
} from '../model';

/**
 * GraphModel implementation using graphology.
 * 
 * This is the ONLY file that imports graphology.
 * Changing graph storage only requires replacing this adapter.
 */
export class GraphologyAdapter implements GraphModel {
  private graph: Graph;
  private handlers = new Map<keyof GraphModelEvents, Set<Function>>();
  private inBatch = false;
  private pendingEvents: Array<() => void> = [];
  
  constructor() {
    this.graph = new Graph();
    this.bindGraphologyEvents();
  }
  
  // --- Node Operations ---
  
  addNode(id: string, x: number, y: number, data?: NodeData): void {
    this.graph.addNode(id, { x, y, ...data });
  }
  
  removeNode(id: string): void {
    this.graph.dropNode(id);
  }
  
  hasNode(id: string): boolean {
    return this.graph.hasNode(id);
  }
  
  getNode(id: string): NodeModel | undefined {
    if (!this.graph.hasNode(id)) return undefined;
    const attrs = this.graph.getNodeAttributes(id);
    return this.toNodeModel(id, attrs);
  }
  
  updateNode(id: string, updates: Partial<NodeData & { x: number; y: number }>): void {
    for (const [key, value] of Object.entries(updates)) {
      this.graph.setNodeAttribute(id, key, value);
    }
  }
  
  // --- Edge Operations ---
  
  addEdge(source: string, target: string, data?: EdgeData): string {
    return this.graph.addEdge(source, target, data);
  }
  
  addEdgeWithId(id: string, source: string, target: string, data?: EdgeData): void {
    this.graph.addEdgeWithKey(id, source, target, data);
  }
  
  removeEdge(id: string): void {
    this.graph.dropEdge(id);
  }
  
  hasEdge(id: string): boolean {
    return this.graph.hasEdge(id);
  }
  
  getEdge(id: string): EdgeModel | undefined {
    if (!this.graph.hasEdge(id)) return undefined;
    const [source, target] = this.graph.extremities(id);
    const attrs = this.graph.getEdgeAttributes(id);
    return { id, source, target, data: attrs as EdgeData };
  }
  
  // --- Iteration ---
  
  getNodeCount(): number {
    return this.graph.order;
  }
  
  getEdgeCount(): number {
    return this.graph.size;
  }
  
  forEachNode(callback: (node: NodeModel) => void): void {
    this.graph.forEachNode((id, attrs) => {
      callback(this.toNodeModel(id, attrs));
    });
  }
  
  forEachEdge(callback: (edge: EdgeModel) => void): void {
    this.graph.forEachEdge((id, attrs, source, target) => {
      callback({ id, source, target, data: attrs as EdgeData });
    });
  }
  
  getNodeEdges(nodeId: string): EdgeModel[] {
    const edges: EdgeModel[] = [];
    this.graph.forEachEdge(nodeId, (id, attrs, source, target) => {
      edges.push({ id, source, target, data: attrs as EdgeData });
    });
    return edges;
  }
  
  getNeighbors(nodeId: string): string[] {
    return this.graph.neighbors(nodeId);
  }
  
  // --- Bulk ---
  
  clear(): void {
    this.graph.clear();
  }
  
  import(data: SerializedGraph): void {
    this.batch(() => {
      this.clear();
      for (const node of data.nodes) {
        this.addNode(node.id, node.x, node.y, node.data);
      }
      for (const edge of data.edges) {
        this.addEdgeWithId(edge.id, edge.source, edge.target, edge.data);
      }
    });
  }
  
  export(): SerializedGraph {
    const nodes: SerializedGraph['nodes'] = [];
    const edges: SerializedGraph['edges'] = [];
    
    this.forEachNode(n => nodes.push({ id: n.id, x: n.x, y: n.y, data: { ...n.data } }));
    this.forEachEdge(e => edges.push({ id: e.id, source: e.source, target: e.target, data: { ...e.data } }));
    
    return { nodes, edges };
  }
  
  // --- Batching ---
  
  batch(fn: () => void): void {
    this.inBatch = true;
    try {
      fn();
    } finally {
      this.inBatch = false;
      // Flush pending events
      const events = this.pendingEvents;
      this.pendingEvents = [];
      events.forEach(emit => emit());
      this.emit('batchComplete');
    }
  }
  
  // --- Events ---
  
  on<K extends keyof GraphModelEvents>(event: K, handler: GraphModelEvents[K]): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }
  
  off<K extends keyof GraphModelEvents>(event: K, handler: GraphModelEvents[K]): void {
    this.handlers.get(event)?.delete(handler);
  }
  
  private emit<K extends keyof GraphModelEvents>(
    event: K, 
    ...args: Parameters<GraphModelEvents[K]>
  ): void {
    if (this.inBatch && event !== 'batchComplete') {
      this.pendingEvents.push(() => this.emit(event, ...args));
      return;
    }
    
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        (handler as Function)(...args);
      }
    }
  }
  
  // --- Private ---
  
  private toNodeModel(id: string, attrs: Record<string, unknown>): NodeModel {
    const { x = 0, y = 0, ...data } = attrs;
    return { id, x: x as number, y: y as number, data: data as NodeData };
  }
  
  private bindGraphologyEvents(): void {
    this.graph.on('nodeAdded', ({ key, attributes }) => {
      this.emit('nodeAdded', this.toNodeModel(key, attributes));
    });
    
    this.graph.on('nodeDropped', ({ key }) => {
      this.emit('nodeRemoved', key);
    });
    
    this.graph.on('nodeAttributesUpdated', ({ key, attributes }) => {
      this.emit('nodeUpdated', this.toNodeModel(key, this.graph.getNodeAttributes(key)), attributes);
    });
    
    this.graph.on('edgeAdded', ({ key, source, target, attributes }) => {
      this.emit('edgeAdded', { id: key, source, target, data: attributes as EdgeData });
    });
    
    this.graph.on('edgeDropped', ({ key }) => {
      this.emit('edgeRemoved', key);
    });
    
    this.graph.on('cleared', () => {
      this.emit('cleared');
    });
  }
}
```

### Files to Create
- `packages/core/src/adapters/GraphologyAdapter.ts`
- `packages/core/src/adapters/index.ts`

### Tests Required
- Unit: All CRUD operations
- Unit: Events fire correctly
- Unit: Batch batches events

---

## Task 1.3: Factory & Package Exports

### Overview
Create factory function and clean exports. Users never import graphology.

### Dependencies
- Task 1.2

### Acceptance Criteria
- [ ] `createGraphModel()` factory exists
- [ ] Public exports don't expose graphology
- [ ] Types are re-exported properly

### Implementation Steps

```typescript
// packages/core/src/factory.ts

import type { GraphModel } from './model';
import { GraphologyAdapter } from './adapters';

/**
 * Create a new GraphModel instance.
 * Implementation detail (graphology) is hidden.
 */
export function createGraphModel(): GraphModel {
  return new GraphologyAdapter();
}
```

```typescript
// packages/core/src/index.ts

// --- Types (public) ---
export type { 
  GraphModel, 
  GraphModelEvents,
  NodeModel, 
  EdgeModel, 
  NodeData, 
  EdgeData, 
  SerializedGraph 
} from './model';

// --- Factory (public) ---
export { createGraphModel } from './factory';

// --- DO NOT export adapters or graphology types ---
```

### Files to Create/Modify
- `packages/core/src/factory.ts`
- `packages/core/src/index.ts`

### Tests Required
- Smoke test: can create model and use it
```

```typescript
// packages/core/src/types/styles.ts
export type StyleValue<T> = T | ((data: NodeData | EdgeData) => T);

export interface NodeStyleConfig {
  shape?: StyleValue<'circle' | 'rectangle' | 'diamond' | 'triangle' | 'star'>;
  size?: StyleValue<number>;
  color?: StyleValue<string>;
  borderColor?: StyleValue<string>;
  borderWidth?: StyleValue<number>;
  opacity?: StyleValue<number>;
  image?: StyleValue<string | null>;
  icon?: StyleValue<string | null>;
  visible?: StyleValue<boolean>;
}

export interface EdgeStyleConfig {
  width?: StyleValue<number>;
  color?: StyleValue<string>;
  opacity?: StyleValue<number>;
  type?: StyleValue<'straight' | 'curved' | 'orthogonal'>;
  arrow?: StyleValue<'none' | 'target' | 'source' | 'both'>;
  dashPattern?: StyleValue<number[] | null>;
  visible?: StyleValue<boolean>;
}
```

**Note:** GraphonConfig does NOT expose graphology. It receives GraphModel internally.

```typescript
// packages/core/src/types/config.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph

// INTERNAL config - users don't see this
export interface GraphonConfig {
  // Required - but users don't pass this, GraphonProvider creates it
  model: GraphModel;  // Internal only
  
  // Styling
  nodeStyle?: NodeStyleConfig;
  edgeStyle?: EdgeStyleConfig;
  
  // Viewport
  viewport?: ViewportConfig;
  
  // Interactions
  interactions?: InteractionsConfig;
  
  // Clustering
  clustering?: ClusteringConfig;
  
  // Callbacks
  onReady?: () => void;
  onError?: (error: Error) => void;
  onNodeClick?: (node: NodeData, event: PointerEvent) => void;
  onNodeDoubleClick?: (node: NodeData, event: PointerEvent) => void;
  onNodeHover?: (node: NodeData | null, event: PointerEvent) => void;
  onNodeDragStart?: (node: NodeData, event: PointerEvent) => void;
  onNodeDrag?: (node: NodeData, position: { x: number; y: number }) => void;
  onNodeDragEnd?: (node: NodeData, position: { x: number; y: number }) => void;
  onEdgeClick?: (edge: EdgeData, event: PointerEvent) => void;
  onEdgeHover?: (edge: EdgeData | null, event: PointerEvent) => void;
  onSelectionChange?: (selection: SelectionState) => void;
  onViewportChange?: (viewport: ViewportState) => void;
}

export interface ViewportConfig {
  minZoom?: number;      // default: 0.01
  maxZoom?: number;      // default: 10
  zoomSpeed?: number;    // default: 1
  panEnabled?: boolean;  // default: true
  zoomEnabled?: boolean; // default: true
  fitPadding?: number;   // default: 50
}

export interface InteractionsConfig {
  nodeClick?: boolean;
  nodeDrag?: boolean;
  nodeHover?: boolean;
  edgeClick?: boolean;
  edgeHover?: boolean;
  selection?: SelectionConfig | false;
  contextMenu?: boolean;
}

export interface SelectionConfig {
  enabled?: boolean;
  multiple?: boolean;
  box?: boolean;
  lasso?: boolean;
}
```

```typescript
// packages/core/src/types/state.ts
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export interface SelectionState {
  nodes: Set<string>;
  edges: Set<string>;
}
```

2. Create feature directory structure:
```
packages/core/src/
├── types/
│   ├── index.ts
│   ├── graph.ts
│   ├── styles.ts
│   ├── config.ts
│   └── state.ts
├── renderer/
├── nodes/
├── edges/
├── labels/
├── interactions/
├── clustering/
├── animation/
├── spatial/
└── index.ts
```

3. Create public exports:
```typescript
// packages/core/src/index.ts
export * from './types';
export { Graphon } from './Graphon';
export type { GraphonInstance } from './Graphon';
```

### Files to Create
- `packages/core/src/types/index.ts`
- `packages/core/src/types/graph.ts`
- `packages/core/src/types/styles.ts`
- `packages/core/src/types/config.ts`
- `packages/core/src/types/state.ts`
- `packages/core/src/index.ts`
- Feature directories (empty with .gitkeep)

### Tests Required
- Unit: Type exports compile correctly
- Unit: No circular dependencies (use madge)

### Demo Addition
None (types only)

---

## Task 1.2: PixiJS Renderer Setup

### Overview
Create the base renderer that initializes PixiJS Application and manages the canvas.

### Dependencies
- Task 1.1

### Acceptance Criteria
- [ ] PixiJS Application initialized
- [ ] Canvas inserted into container
- [ ] Resize handling works
- [ ] Clean destroy method
- [ ] Background color configurable

### Implementation Steps

1. Install PixiJS:
```bash
pnpm add pixi.js --filter @graphon/core
```

2. Create Renderer class:
```typescript
// packages/core/src/renderer/Renderer.ts
import { Application, Container } from 'pixi.js';

export interface RendererConfig {
  container: HTMLElement;
  backgroundColor?: string;
  resolution?: number;
  antialias?: boolean;
}

export class Renderer {
  private app: Application;
  private container: HTMLElement;
  private resizeObserver: ResizeObserver;
  
  // Layer containers (z-order)
  readonly stage: Container;
  readonly edgeLayer: Container;
  readonly nodeLayer: Container;
  readonly labelLayer: Container;
  readonly uiLayer: Container;
  
  constructor(config: RendererConfig) {
    this.container = config.container;
    
    // Initialize PixiJS
    this.app = new Application();
    
    // Create layer hierarchy
    this.stage = new Container();
    this.edgeLayer = new Container();
    this.nodeLayer = new Container();
    this.labelLayer = new Container();
    this.uiLayer = new Container();
    
    this.stage.addChild(this.edgeLayer);
    this.stage.addChild(this.nodeLayer);
    this.stage.addChild(this.labelLayer);
    this.stage.addChild(this.uiLayer);
  }
  
  async init(): Promise<void> {
    await this.app.init({
      resizeTo: this.container,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    this.container.appendChild(this.app.canvas);
    this.app.stage.addChild(this.stage);
    
    // Handle resize
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }
  
  private handleResize(): void {
    this.app.resize();
  }
  
  get width(): number {
    return this.app.screen.width;
  }
  
  get height(): number {
    return this.app.screen.height;
  }
  
  get canvas(): HTMLCanvasElement {
    return this.app.canvas;
  }
  
  render(): void {
    this.app.render();
  }
  
  destroy(): void {
    this.resizeObserver.disconnect();
    this.app.destroy(true, { children: true });
  }
}
```

### Files to Create
- `packages/core/src/renderer/Renderer.ts`
- `packages/core/src/renderer/index.ts`
- `packages/core/src/renderer/__tests__/Renderer.test.ts`

### Tests Required
- Unit: Renderer initializes without error
- Unit: Canvas is inserted into container
- Unit: Width/height return correct values
- Unit: Destroy cleans up resources

### Demo Addition
None (internal infrastructure)

---

## Task 1.3: Viewport Controller

### Overview
Implement pan and zoom with smooth animations, respecting min/max bounds.

### Dependencies
- Task 1.2

### Acceptance Criteria
- [ ] Pan (drag to move viewport)
- [ ] Zoom (wheel to zoom at cursor)
- [ ] Pinch-to-zoom (touch devices)
- [ ] Min/max zoom enforced
- [ ] Smooth animated transitions
- [ ] fitToView() method
- [ ] centerOn() method

### Implementation Steps

1. Create Viewport class:
```typescript
// packages/core/src/renderer/Viewport.ts
import { Container } from 'pixi.js';
import type { ViewportConfig, ViewportState } from '../types';

export class Viewport {
  private container: Container;
  private config: Required<ViewportConfig>;
  
  // State
  private _x = 0;
  private _y = 0;
  private _zoom = 1;
  
  // Callbacks
  private onChangeCallbacks: Array<(state: ViewportState) => void> = [];
  
  constructor(container: Container, config: ViewportConfig = {}) {
    this.container = container;
    this.config = {
      minZoom: config.minZoom ?? 0.01,
      maxZoom: config.maxZoom ?? 10,
      zoomSpeed: config.zoomSpeed ?? 1,
      panEnabled: config.panEnabled ?? true,
      zoomEnabled: config.zoomEnabled ?? true,
      fitPadding: config.fitPadding ?? 50,
    };
  }
  
  get state(): ViewportState {
    return {
      x: this._x,
      y: this._y,
      zoom: this._zoom,
      width: this.container.width,
      height: this.container.height,
    };
  }
  
  /**
   * Set viewport position and zoom
   */
  setPosition(x: number, y: number, zoom?: number): void {
    this._x = x;
    this._y = y;
    if (zoom !== undefined) {
      this._zoom = this.clampZoom(zoom);
    }
    this.applyTransform();
    this.notifyChange();
  }
  
  /**
   * Pan by delta
   */
  pan(dx: number, dy: number): void {
    if (!this.config.panEnabled) return;
    this._x += dx / this._zoom;
    this._y += dy / this._zoom;
    this.applyTransform();
    this.notifyChange();
  }
  
  /**
   * Zoom at point (screen coordinates)
   */
  zoomAt(screenX: number, screenY: number, delta: number): void {
    if (!this.config.zoomEnabled) return;
    
    const zoomFactor = 1 + delta * 0.001 * this.config.zoomSpeed;
    const newZoom = this.clampZoom(this._zoom * zoomFactor);
    
    if (newZoom === this._zoom) return;
    
    // Zoom toward cursor position
    const worldBefore = this.screenToWorld(screenX, screenY);
    this._zoom = newZoom;
    const worldAfter = this.screenToWorld(screenX, screenY);
    
    this._x += worldAfter.x - worldBefore.x;
    this._y += worldAfter.y - worldBefore.y;
    
    this.applyTransform();
    this.notifyChange();
  }
  
  /**
   * Fit viewport to bounds
   */
  fitToBounds(
    bounds: { x: number; y: number; width: number; height: number },
    animate = true
  ): void {
    const padding = this.config.fitPadding;
    const scaleX = (this.container.width - padding * 2) / bounds.width;
    const scaleY = (this.container.height - padding * 2) / bounds.height;
    const zoom = Math.min(scaleX, scaleY, this.config.maxZoom);
    
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    
    if (animate) {
      this.animateTo(-x, -y, zoom);
    } else {
      this.setPosition(-x, -y, zoom);
    }
  }
  
  /**
   * Center on world coordinates
   */
  centerOn(x: number, y: number, zoom?: number, animate = true): void {
    if (animate) {
      this.animateTo(-x, -y, zoom ?? this._zoom);
    } else {
      this.setPosition(-x, -y, zoom);
    }
  }
  
  /**
   * Convert screen to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.container.width / 2) / this._zoom - this._x,
      y: (screenY - this.container.height / 2) / this._zoom - this._y,
    };
  }
  
  /**
   * Convert world to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX + this._x) * this._zoom + this.container.width / 2,
      y: (worldY + this._y) * this._zoom + this.container.height / 2,
    };
  }
  
  /**
   * Get visible world bounds
   */
  getVisibleBounds(): { x: number; y: number; width: number; height: number } {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.container.width, this.container.height);
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }
  
  onChange(callback: (state: ViewportState) => void): () => void {
    this.onChangeCallbacks.push(callback);
    return () => {
      const index = this.onChangeCallbacks.indexOf(callback);
      if (index >= 0) this.onChangeCallbacks.splice(index, 1);
    };
  }
  
  private clampZoom(zoom: number): number {
    return Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
  }
  
  private applyTransform(): void {
    this.container.position.set(
      this._x * this._zoom + this.container.width / 2,
      this._y * this._zoom + this.container.height / 2
    );
    this.container.scale.set(this._zoom);
  }
  
  private animateTo(x: number, y: number, zoom: number, duration = 300): void {
    // Animation implementation (use requestAnimationFrame)
    // For now, just set directly
    this.setPosition(x, y, zoom);
  }
  
  private notifyChange(): void {
    const state = this.state;
    this.onChangeCallbacks.forEach((cb) => cb(state));
  }
}
```

2. Create input handler for viewport:
```typescript
// packages/core/src/renderer/ViewportInput.ts
export class ViewportInput {
  private viewport: Viewport;
  private canvas: HTMLCanvasElement;
  private isDragging = false;
  private lastPointer = { x: 0, y: 0 };
  
  constructor(viewport: Viewport, canvas: HTMLCanvasElement) {
    this.viewport = viewport;
    this.canvas = canvas;
    this.bindEvents();
  }
  
  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }
  
  private onPointerDown = (e: PointerEvent): void => {
    if (e.button === 0) { // Left click or touch
      this.isDragging = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
    }
  };
  
  private onPointerMove = (e: PointerEvent): void => {
    if (this.isDragging) {
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.viewport.pan(dx, dy);
      this.lastPointer = { x: e.clientX, y: e.clientY };
    }
  };
  
  private onPointerUp = (): void => {
    this.isDragging = false;
  };
  
  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.viewport.zoomAt(x, y, -e.deltaY);
  };
  
  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }
}
```

### Files to Create
- `packages/core/src/renderer/Viewport.ts`
- `packages/core/src/renderer/ViewportInput.ts`
- `packages/core/src/renderer/__tests__/Viewport.test.ts`

### Tests Required
- Unit: Pan changes position correctly
- Unit: Zoom clamps to min/max
- Unit: screenToWorld/worldToScreen are inverses
- Unit: fitToBounds calculates correct zoom
- Integration: Mouse wheel zooms at cursor

### Demo Addition
None yet (needs rendering first)

---

## Task 1.4: Main GraphonCore Class

### Overview
Create the main GraphonCore class that orchestrates model, renderer, and subsystems.

**Key:** GraphonCore depends on `GraphModel` interface, NOT graphology. See [Architecture Review](13-architecture-review.md).

### Dependencies
- Task 1.3

### Acceptance Criteria
- [ ] GraphonCore class created
- [ ] Accepts `GraphModel` (not graphology)
- [ ] Initializes renderer and viewport
- [ ] Subscribes to model events
- [ ] Clean destroy method

### Implementation Steps

```typescript
// packages/core/src/core/GraphonCore.ts
import type { GraphModel, NodeModel, EdgeModel } from '../model';
import type { GraphonConfig, ViewportState } from './types';
import { Renderer } from '../renderer/Renderer';
import { Viewport } from '../renderer/Viewport';
import { EventBridge } from './EventBridge';

export interface GraphonCoreConfig {
  container: HTMLElement;
  nodeStyle?: NodeStyleConfig;
  edgeStyle?: EdgeStyleConfig;
  viewport?: Partial<ViewportState>;
  onViewportChange?: (state: ViewportState) => void;
  onReady?: () => void;
}

/**
 * Core orchestrator class.
 * Coordinates GraphModel, Renderer, and subsystems.
 * 
 * Note: This is internal. Users interact via React hooks.
 */
export class GraphonCore {
  private model: GraphModel;
  private renderer: Renderer;
  private viewport: Viewport;
  private eventBridge: EventBridge;
  private config: GraphonCoreConfig;
  
  private constructor(
    model: GraphModel,
    renderer: Renderer,
    config: GraphonCoreConfig
  ) {
    this.model = model;
    this.renderer = renderer;
    this.config = config;
    this.viewport = new Viewport(renderer.stage, config.viewport);
    
    // Bridge syncs model events → renderer
    this.eventBridge = new EventBridge(model, renderer);
    
    // Viewport callbacks
    this.viewport.onChange((state) => {
      config.onViewportChange?.(state);
    });
  }
  
  /**
   * Create instance (async factory)
   */
  static async create(
    model: GraphModel,
    config: GraphonCoreConfig
  ): Promise<GraphonCore> {
    const renderer = new Renderer({ container: config.container });
    await renderer.init();
    
    const instance = new GraphonCore(model, renderer, config);
    instance.initialRender();
    
    config.onReady?.();
    return instance;
  }
  
  // --- Viewport API ---
  
  fitToView(animate = true): void {
    const bounds = this.calculateGraphBounds();
    this.viewport.fitToBounds(bounds, animate);
  }
  
  centerOnNode(nodeId: string, animate = true): void {
    const node = this.model.getNode(nodeId);
    if (node) {
      this.viewport.centerOn(node.x, node.y, undefined, animate);
    }
  }
  
  setViewport(state: Partial<ViewportState>): void {
    this.viewport.setPosition(
      state.x ?? this.viewport.state.x,
      state.y ?? this.viewport.state.y,
      state.zoom
    );
  }
  
  getViewport(): ViewportState {
    return this.viewport.state;
  }
  
  // --- Selection API (placeholder) ---
  
  getSelection(): SelectionState {
    return { nodes: new Set(), edges: new Set() };
  }
  
  setSelection(selection: Partial<SelectionState>): void {
    // Will be implemented in interactions phase
  }
  
  clearSelection(): void {
    this.setSelection({ nodes: new Set(), edges: new Set() });
  }
  
  // --- Graph API ---
  
  getGraph(): Graph {
    return this.config.graph;
  }
  
  // --- Lifecycle ---
  
  refresh(): void {
    this.render();
  }
  
  destroy(): void {
    this.viewportInput.destroy();
    this.renderer.destroy();
  }
  
  // --- Private ---
  
  private render(): void {
    // Will delegate to node/edge renderers
    this.renderer.render();
  }
  
  private calculateGraphBounds(): { x: number; y: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    this.config.graph.forEachNode((node, attrs) => {
      const x = attrs.x ?? 0;
      const y = attrs.y ?? 0;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    
    if (!isFinite(minX)) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX || 100,
      height: maxY - minY || 100,
    };
  }
}
```

### Files to Create
- `packages/core/src/Graphon.ts`
- `packages/core/src/__tests__/Graphon.test.ts`

### Tests Required
- Unit: Graphon.create() returns instance
- Unit: fitToView calculates correct bounds
- Unit: destroy cleans up resources
- Integration: Viewport callbacks fire

### Demo Addition
None yet (needs React wrapper)

---

## Task 1.5: React Package Setup

### Overview
Create @graphon/react with Provider, hooks, and Graphon component.

**Critical:** Users NEVER import graphology. They use our hooks. See [State Management Architecture](12-state-management.md).

### Dependencies
- Task 1.4

### Acceptance Criteria
- [ ] `GraphonProvider` creates and owns GraphModel
- [ ] `useGraph()` returns mutation functions
- [ ] `<Graphon>` component renders the graph
- [ ] No graphology in public API

### Implementation Steps

1. Set up package:
```bash
pnpm add react react-dom --filter @graphon/react
pnpm add -D @types/react @types/react-dom --filter @graphon/react
```

2. Create GraphonProvider (owns the GraphModel):
```typescript
// packages/react/src/GraphonProvider.tsx
import React, { createContext, useContext, useRef, useMemo, type ReactNode } from 'react';
import { createGraphModel, type GraphModel, type SerializedGraph } from '@graphon/core';

interface GraphonContextValue {
  model: GraphModel;
}

const GraphonContext = createContext<GraphonContextValue | null>(null);

export interface GraphonProviderProps {
  children: ReactNode;
  /** Initial graph data to load */
  initialData?: SerializedGraph;
}

/**
 * Provides graph context to the component tree.
 * Creates GraphModel internally - users don't need to know about storage.
 */
export function GraphonProvider({ children, initialData }: GraphonProviderProps) {
  const modelRef = useRef<GraphModel | null>(null);
  
  // Create model once
  if (!modelRef.current) {
    modelRef.current = createGraphModel();
    if (initialData) {
      modelRef.current.import(initialData);
    }
  }
  
  const value = useMemo(() => ({
    model: modelRef.current!,
  }), []);
  
  return (
    <GraphonContext.Provider value={value}>
      {children}
    </GraphonContext.Provider>
  );
}

export function useGraphonContext(): GraphonContextValue {
  const context = useContext(GraphonContext);
  if (!context) {
    throw new Error('useGraphonContext must be used within GraphonProvider');
  }
  return context;
}
```

3. Create useGraph hook (mutations):
```typescript
// packages/react/src/useGraph.ts
import { useCallback } from 'react';
import { useGraphonContext } from './GraphonProvider';
import type { NodeData, EdgeData } from '@graphon/core';

/**
 * Hook for graph mutations.
 * Returns stable functions that mutate the graph.
 * 
 * Usage:
 * ```tsx
 * const { addNode, removeNode, batch } = useGraph();
 * addNode('n1', 100, 200, { label: 'Node 1' });
 * ```
 */
export function useGraph() {
  const { model } = useGraphonContext();
  
  const addNode = useCallback((
    id: string, 
    x: number, 
    y: number, 
    data?: NodeData
  ) => {
    model.addNode(id, x, y, data);
  }, [model]);
  
  const removeNode = useCallback((id: string) => {
    model.removeNode(id);
  }, [model]);
  
  const updateNode = useCallback((
    id: string, 
    updates: Partial<NodeData & { x: number; y: number }>
  ) => {
    model.updateNode(id, updates);
  }, [model]);
  
  const addEdge = useCallback((
    source: string, 
    target: string, 
    data?: EdgeData
  ) => {
    return model.addEdge(source, target, data);
  }, [model]);
  
  const removeEdge = useCallback((id: string) => {
    model.removeEdge(id);
  }, [model]);
  
  const clear = useCallback(() => {
    model.clear();
  }, [model]);
  
  const batch = useCallback((fn: () => void) => {
    model.batch(fn);
  }, [model]);
  
  const importGraph = useCallback((data: SerializedGraph) => {
    model.import(data);
  }, [model]);
  
  const exportGraph = useCallback(() => {
    return model.export();
  }, [model]);
  
  return {
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    clear,
    batch,
    import: importGraph,
    export: exportGraph,
  };
}
```

4. Create Graphon component:
```typescript
// packages/react/src/Graphon.tsx
import React, { useEffect, useRef } from 'react';
import { GraphonCore, type GraphonCoreConfig } from '@graphon/core';
import { useGraphonContext } from './GraphonProvider';

export interface GraphonProps {
  className?: string;
  style?: React.CSSProperties;
  nodeStyle?: NodeStyleConfig;
  edgeStyle?: EdgeStyleConfig;
  onReady?: () => void;
  onViewportChange?: (state: ViewportState) => void;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onEdgeClick?: (edgeId: string) => void;
}

/**
 * Graph visualization component.
 * Must be used within GraphonProvider.
 */
export function Graphon(props: GraphonProps) {
  const { className, style, onReady, ...config } = props;
  const { model } = useGraphonContext();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<GraphonCore | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    let destroyed = false;
    
    GraphonCore.create(model, {
      container: containerRef.current,
      ...config,
      onReady: () => {
        if (!destroyed) onReady?.();
      },
    }).then((core) => {
      if (destroyed) {
        core.destroy();
        return;
      }
      coreRef.current = core;
    });
    
    return () => {
      destroyed = true;
      coreRef.current?.destroy();
      coreRef.current = null;
    };
  }, [model]);
  
  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
}
```

5. Export public API:
```typescript
// packages/react/src/index.ts

// Components
export { GraphonProvider, type GraphonProviderProps } from './GraphonProvider';
export { Graphon, type GraphonProps } from './Graphon';

// Hooks
export { useGraph } from './useGraph';

// Re-export types users need (but NOT graphology!)
export type { 
  NodeData, 
  EdgeData, 
  SerializedGraph,
  NodeModel,
  EdgeModel,
} from '@graphon/core';
```

6. Create useViewport hook (viewport operations):
```typescript
// packages/react/src/useViewport.ts
import { useCallback, useRef } from 'react';
import type { ViewportState } from '@graphon/core';

/**
 * Hook for viewport operations.
 * Requires passing the ref from Graphon component.
 */
export function useViewport(coreRef: React.RefObject<GraphonCore | null>) {
  const fitToView = useCallback((animate?: boolean) => {
    coreRef.current?.fitToView(animate);
  }, [coreRef]);
  
  const centerOn = useCallback((nodeId: string, animate?: boolean) => {
    coreRef.current?.centerOn(nodeId, animate);
  }, [coreRef]);
  
  const setViewport = useCallback((state: Partial<ViewportState>) => {
    coreRef.current?.setViewport(state);
  }, [coreRef]);
  
  const getViewport = useCallback((): ViewportState | null => {
    return coreRef.current?.getViewport() ?? null;
  }, [coreRef]);
  
  return { fitToView, centerOn, setViewport, getViewport };
}
```

### Files to Create
- `packages/react/src/GraphonProvider.tsx`
- `packages/react/src/Graphon.tsx`
- `packages/react/src/useGraph.ts`
- `packages/react/src/useViewport.ts`
- `packages/react/src/index.ts`
- `packages/react/src/__tests__/GraphonProvider.test.tsx`
- `packages/react/src/__tests__/useGraph.test.tsx`

### Tests Required
- Unit: GraphonProvider creates model
- Unit: useGraph returns stable functions
- Unit: Graphon component mounts and connects to model
- Unit: Cleanup on unmount
- Integration: addNode/removeNode trigger re-render

### Example Usage (for Docs)
```tsx
// This is what users write - NO graphology import!
import { GraphonProvider, Graphon, useGraph } from '@graphon/react';

function App() {
  return (
    <GraphonProvider>
      <Controls />
      <Graphon style={{ height: '100vh' }} />
    </GraphonProvider>
  );
}

function Controls() {
  const { addNode, addEdge, batch } = useGraph();
  
  const addRandomNodes = () => {
    batch(() => {
      for (let i = 0; i < 100; i++) {
        addNode(`n${i}`, Math.random() * 1000, Math.random() * 1000);
      }
    });
  };
  
  return <button onClick={addRandomNodes}>Add 100 Nodes</button>;
}
```

---

## Task 1.6: Demo - Empty Canvas with Pan/Zoom

### Overview
First demo showing an empty canvas with working pan and zoom.

### Dependencies
- Task 1.5

### Acceptance Criteria
- [ ] Demo page shows empty Graphon canvas
- [ ] Pan by dragging works
- [ ] Zoom with wheel works
- [ ] Viewport state displayed
- [ ] Controls to test fitToView

### Implementation Steps

```tsx
// apps/demo/src/demos/BasicRendering.tsx
import React, { useState } from 'react';
import { GraphonProvider, Graphon, type ViewportState } from '@graphon/react';

export function BasicRendering() {
  const [viewport, setViewport] = useState<ViewportState | null>(null);
  
  return (
    <GraphonProvider>
      <BasicRenderingContent viewport={viewport} setViewport={setViewport} />
    </GraphonProvider>
  );
}

function BasicRenderingContent({ 
  viewport, 
  setViewport 
}: { 
  viewport: ViewportState | null;
  setViewport: (v: ViewportState) => void;
}) {
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Basic Rendering</h1>
        <p>
          Empty canvas with pan/zoom. Drag to pan, scroll to zoom.
        </p>
      </header>
      
      <div className="demo-controls">
        {/* Viewport controls will use useViewport hook */}
      </div>
      
      <div className="demo-viewport-info">
        {viewport && (
          <>
            <span>X: {viewport.x.toFixed(0)}</span>
            <span>Y: {viewport.y.toFixed(0)}</span>
            <span>Zoom: {(viewport.zoom * 100).toFixed(0)}%</span>
          </>
        )}
      </div>
      
      <div className="demo-canvas">
        <Graphon onViewportChange={setViewport} />
      </div>
    </div>
  );
}
```

### Files to Create/Modify
- `apps/demo/src/demos/BasicRendering.tsx`
- `apps/demo/src/App.tsx` (update route)
- `apps/demo/src/styles/demo.css`

### Tests Required
- Visual: Screenshot of empty canvas
- Visual: Screenshot after zoom

### Demo Addition
- Basic Rendering page with pan/zoom demo

---

## Phase 1 Checklist

After completing all tasks:

- [ ] Types defined and exported
- [ ] PixiJS renderer initializes
- [ ] Viewport pan/zoom works
- [ ] Graphon class orchestrates components
- [ ] React component and hook work
- [ ] Demo shows empty canvas with pan/zoom
- [ ] All tests pass

**Estimated time:** 2-3 days
