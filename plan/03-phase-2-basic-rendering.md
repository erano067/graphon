# Phase 2: Basic Rendering

## Overview

Implement basic node and edge rendering with minimal styling. Focus on correctness and performance foundation.

---

## Task 2.1: Node Renderer (Circle Only)

### Overview
Render nodes as circles using GraphModel. Single shape, single color for now.

**Note:** NodeRenderer works with `GraphModel` interface, NOT graphology directly.

### Dependencies
- Phase 1 complete (GraphModel interface exists)

### Acceptance Criteria
- [ ] Nodes render at positions from GraphModel
- [ ] Circle shape with default size/color
- [ ] Updates when model changes
- [ ] Efficient batch rendering
- [ ] **No graphology imports**

### Implementation Steps

1. Create NodeRenderer:
```typescript
// packages/core/src/nodes/NodeRenderer.ts
import { Container, Graphics } from 'pixi.js';
import type { GraphModel, NodeModel } from '../model/GraphModel';

export interface NodeRenderConfig {
  defaultSize: number;
  defaultColor: number;
}

export class NodeRenderer {
  private container: Container;
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private config: NodeRenderConfig;
  
  // Node ID -> Graphics mapping
  private nodeGraphics: Map<string, Graphics> = new Map();
  
  constructor(container: Container, model: GraphModel, config?: Partial<NodeRenderConfig>) {
    this.container = container;
    this.model = model;
    this.config = {
      defaultSize: config?.defaultSize ?? 10,
      defaultColor: config?.defaultColor ?? 0x6366f1,
    };
  }
  
  /**
   * Render all nodes from the model
   */
  render(): void {
    const existingIds = new Set(this.nodeGraphics.keys());
    
    // Use GraphModel's iterator
    for (const node of this.model.nodes()) {
      existingIds.delete(node.id);
      
      let graphics = this.nodeGraphics.get(node.id);
      
      if (!graphics) {
        graphics = new Graphics();
        this.nodeGraphics.set(node.id, graphics);
        this.container.addChild(graphics);
      }
      
      this.renderNode(graphics, node);
    }
    
    // Remove nodes no longer in model
    for (const removedId of existingIds) {
      const graphics = this.nodeGraphics.get(removedId);
      if (graphics) {
        this.container.removeChild(graphics);
        graphics.destroy();
        this.nodeGraphics.delete(removedId);
      }
    }
  }
  
  /**
   * Render a single node
   */
  private renderNode(graphics: Graphics, node: NodeModel): void {
    const size = node.data?.size ?? this.config.defaultSize;
    const color = node.data?.color ?? this.config.defaultColor;
    
    graphics.clear();
    graphics.circle(0, 0, size);
    graphics.fill({ color });
    graphics.position.set(node.x, node.y);
    
    // Store node ID for hit testing later
    graphics.label = node.id;
  }
  
  /**
   * Update a single node
   */
  updateNode(nodeId: string): void {
    const graphics = this.nodeGraphics.get(nodeId);
    const node = this.model.getNode(nodeId);
    if (graphics && node) {
      this.renderNode(graphics, node);
    }
  }
  
  /**
   * Get Graphics for a node
   */
  getNodeGraphics(nodeId: string): Graphics | undefined {
    return this.nodeGraphics.get(nodeId);
  }
  
  /**
   * Clean up
   */
  destroy(): void {
    for (const graphics of this.nodeGraphics.values()) {
      graphics.destroy();
    }
    this.nodeGraphics.clear();
  }
}
```

2. Integrate with Graphon:
```typescript
// Update packages/core/src/Graphon.ts
import { NodeRenderer } from './nodes/NodeRenderer';

export class Graphon implements GraphonInstance {
  private nodeRenderer: NodeRenderer;
  
  // In constructor after renderer init:
  this.nodeRenderer = new NodeRenderer(
    this.renderer.nodeLayer,
    this.config.graph
  );
  
  // In render():
  private render(): void {
    this.nodeRenderer.render();
    this.renderer.render();
  }
  
  // In destroy():
  destroy(): void {
    this.nodeRenderer.destroy();
    // ... rest
  }
}
```

