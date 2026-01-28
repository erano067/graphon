# Architecture Review: Separation of Concerns

## Issues Identified

### 1. graphology Leaking into Public API ❌

**Current (Bad):**
```tsx
import Graph from 'graphology';  // User imports graphology
const graph = new Graph();        // User creates graphology instance
graph.addNode('x', { x: 0 });     // User uses graphology API
<Graphon graph={graph} />         // User passes graphology to us
```

**Problems:**
- Users must learn graphology API
- We can't swap implementations without breaking user code
- graphology types/concepts spread throughout codebase
- Testing requires real graphology instances

---

### 2. Shotgun Surgery Risks ❌

If we change how graph data is stored, we'd need to modify:
- `GraphBridge.ts`
- `NodeRenderer.ts`
- `EdgeRenderer.ts`
- `StyleResolver.ts`
- `InteractionManager.ts`
- `LODManager.ts`
- `LayoutManager.ts`
- React hooks
- Tests

**This is the definition of shotgun surgery.**

---

### 3. Mixed Abstraction Levels ❌

Current design mixes:
- **Domain level:** "select nodes", "apply layout"
- **Implementation level:** graphology events, PixiJS sprites
- **Infrastructure level:** typed arrays, WebGL batching

Users shouldn't see implementation or infrastructure levels.

---

### 4. Unclear Boundaries ❌

Where does responsibility live?
- Who owns node positions? (Graph? Renderer? Layout?)
- Who triggers animations? (GraphBridge? Renderer? AnimationManager?)
- Who manages selection? (React state? Internal state? Graph attributes?)

---

## Solution: Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC API LAYER                         │
│   GraphonProvider, useGraphon, useNodes, useLayout              │
│   - Stable, semantic, domain-focused                            │
│   - No implementation details leak here                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│   GraphonCore - orchestrates all features                       │
│   - Coordinates between subsystems                              │
│   - Manages lifecycle                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                              │
│   GraphModel (interface) - our abstraction over graph data      │
│   NodeModel, EdgeModel, LayoutModel, SelectionModel             │
│   - Pure domain logic, no rendering/storage details             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                         │
│   GraphologyAdapter (implements GraphModel)                     │
│   PixiRenderer, WebGLBatcher, QuadTree                          │
│   - Implementation details, swappable                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Corrected Design

### 1. GraphModel Interface (Our Abstraction)

```typescript
// packages/core/src/model/GraphModel.ts

/**
 * Abstract graph model interface.
 * Users interact with THIS, not graphology.
 * Implementation can be swapped (graphology, custom, etc.)
 */
export interface GraphModel {
  // --- Nodes ---
  addNode(id: string, data?: NodeData): void;
  removeNode(id: string): void;
  hasNode(id: string): boolean;
  getNode(id: string): NodeModel | undefined;
  getNodes(): Iterable<NodeModel>;
  getNodeCount(): number;
  updateNode(id: string, data: Partial<NodeData>): void;
  
  // --- Edges ---
  addEdge(source: string, target: string, data?: EdgeData): string;
  removeEdge(id: string): void;
  hasEdge(id: string): boolean;
  getEdge(id: string): EdgeModel | undefined;
  getEdges(): Iterable<EdgeModel>;
  getEdgeCount(): number;
  getNodeEdges(nodeId: string): Iterable<EdgeModel>;
  
  // --- Bulk Operations ---
  clear(): void;
  import(data: SerializedGraph): void;
  export(): SerializedGraph;
  
  // --- Events (implementation-agnostic) ---
  on<K extends keyof GraphEvents>(event: K, handler: GraphEvents[K]): void;
  off<K extends keyof GraphEvents>(event: K, handler: GraphEvents[K]): void;
  
  // --- Transactions ---
  batch(fn: () => void): void;  // Batch changes, emit single event
}

export interface NodeModel {
  readonly id: string;
  x: number;
  y: number;
  data: NodeData;
}

export interface EdgeModel {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  data: EdgeData;
}

export interface NodeData {
  label?: string;
  size?: number;
  color?: string;
  shape?: NodeShape;
  [key: string]: unknown;
}

export interface EdgeData {
  label?: string;
  width?: number;
  color?: string;
  [key: string]: unknown;
}

export interface GraphEvents {
  nodeAdded: (node: NodeModel) => void;
  nodeRemoved: (nodeId: string) => void;
  nodeUpdated: (node: NodeModel, changes: Partial<NodeData>) => void;
  edgeAdded: (edge: EdgeModel) => void;
  edgeRemoved: (edgeId: string) => void;
  edgeUpdated: (edge: EdgeModel, changes: Partial<EdgeData>) => void;
  cleared: () => void;
  batchComplete: () => void;
}

export interface SerializedGraph {
  nodes: Array<{ id: string; x: number; y: number; data: NodeData }>;
  edges: Array<{ id: string; source: string; target: string; data: EdgeData }>;
}
```

