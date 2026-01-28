# Phase 5: Interactions

## Overview

Implement user interactions: selection, dragging, hover states, and context menus.

---

## Task 5.1: Hit Testing Infrastructure

### Overview
Efficient hit testing to determine what element is under the cursor.

### Dependencies
- Phase 4 complete

### Acceptance Criteria
- [ ] Detect node under cursor
- [ ] Detect edge under cursor (with tolerance)
- [ ] Use spatial index for performance
- [ ] Handle overlapping elements (z-order)

### Implementation Steps

**Note:** HitTester works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/interactions/HitTester.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { SpatialIndex } from '../spatial/SpatialIndex';
import type { Viewport } from '../renderer/Viewport';

export interface HitTestResult {
  type: 'node' | 'edge' | 'none';
  id: string | null;
  position: { x: number; y: number };
}

export class HitTester {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private spatialIndex: SpatialIndex;
  private viewport: Viewport;
  
  constructor(model: GraphModel, spatialIndex: SpatialIndex, viewport: Viewport) {
    this.model = model;
    this.spatialIndex = spatialIndex;
    this.viewport = viewport;
  }
  
  /**
   * Test what's at screen coordinates
   */
  hitTest(screenX: number, screenY: number): HitTestResult {
    const worldPos = this.viewport.screenToWorld(screenX, screenY);
    
    // First check nodes (they're on top)
    const nodeHit = this.hitTestNode(worldPos.x, worldPos.y);
    if (nodeHit) {
      return { type: 'node', id: nodeHit, position: worldPos };
    }
    
    // Then check edges
    const edgeHit = this.hitTestEdge(worldPos.x, worldPos.y);
    if (edgeHit) {
      return { type: 'edge', id: edgeHit, position: worldPos };
    }
    
    return { type: 'none', id: null, position: worldPos };
  }
  
  private hitTestNode(worldX: number, worldY: number): string | null {
    // Use spatial index for efficiency
    const maxDistance = 30 / this.viewport.state.zoom; // Adjust for zoom
    const nearest = this.spatialIndex.getNearestNode(worldX, worldY, maxDistance);
    
    if (nearest) {
      const node = this.model.getNode(nearest);  // Use GraphModel
      if (!node) return null;
      
      const nodeSize = (node.data?.size as number) ?? 10;
      const distance = Math.hypot(worldX - node.x, worldY - node.y);
      if (distance <= nodeSize) {
        return nearest;
      }
    }
    
    return null;
  }
  
  private hitTestEdge(worldX: number, worldY: number): string | null {
    const tolerance = 5 / this.viewport.state.zoom;
    let closestEdge: string | null = null;
    let closestDistance = tolerance;
    
    // Use GraphModel iterator instead of graphology
    for (const edge of this.model.edges()) {
      const sourceNode = this.model.getNode(edge.source);
      const targetNode = this.model.getNode(edge.target);
      
      if (!sourceNode || !targetNode) continue;
      
      const x1 = sourceNode.x;
      const y1 = sourceNode.y;
      const x2 = targetNode.x;
      const y2 = targetNode.y;
      
      const distance = this.pointToLineDistance(worldX, worldY, x1, y1, x2, y2);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEdge = edge.id;
      }
    }
    
    return closestEdge;
  }
  
  private pointToLineDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    
    if (lengthSq === 0) {
      return Math.hypot(px - x1, py - y1);
    }
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.hypot(px - projX, py - projY);
  }
}
```

### Files to Create
- `packages/core/src/interactions/HitTester.ts`
- `packages/core/src/interactions/__tests__/HitTester.test.ts`

### Tests Required
- Unit: Node hit detection
- Unit: Edge hit detection
- Unit: Point to line distance

### Demo Addition
None (infrastructure)

---

## Task 5.2: Selection System

### Overview
Single and multi-selection of nodes and edges.

### Dependencies
- Task 5.1

### Acceptance Criteria
- [ ] Click to select single node/edge
- [ ] Shift+click for multi-select
- [ ] Ctrl/Cmd+click to toggle
- [ ] Click empty to deselect
- [ ] Selection state in API
- [ ] Visual highlight for selection

### Implementation Steps

```typescript
// packages/core/src/interactions/SelectionManager.ts
import type { SelectionState } from '../types';