### Files to Create
- `packages/core/src/nodes/NodeRenderer.ts`
- `packages/core/src/nodes/index.ts`
- `packages/core/src/nodes/__tests__/NodeRenderer.test.ts`

### Tests Required
- Unit: Nodes render at correct positions
- Unit: Node count matches graph
- Unit: Removed nodes are cleaned up
- Unit: updateNode updates position

### Demo Addition
Update BasicRendering to show nodes

---

## Task 2.2: Edge Renderer (Straight Lines Only)

### Overview
Render edges as straight lines between nodes. Single width, single color.

**Note:** EdgeRenderer works with `GraphModel` interface, NOT graphology directly.

### Dependencies
- Task 2.1

### Acceptance Criteria
- [ ] Edges render between source and target nodes
- [ ] Updates when model changes
- [ ] Efficient rendering with Graphics batching
- [ ] **No graphology imports**

### Implementation Steps

```typescript
// packages/core/src/edges/EdgeRenderer.ts
import { Container, Graphics } from 'pixi.js';
import type { GraphModel, EdgeModel } from '../model/GraphModel';

export interface EdgeRenderConfig {
  defaultWidth: number;
  defaultColor: number;
}

export class EdgeRenderer {
  private container: Container;
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private config: EdgeRenderConfig;
  
  // Single Graphics object for all edges (more efficient)
  private graphics: Graphics;
  
  // Edge ID -> line data for selective updates
  private edgeCache: Map<string, { x1: number; y1: number; x2: number; y2: number }> = new Map();
  
  constructor(container: Container, model: GraphModel, config?: Partial<EdgeRenderConfig>) {
    this.container = container;
    this.model = model;
    this.config = {
      defaultWidth: config?.defaultWidth ?? 1,
      defaultColor: config?.defaultColor ?? 0xcccccc,
    };
    
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }
  
  /**
   * Render all edges
   */
  render(): void {
    this.graphics.clear();
    this.edgeCache.clear();
    
    // Use GraphModel's iterator
    for (const edge of this.model.edges()) {
      const sourceNode = this.model.getNode(edge.source);
      const targetNode = this.model.getNode(edge.target);
      
      if (!sourceNode || !targetNode) continue;
      
      const x1 = sourceNode.x;
      const y1 = sourceNode.y;
      const x2 = targetNode.x;
      const y2 = targetNode.y;
      
      const width = edge.data?.width ?? this.config.defaultWidth;
      const color = edge.data?.color ?? this.config.defaultColor;
      
      this.graphics.moveTo(x1, y1);
      this.graphics.lineTo(x2, y2);
      this.graphics.stroke({ width, color });
      
      this.edgeCache.set(edge.id, { x1, y1, x2, y2 });
    }
  }
  
  /**
   * Check if edge needs re-render (positions changed)
   */
  needsUpdate(edgeId: string): boolean {
    const cached = this.edgeCache.get(edgeId);
    if (!cached) return true;
    
    const edge = this.model.getEdge(edgeId);
    if (!edge) return false;
    
    const sourceNode = this.model.getNode(edge.source);
    const targetNode = this.model.getNode(edge.target);
    
    if (!sourceNode || !targetNode) return false;
    
    return (
      cached.x1 !== sourceNode.x ||
      cached.y1 !== sourceNode.y ||
      cached.x2 !== targetNode.x ||
      cached.y2 !== targetNode.y
    );
  }
  
  /**
   * Clean up
   */
  destroy(): void {
    this.graphics.destroy();
    this.edgeCache.clear();
  }
}
```

### Files to Create
- `packages/core/src/edges/EdgeRenderer.ts`
- `packages/core/src/edges/index.ts`
- `packages/core/src/edges/__tests__/EdgeRenderer.test.ts`

### Tests Required
- Unit: Edges render between correct nodes
- Unit: Edge count matches graph
- Unit: needsUpdate detects position changes

