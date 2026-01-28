# Phase 7: Layouts

## Overview

Create the @graphon/layouts package with layout algorithms running in Web Workers.

---

## Task 7.1: Layouts Package Setup

### Overview
Initialize @graphon/layouts package with Web Worker infrastructure.

### Dependencies
- Phase 6 complete

### Acceptance Criteria
- [ ] Package structure created
- [ ] Worker communication with Comlink
- [ ] Layout interface defined

### Implementation Steps

```typescript
// packages/layouts/src/types.ts
export interface LayoutConfig {
  animate?: boolean;
  animationDuration?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export interface ForceLayoutConfig extends LayoutConfig {
  iterations?: number;
  gravity?: number;
  repulsion?: number;
  attraction?: number;
  edgeLength?: number;
}

export interface HierarchicalLayoutConfig extends LayoutConfig {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  levelSeparation?: number;
  nodeSeparation?: number;
}

export interface CircularLayoutConfig extends LayoutConfig {
  radius?: number;
  startAngle?: number;
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  duration: number;
}

export interface LayoutWorkerAPI {
  runForceLayout(
    nodes: Array<{ id: string; x: number; y: number }>,
    edges: Array<{ source: string; target: string }>,
    config: ForceLayoutConfig
  ): Promise<LayoutResult>;
  
  runCircularLayout(
    nodes: Array<{ id: string }>,
    config: CircularLayoutConfig
  ): Promise<LayoutResult>;
  
  cancel(): void;
}
```

```typescript
// packages/layouts/src/worker/layoutWorker.ts
import * as Comlink from 'comlink';
import type { LayoutWorkerAPI, LayoutResult, ForceLayoutConfig, CircularLayoutConfig } from '../types';

const api: LayoutWorkerAPI = {
  async runForceLayout(nodes, edges, config): Promise<LayoutResult> {
    const start = performance.now();
    const positions = new Map<string, { x: number; y: number }>();
    
    // Implementation will be in separate tasks
    // For now, return current positions
    for (const node of nodes) {
      positions.set(node.id, { x: node.x, y: node.y });
    }
    
    return {
      positions,
      duration: performance.now() - start,
    };
  },
  
  async runCircularLayout(nodes, config): Promise<LayoutResult> {
    const start = performance.now();
    const positions = new Map<string, { x: number; y: number }>();
    
    const radius = config.radius ?? 200;
    const startAngle = config.startAngle ?? 0;
    
    nodes.forEach((node, i) => {
      const angle = startAngle + (i / nodes.length) * Math.PI * 2;
      positions.set(node.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });
    
    return {
      positions,
      duration: performance.now() - start,
    };
  },
  
  cancel(): void {
    // Cancel ongoing layout
  },
};

Comlink.expose(api);
```

**Note:** LayoutManager works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/layouts/src/LayoutManager.ts
import * as Comlink from 'comlink';
import type { GraphModel } from '@graphon/core';  // Uses GraphModel, NOT Graph
import type { LayoutWorkerAPI, LayoutConfig, ForceLayoutConfig, CircularLayoutConfig } from './types';

export class LayoutManager {
  private worker: Worker;
  private api: Comlink.Remote<LayoutWorkerAPI>;
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  
  constructor(model: GraphModel) {
    this.model = model;
    this.worker = new Worker(new URL('./worker/layoutWorker', import.meta.url), { type: 'module' });
    this.api = Comlink.wrap<LayoutWorkerAPI>(this.worker);
  }
  
  /**
   * Run force-directed layout
   */
  async runForce(config?: ForceLayoutConfig): Promise<void> {
    const nodes = this.getNodes();
    const edges = this.getEdges();
    
    const result = await this.api.runForceLayout(nodes, edges, config ?? {});
    this.applyPositions(result.positions, config?.animate);
  }
  
  /**
   * Run circular layout
   */
  async runCircular(config?: CircularLayoutConfig): Promise<void> {
    const nodes = this.getNodes();
    
    const result = await this.api.runCircularLayout(nodes, config ?? {});
    this.applyPositions(result.positions, config?.animate);
  }
  
  /**
   * Cancel running layout
   */
  cancel(): void {
    this.api.cancel();
  }
  
  private getNodes(): Array<{ id: string; x: number; y: number }> {
    const nodes: Array<{ id: string; x: number; y: number }> = [];
    // Use GraphModel iterator
    for (const node of this.model.nodes()) {
      nodes.push({ id: node.id, x: node.x, y: node.y });
    }
    return nodes;
  }
  
  private getEdges(): Array<{ source: string; target: string }> {
    const edges: Array<{ source: string; target: string }> = [];
    // Use GraphModel iterator
    for (const edge of this.model.edges()) {
      edges.push({ source: edge.source, target: edge.target });
    }
    return edges;
  }
  
