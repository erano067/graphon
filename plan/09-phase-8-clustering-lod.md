# Phase 8: Clustering & LOD (Level of Detail)

## Overview

The key differentiating feature: cluster-based LOD system for 100k+ node visualization. At zoomed-out levels, shows cluster super-nodes; at zoomed-in levels, shows individual nodes. Enables smooth interaction with massive graphs.

---

## Task 8.1: Cluster Data Structures

### Overview
Define cluster hierarchy data structures and integrate with graphology.

### Dependencies
- Phase 7 complete

### Acceptance Criteria
- [ ] ClusterHierarchy type defined
- [ ] Cluster attributes on nodes
- [ ] Cluster node/edge generation

### Implementation Steps

```typescript
// packages/core/src/clustering/types.ts
/**
 * Cluster hierarchy representation
 * Users can pre-compute this on backend using Louvain or other algorithms
 */
export interface ClusterNode {
  /** Cluster ID */
  id: string;
  
  /** Child clusters or leaf nodes */
  children: string[];
  
  /** Hierarchy level (0 = root, higher = more detailed) */
  level: number;
  
  /** Parent cluster ID (null for root) */
  parent: string | null;
  
  /** Number of leaf nodes in this cluster */
  size: number;
  
  /** Position (center of mass of children) */
  x: number;
  y: number;
  
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface ClusterEdge {
  /** Source cluster ID */
  source: string;
  
  /** Target cluster ID */
  target: string;
  
  /** Number of edges this represents */
  weight: number;
  
  /** IDs of actual edges aggregated */
  edges: string[];
}

export interface ClusterHierarchy {
  /** All clusters by ID */
  clusters: Map<string, ClusterNode>;
  
  /** Edges between clusters at each level */
  clusterEdges: Map<number, ClusterEdge[]>;
  
  /** Maximum hierarchy depth */
  maxLevel: number;
  
  /** Map node ID to cluster at each level */
  nodeToCluster: Map<string, string[]>;
}

export interface LODConfig {
  /** Zoom threshold to switch levels (zoom value -> LOD level) */
  zoomThresholds: number[];
  
  /** Minimum cluster size to show as cluster (smaller show individual nodes) */
  minClusterSize: number;
  
  /** Enable smooth transitions between LOD levels */
  animateTransitions: boolean;
  
  /** Transition duration in ms */
  transitionDuration: number;
}

export const DEFAULT_LOD_CONFIG: LODConfig = {
  zoomThresholds: [0.1, 0.3, 0.6, 1.0],  // 4 levels
  minClusterSize: 5,
  animateTransitions: true,
  transitionDuration: 300,
};
```