export interface SelectionConfig {
  enabled: boolean;
  multiple: boolean;
}

export class SelectionManager {
  private config: SelectionConfig;
  private state: SelectionState = {
    nodes: new Set(),
    edges: new Set(),
  };
  
  private onChangeCallbacks: Array<(state: SelectionState) => void> = [];
  
  constructor(config?: Partial<SelectionConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      multiple: config?.multiple ?? true,
    };
  }
  
  /**
   * Get current selection state
   */
  getState(): SelectionState {
    return {
      nodes: new Set(this.state.nodes),
      edges: new Set(this.state.edges),
    };
  }
  
  /**
   * Select node(s)
   */
  selectNodes(nodeIds: string | string[], additive = false): void {
    if (!this.config.enabled) return;
    
    const ids = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    
    if (!additive || !this.config.multiple) {
      this.state.nodes.clear();
      this.state.edges.clear();
    }
    
    for (const id of ids) {
      this.state.nodes.add(id);
    }
    
    this.notifyChange();
  }
  
  /**
   * Select edge(s)
   */
  selectEdges(edgeIds: string | string[], additive = false): void {
    if (!this.config.enabled) return;
    
    const ids = Array.isArray(edgeIds) ? edgeIds : [edgeIds];
    
    if (!additive || !this.config.multiple) {
      this.state.nodes.clear();
      this.state.edges.clear();
    }
    
    for (const id of ids) {
      this.state.edges.add(id);
    }
    
    this.notifyChange();
  }
  
  /**
   * Toggle node selection
   */
  toggleNode(nodeId: string): void {
    if (!this.config.enabled) return;
    
    if (this.state.nodes.has(nodeId)) {
      this.state.nodes.delete(nodeId);
    } else {
      if (!this.config.multiple) {
        this.state.nodes.clear();
        this.state.edges.clear();
      }
      this.state.nodes.add(nodeId);
    }
    
    this.notifyChange();
  }
  
  /**
   * Toggle edge selection
   */
  toggleEdge(edgeId: string): void {
    if (!this.config.enabled) return;
    
    if (this.state.edges.has(edgeId)) {
      this.state.edges.delete(edgeId);
    } else {
      if (!this.config.multiple) {
        this.state.nodes.clear();
        this.state.edges.clear();
      }
      this.state.edges.add(edgeId);
    }
    
    this.notifyChange();
  }
  
  /**
   * Clear all selection
   */
  clear(): void {
    if (this.state.nodes.size === 0 && this.state.edges.size === 0) return;
    
    this.state.nodes.clear();
    this.state.edges.clear();
    this.notifyChange();
  }
  
  /**
   * Set selection directly
   */
  setSelection(selection: Partial<SelectionState>): void {
    if (selection.nodes !== undefined) {
      this.state.nodes = new Set(selection.nodes);
    }
    if (selection.edges !== undefined) {
      this.state.edges = new Set(selection.edges);
    }
    this.notifyChange();
  }
  
  /**
   * Check if node is selected
   */
  isNodeSelected(nodeId: string): boolean {
    return this.state.nodes.has(nodeId);
  }
  
  /**
   * Check if edge is selected
   */
  isEdgeSelected(edgeId: string): boolean {
    return this.state.edges.has(edgeId);
  }
  
  /**
   * Subscribe to selection changes
   */
  onChange(callback: (state: SelectionState) => void): () => void {
    this.onChangeCallbacks.push(callback);
    return () => {
      const index = this.onChangeCallbacks.indexOf(callback);
      if (index >= 0) this.onChangeCallbacks.splice(index, 1);
    };
  }
  
  private notifyChange(): void {
    const state = this.getState();
    for (const callback of this.onChangeCallbacks) {
      callback(state);
    }
  }
}
```

### Files to Create
- `packages/core/src/interactions/SelectionManager.ts`
- `packages/core/src/interactions/__tests__/SelectionManager.test.ts`

### Tests Required
- Unit: Single selection
- Unit: Multi selection
- Unit: Toggle selection
- Unit: Clear selection
- Unit: Callbacks fire

### Demo Addition
Selection state display in demo

---

## Task 5.3: Box Selection

### Overview
Drag a rectangle to select multiple nodes.

### Dependencies
- Task 5.2

### Acceptance Criteria
- [ ] Drag to draw selection rectangle
- [ ] Nodes in box become selected
- [ ] Visual feedback (selection box)
- [ ] Works with Shift for additive

### Implementation Steps

```typescript
// packages/core/src/interactions/BoxSelection.ts
import { Graphics } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { SpatialIndex } from '../spatial/SpatialIndex';
import type { Viewport } from '../renderer/Viewport';
import type { SelectionManager } from './SelectionManager';

