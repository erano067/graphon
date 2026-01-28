# State Management Architecture

## Overview

This document defines how Graphon handles state, mutations, and React integration for 100k+ node graphs without performance degradation.

**Key principle:** Users interact with our `GraphModel` abstraction, never with underlying storage (graphology).

## The Problem

React state is **not suitable** for large graph data:

```tsx
// ❌ ANTI-PATTERN: Graph data as React state
const [nodes, setNodes] = useState<Node[]>([]);

// Problem 1: Every mutation clones the entire array
setNodes(prev => [...prev, newNode]); // 100k array copy 😱

// Problem 2: React reconciliation runs on every change
// Even with useMemo, React still processes the state object

// Problem 3: No granular change events
// We can't know WHAT changed without diffing
```

## The Solution: GraphModel + Events + Hooks

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Component                          │
│  ┌─────────────────┐  ┌──────────────────────────────────┐ │
│  │  React State    │  │  GraphModel (ref, not state)     │ │
│  │  - selection    │  │  Lives in GraphonProvider        │ │
│  │  - hover        │  │                                  │ │
│  │  - config       │  │  Emits domain events:            │ │
│  └────────┬────────┘  │  - nodeAdded                     │ │
│           │           │  - nodeRemoved                   │ │
│           │           │  - nodeUpdated                   │ │
│           │           │  - edgeAdded/Removed             │ │
│           │           └──────────────┬───────────────────┘ │
│           │                          │                      │
│           ▼                          ▼                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              GraphonCore (Application Layer)            ││
│  │  - Subscribes to GraphModel events                      ││
│  │  - Triggers renderer updates with animation             ││
│  │  - Manages render loop (requestAnimationFrame)          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### What Lives Where

| Data | Location | Why |
|------|----------|-----|
| Graph (nodes/edges) | `GraphModel` in Provider ref | Mutable, 100k+ items, not React's job |
| Node/edge positions | `GraphModel` | Part of graph data |
| Selection state | React state | Small set, UI needs to react |
| Hover state | React state | UI feedback |
| Viewport (pan/zoom) | Renderer internal | Continuous updates, not React's job |
| Style config | React props | Declarative, changes trigger re-style |
| Callbacks | React props | Standard React pattern |

---

## API Design (No Implementation Details Exposed)

### The Public API

Users never import or see graphology, PixiJS, or any implementation detail:

```tsx
// ✅ User code - clean, domain-focused
import { GraphonProvider, Graphon, useGraph, useSelection } from '@graphon/react';

function App() {
  return (
    <GraphonProvider>
      <GraphEditor />
    </GraphonProvider>
  );
}

function GraphEditor() {
  // Our hooks - no implementation details
  const { addNode, removeNode, addEdge, batch } = useGraph();
  const [selectedNodes, selectNodes] = useSelection();
  
  const handleAddNode = () => {
    addNode('new-1', 100, 200, { label: 'New Node' });
  };
  
  return (
    <div>
      <button onClick={handleAddNode}>Add Node</button>
      <Graphon 
        nodeStyle={{ size: 10, color: '#6366f1' }}
        onNodeClick={(nodeId) => selectNodes([nodeId])}
      />
    </div>
  );
}
```

### What We DON'T Expose

```tsx
// ❌ NEVER expose graphology to users
import Graph from 'graphology';  // Users don't need this

// ❌ NEVER expose raw graph instance
<Graphon graph={graphologyInstance} />  // Bad API

// ❌ NEVER require users to call graphology methods
graph.addNode('x', { x: 0 });  // Users don't see this
```

---

## Recommended Pattern: Provider + Hooks

```tsx
// ❌ Don't do this for large graphs
function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  return <Graphon nodes={nodes} edges={edges} />;
}
```

### Option B: GraphonProvider + Hooks (Recommended)

**Note:** Users NEVER see graphology. The GraphModel is created and owned by GraphonProvider.

```tsx
// ✅ Recommended pattern - NO graphology imports!
import { GraphonProvider, Graphon, useGraph, useGraphonRef } from '@graphon/react';

function App() {
  return (
    <GraphonProvider>
      <AppContent />
    </GraphonProvider>
  );
}

function AppContent() {
  const graphonRef = useGraphonRef();
  
  // useGraph() returns mutation methods - NOT the graph instance
  const { addNode, removeNode, addEdge, clear } = useGraph();
  
  // For bulk operations, use transactions
  const loadData = useCallback((data: GraphData) => {
    graphonRef.current?.transaction(() => {
      // Batch all changes, animate once at the end
      data.nodes.forEach(n => addNode(n.id, n.x, n.y, n.data));
      data.edges.forEach(e => addEdge(e.id, e.source, e.target));
    });
  }, [addNode, addEdge]);
  
  return (
    <Graphon
      ref={graphonRef}
      nodeStyle={{ size: 10 }}
      onNodeClick={(nodeId) => console.log('clicked', nodeId)}
    />
  );
}
```