**Note:** ClusterBuilder works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/clustering/ClusterBuilder.ts
import type { GraphModel, NodeModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { ClusterHierarchy, ClusterNode, ClusterEdge } from './types';

/**
 * Builds cluster hierarchy from node cluster assignments.
 * Expects nodes to have `cluster_level_N` attributes in data.
 * 
 * @example
 * // Node data:
 * // { cluster_level_0: 'c0', cluster_level_1: 'c1', cluster_level_2: 'c2' }
 */
export class ClusterBuilder {
  /**
   * Build hierarchy from node cluster attributes
   */
  static buildFromAttributes(
    model: GraphModel,
    maxLevel: number = 3
  ): ClusterHierarchy {
    const clusters = new Map<string, ClusterNode>();
    const nodeToCluster = new Map<string, string[]>();
    const clusterEdges = new Map<number, ClusterEdge[]>();
    
    // First pass: collect all clusters at each level
    const levelClusters = new Map<number, Map<string, string[]>>();
    for (let level = 0; level <= maxLevel; level++) {
      levelClusters.set(level, new Map());
    }
    
    // Use GraphModel iterator
    for (const node of model.nodes()) {
      const nodeClusters: string[] = [];
      
      for (let level = 0; level <= maxLevel; level++) {
        const clusterId = node.data?.[`cluster_level_${level}`] as string | undefined;
        if (clusterId) {
          nodeClusters.push(clusterId);
          
          const clusterNodes = levelClusters.get(level)!;
          if (!clusterNodes.has(clusterId)) {
            clusterNodes.set(clusterId, []);
          }
          clusterNodes.get(clusterId)!.push(node.id);
        }
      }
      
      nodeToCluster.set(node.id, nodeClusters);
    }
    
    // Second pass: create cluster nodes with positions (center of mass)
    for (let level = 0; level <= maxLevel; level++) {
      const clusterNodes = levelClusters.get(level)!;
      
      for (const [clusterId, nodeIds] of clusterNodes) {
        let sumX = 0, sumY = 0;
        for (const nodeId of nodeIds) {
          const node = model.getNode(nodeId);  // Use GraphModel
          if (node) {
            sumX += node.x;
            sumY += node.y;
          }
        }
        
        // Find parent cluster (one level up)
        let parent: string | null = null;
        if (level > 0 && nodeIds.length > 0) {
          const sampleNode = nodeIds[0];
          const nodeClusters = nodeToCluster.get(sampleNode);
          if (nodeClusters && nodeClusters[level - 1]) {
            parent = nodeClusters[level - 1];
          }
        }
        
        clusters.set(clusterId, {
          id: clusterId,
          children: nodeIds,
          level,
          parent,
          size: nodeIds.length,
          x: sumX / nodeIds.length,
          y: sumY / nodeIds.length,
        });
      }
    }
    
    // Third pass: build cluster edges at each level
    // Use GraphModel iterator instead of graphology
    for (let level = 0; level <= maxLevel; level++) {
      const edgeMap = new Map<string, ClusterEdge>();
      
      for (const edge of model.edges()) {
        const sourceClusters = nodeToCluster.get(edge.source);
        const targetClusters = nodeToCluster.get(edge.target);
        
        if (!sourceClusters || !targetClusters) continue;
        
        const sourceCluster = sourceClusters[level];
        const targetCluster = targetClusters[level];
        
        if (!sourceCluster || !targetCluster) continue;
        if (sourceCluster === targetCluster) continue;  // Internal edge
        
        const key = [sourceCluster, targetCluster].sort().join('__');
        
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source: sourceCluster,
            target: targetCluster,
            weight: 0,
            edges: [],
          });
        }
        
        const clusterEdge = edgeMap.get(key)!;
        clusterEdge.weight++;
        clusterEdge.edges.push(edge.id);
      }
      
      clusterEdges.set(level, Array.from(edgeMap.values()));
    }
    
    return {
      clusters,
      clusterEdges,
      maxLevel,
      nodeToCluster,
    };
  }
}
```

### Files to Create
- `packages/core/src/clustering/types.ts`
- `packages/core/src/clustering/ClusterBuilder.ts`
- `packages/core/src/clustering/index.ts`

### Tests Required
- Unit: ClusterBuilder extracts hierarchy correctly
- Unit: Cluster edges counted correctly

### Demo Addition
None yet (Task 8.4)

---

## Task 8.2: LOD Manager

### Overview
Create LODManager that tracks zoom level and determines what to render.

### Dependencies
- Task 8.1

### Acceptance Criteria
- [ ] Tracks current LOD level
- [ ] Determines visible items based on zoom
- [ ] Provides render lists (nodes/edges/clusters)

### Implementation Steps

**Note:** LODManager works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/clustering/LODManager.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { ClusterHierarchy, ClusterNode, ClusterEdge, LODConfig } from './types';
import { DEFAULT_LOD_CONFIG } from './types';

export interface LODRenderSet {
  /** Individual nodes to render */
  nodes: string[];
  
  /** Individual edges to render */
  edges: string[];
  
  /** Clusters to render as super-nodes */
  clusters: ClusterNode[];
  
  /** Cluster edges to render */
  clusterEdges: ClusterEdge[];
  
  /** Current LOD level (0 = most zoomed out) */
  level: number;
}

export class LODManager {
  private model: GraphModel;  // Uses GraphModel, NOT Graph
  private hierarchy: ClusterHierarchy | null = null;
  private config: LODConfig;
  private currentZoom: number = 1;
  private currentLevel: number = -1;
  
  constructor(model: GraphModel, config?: Partial<LODConfig>) {
    this.model = model;
    this.config = { ...DEFAULT_LOD_CONFIG, ...config };
  }
  
  /**
   * Set the cluster hierarchy
   */
  setHierarchy(hierarchy: ClusterHierarchy): void {
    this.hierarchy = hierarchy;
    this.currentLevel = -1;  // Force recalculation
  }
  
  /**
   * Clear hierarchy (render all nodes individually)
   */
  clearHierarchy(): void {
    this.hierarchy = null;
    this.currentLevel = -1;
  }
  
  /**
   * Update zoom level and get what should be rendered
   */
  updateZoom(zoom: number): LODRenderSet {
    this.currentZoom = zoom;
    
    // No hierarchy - render everything
    if (!this.hierarchy) {
      return this.getAllElements();
    }
    
    // Determine LOD level from zoom
    const level = this.zoomToLevel(zoom);
    this.currentLevel = level;
    
    return this.getRenderSet(level);
  }
  
  /**
   * Get current render set without changing zoom
   */
  getCurrentRenderSet(): LODRenderSet {
    if (!this.hierarchy) {
      return this.getAllElements();
    }
    return this.getRenderSet(this.currentLevel);
  }
  
  /**
   * Check if zoom change would trigger LOD change
   */
  wouldLevelChange(newZoom: number): boolean {
    return this.zoomToLevel(newZoom) !== this.currentLevel;
  }
  
  private zoomToLevel(zoom: number): number {
    const thresholds = this.config.zoomThresholds;
    
    for (let i = 0; i < thresholds.length; i++) {
      if (zoom < thresholds[i]) {
        return i;
      }
    }
    
    return thresholds.length;  // Max detail
  }
  
  private getRenderSet(level: number): LODRenderSet {
    const hierarchy = this.hierarchy!;
    const maxDetailLevel = hierarchy.maxLevel;
    
    // At max detail (highest level), show all individual nodes
    if (level >= maxDetailLevel) {
      return this.getAllElements();
    }
    
    // Find clusters at this LOD level
    const clustersAtLevel: ClusterNode[] = [];
    const expandedNodes: string[] = [];
    const expandedNodeSet = new Set<string>();
    
    for (const cluster of hierarchy.clusters.values()) {
      if (cluster.level !== level) continue;
      
      // Small clusters show individual nodes
      if (cluster.size < this.config.minClusterSize) {
        for (const nodeId of cluster.children) {
          if (!expandedNodeSet.has(nodeId)) {
            expandedNodes.push(nodeId);
            expandedNodeSet.add(nodeId);
          }
        }
      } else {
        clustersAtLevel.push(cluster);
      }
    }
    
    // Find edges between expanded nodes using GraphModel iterator
    const edges: string[] = [];
    for (const edge of this.model.edges()) {
      if (expandedNodeSet.has(edge.source) && expandedNodeSet.has(edge.target)) {
        edges.push(edge.id);
      }
    }
    
    // Cluster edges at this level
    const clusterEdges = hierarchy.clusterEdges.get(level) || [];
    
    return {
      nodes: expandedNodes,
      edges,
      clusters: clustersAtLevel,
      clusterEdges,
      level,
    };
  }
  
  // Use GraphModel iterators instead of graphology
  private getAllElements(): LODRenderSet {
    const nodes: string[] = [];
    const edges: string[] = [];
    
    for (const node of this.model.nodes()) nodes.push(node.id);
    for (const edge of this.model.edges()) edges.push(edge.id);
    
    return {
      nodes,
      edges,
      clusters: [],
      clusterEdges: [],
      level: this.hierarchy?.maxLevel ?? 0,
    };
  }
}
```