export class BoxSelection {
  private container: Container;
  private spatialIndex: SpatialIndex;
  private viewport: Viewport;
  private selection: SelectionManager;
  
  private graphics: Graphics;
  private isActive = false;
  private startWorld = { x: 0, y: 0 };
  private currentWorld = { x: 0, y: 0 };
  
  constructor(
    container: Container,
    spatialIndex: SpatialIndex,
    viewport: Viewport,
    selection: SelectionManager
  ) {
    this.container = container;
    this.spatialIndex = spatialIndex;
    this.viewport = viewport;
    this.selection = selection;
    
    this.graphics = new Graphics();
    this.graphics.visible = false;
    this.container.addChild(this.graphics);
  }
  
  /**
   * Start box selection
   */
  start(screenX: number, screenY: number): void {
    this.isActive = true;
    const world = this.viewport.screenToWorld(screenX, screenY);
    this.startWorld = { ...world };
    this.currentWorld = { ...world };
    this.graphics.visible = true;
    this.render();
  }
  
  /**
   * Update box during drag
   */
  update(screenX: number, screenY: number): void {
    if (!this.isActive) return;
    
    this.currentWorld = this.viewport.screenToWorld(screenX, screenY);
    this.render();
  }
  
  /**
   * Complete box selection
   */
  complete(additive: boolean): string[] {
    if (!this.isActive) return [];
    
    this.isActive = false;
    this.graphics.visible = false;
    
    // Calculate bounds
    const bounds = this.getBounds();
    
    // Query nodes in bounds
    const nodesInBox = this.spatialIndex.getNodesInBounds(bounds);
    
    // Update selection
    if (nodesInBox.size > 0) {
      this.selection.selectNodes([...nodesInBox], additive);
    } else if (!additive) {
      this.selection.clear();
    }
    
    return [...nodesInBox];
  }
  
  /**
   * Cancel box selection
   */
  cancel(): void {
    this.isActive = false;
    this.graphics.visible = false;
  }
  
  private getBounds(): { x: number; y: number; width: number; height: number } {
    const x = Math.min(this.startWorld.x, this.currentWorld.x);
    const y = Math.min(this.startWorld.y, this.currentWorld.y);
    const width = Math.abs(this.currentWorld.x - this.startWorld.x);
    const height = Math.abs(this.currentWorld.y - this.startWorld.y);
    return { x, y, width, height };
  }
  
  private render(): void {
    const bounds = this.getBounds();
    
    this.graphics.clear();
    this.graphics.rect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.graphics.fill({ color: 0x6366f1, alpha: 0.1 });
    this.graphics.stroke({ color: 0x6366f1, width: 1 });
  }
  
  get active(): boolean {
    return this.isActive;
  }
  