  private applyPositions(
    positions: Map<string, { x: number; y: number }>,
    animate?: boolean
  ): void {
    // Use GraphModel's batch update for performance
    this.model.batch(() => {
      for (const [nodeId, pos] of positions) {
        this.model.updateNode(nodeId, { x: pos.x, y: pos.y });
      }
    });
  }
  
  destroy(): void {
    this.worker.terminate();
  }
}
```

### Files to Create
- `packages/layouts/src/types.ts`
- `packages/layouts/src/worker/layoutWorker.ts`
- `packages/layouts/src/LayoutManager.ts`
- `packages/layouts/src/index.ts`
- `packages/layouts/package.json`
- `packages/layouts/tsconfig.json`
- `packages/layouts/tsup.config.ts`

### Tests Required
- Unit: Worker communication
- Unit: Circular layout positions

### Demo Addition
None yet (Task 7.4)

---

## Task 7.2: Force-Directed Layout

### Overview
Implement force-directed layout with Barnes-Hut optimization.

### Dependencies
- Task 7.1

### Acceptance Criteria
- [ ] Basic force simulation
- [ ] Barnes-Hut for O(n log n)
- [ ] Progress callbacks
- [ ] Cancellation support

### Implementation Steps

```typescript
// packages/layouts/src/algorithms/forceDirected.ts
export interface ForceNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
}

export interface ForceConfig {
  iterations: number;
  gravity: number;
  repulsion: number;
  attraction: number;
  friction: number;
  theta: number;  // Barnes-Hut approximation parameter
}

const DEFAULT_CONFIG: ForceConfig = {
  iterations: 100,
  gravity: 0.1,
  repulsion: 1000,
  attraction: 0.01,
  friction: 0.9,
  theta: 0.8,
};

export function runForceLayout(
  nodes: ForceNode[],
  edges: Array<{ source: string; target: string }>,
  config: Partial<ForceConfig>,
  onProgress?: (progress: number) => void,
  shouldCancel?: () => boolean
): Map<string, { x: number; y: number }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  
  // Build edge lookup
  const edgeLookup = new Map<string, string[]>();
  for (const edge of edges) {
    if (!edgeLookup.has(edge.source)) edgeLookup.set(edge.source, []);
    if (!edgeLookup.has(edge.target)) edgeLookup.set(edge.target, []);
    edgeLookup.get(edge.source)!.push(edge.target);
    edgeLookup.get(edge.target)!.push(edge.source);
  }
  
  // Run iterations
  for (let i = 0; i < cfg.iterations; i++) {
    if (shouldCancel?.()) break;
    
    // Apply forces
    applyRepulsion(nodes, cfg);
    applyAttraction(nodes, edgeLookup, nodeMap, cfg);
    applyGravity(nodes, cfg);
    
    // Update positions
    for (const node of nodes) {
      node.vx *= cfg.friction;
      node.vy *= cfg.friction;
      node.x += node.vx;
      node.y += node.vy;
    }
    
    onProgress?.((i + 1) / cfg.iterations);
  }
  
  // Return final positions
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    positions.set(node.id, { x: node.x, y: node.y });
  }
  return positions;
}

function applyRepulsion(nodes: ForceNode[], cfg: ForceConfig): void {
  // Simple O(n²) for now - replace with Barnes-Hut for large graphs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const dist = Math.hypot(dx, dy) || 1;
      
      const force = cfg.repulsion / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      n1.vx -= fx;
      n1.vy -= fy;
      n2.vx += fx;
      n2.vy += fy;
    }
  }
}

function applyAttraction(
  nodes: ForceNode[],
  edgeLookup: Map<string, string[]>,
  nodeMap: Map<string, ForceNode>,
  cfg: ForceConfig
): void {
  for (const node of nodes) {
    const neighbors = edgeLookup.get(node.id) || [];
    for (const neighborId of neighbors) {
      const neighbor = nodeMap.get(neighborId);
      if (!neighbor) continue;
      
      const dx = neighbor.x - node.x;
      const dy = neighbor.y - node.y;
      const dist = Math.hypot(dx, dy) || 1;
      
      const force = dist * cfg.attraction;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      node.vx += fx;
      node.vy += fy;
    }
  }
}

function applyGravity(nodes: ForceNode[], cfg: ForceConfig): void {
  for (const node of nodes) {
    const dist = Math.hypot(node.x, node.y) || 1;
    node.vx -= (node.x / dist) * cfg.gravity;
    node.vy -= (node.y / dist) * cfg.gravity;
  }
}
```

### Files to Create
- `packages/layouts/src/algorithms/forceDirected.ts`
- `packages/layouts/src/algorithms/__tests__/forceDirected.test.ts`

### Tests Required
- Unit: Layout converges
- Unit: Progress callbacks
- Benchmark: 10k nodes performance

---

## Task 7.3: Additional Layouts

### Overview
Implement hierarchical (dagre-like) and grid layouts.

### Dependencies
- Task 7.2

### Acceptance Criteria
- [ ] Hierarchical layout for DAGs
- [ ] Grid layout
- [ ] Random layout
- [ ] Concentric layout

### Implementation Steps

```typescript
// packages/layouts/src/algorithms/hierarchical.ts
export interface HierarchicalConfig {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  levelSeparation: number;
  nodeSeparation: number;
}