### Files to Create
- `packages/core/src/clustering/LODManager.ts`

### Tests Required
- Unit: zoomToLevel maps correctly
- Unit: Small clusters expand to nodes
- Unit: Correct edges included

---

## Task 8.3: Cluster Rendering

### Overview
Render cluster super-nodes with distinct visual style.

### Dependencies
- Task 8.2

### Acceptance Criteria
- [ ] ClusterRenderer creates cluster visuals
- [ ] Shows cluster size inside
- [ ] Cluster edges rendered correctly
- [ ] Smooth LOD transitions

### Implementation Steps

```typescript
// packages/core/src/clustering/ClusterRenderer.ts
import * as PIXI from 'pixi.js';
import type { ClusterNode, ClusterEdge } from './types';

export interface ClusterStyle {
  color: number;
  borderColor: number;
  borderWidth: number;
  minRadius: number;
  maxRadius: number;
  showLabel: boolean;
  showSize: boolean;
  opacity: number;
}

const DEFAULT_CLUSTER_STYLE: ClusterStyle = {
  color: 0x6366f1,
  borderColor: 0x4338ca,
  borderWidth: 3,
  minRadius: 20,
  maxRadius: 80,
  showLabel: true,
  showSize: true,
  opacity: 0.8,
};

export class ClusterRenderer {
  private container: PIXI.Container;
  private clusterGraphics: Map<string, PIXI.Container> = new Map();
  private edgeGraphics: Map<string, PIXI.Graphics> = new Map();
  private style: ClusterStyle;
  
  constructor(parentContainer: PIXI.Container, style?: Partial<ClusterStyle>) {
    this.style = { ...DEFAULT_CLUSTER_STYLE, ...style };
    
    this.container = new PIXI.Container();
    this.container.label = 'clusters';
    parentContainer.addChild(this.container);
  }
  
  /**
   * Update visible clusters
   */
  update(clusters: ClusterNode[], edges: ClusterEdge[]): void {
    const existingIds = new Set(this.clusterGraphics.keys());
    const newIds = new Set(clusters.map((c) => c.id));
    
    // Remove clusters no longer visible
    for (const id of existingIds) {
      if (!newIds.has(id)) {
        this.removeCluster(id);
      }
    }
    
    // Add or update clusters
    for (const cluster of clusters) {
      if (existingIds.has(cluster.id)) {
        this.updateCluster(cluster);
      } else {
        this.addCluster(cluster);
      }
    }
    
    // Update edges
    this.updateEdges(edges);
  }
  
  /**
   * Animate transition between LOD levels
   */
  async transition(
    fromClusters: ClusterNode[],
    toClusters: ClusterNode[],
    duration: number
  ): Promise<void> {
    // Fade out old, fade in new
    // TODO: Implement smooth transition animation
    this.update(toClusters, []);
  }
  
  private addCluster(cluster: ClusterNode): void {
    const container = new PIXI.Container();
    container.position.set(cluster.x, cluster.y);
    
    // Calculate radius based on size
    const radius = this.calculateRadius(cluster.size);
    
    // Draw cluster circle
    const circle = new PIXI.Graphics();
    circle
      .circle(0, 0, radius)
      .fill({ color: this.style.color, alpha: this.style.opacity })
      .stroke({ color: this.style.borderColor, width: this.style.borderWidth });
    container.addChild(circle);
    
    // Size label
    if (this.style.showSize) {
      const label = new PIXI.BitmapText({
        text: cluster.size.toString(),
        style: {
          fontFamily: 'GraphonFont',
          fontSize: Math.min(24, radius * 0.8),
        },
      });
      label.anchor.set(0.5, 0.5);
      container.addChild(label);
    }
    
    this.container.addChild(container);
    this.clusterGraphics.set(cluster.id, container);
  }
  
  private updateCluster(cluster: ClusterNode): void {
    const container = this.clusterGraphics.get(cluster.id);
    if (!container) return;
    
    container.position.set(cluster.x, cluster.y);
  }
  
  private removeCluster(id: string): void {
    const container = this.clusterGraphics.get(id);
    if (container) {
      this.container.removeChild(container);
      container.destroy();
      this.clusterGraphics.delete(id);
    }
  }
  
  private updateEdges(edges: ClusterEdge[]): void {
    // Clear existing edge graphics
    for (const g of this.edgeGraphics.values()) {
      g.destroy();
    }
    this.edgeGraphics.clear();
    
    // Draw new edges
    for (const edge of edges) {
      const sourceContainer = this.clusterGraphics.get(edge.source);
      const targetContainer = this.clusterGraphics.get(edge.target);
      
      if (!sourceContainer || !targetContainer) continue;
      
      const g = new PIXI.Graphics();
      const thickness = Math.min(8, 1 + Math.log2(edge.weight));
      
      g.moveTo(sourceContainer.x, sourceContainer.y);
      g.lineTo(targetContainer.x, targetContainer.y);
      g.stroke({ color: 0x94a3b8, width: thickness, alpha: 0.5 });
      
      this.container.addChildAt(g, 0);  // Behind clusters
      this.edgeGraphics.set(`${edge.source}__${edge.target}`, g);
    }
  }
  
  private calculateRadius(size: number): number {
    // Logarithmic scale for radius
    const scale = Math.log2(size + 1) / Math.log2(1000);
    return this.style.minRadius + scale * (this.style.maxRadius - this.style.minRadius);
  }
  
  destroy(): void {
    for (const c of this.clusterGraphics.values()) c.destroy();
    for (const g of this.edgeGraphics.values()) g.destroy();
    this.container.destroy();
  }
}
```