  destroy(): void {
    this.graphics.destroy();
  }
}
```

### Files to Create
- `packages/core/src/interactions/BoxSelection.ts`
- `packages/core/src/interactions/__tests__/BoxSelection.test.ts`

### Tests Required
- Unit: Bounds calculation
- Integration: Nodes in box selected

### Demo Addition
See Task 5.5

---

## Task 5.4: Node Dragging

### Overview
Drag nodes to reposition them.

### Dependencies
- Task 5.1

### Acceptance Criteria
- [ ] Drag single node
- [ ] Drag moves selected nodes together
- [ ] Updates graph positions
- [ ] Callbacks for drag start/move/end

### Implementation Steps

**Note:** NodeDragger works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/interactions/NodeDragger.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { Viewport } from '../renderer/Viewport';
import type { SelectionManager } from './SelectionManager';

export interface DragState {
  nodeId: string;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
}

export interface DragCallbacks {
  onDragStart?: (nodeId: string) => void;
  onDrag?: (nodeId: string, position: { x: number; y: number }) => void;
  onDragEnd?: (nodeId: string, position: { x: number; y: number }) => void;
}

export class NodeDragger {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private viewport: Viewport;
  private selection: SelectionManager;
  private callbacks: DragCallbacks;
  
  private isDragging = false;
  private draggedNode: string | null = null;
  private dragStartWorld = { x: 0, y: 0 };
  private nodeStartPositions: Map<string, { x: number; y: number }> = new Map();
  
  constructor(
    model: GraphModel,
    viewport: Viewport,
    selection: SelectionManager,
    callbacks: DragCallbacks = {}
  ) {
    this.model = model;
    this.viewport = viewport;
    this.selection = selection;
    this.callbacks = callbacks;
  }
  
  /**
   * Start dragging a node
   */
  start(nodeId: string, screenX: number, screenY: number): void {
    this.isDragging = true;
    this.draggedNode = nodeId;
    this.dragStartWorld = this.viewport.screenToWorld(screenX, screenY);
    
    // Store start positions for all affected nodes
    this.nodeStartPositions.clear();
    
    // If dragged node is selected, move all selected nodes
    const nodesToDrag = this.selection.isNodeSelected(nodeId)
      ? [...this.selection.getState().nodes]
      : [nodeId];
    
    // Use GraphModel.getNode() instead of graphology
    for (const id of nodesToDrag) {
      const node = this.model.getNode(id);
      if (node) {
        this.nodeStartPositions.set(id, { x: node.x, y: node.y });
      }
    }
    
    this.callbacks.onDragStart?.(nodeId);
  }
  
  /**
   * Update during drag
   */
  update(screenX: number, screenY: number): void {
    if (!this.isDragging || !this.draggedNode) return;
    
    const currentWorld = this.viewport.screenToWorld(screenX, screenY);
    const dx = currentWorld.x - this.dragStartWorld.x;
    const dy = currentWorld.y - this.dragStartWorld.y;
    
    // Move all affected nodes using GraphModel
    for (const [nodeId, startPos] of this.nodeStartPositions) {
      const newX = startPos.x + dx;
      const newY = startPos.y + dy;
      
      // Use GraphModel.setNodePosition() instead of graphology
      this.model.setNodePosition(nodeId, newX, newY);
      
      if (nodeId === this.draggedNode) {
        this.callbacks.onDrag?.(nodeId, { x: newX, y: newY });
      }
    }
  }
  
  /**
   * Complete dragging
   */
  end(): void {
    if (!this.isDragging || !this.draggedNode) return;
    
    // Use GraphModel.getNode() instead of graphology
    const node = this.model.getNode(this.draggedNode);
    if (node) {
      this.callbacks.onDragEnd?.(this.draggedNode, { x: node.x, y: node.y });
    }
    
    this.isDragging = false;
    this.draggedNode = null;
    this.nodeStartPositions.clear();
  }
  
  /**
   * Cancel dragging (restore positions)
   */
  cancel(): void {
    if (!this.isDragging) return;
    
    // Restore original positions using GraphModel
    for (const [nodeId, startPos] of this.nodeStartPositions) {
      this.model.setNodePosition(nodeId, startPos.x, startPos.y);
    }
    
    this.isDragging = false;
    this.draggedNode = null;
    this.nodeStartPositions.clear();
  }
  
  get active(): boolean {
    return this.isDragging;
  }
}
```

### Files to Create
- `packages/core/src/interactions/NodeDragger.ts`
- `packages/core/src/interactions/__tests__/NodeDragger.test.ts`

### Tests Required
- Unit: Single node drag
- Unit: Multi-node drag
- Unit: Cancel restores positions

### Demo Addition
See Task 5.5

---

## Task 5.5: Interaction Manager (Orchestrator)

### Overview
Central manager that handles all pointer events and coordinates interactions.

### Dependencies
- Task 5.4

### Acceptance Criteria
- [ ] Handles all pointer events
- [ ] Determines correct action (pan, select, drag, box)
- [ ] Fires appropriate callbacks
- [ ] Manages hover state

### Implementation Steps

**Note:** InteractionManager works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/interactions/InteractionManager.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { Viewport } from '../renderer/Viewport';
import type { SpatialIndex } from '../spatial/SpatialIndex';
import type { GraphonCoreConfig, NodeData, EdgeData } from '../types';
import { HitTester, type HitTestResult } from './HitTester';
import { SelectionManager } from './SelectionManager';
import { BoxSelection } from './BoxSelection';
import { NodeDragger } from './NodeDragger';
import type { Container } from 'pixi.js';