export function runHierarchicalLayout(
  nodes: Array<{ id: string }>,
  edges: Array<{ source: string; target: string }>,
  config: Partial<HierarchicalConfig>
): Map<string, { x: number; y: number }> {
  const cfg: HierarchicalConfig = {
    direction: config.direction ?? 'TB',
    levelSeparation: config.levelSeparation ?? 100,
    nodeSeparation: config.nodeSeparation ?? 50,
  };
  
  // Build graph structure
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  const nodeSet = new Set(nodes.map((n) => n.id));
  
  for (const edge of edges) {
    if (!children.has(edge.source)) children.set(edge.source, []);
    if (!parents.has(edge.target)) parents.set(edge.target, []);
    children.get(edge.source)!.push(edge.target);
    parents.get(edge.target)!.push(edge.source);
  }
  
  // Find roots (nodes with no parents)
  const roots = nodes.filter((n) => !parents.has(n.id) || parents.get(n.id)!.length === 0);
  
  // Assign levels using BFS
  const levels = new Map<string, number>();
  const queue = roots.map((r) => ({ id: r.id, level: 0 }));
  
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (levels.has(id)) continue;
    levels.set(id, level);
    
    const nodeChildren = children.get(id) || [];
    for (const child of nodeChildren) {
      queue.push({ id: child, level: level + 1 });
    }
  }
  
  // Group nodes by level
  const levelNodes = new Map<number, string[]>();
  for (const [id, level] of levels) {
    if (!levelNodes.has(level)) levelNodes.set(level, []);
    levelNodes.get(level)!.push(id);
  }
  
  // Position nodes
  const positions = new Map<string, { x: number; y: number }>();
  const maxLevel = Math.max(...levelNodes.keys(), 0);
  
  for (const [level, nodeIds] of levelNodes) {
    const count = nodeIds.length;
    const totalWidth = (count - 1) * cfg.nodeSeparation;
    
    nodeIds.forEach((id, i) => {
      let x = i * cfg.nodeSeparation - totalWidth / 2;
      let y = level * cfg.levelSeparation;
      
      // Adjust for direction
      if (cfg.direction === 'BT') y = (maxLevel - level) * cfg.levelSeparation;
      if (cfg.direction === 'LR') [x, y] = [y, x];
      if (cfg.direction === 'RL') [x, y] = [(maxLevel - level) * cfg.levelSeparation, x];
      
      positions.set(id, { x, y });
    });
  }
  
  return positions;
}
```

```typescript
// packages/layouts/src/algorithms/grid.ts
export interface GridConfig {
  columns?: number;
  rowSpacing: number;
  columnSpacing: number;
}

export function runGridLayout(
  nodes: Array<{ id: string }>,
  config: Partial<GridConfig>
): Map<string, { x: number; y: number }> {
  const cfg: GridConfig = {
    columns: config.columns ?? Math.ceil(Math.sqrt(nodes.length)),
    rowSpacing: config.rowSpacing ?? 100,
    columnSpacing: config.columnSpacing ?? 100,
  };
  
  const positions = new Map<string, { x: number; y: number }>();
  const cols = cfg.columns!;
  
  nodes.forEach((node, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    positions.set(node.id, {
      x: col * cfg.columnSpacing - ((cols - 1) * cfg.columnSpacing) / 2,
      y: row * cfg.rowSpacing - ((Math.ceil(nodes.length / cols) - 1) * cfg.rowSpacing) / 2,
    });
  });
  
  return positions;
}
```

### Files to Create
- `packages/layouts/src/algorithms/hierarchical.ts`
- `packages/layouts/src/algorithms/grid.ts`
- `packages/layouts/src/algorithms/concentric.ts`
- Tests for each

### Tests Required
- Unit: Hierarchical assigns correct levels
- Unit: Grid positions correctly

---

## Task 7.4: Layout Integration & Demo

### Overview
Integrate layouts with main Graphon component and create demo.

### Dependencies
- Task 7.3

### Acceptance Criteria
- [ ] `useLayout` hook for React
- [ ] Animated position transitions
- [ ] Demo with layout selector

### Implementation Steps

**Note:** useLayout hook gets GraphModel from context - NO graphology in public API.

```typescript
// packages/react/src/useLayout.ts
import { useRef, useCallback } from 'react';
import { LayoutManager, type ForceLayoutConfig, type CircularLayoutConfig } from '@graphon/layouts';
import { useGraphonContext } from './GraphonProvider';