### 2. graphology Adapter (Implementation Detail)

```typescript
// packages/core/src/adapters/GraphologyAdapter.ts

import Graph from 'graphology';
import type { GraphModel, NodeModel, EdgeModel, GraphEvents, NodeData, EdgeData } from '../model/GraphModel';

/**
 * Adapts graphology to our GraphModel interface.
 * This is the ONLY file that imports graphology.
 * Can be swapped for another implementation.
 */
export class GraphologyAdapter implements GraphModel {
  private graph: Graph;
  private eventHandlers: Map<keyof GraphEvents, Set<Function>> = new Map();
  private inBatch = false;
  private batchedChanges: Array<() => void> = [];
  
  constructor(graph?: Graph) {
    this.graph = graph ?? new Graph();
    this.bindGraphologyEvents();
  }
  
  // --- Nodes ---
  
  addNode(id: string, data?: NodeData): void {
    const { x = 0, y = 0, ...rest } = data ?? {};
    this.graph.addNode(id, { x, y, ...rest });
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
  
  *getNodes(): Iterable<NodeModel> {
    for (const [id, attrs] of this.graph.nodeEntries()) {
      yield this.toNodeModel(id, attrs);
    }
  }
  
  getNodeCount(): number {
    return this.graph.order;
  }
  
  updateNode(id: string, data: Partial<NodeData>): void {
    for (const [key, value] of Object.entries(data)) {
      this.graph.setNodeAttribute(id, key, value);
    }
  }
  
  // --- Edges ---
  
  addEdge(source: string, target: string, data?: EdgeData): string {
    return this.graph.addEdge(source, target, data);
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
    return { id, source, target, data: attrs };
  }
  
  *getEdges(): Iterable<EdgeModel> {
    for (const [id, attrs, source, target] of this.graph.edgeEntries()) {
      yield { id, source, target, data: attrs };
    }
  }
  
  getEdgeCount(): number {
    return this.graph.size;
  }
  
  *getNodeEdges(nodeId: string): Iterable<EdgeModel> {
    for (const edgeId of this.graph.edges(nodeId)) {
      const edge = this.getEdge(edgeId);
      if (edge) yield edge;
    }
  }
  
  // --- Bulk ---
  
  clear(): void {
    this.graph.clear();
  }
  
  import(data: SerializedGraph): void {
    this.batch(() => {
      this.clear();
      for (const node of data.nodes) {
        this.addNode(node.id, { x: node.x, y: node.y, ...node.data });
      }
      for (const edge of data.edges) {
        this.graph.addEdgeWithKey(edge.id, edge.source, edge.target, edge.data);
      }
    });
  }
  
  export(): SerializedGraph {
    return {
      nodes: [...this.getNodes()].map(n => ({ id: n.id, x: n.x, y: n.y, data: n.data })),
      edges: [...this.getEdges()].map(e => ({ id: e.id, source: e.source, target: e.target, data: e.data })),
    };
  }
  
  // --- Events ---
  
  on<K extends keyof GraphEvents>(event: K, handler: GraphEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }
  
  off<K extends keyof GraphEvents>(event: K, handler: GraphEvents[K]): void {
    this.eventHandlers.get(event)?.delete(handler);
  }
  
  private emit<K extends keyof GraphEvents>(event: K, ...args: Parameters<GraphEvents[K]>): void {
    if (this.inBatch) {
      this.batchedChanges.push(() => this.emit(event, ...args));
      return;
    }
    
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        (handler as Function)(...args);
      }
    }
  }
  
  // --- Batching ---
  
  batch(fn: () => void): void {
    this.inBatch = true;
    try {
      fn();
    } finally {
      this.inBatch = false;
      // Emit all batched changes
      const changes = this.batchedChanges;
      this.batchedChanges = [];
      for (const change of changes) {
        change();
      }
      this.emit('batchComplete');
    }
  }
  
  // --- Private ---
  
  private toNodeModel(id: string, attrs: Record<string, unknown>): NodeModel {
    const { x = 0, y = 0, ...data } = attrs;
    return {
      id,
      x: x as number,
      y: y as number,
      data: data as NodeData,
    };
  }
  
  private bindGraphologyEvents(): void {
    this.graph.on('nodeAdded', ({ key, attributes }) => {
      this.emit('nodeAdded', this.toNodeModel(key, attributes));
    });
    
    this.graph.on('nodeDropped', ({ key }) => {
      this.emit('nodeRemoved', key);
    });
    
    this.graph.on('nodeAttributesUpdated', ({ key, attributes }) => {
      this.emit('nodeUpdated', this.toNodeModel(key, attributes), attributes);
    });
    
    this.graph.on('edgeAdded', ({ key, source, target, attributes }) => {
      this.emit('edgeAdded', { id: key, source, target, data: attributes });
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

### 3. Clean Public API

```typescript
// packages/react/src/GraphonProvider.tsx