export class InteractionManager {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private viewport: Viewport;
  private config: GraphonCoreConfig;
  private canvas: HTMLCanvasElement;
  
  private hitTester: HitTester;
  private selection: SelectionManager;
  private boxSelection: BoxSelection;
  private nodeDragger: NodeDragger;
  
  // State
  private hoveredNode: string | null = null;
  private hoveredEdge: string | null = null;
  private isPointerDown = false;
  private pointerDownTarget: HitTestResult | null = null;
  private pointerDownPosition = { x: 0, y: 0 };
  private hasMoved = false;
  
  constructor(
    model: GraphModel,
    viewport: Viewport,
    spatialIndex: SpatialIndex,
    uiContainer: Container,
    canvas: HTMLCanvasElement,
    config: GraphonCoreConfig
  ) {
    this.model = model;
    this.viewport = viewport;
    this.config = config;
    this.canvas = canvas;
    
    this.hitTester = new HitTester(model, spatialIndex, viewport);
    this.selection = new SelectionManager(config.interactions?.selection || {});
    this.boxSelection = new BoxSelection(uiContainer, spatialIndex, viewport, this.selection);
    this.nodeDragger = new NodeDragger(model, viewport, this.selection, {
      onDragStart: (id) => this.onNodeDragStart(id),
      onDrag: (id, pos) => this.onNodeDrag(id, pos),
      onDragEnd: (id, pos) => this.onNodeDragEnd(id, pos),
    });
    
    // Wire up selection changes
    this.selection.onChange((state) => {
      this.config.onSelectionChange?.(state);
    });
    
    this.bindEvents();
  }
  
  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('dblclick', this.onDoubleClick);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
  }
  
  private onPointerDown = (e: PointerEvent): void => {
    this.isPointerDown = true;
    this.hasMoved = false;
    this.pointerDownPosition = { x: e.clientX, y: e.clientY };
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.pointerDownTarget = this.hitTester.hitTest(x, y);
    
    // Start box selection on empty space with shift
    if (this.pointerDownTarget.type === 'none' && e.shiftKey) {
      this.boxSelection.start(x, y);
    }
  };
  
  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if we've moved enough to consider it a drag
    if (this.isPointerDown && !this.hasMoved) {
      const dist = Math.hypot(
        e.clientX - this.pointerDownPosition.x,
        e.clientY - this.pointerDownPosition.y
      );
      if (dist > 5) {
        this.hasMoved = true;
        
        // Start appropriate drag action
        if (this.boxSelection.active) {
          // Already started
        } else if (this.pointerDownTarget?.type === 'node') {
          this.nodeDragger.start(this.pointerDownTarget.id!, x, y);
        }
      }
    }
    
    // Update active drag
    if (this.boxSelection.active) {
      this.boxSelection.update(x, y);
    } else if (this.nodeDragger.active) {
      this.nodeDragger.update(x, y);
    } else if (!this.isPointerDown) {
      // Hover detection
      this.updateHover(x, y);
    }
  };
  
  private onPointerUp = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.boxSelection.active) {
      this.boxSelection.complete(e.shiftKey);
    } else if (this.nodeDragger.active) {
      this.nodeDragger.end();
    } else if (!this.hasMoved && this.pointerDownTarget) {
      // Click (not drag)
      this.handleClick(this.pointerDownTarget, e);
    }
    
    this.isPointerDown = false;
    this.pointerDownTarget = null;
  };
  
  private onPointerLeave = (): void => {
    this.clearHover();
    if (this.boxSelection.active) {
      this.boxSelection.cancel();
    }
  };
  
  private onDoubleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.hitTester.hitTest(x, y);
    
    if (hit.type === 'node') {
      const nodeData = this.getNodeData(hit.id!);
      this.config.onNodeDoubleClick?.(nodeData, e as unknown as PointerEvent);
    }
  };
  
  private onContextMenu = (e: MouseEvent): void => {
    if (!this.config.interactions?.contextMenu) return;
    
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hit = this.hitTester.hitTest(x, y);
    
    // Emit context menu event through callbacks
    // (handled by user for custom menu)
  };
  
  private handleClick(hit: HitTestResult, e: PointerEvent): void {
    const isModifierKey = e.shiftKey || e.ctrlKey || e.metaKey;
    
    if (hit.type === 'node') {
      const nodeData = this.getNodeData(hit.id!);
      this.config.onNodeClick?.(nodeData, e);
      
      if (isModifierKey) {
        this.selection.toggleNode(hit.id!);
      } else {
        this.selection.selectNodes(hit.id!);
      }
    } else if (hit.type === 'edge') {
      const edgeData = this.getEdgeData(hit.id!);
      this.config.onEdgeClick?.(edgeData, e);
      
      if (isModifierKey) {
        this.selection.toggleEdge(hit.id!);
      } else {
        this.selection.selectEdges(hit.id!);
      }
    } else {
      // Click on empty space
      if (!isModifierKey) {
        this.selection.clear();
      }
    }
  }
  
  private updateHover(x: number, y: number): void {
    const hit = this.hitTester.hitTest(x, y);
    
    // Node hover
    if (hit.type === 'node') {
      if (hit.id !== this.hoveredNode) {
        this.hoveredNode = hit.id;
        const nodeData = this.getNodeData(hit.id!);
        this.config.onNodeHover?.(nodeData, {} as PointerEvent);
      }
    } else if (this.hoveredNode) {
      this.hoveredNode = null;
      this.config.onNodeHover?.(null, {} as PointerEvent);
    }
    
    // Edge hover
    if (hit.type === 'edge') {
      if (hit.id !== this.hoveredEdge) {
        this.hoveredEdge = hit.id;
        const edgeData = this.getEdgeData(hit.id!);
        this.config.onEdgeHover?.(edgeData, {} as PointerEvent);
      }
    } else if (this.hoveredEdge) {
      this.hoveredEdge = null;
      this.config.onEdgeHover?.(null, {} as PointerEvent);
    }
    
    // Update cursor
    this.canvas.style.cursor = hit.type !== 'none' ? 'pointer' : 'default';
  }
  
  private clearHover(): void {
    if (this.hoveredNode) {
      this.hoveredNode = null;
      this.config.onNodeHover?.(null, {} as PointerEvent);
    }
    if (this.hoveredEdge) {
      this.hoveredEdge = null;
      this.config.onEdgeHover?.(null, {} as PointerEvent);
    }
  }
  
  private onNodeDragStart(nodeId: string): void {
    const nodeData = this.getNodeData(nodeId);
    this.config.onNodeDragStart?.(nodeData, {} as PointerEvent);
  }
  
  private onNodeDrag(nodeId: string, position: { x: number; y: number }): void {
    const nodeData = this.getNodeData(nodeId);
    this.config.onNodeDrag?.(nodeData, position);
  }
  
  private onNodeDragEnd(nodeId: string, position: { x: number; y: number }): void {
    const nodeData = this.getNodeData(nodeId);
    this.config.onNodeDragEnd?.(nodeData, position);
  }
  
  // Use GraphModel instead of graphology
  private getNodeData(nodeId: string): NodeData {
    const node = this.model.getNode(nodeId);
    return {
      id: nodeId,
      attributes: node?.data ?? {},
      x: node?.x ?? 0,
      y: node?.y ?? 0,
    };
  }
  
  private getEdgeData(edgeId: string): EdgeData {
    const edge = this.model.getEdge(edgeId);
    return {
      id: edgeId,
      source: edge?.source ?? '',
      target: edge?.target ?? '',
      attributes: edge?.data ?? {},
    };
  }
  
  // Public API
  getSelection(): SelectionManager {
    return this.selection;
  }
  
  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    
    this.boxSelection.destroy();
  }
}
```

### Files to Create
- `packages/core/src/interactions/InteractionManager.ts`
- `packages/core/src/interactions/index.ts`

### Tests Required
- Integration: Click selects node
- Integration: Drag moves node
- Integration: Box selects multiple
- Integration: Hover callbacks fire

### Demo Addition
Next task

---

## Task 5.6: Demo - Interactions

### Overview
Demo showcasing all interaction features.

### Dependencies
- Task 5.5

### Acceptance Criteria
- [ ] Shows selection state
- [ ] Node dragging works
- [ ] Box selection works
- [ ] Hover tooltips
- [ ] Multi-select with Shift

### Implementation

**Note:** Demo uses `GraphonProvider` + `useGraph()` pattern. NO graphology imports!

```tsx
// apps/demo/src/demos/Interactions.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { 
  GraphonProvider,
  Graphon, 
  useGraph, 
  type SelectionState, 
  type NodeData 
} from '@graphon/react';  // NO graphology import!