### Option C: Hybrid with Controlled UI State

**Note:** Graph model is internal. UI state (selection, search) can be React state.

```tsx
// ✅ Best of both worlds - NO graphology imports!
import { GraphonProvider, Graphon, useSelection } from '@graphon/react';

function App() {
  return (
    <GraphonProvider>
      <AppContent />
    </GraphonProvider>
  );
}

function AppContent() {
  // UI state CAN be React state (small, needs re-renders)
  const { selectedNodes, setSelectedNodes, searchResults } = useSelection();
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <>
      <SearchInput value={searchQuery} onChange={setSearchQuery} />
      
      <Graphon
        selectedNodes={selectedNodes}
        onSelectionChange={setSelectedNodes}
        highlightedNodes={searchResults}
      />
      
      <Sidebar selectedNodes={selectedNodes} />
    </>
  );
}
```

---

## GraphModel Event Integration

**Note:** GraphBridge subscribes to `GraphModel` events, NOT graphology directly.

### Events We Subscribe To

```typescript
// packages/core/src/GraphBridge.ts
import type { GraphModel, NodeModel, EdgeModel } from '../model/GraphModel';

export class GraphBridge {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private renderer: Graphon;
  
  constructor(model: GraphModel, renderer: Graphon) {
    this.model = model;
    this.renderer = renderer;
    this.subscribe();
  }
  
  private subscribe(): void {
    // Subscribe to GraphModel events (abstracted from graphology)
    this.model.on('nodeAdded', this.onNodeAdded.bind(this));
    this.model.on('nodeRemoved', this.onNodeRemoved.bind(this));
    this.model.on('nodeUpdated', this.onNodeUpdated.bind(this));
    
    // Edge events
    this.model.on('edgeAdded', this.onEdgeAdded.bind(this));
    this.model.on('edgeRemoved', this.onEdgeRemoved.bind(this));
    this.model.on('edgeUpdated', this.onEdgeUpdated.bind(this));
    
    // Bulk events
    this.model.on('cleared', this.onCleared.bind(this));
  }
  
  private onNodeAdded(node: NodeModel): void {
    // Add to renderer with entrance animation
    this.renderer.addNode(node.id, node, { animate: true });
  }
  
  private onNodeRemoved(nodeId: string): void {
    // Remove with exit animation
    this.renderer.removeNode(nodeId, { animate: true });
  }
  
  private onNodeUpdated(node: NodeModel, changes: Partial<NodeModel>): void {
    // Animate position change if x/y changed
    if (attributes.x !== previousAttributes.x || attributes.y !== previousAttributes.y) {
      this.renderer.animateNodePosition(key, attributes.x, attributes.y);
    }
    
    // Update other attributes (size, color, etc.)
    this.renderer.updateNodeStyle(key, attributes);
  }
}
```

### Batching / Transactions

For bulk operations (loading graph, layout changes), we need to batch updates:

```typescript
// packages/core/src/Graphon.ts
export class Graphon {
  private isInTransaction = false;
  private pendingAdds: Map<string, NodeAttrs> = new Map();
  private pendingRemoves: Set<string> = new Set();
  
  /**
   * Batch multiple graph changes into a single animated update
   */
  transaction(fn: () => void): void {
    this.isInTransaction = true;
    
    try {
      fn();
    } finally {
      this.isInTransaction = false;
      this.flushTransaction();
    }
  }
  
  private flushTransaction(): void {
    // Animate all changes at once
    if (this.pendingRemoves.size > 0) {
      this.animateBulkRemoval(this.pendingRemoves);
      this.pendingRemoves.clear();
    }
    
    if (this.pendingAdds.size > 0) {
      this.animateBulkAddition(this.pendingAdds);
      this.pendingAdds.clear();
    }
  }
}
```

---

## React Hook Design

### useGraph Hook

**CRITICAL:** useGraph does NOT expose the graph instance. Users only get mutation methods.