import { createContext, useContext, useRef, useMemo, type ReactNode } from 'react';
import type { GraphModel } from '@graphon/core';
import { createGraphModel } from '@graphon/core';

interface GraphonContextValue {
  model: GraphModel;
  // ... other context values
}

const GraphonContext = createContext<GraphonContextValue | null>(null);

interface GraphonProviderProps {
  children: ReactNode;
  initialData?: SerializedGraph;
}

/**
 * Provides graph context to the component tree.
 * Creates and manages the graph model internally.
 */
export function GraphonProvider({ children, initialData }: GraphonProviderProps) {
  // Model is created once and lives in a ref
  const modelRef = useRef<GraphModel | null>(null);
  
  if (!modelRef.current) {
    modelRef.current = createGraphModel();  // Factory hides implementation
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

```typescript
// packages/react/src/useGraph.ts

import { useCallback } from 'react';
import { useGraphonContext } from './GraphonProvider';
import type { NodeData, EdgeData } from '@graphon/core';

/**
 * Hook for graph mutations.
 * Returns stable functions that mutate the graph model.
 */
export function useGraph() {
  const { model } = useGraphonContext();
  
  const addNode = useCallback((id: string, x: number, y: number, data?: NodeData) => {
    model.addNode(id, { x, y, ...data });
  }, [model]);
  
  const removeNode = useCallback((id: string) => {
    model.removeNode(id);
  }, [model]);
  
  const updateNode = useCallback((id: string, data: Partial<NodeData>) => {
    model.updateNode(id, data);
  }, [model]);
  
  const addEdge = useCallback((source: string, target: string, data?: EdgeData) => {
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
  
  return {
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    clear,
    batch,
  };
}
```

### 4. Usage (Clean, No Implementation Details)

```tsx
// User code - no graphology knowledge needed!

import { GraphonProvider, Graphon, useGraph } from '@graphon/react';

function App() {
  return (
    <GraphonProvider>
      <GraphEditor />
    </GraphonProvider>
  );
}

function GraphEditor() {
  const { addNode, addEdge, batch } = useGraph();
  
  const handleAddNode = () => {
    addNode('new-node', 100, 200, { label: 'New Node' });
  };
  
  const handleLoadData = (data) => {
    batch(() => {
      // Bulk add - single animation at end
      data.nodes.forEach(n => addNode(n.id, n.x, n.y, n));
      data.edges.forEach(e => addEdge(e.source, e.target, e));
    });
  };
  
  return (
    <div>
      <button onClick={handleAddNode}>Add Node</button>
      <Graphon />
    </div>
  );
}
```

---

## Responsibility Matrix

| Concern | Owner | Does NOT Know About |
|---------|-------|---------------------|
| Graph data storage | `GraphModel` + Adapter | Rendering, React |
| Change events | `GraphModel` | How subscribers use events |
| Rendering | `Renderer` | Graph storage impl, React |
| Animations | `AnimationController` | Graph storage, React state |
| Selection | `SelectionModel` | Rendering, storage impl |
| Layout algorithms | `LayoutEngine` | Rendering, React |
| React integration | `@graphon/react` | Storage impl, rendering impl |
| User code | Hooks & Components | Everything below API layer |

---

## Shotgun Surgery Prevention

### Before: Changing storage requires modifying:
❌ GraphBridge, NodeRenderer, EdgeRenderer, StyleResolver, InteractionManager, LODManager, LayoutManager, React hooks, Tests

### After: Changing storage requires modifying:
✅ Only the adapter file (`GraphologyAdapter.ts`)

All other code depends on `GraphModel` interface, not implementation.

---

## Abstraction Level Consistency

### Layer 1: Public API (Semantic/Domain)
```typescript
// Users see this - pure domain concepts
addNode('user-1', 100, 200, { label: 'Alice' });
selectNodes(['user-1', 'user-2']);
runLayout('force-directed');
```

### Layer 2: Application (Orchestration)
```typescript
// Internal - coordinates subsystems
class GraphonCore {
  constructor(model: GraphModel, renderer: Renderer) {}
  
  handleNodeAdded(node: NodeModel) {
    this.renderer.addNodeSprite(node);
    this.animator.animateEntrance(node.id);
  }
}
```

### Layer 3: Domain (Business Logic)
```typescript
// Pure logic - no I/O, no rendering
interface GraphModel { ... }
interface SelectionModel { ... }
interface LayoutEngine { ... }
```

### Layer 4: Infrastructure (Implementation)
```typescript
// Swappable implementations
class GraphologyAdapter implements GraphModel { ... }
class PixiRenderer implements Renderer { ... }
class WebWorkerLayoutEngine implements LayoutEngine { ... }
```

---

## Factory Pattern for Swappability

```typescript
// packages/core/src/factory.ts

import type { GraphModel } from './model/GraphModel';
import { GraphologyAdapter } from './adapters/GraphologyAdapter';

/**
 * Creates a GraphModel instance.
 * Implementation can be swapped by changing this factory.
 */
export function createGraphModel(): GraphModel {
  return new GraphologyAdapter();
}

// In the future, could be:
// export function createGraphModel(): GraphModel {
//   return new CustomGraphAdapter();
// }
```

---

## Updated Package Structure

```
packages/core/src/
├── model/                      # Domain layer (interfaces)
│   ├── GraphModel.ts           # Graph abstraction
│   ├── SelectionModel.ts       # Selection abstraction
│   ├── ViewportModel.ts        # Viewport abstraction
│   └── index.ts
├── adapters/                   # Infrastructure layer (implementations)
│   ├── GraphologyAdapter.ts    # graphology implementation
│   └── index.ts
├── renderer/                   # Infrastructure layer
│   ├── PixiRenderer.ts
│   ├── NodeRenderer.ts
│   ├── EdgeRenderer.ts
│   └── index.ts
├── animation/                  # Domain + Infrastructure
│   ├── AnimationController.ts
│   └── index.ts
├── layout/                     # Domain layer
│   ├── LayoutEngine.ts         # Interface
│   └── algorithms/             # Implementations
├── core/                       # Application layer
│   ├── GraphonCore.ts          # Orchestrator
│   └── index.ts
├── factory.ts                  # Dependency injection
└── index.ts                    # Public exports
```

---

## Dependency Rules

1. **Public API** → can depend on **Application Layer**
2. **Application Layer** → can depend on **Domain Layer**
3. **Domain Layer** → depends on **NOTHING** (pure interfaces)
4. **Infrastructure Layer** → implements **Domain Layer** interfaces

**NEVER:**
- Domain layer importing from infrastructure
- Public API importing from infrastructure
- Circular dependencies

---

## Testing Benefits

```typescript
// Can test with mock GraphModel - no graphology needed
class MockGraphModel implements GraphModel {
  private nodes = new Map<string, NodeModel>();
  
  addNode(id: string, data?: NodeData) {
    this.nodes.set(id, { id, x: 0, y: 0, data: data ?? {} });
  }
  // ... minimal implementation for tests
}

test('renderer adds sprite when node added', () => {
  const model = new MockGraphModel();
  const renderer = new MockRenderer();
  const core = new GraphonCore(model, renderer);
  
  model.addNode('test');
  
  expect(renderer.sprites.has('test')).toBe(true);
});
```

---

## Migration Path

1. **Phase 1:** Create `GraphModel` interface and `GraphologyAdapter`
2. **Phase 2:** Update `GraphBridge` to use `GraphModel` instead of raw graphology
3. **Phase 3:** Update renderers to receive data via `GraphModel`
4. **Phase 4:** Create public API hooks that hide implementation
5. **Phase 5:** Remove all direct graphology imports except in adapter

---

## Summary of Changes Needed

| Document | Changes Required |
|----------|------------------|
| `00-overview.md` | Add architecture layers section |
| `02-phase-1-*.md` | Add GraphModel interface task |
| `03-phase-2-*.md` | GraphBridge uses GraphModel, not graphology |
| `12-state-management.md` | Update to show GraphModel, not raw graphology |
| All phase docs | Ensure no graphology leaks into public API |

---

## Documents Updated ✅

The following documents have been updated to use the new layered architecture:

| Document | Status | Notes |
|----------|--------|-------|
| `00-overview.md` | ✅ Updated | Layered architecture diagram, design principles |
| `02-phase-1-*.md` | ✅ Updated | Tasks 1.1-1.6 use GraphModel pattern |
| `03-phase-2-*.md` | ✅ Updated | Tasks 2.1-2.4 use GraphModel, not Graph |
| `12-state-management.md` | ✅ Updated | Shows GraphModel abstraction |
| `13-architecture-review.md` | ✅ Created | This document |

### Remaining Work

The following documents still contain `graphology` imports that should be updated during implementation:

- `04-phase-3-node-styling.md` - Update StyleResolver to use GraphModel
- `05-phase-4-edge-styling.md` - Update EdgeStyleResolver to use GraphModel
- `06-phase-5-interactions.md` - Update InteractionManager to use GraphModel
- `07-phase-6-labels.md` - Update LabelRenderer to use GraphModel
- `08-phase-7-layouts.md` - Update LayoutManager to use GraphModel
- `09-phase-8-clustering-lod.md` - Update ClusterBuilder to use GraphModel
- `10-phase-9-animations.md` - Update AnimationManager to use GraphModel
- `11-phase-10-advanced-features.md` - Multiple updates needed

**Key Principle:** During implementation, follow the pattern established in Phases 1-2. Internal modules use `GraphModel` interface, only `GraphologyAdapter` imports graphology.