/**
 * Hook for layout operations.
 * Gets GraphModel from context - users never see graphology.
 */
export function useLayout() {
  const { model } = useGraphonContext();  // Get model from context
  const managerRef = useRef<LayoutManager | null>(null);
  
  // Lazy init
  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new LayoutManager(model);
    }
    return managerRef.current;
  }, [model]);
  
  const runForce = useCallback(async (config?: ForceLayoutConfig) => {
    await getManager().runForce(config);
  }, [getManager]);
  
  const runCircular = useCallback(async (config?: CircularLayoutConfig) => {
    await getManager().runCircular(config);
  }, [getManager]);
  
  const runHierarchical = useCallback(async (config?: any) => {
    // await getManager().runHierarchical(config);
  }, [getManager]);
  
  const runGrid = useCallback(async (config?: any) => {
    // await getManager().runGrid(config);
  }, [getManager]);
  
  const cancel = useCallback(() => {
    managerRef.current?.cancel();
  }, []);
  
  return {
    runForce,
    runCircular,
    runHierarchical,
    runGrid,
    cancel,
  };
}
```

**Note:** Demo uses `GraphonProvider` + `useGraph()` pattern. NO graphology imports!

```tsx
// apps/demo/src/demos/Layouts.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { GraphonProvider, Graphon, useGraph, useLayout } from '@graphon/react';  // NO graphology import!

const LAYOUTS = ['force', 'circular', 'hierarchical', 'grid', 'random'] as const;

// Hook to generate demo graph using useGraph()
function useGenerateHierarchicalGraph() {
  const { addNode, addEdge, batch } = useGraph();
  
  useEffect(() => {
    batch(() => {
      addNode('root', 0, 0, { label: 'Root' });
      
      for (let i = 0; i < 5; i++) {
        const childId = `child-${i}`;
        addNode(childId, Math.random() * 200 - 100, Math.random() * 200 - 100, { label: `Child ${i}` });
        addEdge('root', childId);
        
        for (let j = 0; j < 3; j++) {
          const grandchildId = `grandchild-${i}-${j}`;
          addNode(grandchildId, Math.random() * 200 - 100, Math.random() * 200 - 100, { label: `GC ${i}-${j}` });
          addEdge(childId, grandchildId);
        }
      }
    });
  }, [addNode, addEdge, batch]);
}

export function Layouts() {
  return (
    <GraphonProvider>
      <LayoutsContent />
    </GraphonProvider>
  );
}

function LayoutsContent() {
  useGenerateHierarchicalGraph();
  const { runForce, runCircular } = useLayout();  // No graph parameter needed!
  const [isRunning, setIsRunning] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<string>('');
  
  const handleLayout = useCallback(async (layout: typeof LAYOUTS[number]) => {
    setIsRunning(true);
    setCurrentLayout(layout);
    
    try {
      switch (layout) {
        case 'force':
          await runForce({ iterations: 100, animate: true });
          break;
        case 'circular':
          await runCircular({ radius: 200, animate: true });
          break;
        // Add more layouts
      }
      fitToView();
    } finally {
      setIsRunning(false);
    }
  }, [runForce, runCircular, fitToView]);
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Layouts</h1>
        <p>Apply different layout algorithms to arrange the graph.</p>
      </header>
      
      <div className="demo-controls">
        {LAYOUTS.map((layout) => (
          <button
            key={layout}
            onClick={() => handleLayout(layout)}
            disabled={isRunning}
            className={currentLayout === layout ? 'active' : ''}
          >
            {layout.charAt(0).toUpperCase() + layout.slice(1)}
          </button>
        ))}
        <button onClick={() => fitToView()}>Fit to View</button>
      </div>
      
      <div className="demo-info">
        {isRunning && <p>Running {currentLayout} layout...</p>}
      </div>
      
      <div className="demo-canvas">
        <Graphon
          ref={ref}
          graph={graph}
          nodeStyle={{ size: 15, color: '#6366f1', label: { visible: true } }}
          edgeStyle={{ arrow: 'target' }}
          onReady={() => fitToView(false)}
        />
      </div>
    </div>
  );
}
```

### Files to Create/Modify
- `packages/react/src/useLayout.ts`
- `packages/react/src/index.ts` (export hook)
- `apps/demo/src/demos/Layouts.tsx`

### Tests Required
- Integration: Layout applies positions
- Visual: Before/after layout

---

## Phase 7 Checklist

- [ ] Layout worker infrastructure
- [ ] Force-directed layout works
- [ ] Hierarchical layout works
- [ ] Circular/grid layouts work
- [ ] React hook for layouts
- [ ] Demo shows all layouts
- [ ] All tests pass

**Estimated time:** 3 days