### Files to Create
- `packages/core/src/clustering/ClusterRenderer.ts`

### Tests Required
- Unit: Radius calculation
- Visual: Cluster rendering

---

## Task 8.4: Integration & Demo

### Overview
Integrate LOD system with main renderer and create demo.

### Dependencies
- Task 8.3

### Acceptance Criteria
- [ ] Graphon accepts cluster hierarchy
- [ ] Auto-switches LOD on zoom
- [ ] Demo with 10k+ nodes using clusters

### Implementation Steps

```tsx
// Integration in Graphon class
// packages/core/src/Graphon.ts (additions)

import { LODManager, ClusterRenderer, ClusterBuilder } from './clustering';
import type { ClusterHierarchy, LODConfig } from './clustering/types';

// In Graphon class:
private lodManager: LODManager;
private clusterRenderer: ClusterRenderer | null = null;

/**
 * Enable cluster-based LOD
 */
enableClusterLOD(hierarchy: ClusterHierarchy, config?: Partial<LODConfig>): void {
  this.lodManager.setHierarchy(hierarchy);
  
  if (!this.clusterRenderer) {
    this.clusterRenderer = new ClusterRenderer(this.mainContainer);
  }
  
  this.updateLOD();
}

/**
 * Build hierarchy from node attributes
 */
buildClusterHierarchy(maxLevel: number = 3): ClusterHierarchy {
  return ClusterBuilder.buildFromAttributes(this.graph, maxLevel);
}

/**
 * Disable cluster LOD
 */
disableClusterLOD(): void {
  this.lodManager.clearHierarchy();
  this.clusterRenderer?.destroy();
  this.clusterRenderer = null;
  this.updateRender();
}

private updateLOD(): void {
  const renderSet = this.lodManager.updateZoom(this.viewport.zoom);
  
  // Update node/edge visibility
  this.nodeRenderer.setVisibleNodes(new Set(renderSet.nodes));
  this.edgeRenderer.setVisibleEdges(new Set(renderSet.edges));
  
  // Update cluster rendering
  this.clusterRenderer?.update(renderSet.clusters, renderSet.clusterEdges);
}
```