### Demo Addition
Update BasicRendering to show edges

---

## Task 2.3: Graph Data Bridge

### Overview
Create a bridge that listens to GraphModel events and triggers re-renders.

**This is the core of our diff-based update system.** See [State Management Architecture](12-state-management.md) for the full design.

**Note:** GraphBridge works with `GraphModel` interface. It uses GraphModel's event system, NOT graphology's events directly. This ensures if we swap graphology, only GraphologyAdapter changes.

### Dependencies
- Task 2.2

### Acceptance Criteria
- [ ] Listens to GraphModel events (node:added, node:removed, etc.)
- [ ] Batches updates (don't re-render on every change)
- [ ] Clean unsubscribe on destroy
- [ ] **No graphology imports**

### Implementation Steps

```typescript
// packages/core/src/data/GraphBridge.ts
import type { GraphModel, GraphModelEvent } from '../model/GraphModel';

export type GraphChangeType =
  | 'nodeAdded'
  | 'nodeRemoved'
  | 'nodeUpdated'
  | 'edgeAdded'
  | 'edgeRemoved'
  | 'edgeUpdated'
  | 'cleared';

export interface GraphChange {
  type: GraphChangeType;
  id?: string;
}

/**
 * Bridge between GraphModel and rendering system.
 * Batches model events and notifies renderers.
 * 
 * Uses GraphModel's event system - agnostic to underlying storage.
 */
export class GraphBridge {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private listeners: Array<(changes: GraphChange[]) => void> = [];
  private pendingChanges: GraphChange[] = [];
  private flushScheduled = false;
  private unsubscribers: Array<() => void> = [];
  
  constructor(model: GraphModel) {
    this.model = model;
    this.bindEvents();
  }
  
  private bindEvents(): void {
    // Subscribe to GraphModel's normalized events
    const eventMap: Array<[GraphModelEvent, GraphChangeType]> = [
      ['node:added', 'nodeAdded'],
      ['node:removed', 'nodeRemoved'],
      ['node:updated', 'nodeUpdated'],
      ['edge:added', 'edgeAdded'],
      ['edge:removed', 'edgeRemoved'],
      ['edge:updated', 'edgeUpdated'],
      ['cleared', 'cleared'],
    ];
    
    for (const [event, changeType] of eventMap) {
      const unsub = this.model.on(event, (payload) => {
        this.queueChange({ type: changeType, id: payload?.id });
      });
      this.unsubscribers.push(unsub);
    }
  }
  
  private queueChange(change: GraphChange): void {
    this.pendingChanges.push(change);
    
    if (!this.flushScheduled) {
      this.flushScheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }
  
  private flush(): void {
    this.flushScheduled = false;
    
    if (this.pendingChanges.length === 0) return;
    
    const changes = this.pendingChanges;
    this.pendingChanges = [];
    
    for (const listener of this.listeners) {
      listener(changes);
    }
  }
  
  /**
   * Subscribe to graph changes
   */
  onChange(callback: (changes: GraphChange[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }
  
  /**
   * Force immediate flush
   */
  flushNow(): void {
    if (this.pendingChanges.length > 0) {
      this.flush();
    }
  }
  
  /**
   * Clean up
   */
  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.listeners = [];
    this.pendingChanges = [];
  }
}
```

### Files to Create
- `packages/core/src/data/GraphBridge.ts`
- `packages/core/src/data/index.ts`
- `packages/core/src/data/__tests__/GraphBridge.test.ts`

### Tests Required
- Unit: Events queue changes
- Unit: Flush batches multiple changes
- Unit: Listeners receive correct change types
- Unit: Unsubscribe stops updates

### Demo Addition
None (internal infrastructure)

---

## Task 2.4: Integrate Renderers with Bridge

### Overview
Wire up the graph bridge to trigger node/edge re-renders.

### Dependencies
- Task 2.3

### Acceptance Criteria
- [ ] Adding node re-renders
- [ ] Removing node re-renders
- [ ] Moving node updates rendering
- [ ] Same for edges
- [ ] Efficient partial updates

### Implementation Steps

Update GraphonCore class:
```typescript
// packages/core/src/GraphonCore.ts
import { GraphBridge, type GraphChange } from './data/GraphBridge';

export class GraphonCore {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private graphBridge: GraphBridge;
  
  // In constructor:
  this.graphBridge = new GraphBridge(this.model);
  this.graphBridge.onChange((changes) => this.handleGraphChanges(changes));
  
  private handleGraphChanges(changes: GraphChange[]): void {
    // Determine what needs re-rendering
    let needsNodeRender = false;
    let needsEdgeRender = false;
    const nodesToUpdate = new Set<string>();
    
    for (const change of changes) {
      switch (change.type) {
        case 'nodeAdded':
        case 'nodeRemoved':
        case 'cleared':
          needsNodeRender = true;
          needsEdgeRender = true;
          break;
        case 'nodeUpdated':
          if (change.id) {
            nodesToUpdate.add(change.id);
          }
          // Position change affects edges
          needsEdgeRender = true;
          break;
        case 'edgeAdded':
        case 'edgeRemoved':
        case 'edgeUpdated':
          needsEdgeRender = true;
          break;
      }
    }
    
    // Perform updates
    if (needsNodeRender) {
      this.nodeRenderer.render();
    } else if (nodesToUpdate.size > 0) {
      for (const nodeId of nodesToUpdate) {
        this.nodeRenderer.updateNode(nodeId);
      }
    }
    
    if (needsEdgeRender) {
      this.edgeRenderer.render();
    }
    
    this.renderer.render();
  }
}
```

### Files to Modify
- `packages/core/src/Graphon.ts`

### Tests Required
- Integration: Add node triggers render
- Integration: Move node updates position
- Integration: Remove edge updates rendering
- Integration: Batch changes result in single render

### Demo Addition
None (behavior improvement)

---

## Task 2.5: Performance - Spatial Index (QuadTree)

### Overview
Implement QuadTree for efficient viewport culling and hit testing.

### Dependencies
- Task 2.4

### Acceptance Criteria
- [ ] QuadTree stores nodes by position
- [ ] Query nodes in rectangular bounds
- [ ] Query nearest node to point
- [ ] Updates when nodes move
- [ ] O(log n) queries

### Implementation Steps

```typescript
// packages/core/src/spatial/QuadTree.ts

interface QuadTreeNode<T> {
  x: number;
  y: number;
  data: T;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class QuadTree<T> {
  private bounds: Bounds;
  private capacity: number;
  private points: Array<QuadTreeNode<T>> = [];
  private divided = false;
  
  private northwest?: QuadTree<T>;
  private northeast?: QuadTree<T>;
  private southwest?: QuadTree<T>;
  private southeast?: QuadTree<T>;
  
  constructor(bounds: Bounds, capacity = 4) {
    this.bounds = bounds;
    this.capacity = capacity;
  }
  
  /**
   * Insert a point into the tree
   */
  insert(x: number, y: number, data: T): boolean {
    if (!this.contains(x, y)) {
      return false;
    }
    
    if (this.points.length < this.capacity && !this.divided) {
      this.points.push({ x, y, data });
      return true;
    }
    
    if (!this.divided) {
      this.subdivide();
    }
    
    return (
      this.northwest!.insert(x, y, data) ||
      this.northeast!.insert(x, y, data) ||
      this.southwest!.insert(x, y, data) ||
      this.southeast!.insert(x, y, data)
    );
  }
  
  /**
   * Query all points within a rectangular bounds
   */
  queryBounds(bounds: Bounds): T[] {
    const found: T[] = [];
    
    if (!this.intersects(bounds)) {
      return found;
    }
    
    for (const point of this.points) {
      if (this.pointInBounds(point.x, point.y, bounds)) {
        found.push(point.data);
      }
    }
    
    if (this.divided) {
      found.push(...this.northwest!.queryBounds(bounds));
      found.push(...this.northeast!.queryBounds(bounds));
      found.push(...this.southwest!.queryBounds(bounds));
      found.push(...this.southeast!.queryBounds(bounds));
    }
    
    return found;
  }
  
  /**
   * Query nearest point to a position
   */
  queryNearest(x: number, y: number, maxDistance: number): T | null {
    let nearest: T | null = null;
    let nearestDist = maxDistance;
    
    const search = (tree: QuadTree<T>): void => {
      // Check if this quadrant could contain a closer point
      const closestX = Math.max(tree.bounds.x, Math.min(x, tree.bounds.x + tree.bounds.width));
      const closestY = Math.max(tree.bounds.y, Math.min(y, tree.bounds.y + tree.bounds.height));
      const distToBounds = Math.hypot(x - closestX, y - closestY);
      
      if (distToBounds > nearestDist) {
        return;
      }
      
      for (const point of tree.points) {
        const dist = Math.hypot(x - point.x, y - point.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = point.data;
        }
      }
      
      if (tree.divided) {
        search(tree.northwest!);
        search(tree.northeast!);
        search(tree.southwest!);
        search(tree.southeast!);
      }
    };
    
    search(this);
    return nearest;
  }
  
  /**
   * Clear all points
   */
  clear(): void {
    this.points = [];
    this.divided = false;
    this.northwest = undefined;
    this.northeast = undefined;
    this.southwest = undefined;
    this.southeast = undefined;
  }
  
  private subdivide(): void {
    const { x, y, width, height } = this.bounds;
    const hw = width / 2;
    const hh = height / 2;
    
    this.northwest = new QuadTree({ x, y, width: hw, height: hh }, this.capacity);
    this.northeast = new QuadTree({ x: x + hw, y, width: hw, height: hh }, this.capacity);
    this.southwest = new QuadTree({ x, y: y + hh, width: hw, height: hh }, this.capacity);
    this.southeast = new QuadTree({ x: x + hw, y: y + hh, width: hw, height: hh }, this.capacity);
    this.divided = true;
    
    // Re-insert existing points
    for (const point of this.points) {
      this.northwest.insert(point.x, point.y, point.data) ||
      this.northeast.insert(point.x, point.y, point.data) ||
      this.southwest.insert(point.x, point.y, point.data) ||
      this.southeast.insert(point.x, point.y, point.data);
    }
    this.points = [];
  }
  
  private contains(x: number, y: number): boolean {
    return this.pointInBounds(x, y, this.bounds);
  }
  
  private pointInBounds(x: number, y: number, bounds: Bounds): boolean {
    return (
      x >= bounds.x &&
      x < bounds.x + bounds.width &&
      y >= bounds.y &&
      y < bounds.y + bounds.height
    );
  }
  
  private intersects(bounds: Bounds): boolean {
    return !(
      bounds.x > this.bounds.x + this.bounds.width ||
      bounds.x + bounds.width < this.bounds.x ||
      bounds.y > this.bounds.y + this.bounds.height ||
      bounds.y + bounds.height < this.bounds.y
    );
  }
}
```

### Files to Create
- `packages/core/src/spatial/QuadTree.ts`
- `packages/core/src/spatial/index.ts`
- `packages/core/src/spatial/__tests__/QuadTree.test.ts`

### Tests Required
- Unit: Insert and query basic
- Unit: Query bounds returns correct nodes
- Unit: Query nearest finds closest
- Unit: Performance with 100k points
- Benchmark: Query time at scale

### Demo Addition
None (internal infrastructure)

---

## Task 2.6: Viewport Culling

### Overview
Only render nodes/edges visible in the current viewport.

### Dependencies
- Task 2.5

### Acceptance Criteria
- [ ] QuadTree maintained with node positions
- [ ] Only visible nodes rendered
- [ ] Edges with at least one visible endpoint rendered
- [ ] Culling updates on viewport change
- [ ] Performance improvement measurable

### Implementation Steps

1. Create SpatialIndex wrapper:

**Note:** SpatialIndex uses `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/spatial/SpatialIndex.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import { QuadTree } from './QuadTree';

export class SpatialIndex {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private quadTree: QuadTree<string>;
  private bounds = { x: -50000, y: -50000, width: 100000, height: 100000 };
  
  constructor(model: GraphModel) {
    this.model = model;
    this.quadTree = new QuadTree(this.bounds, 8);
  }
  
  /**
   * Rebuild index from graph
   */
  rebuild(): void {
    this.quadTree.clear();
    
    // Use GraphModel iterator
    for (const node of this.model.nodes()) {
      this.quadTree.insert(node.x, node.y, node.id);
    }
  }
  
  /**
   * Update single node position
   */
  updateNode(nodeId: string): void {
    // QuadTree doesn't support updates, need to rebuild
    // In production, use a more sophisticated data structure
    this.rebuild();
  }
  
  /**
   * Query nodes in viewport
   */
  getNodesInBounds(bounds: { x: number; y: number; width: number; height: number }): Set<string> {
    return new Set(this.quadTree.queryBounds(bounds));
  }
  
  /**
   * Query nearest node to point
   */
  getNearestNode(x: number, y: number, maxDistance: number): string | null {
    return this.quadTree.queryNearest(x, y, maxDistance);
  }
}
```

2. Update NodeRenderer for culling:
```typescript
// packages/core/src/nodes/NodeRenderer.ts
export class NodeRenderer {
  private visibleNodes: Set<string> = new Set();
  
  /**
   * Set which nodes should be visible
   */
  setVisibleNodes(nodeIds: Set<string>): void {
    // Hide nodes no longer visible
    for (const nodeId of this.visibleNodes) {
      if (!nodeIds.has(nodeId)) {
        const graphics = this.nodeGraphics.get(nodeId);
        if (graphics) {
          graphics.visible = false;
        }
      }
    }
    
    // Show newly visible nodes
    for (const nodeId of nodeIds) {
      if (!this.visibleNodes.has(nodeId)) {
        let graphics = this.nodeGraphics.get(nodeId);
        
        if (!graphics) {
          // Lazy create
          graphics = new Graphics();
          this.nodeGraphics.set(nodeId, graphics);
          this.container.addChild(graphics);
          // Use GraphModel.getNode() instead of graphology
          const node = this.model.getNode(nodeId);
          if (node) this.renderNode(graphics, nodeId, node);
        }
        
        graphics.visible = true;
      }
    }
    
    this.visibleNodes = new Set(nodeIds);
  }
}
```

3. Wire up in Graphon:
```typescript
// In Graphon constructor
this.viewport.onChange(() => this.updateVisibility());

private updateVisibility(): void {
  const bounds = this.viewport.getVisibleBounds();
  // Add margin for nodes at edge
  const margin = 50 / this.viewport.state.zoom;
  const queryBounds = {
    x: bounds.x - margin,
    y: bounds.y - margin,
    width: bounds.width + margin * 2,
    height: bounds.height + margin * 2,
  };
  
  const visibleNodes = this.spatialIndex.getNodesInBounds(queryBounds);
  this.nodeRenderer.setVisibleNodes(visibleNodes);
  // Also update edge visibility based on visible nodes
}
```

### Files to Create/Modify
- `packages/core/src/spatial/SpatialIndex.ts`
- `packages/core/src/nodes/NodeRenderer.ts` (modify)
- `packages/core/src/Graphon.ts` (modify)

### Tests Required
- Unit: SpatialIndex queries return correct nodes
- Integration: Only visible nodes rendered
- Benchmark: 100k nodes with culling vs without

### Demo Addition
Add node count display showing total vs visible

---

## Task 2.7: Demo - Basic Graph Rendering

### Overview
Complete demo showing nodes and edges with dynamic updates.

### Dependencies
- Task 2.6

### Acceptance Criteria
- [ ] Demo shows graph with nodes and edges
- [ ] Random graph generation
- [ ] Add/remove nodes dynamically
- [ ] Shows visible node count
- [ ] Performance stats displayed

### Implementation Steps

**Note:** Demo uses `GraphonProvider` + hooks pattern. NO graphology imports!

```tsx
// apps/demo/src/demos/BasicRendering.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { 
  GraphonProvider, 
  Graphon, 
  useGraph,
  type ViewportState 
} from '@graphon/react';  // NO graphology import!

/**
 * Generate random graph using GraphModel API
 */
function useRandomGraph(nodeCount: number, edgeCount: number) {
  const { addNode, addEdge, clear, hasEdge } = useGraph();
  
  const regenerate = useCallback(() => {
    clear();
    
    // Add nodes in a circular layout
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 200 + Math.random() * 100;
      addNode(`node-${i}`, Math.cos(angle) * radius, Math.sin(angle) * radius, {
        label: `Node ${i}`,
      });
    }
    
    // Add random edges
    for (let i = 0; i < edgeCount; i++) {
      const source = `node-${Math.floor(Math.random() * nodeCount)}`;
      const target = `node-${Math.floor(Math.random() * nodeCount)}`;
      if (source !== target && !hasEdge(source, target)) {
        addEdge(`edge-${i}`, source, target);
      }
    }
  }, [nodeCount, edgeCount, addNode, addEdge, clear, hasEdge]);
  
  return { regenerate };
}

export function BasicRendering() {
  return (
    <GraphonProvider>
      <BasicRenderingContent />
    </GraphonProvider>
  );
}

function BasicRenderingContent() {
  const [nodeCount, setNodeCount] = useState(100);
  const [edgeCount, setEdgeCount] = useState(200);
  const { regenerate } = useRandomGraph(nodeCount, edgeCount);
  const [viewport, setViewport] = useState<ViewportState | null>(null);
  
  // Generate initial graph
  useEffect(() => { regenerate(); }, []);
  const { ref, fitToView } = useGraphon();
  
  const regenerate = useCallback(() => {
    setGraph(generateRandomGraph(nodeCount, edgeCount));
  }, [nodeCount, edgeCount]);
  
  const addNodes = useCallback(() => {
    const currentCount = graph.order;
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 200 + Math.random() * 100;
      graph.addNode(`node-${currentCount + i}`, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }
  }, [graph]);
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Basic Rendering</h1>
        <p>Nodes and edges with pan/zoom. Viewport culling enabled.</p>
      </header>
      
      <div className="demo-controls">
        <label>
          Nodes:
          <input
            type="number"
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
          />
        </label>
        <label>
          Edges:
          <input
            type="number"
            value={edgeCount}
            onChange={(e) => setEdgeCount(Number(e.target.value))}
          />
        </label>
        <button onClick={regenerate}>Regenerate</button>
        <button onClick={addNodes}>Add 10 Nodes</button>
        <button onClick={() => fitToView()}>Fit to View</button>
      </div>
      
      <div className="demo-stats">
        <span>Total Nodes: {graph.order}</span>
        <span>Total Edges: {graph.size}</span>
        {viewport && (
          <>
            <span>Zoom: {(viewport.zoom * 100).toFixed(0)}%</span>
          </>
        )}
      </div>
      
      <div className="demo-canvas">
        <Graphon
          ref={ref}
          graph={graph}
          onViewportChange={setViewport}
          onReady={() => fitToView(false)}
        />
      </div>
    </div>
  );
}
```

### Files to Modify
- `apps/demo/src/demos/BasicRendering.tsx`

### Tests Required
- Visual: Screenshot with 100 nodes
- Visual: Screenshot with 1000 nodes
- Visual: Screenshot zoomed in

### Demo Addition
- Complete basic rendering demo

---

## Phase 2 Checklist

After completing all tasks:

- [ ] Nodes render as circles
- [ ] Edges render as lines
- [ ] Graph changes trigger re-render
- [ ] QuadTree spatial index works
- [ ] Viewport culling improves performance
- [ ] Demo shows interactive graph
- [ ] All tests pass

**Estimated time:** 2-3 days