```typescript
// packages/react/src/useGraph.ts
import { useCallback } from 'react';
import { useGraphonContext } from './GraphonProvider';
import type { GraphModel, SerializedGraph, NodeData } from '@graphon/core';

/**
 * Hook to access graph mutation methods.
 * Does NOT expose graphology - only clean mutation API.
 */
export interface UseGraphReturn {
  // NO graph property! Users can't access raw graphology
  
  // Node mutations
  addNode: (id: string, x: number, y: number, data?: NodeData) => void;
  removeNode: (id: string) => void;
  setNodePosition: (id: string, x: number, y: number) => void;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  
  // Edge mutations  
  addEdge: (id: string, source: string, target: string, data?: Record<string, unknown>) => void;
  removeEdge: (id: string) => void;
  
  // Queries (read-only)
  getNode: (id: string) => NodeModel | undefined;
  hasNode: (id: string) => boolean;
  hasEdge: (source: string, target: string) => boolean;
  nodeCount: number;
  edgeCount: number;
  
  // Bulk operations
  clear: () => void;
  import: (data: SerializedGraph) => void;
  export: () => SerializedGraph;
}

export function useGraph(): UseGraphReturn {
  const { model } = useGraphonContext();  // Get GraphModel from context
  
  const addNode = useCallback((id: string, x: number, y: number, data?: NodeData) => {
    model.addNode(id, x, y, data);
  }, [model]);
  
  const removeNode = useCallback((id: string) => {
    model.removeNode(id);
  }, [model]);
  
  // ... other mutations delegate to GraphModel
  
  return {
    addNode,
    removeNode,
    setNodePosition: (id, x, y) => model.setNodePosition(id, x, y),
    updateNode: (id, data) => model.updateNode(id, data),
    addEdge: (id, s, t, d) => model.addEdge(id, s, t, d),
    removeEdge: (id) => model.removeEdge(id),
    getNode: (id) => model.getNode(id),
    hasNode: (id) => model.hasNode(id),
    hasEdge: (s, t) => model.hasEdge(s, t),
    get nodeCount() { return model.nodeCount; },
    get edgeCount() { return model.edgeCount; },
    clear: () => model.clear(),
    import: (data) => model.import(data),
    export: () => model.export(),
  };
}
```

### useGraphonRef Hook

**Note:** NO graphology parameter. The model is obtained from context.

```typescript
// packages/react/src/useGraphonRef.ts
import { useRef, useCallback, useEffect } from 'react';
import { useGraphonContext } from './GraphonProvider';
import type { Graphon, GraphonConfig } from '@graphon/core';

export interface GraphonHandle {
  // Navigation
  fitToView: (animate?: boolean) => void;
  centerOn: (x: number, y: number, zoom?: number) => void;
  focusOnNode: (nodeId: string, zoom?: number) => void;
  
  // Transactions
  transaction: (fn: () => void) => void;
  
  // Selection (can also be controlled via props)
  selectNodes: (nodeIds: string[]) => void;
  clearSelection: () => void;
  
  // Export
  toImage: (format: 'png' | 'svg') => Promise<Blob>;
  
  // Layout
  runLayout: (algorithm: string, options?: LayoutOptions) => Promise<void>;
  
  // NO getRenderer() - don't expose internals
}

/**
 * Hook to access Graphon imperative methods.
 * Gets GraphModel from context - NO graphology parameter.
 */
export function useGraphonRef(config?: GraphonConfig): {
  ref: React.RefCallback<HTMLDivElement>;
  handle: GraphonHandle;
} {
  const { model } = useGraphonContext();  // Get model from context
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<Graphon | null>(null);
  
  // Initialize renderer when container is available
  const ref = useCallback((container: HTMLDivElement | null) => {
    if (container && !rendererRef.current) {
      // Graphon receives GraphModel, NOT graphology
      rendererRef.current = new Graphon(container, model, config);
    }
    containerRef.current = container;
  }, [model, config]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, []);
  
  const handle: GraphonHandle = {
    fitToView: (animate = true) => rendererRef.current?.fitToView(animate),
    centerOn: (x, y, zoom) => rendererRef.current?.centerOn(x, y, zoom),
    focusOnNode: (nodeId, zoom) => rendererRef.current?.focusOnNode(nodeId, zoom),
    transaction: (fn) => rendererRef.current?.transaction(fn),
    selectNodes: (ids) => rendererRef.current?.selectNodes(ids),
    clearSelection: () => rendererRef.current?.clearSelection(),
    toImage: (format) => rendererRef.current?.toImage(format) ?? Promise.reject(),
    runLayout: (alg, opts) => rendererRef.current?.runLayout(alg, opts) ?? Promise.resolve(),
  };
  
  return { ref, handle };
}
```