**Note:** Demo uses `GraphonProvider` + `useGraph()` pattern. NO graphology imports!

```tsx
// apps/demo/src/demos/ClusterLOD.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { GraphonProvider, Graphon, useGraph, useLOD } from '@graphon/react';  // NO graphology import!

// Hook to generate clustered graph using useGraph()
function useGenerateClusteredGraph(nodeCount: number, clusterCount: number) {
  const { addNode, addEdge, batch, clear } = useGraph();
  
  useEffect(() => {
    clear();  // Clear previous graph
    
    const nodesPerCluster = Math.floor(nodeCount / clusterCount);
    
    batch(() => {
      for (let c = 0; c < clusterCount; c++) {
        const clusterX = Math.cos((c / clusterCount) * Math.PI * 2) * 500;
        const clusterY = Math.sin((c / clusterCount) * Math.PI * 2) * 500;
        const superCluster = Math.floor(c / 4);
        
        for (let i = 0; i < nodesPerCluster; i++) {
          const nodeId = `n-${c}-${i}`;
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 100;
          
          addNode(
            nodeId, 
            clusterX + Math.cos(angle) * dist,
            clusterY + Math.sin(angle) * dist, 
            {
              label: `Node ${c}-${i}`,
              cluster_level_0: `super-${superCluster}`,
              cluster_level_1: `cluster-${c}`,
              cluster_level_2: nodeId,
            }
          );
      
      // Add intra-cluster edges
      if (i > 0) {
        const prevNode = `n-${c}-${i - 1}`;
        graph.addEdge(prevNode, nodeId);
      }
      
      // Random edge to same cluster
      if (i > 2 && Math.random() > 0.7) {
        const randIdx = Math.floor(Math.random() * i);
        graph.addEdge(`n-${c}-${randIdx}`, nodeId);
      }
    }
    
    // Inter-cluster edges
    if (c > 0) {
      const sourceNode = `n-${c}-0`;
      const targetCluster = Math.floor(Math.random() * c);
      const targetNode = `n-${targetCluster}-0`;
      graph.addEdge(sourceNode, targetNode);
    }
  }
  
  return graph;
}

export function ClusterLOD() {
  const [nodeCount, setNodeCount] = useState(10000);
  const [clusterCount, setClusterCount] = useState(50);
  const [lodEnabled, setLODEnabled] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [renderStats, setRenderStats] = useState({ nodes: 0, edges: 0, clusters: 0 });
  
  const [graph, setGraph] = useState<Graph | null>(null);
  const graphonRef = useRef<GraphonRef>(null);
  
  // Generate graph
  useEffect(() => {
    console.time('Generate graph');
    const g = generateClusteredGraph(nodeCount, clusterCount);
    console.timeEnd('Generate graph');
    setGraph(g);
  }, [nodeCount, clusterCount]);
  
  // Enable LOD when graph changes
  useEffect(() => {
    if (graphonRef.current && graph && lodEnabled) {
      const hierarchy = graphonRef.current.buildClusterHierarchy(2);
      graphonRef.current.enableClusterLOD(hierarchy);
    }
  }, [graph, lodEnabled]);
  
  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);
  
  const toggleLOD = useCallback(() => {
    if (!graphonRef.current) return;
    
    if (lodEnabled) {
      graphonRef.current.disableClusterLOD();
    } else {
      const hierarchy = graphonRef.current.buildClusterHierarchy(2);
      graphonRef.current.enableClusterLOD(hierarchy);
    }
    setLODEnabled(!lodEnabled);
  }, [lodEnabled]);
  
  if (!graph) return <div>Generating graph...</div>;
  
  return (
    <div className="demo-page">
      <header className="demo-header">
        <h1>Cluster-Based LOD</h1>
        <p>
          Visualize large graphs with automatic level-of-detail.
          Zoom out to see clusters, zoom in to see individual nodes.
        </p>
      </header>
      
      <div className="demo-controls">
        <div className="control-group">
          <label>Nodes:</label>
          <select value={nodeCount} onChange={(e) => setNodeCount(Number(e.target.value))}>
            <option value={1000}>1,000</option>
            <option value={10000}>10,000</option>
            <option value={50000}>50,000</option>
            <option value={100000}>100,000</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>Clusters:</label>
          <select value={clusterCount} onChange={(e) => setClusterCount(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
        
        <button onClick={toggleLOD}>
          {lodEnabled ? 'Disable' : 'Enable'} LOD
        </button>
      </div>
      
      <div className="demo-info">
        <div className="stat">
          <span className="stat-label">Zoom:</span>
          <span className="stat-value">{(currentZoom * 100).toFixed(0)}%</span>
        </div>
        <div className="stat">
          <span className="stat-label">Visible Nodes:</span>
          <span className="stat-value">{renderStats.nodes.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Visible Clusters:</span>
          <span className="stat-value">{renderStats.clusters}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total Nodes:</span>
          <span className="stat-value">{graph.order.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="demo-canvas">
        <Graphon
          ref={graphonRef}
          graph={graph}
          nodeStyle={{ size: 5, color: '#6366f1' }}
          edgeStyle={{ width: 1, color: '#94a3b8' }}
          onZoomChange={handleZoomChange}
          onReady={() => graphonRef.current?.fitToView()}
        />
      </div>
      
      <div className="demo-description">
        <h3>How it works</h3>
        <ul>
          <li><strong>Zoom out</strong> - Individual nodes are grouped into cluster super-nodes</li>
          <li><strong>Zoom in</strong> - Clusters expand to show individual nodes</li>
          <li><strong>Hierarchy</strong> - Multiple LOD levels for smooth transitions</li>
          <li><strong>Performance</strong> - Only visible elements are rendered</li>
        </ul>
        
        <h3>Cluster Assignment</h3>
        <p>
          Nodes have <code>cluster_level_N</code> attributes that define the hierarchy.
          Pre-compute these on your backend using Louvain or similar algorithms.
        </p>
      </div>
    </div>
  );
}
```