// Hook to generate demo graph using useGraph()
function useGenerateGraph() {
  const { addNode, addEdge, batch } = useGraph();
  
  useEffect(() => {
    const addedEdges = new Set<string>();
    
    batch(() => {
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 150 + Math.random() * 50;
        addNode(`node-${i}`, 
          Math.cos(angle) * radius, 
          Math.sin(angle) * radius, 
          { label: `Node ${i}` }
        );
      }
      
      for (let i = 0; i < 50; i++) {
        const source = `node-${Math.floor(Math.random() * 30)}`;
        const target = `node-${Math.floor(Math.random() * 30)}`;
        const edgeKey = `${source}-${target}`;
        if (source !== target && !addedEdges.has(edgeKey)) {
          addEdge(source, target);
          addedEdges.add(edgeKey);
        }
      }
    });
  }, [addNode, addEdge, batch]);
}

export function Interactions() {
  return (
    <GraphonProvider>
      <InteractionsContent />
    </GraphonProvider>
  );
}

function InteractionsContent() {
  useGenerateGraph();
  const [selection, setSelection] = useState<SelectionState>({ nodes: new Set(), edges: new Set() });
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [lastAction, setLastAction] = useState<string>('');
  
  const handleSelectionChange = useCallback((sel: SelectionState) => {
    setSelection(sel);
    setLastAction(`Selected ${sel.nodes.size} nodes, ${sel.edges.size} edges`);
  }, []);
  
  const handleNodeClick = useCallback((node: NodeData) => {
    setLastAction(`Clicked: ${node.id}`);
  }, []);
  
  const handleNodeHover = useCallback((node: NodeData | null) => {
    setHoveredNode(node);
  }, []);
  
  const handleNodeDrag = useCallback((node: NodeData, pos: { x: number; y: number }) => {
    setLastAction(`Dragging ${node.id} to (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
  }, []);
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Interactions</h1>
        <p>Click, drag, and select nodes and edges.</p>
      </header>
      
      <div className="demo-controls">
        <button onClick={() => fitToView()}>Fit to View</button>
      </div>
      
      <div className="demo-info">
        <div><strong>Last Action:</strong> {lastAction || 'None'}</div>
        <div><strong>Selected Nodes:</strong> {[...selection.nodes].join(', ') || 'None'}</div>
        <div><strong>Hovered:</strong> {hoveredNode?.id || 'None'}</div>
        <div className="demo-tips">
          <p><strong>Tips:</strong></p>
          <ul>
            <li>Click node to select</li>
            <li>Shift+Click for multi-select</li>
            <li>Drag node to move</li>
            <li>Shift+Drag on empty to box select</li>
            <li>Click empty to deselect</li>
          </ul>
        </div>
      </div>
      
      <div className="demo-canvas">
        <Graphon
          ref={ref}
          graph={graph}
          nodeStyle={{
            size: 12,
            color: (node) => 
              selection.nodes.has(node.id) ? '#ef4444' : 
              hoveredNode?.id === node.id ? '#f59e0b' : 
              '#6366f1',
            borderWidth: 2,
            borderColor: '#ffffff',
          }}
          interactions={{
            nodeClick: true,
            nodeDrag: true,
            nodeHover: true,
            selection: { enabled: true, multiple: true, box: true },
          }}
          onSelectionChange={handleSelectionChange}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onNodeDrag={handleNodeDrag}
          onReady={() => fitToView(false)}
        />
      </div>
    </div>
  );
}
```

### Files to Create
- `apps/demo/src/demos/Interactions.tsx`

### Tests Required
- Visual: Selection highlight
- Visual: Box selection
- E2E: Click selects node
- E2E: Drag moves node

### Demo Addition
- Full interactions demo page

---

## Phase 5 Checklist

- [ ] Hit testing works for nodes and edges
- [ ] Single and multi-selection works
- [ ] Box selection works
- [ ] Node dragging works
- [ ] Hover callbacks fire
- [ ] Demo shows all interactions
- [ ] All tests pass

**Estimated time:** 2-3 days