---

## Example: Adding a Node with Animation

**Note:** NO graphology access. All operations go through useGraph() hooks.

```tsx
function GraphEditor() {
  // useGraph returns mutation methods - NOT the graph instance
  const { addNode, addEdge, getNode } = useGraph();
  const { ref, handle } = useGraphonRef();
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  
  const handleAddNode = () => {
    // Get position near selected node, or random
    let x = Math.random() * 500;
    let y = Math.random() * 500;
    
    if (selectedNodes.size > 0) {
      const [firstSelected] = selectedNodes;
      // Use useGraph().getNode() instead of graphology
      const node = getNode(firstSelected);
      if (node) {
        x = node.x + 100;
        y = node.y;
      }
    }
    
    const newId = `node-${Date.now()}`;
    
    // This mutation triggers:
    // 1. GraphModel emits 'nodeAdded'
    // 2. Graphon's GraphBridge receives event
    // 3. Graphon adds node sprite with entrance animation
    // 4. If there's a selected node, optionally add edge too
    addNode(newId, x, y, { label: 'New Node' });
    
    if (selectedNodes.size > 0) {
      const [firstSelected] = selectedNodes;
      // Use useGraph().addEdge() instead of graphology
      addEdge(`edge-${Date.now()}`, firstSelected, newId);
    }
    
    // Focus on new node
    handle.focusOnNode(newId);
  };
  
  return (
    <div>
      <button onClick={handleAddNode}>Add Node</button>
      <div ref={ref} style={{ width: '100%', height: 600 }} />
    </div>
  );
}
```

---

## Performance Characteristics

### Memory

| Approach | 100k Nodes | 1M Nodes |
|----------|------------|----------|
| Graph in React state | ❌ Reconciliation overhead | ❌ Unusable |
| Graph in ref + events | ✅ ~50-100MB | ✅ ~500MB-1GB |

### Update Performance

| Operation | React State | Ref + Events |
|-----------|-------------|--------------|
| Add 1 node | ~50ms (reconcile all) | ~1ms |
| Add 1000 nodes | ~500ms | ~10ms (batched) |
| Move 1 node | ~50ms | ~0.1ms |
| Update style of 1 node | ~50ms | ~0.1ms |

### Why Ref + Events is Fast

1. **No React reconciliation** — React doesn't know about graph changes
2. **Granular updates** — Only affected sprites are updated
3. **graphology events are O(1)** — No diffing needed, events tell us exactly what changed
4. **PixiJS batches draws** — Multiple sprite updates = single GPU draw call

---

## Controlled vs Uncontrolled Patterns

### Uncontrolled (GraphModel managed by Provider)

**Note:** Users don't manage graphology. GraphonProvider owns the model.

```tsx
// ✅ GraphonProvider creates and owns the GraphModel internally
<GraphonProvider>
  <AppContent />
</GraphonProvider>

// Inside AppContent, use hooks to mutate
const { addNode } = useGraph();
addNode('a', 0, 0, { label: 'A' });
```

### Controlled UI State (Recommended)

```tsx
// Graph data is internal, but UI state is controlled React state
<GraphonProvider>
  <AppContent />
</GraphonProvider>

function AppContent() {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  return (
    <Graphon
      selectedNodes={selectedNodes}        // Controlled
      onSelectionChange={setSelectedNodes}  // Callback
    />
  );
}
```

### Fully Controlled (For small graphs only)

```tsx
// Only for <1000 nodes, or when you NEED React to track changes
<Graphon
  nodes={nodes}
  edges={edges}
  onNodesChange={setNodes}
  onEdgesChange={setEdges}
/>
```

---

## Summary

| Aspect | Recommendation |
|--------|----------------|
| Graph data | Internal to `GraphonProvider` — users never see graphology |
| Graph mutations | `useGraph()` hook methods (addNode, removeNode, etc.) |
| Change detection | Subscribe to `GraphModel` events (abstracted from graphology) |
| Animation | Renderer handles automatically on events |
| UI state (selection, hover) | Can be React state (small data) |
| Config/styles | React props (declarative) |
| Bulk updates | Use `transaction()` to batch and animate once |

This architecture ensures:
- ✅ 100k+ nodes without React overhead
- ✅ Automatic diffing via GraphModel events
- ✅ Smooth animations for all changes
- ✅ Clean React integration for UI state
- ✅ Declarative styling via props
- ✅ **graphology is encapsulated** — can swap implementations without API changes