### Files to Create/Modify
- `packages/core/src/Graphon.ts` (add LOD integration)
- `packages/core/src/clustering/index.ts` (exports)
- `apps/demo/src/demos/ClusterLOD.tsx`
- `apps/demo/src/App.tsx` (add route)

### Tests Required
- Integration: LOD level changes with zoom
- Performance: 100k nodes with LOD enabled
- Visual: Cluster to node transitions

---

## Task 8.5: Performance Optimization

### Overview
Optimize LOD system for 100k+ nodes.

### Dependencies
- Task 8.4

### Acceptance Criteria
- [ ] 60fps with 100k nodes (LOD enabled)
- [ ] Memory-efficient cluster storage
- [ ] Incremental updates on graph changes

### Implementation Steps

**Note:** OptimizedLODManager works with `GraphModel` interface, NOT graphology directly.

```typescript
// packages/core/src/clustering/OptimizedLODManager.ts
import type { GraphModel } from '../model/GraphModel';  // Uses GraphModel, NOT Graph
import type { ClusterHierarchy, ClusterNode, LODRenderSet } from './types';

/**
 * Memory-optimized LOD manager using typed arrays
 */
export class OptimizedLODManager {
  // Use typed arrays for large node sets
  private nodePositions: Float32Array;
  private nodeClusterLevels: Uint8Array;
  private nodeIdToIndex: Map<string, number>;
  
  constructor(model: GraphModel, hierarchy: ClusterHierarchy) {
    const nodeCount = model.nodeCount;
    
    this.nodePositions = new Float32Array(nodeCount * 2);
    this.nodeClusterLevels = new Uint8Array(nodeCount * hierarchy.maxLevel);
    this.nodeIdToIndex = new Map();
    
    let idx = 0;
    // Use GraphModel iterator
    for (const node of model.nodes()) {
      this.nodeIdToIndex.set(node.id, idx);
      this.nodePositions[idx * 2] = node.x;
      this.nodePositions[idx * 2 + 1] = node.y;
      idx++;
    }
  }
  
  /**
   * Fast visibility calculation using typed arrays
   */
  getVisibleInViewport(
    viewportBounds: { minX: number; maxX: number; minY: number; maxY: number },
    lodLevel: number
  ): Uint32Array {
    // Return indices of visible nodes
    const visible: number[] = [];
    const nodeCount = this.nodePositions.length / 2;
    
    for (let i = 0; i < nodeCount; i++) {
      const x = this.nodePositions[i * 2];
      const y = this.nodePositions[i * 2 + 1];
      
      if (x >= viewportBounds.minX && x <= viewportBounds.maxX &&
          y >= viewportBounds.minY && y <= viewportBounds.maxY) {
        visible.push(i);
      }
    }
    
    return new Uint32Array(visible);
  }
}
```

### Files to Create
- `packages/core/src/clustering/OptimizedLODManager.ts`

### Tests Required
- Benchmark: Memory usage with 100k nodes
- Benchmark: Visibility calculation time

---

## Phase 8 Checklist

- [ ] Cluster data structures defined
- [ ] ClusterBuilder creates hierarchy
- [ ] LODManager tracks zoom levels
- [ ] ClusterRenderer draws clusters
- [ ] Smooth LOD transitions
- [ ] 100k node demo works
- [ ] Performance benchmarks pass
- [ ] All tests pass

**Estimated time:** 4-5 days
