# Phase 14: API Redesign — Rich Developer Experience

## Overview

This phase transforms Graphon from a basic graph renderer into a professional-grade, feature-rich graph visualization library comparable to ReGraph, KeyLines, and Cytoscape.js.

### Core Principles

1. **Physics is an implementation detail** — never exposed to the API
2. **State-driven** — declarative, React-idiomatic controlled components
3. **Rich visuals** — comprehensive node/edge styling options
4. **Developer-friendly** — intuitive API with sensible defaults

---

## Table of Contents

1. [Node Styling](#1-node-styling)
2. [Edge Styling](#2-edge-styling)
3. [State-Aware Style Functions](#3-state-aware-style-functions)
4. [Controlled State](#4-controlled-state)
5. [Interactions](#5-interactions)
6. [Layout System](#6-layout-system)
7. [Combos & Clustering](#7-combos--clustering)
8. [Dynamic Data & Expansion](#8-dynamic-data--expansion)
9. [Annotations](#9-annotations)
10. [Events](#10-events)
11. [Ref API](#11-ref-api)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Node Styling

### Shape System

```typescript
type NodeShape =
  // Basic
  | 'circle' | 'ellipse'
  | 'rectangle' | 'round-rectangle'
  // Polygons
  | 'triangle' | 'round-triangle'
  | 'diamond' | 'round-diamond'
  | 'pentagon' | 'hexagon' | 'octagon'
  // Special
  | 'star' | 'tag' | 'vee'
  | 'polygon';  // custom via polygonPoints
```

### Complete NodeStyle Interface

```typescript
interface NodeStyle {
  // === Shape ===
  shape: NodeShape;
  polygonPoints?: [number, number][];  // for shape: 'polygon'
  
  // === Size ===
  size: number | { width: number; height: number };
  
  // === Colors ===
  color: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  
  // === Gradients ===
  gradient?: {
    type: 'linear' | 'radial';
    stops: Array<{ offset: number; color: string }>;
    angle?: number;  // for linear
  };
  
  // === Images & Icons ===
  image?: {
    src: string;
    fit?: 'contain' | 'cover' | 'none';
    clip?: boolean;
    opacity?: number;
  };
  icon?: {
    content: string;  // Unicode or font icon
    fontFamily?: string;
    color?: string;
    size?: number;
  };
  
  // === Decorators (badges, glyphs) ===
  decorators?: Array<{
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    type: 'badge' | 'dot' | 'icon';
    content?: string;
    color?: string;
    size?: number;
  }>;
  
  // === Pie/Donut Charts ===
  pie?: {
    slices: Array<{ value: number; color: string }>;
    innerRadius?: number;  // 0 = pie, >0 = donut
  };
  
  // === Label ===
  label?: {
    text: string;
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    background?: { color: string; padding?: number; borderRadius?: number };
    maxWidth?: number;
    visible?: boolean | 'auto';  // 'auto' = LOD-based
  };
  
  // === State ===
  opacity?: number;
  cursor?: string;
  zIndex?: number;
}
```

---

## 2. Edge Styling

### Curve Types

```typescript
type EdgeCurveStyle =
  | 'straight'           // direct line
  | 'bezier'             // automatic bundled curves
  | 'unbundled-bezier'   // manual control points
  | 'segments'           // polyline
  | 'taxi'               // right-angle (hierarchical)
  | 'arc';               // simple arc
```

### Complete EdgeStyle Interface

```typescript
interface EdgeStyle {
  // === Curve ===
  curveStyle: EdgeCurveStyle;
  curvature?: number;
  controlPoints?: Array<{ x: number; y: number }>;
  taxiDirection?: 'horizontal' | 'vertical' | 'auto';
  taxiTurn?: number;
  cornerRadius?: number;
  
  // === Line ===
  width: number;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted';
  dashPattern?: number[];
  
  // === Gradients ===
  gradient?: {
    type: 'linear' | 'radial';
    stops: Array<{ offset: number; color: string }>;
  };
  
  // === Animated Flow ===
  flow?: {
    enabled: boolean;
    color?: string;
    speed?: number;
    width?: number;
    gap?: number;
    direction?: 'forward' | 'reverse';
  };
  
  // === Arrows ===
  sourceArrow?: ArrowStyle;
  targetArrow?: ArrowStyle;
  midArrow?: ArrowStyle;
  
  // === Label ===
  label?: {
    text: string;
    position?: 'center' | 'source' | 'target';
    offset?: number;
    rotation?: 'auto' | 'none' | number;
    color?: string;
    fontSize?: number;
    background?: { color: string; padding?: number };
  };
  
  // === State ===
  opacity?: number;
  zIndex?: number;
}

interface ArrowStyle {
  shape: 
    | 'triangle' | 'triangle-tee' | 'triangle-cross'
    | 'vee' | 'chevron'
    | 'tee' | 'bar'
    | 'circle' | 'diamond' | 'square'
    | 'none';
  size?: number;
  color?: string;
  fill?: 'filled' | 'hollow';
}
```

---

## 3. State-Aware Style Functions

Styles can be static objects or functions that receive element state:

```typescript
interface NodeState {
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  isFocused: boolean;
  isNeighborOfSelected: boolean;
  isNeighborOfHovered: boolean;
  isExpanded: boolean;        // for clusters
  isCollapsed: boolean;       // for clusters
  hasHiddenChildren: boolean; // for clusters
}

interface EdgeState {
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  sourceIsSelected: boolean;
  targetIsSelected: boolean;
  sourceIsHovered: boolean;
  targetIsHovered: boolean;
}

// Usage
nodeStyle={(node, state) => ({
  color: state.isSelected ? '#2563eb' : 
         state.isDimmed ? '#e5e7eb' : '#6b7280',
  borderWidth: state.isSelected ? 3 : 1,
})}
```

---

## 4. Controlled State

### Selection

```typescript
interface Selection {
  nodes: string[];
  edges: string[];
}

<Graphon
  selection={selection}
  onSelectionChange={(newSelection) => setSelection(newSelection)}
  selectionMode="multiple"  // 'single' | 'multiple' | 'none'
/>
```

### Hover

```typescript
interface HoveredItem {
  type: 'node' | 'edge' | 'cluster';
  id: string;
}

<Graphon
  hovered={hovered}
  onHoverChange={(item) => setHovered(item)}
/>
```

### Viewport

```typescript
interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

<Graphon
  viewport={viewport}
  onViewportChange={(vp) => setViewport(vp)}
/>
```

### Highlight (separate from selection)

```typescript
<Graphon
  highlighted={{
    nodes: ['node1', 'node2'],
    edges: ['edge1'],
  }}
/>
```

---

## 5. Interactions

```typescript
interface Interactions {
  // === Pan & Zoom ===
  pan?: boolean | {
    enabled: boolean;
    button?: 'left' | 'middle' | 'right';
    modifierKey?: 'ctrl' | 'shift' | 'alt';
  };
  zoom?: boolean | {
    enabled: boolean;
    min?: number;
    max?: number;
    sensitivity?: number;
  };
  
  // === Selection ===
  select?: boolean | {
    enabled: boolean;
    nodes?: boolean;
    edges?: boolean;
    boxSelect?: boolean;
    boxSelectKey?: 'shift' | 'ctrl' | 'alt';
  };
  
  // === Hover ===
  hover?: boolean | {
    enabled: boolean;
    delay?: number;
    highlightNeighbors?: boolean;
    dimNonNeighbors?: boolean;
    dimOpacity?: number;
  };
  
  // === Dragging ===
  drag?: boolean | {
    enabled: boolean;
    nodes?: boolean;
    lockAxis?: 'x' | 'y' | null;
  };
  
  // === Context Menu ===
  contextMenu?: boolean;
  
  // === Cluster Interaction ===
  cluster?: {
    expandOnDoubleClick?: boolean;
    collapseOnDoubleClick?: boolean;
  };
}
```

---

## 6. Layout System

### Layout Types

```typescript
type LayoutType =
  | 'none'           // use node.x, node.y directly
  | 'force'          // force-directed (default)
  | 'circular'       // nodes in a circle
  | 'grid'           // regular grid
  | 'hierarchical'   // dagre-style tree
  | 'radial'         // radial tree
  | 'concentric';    // concentric circles by metric
```

### Layout Options

```typescript
interface LayoutOptions {
  // === Force Layout ===
  iterations?: number;
  strength?: number;
  linkDistance?: number;
  chargeStrength?: number;
  
  // === Hierarchical Layout ===
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  levelSeparation?: number;
  nodeSeparation?: number;
  
  // === Circular/Radial ===
  startAngle?: number;
  endAngle?: number;
  radius?: number;
  
  // === Concentric ===
  concentricMetric?: (node: Node) => number;
  levelWidth?: number;
  
  // === Common ===
  fit?: boolean;
  padding?: number;
  animate?: boolean;
  animationDuration?: number;
  
  // === Cluster Layout ===
  clusterPadding?: number;        // space around cluster contents
  interClusterSpacing?: number;   // space between clusters
}
```

---

## 7. Combos & Clustering

### Overview

Combos and clusters allow grouping nodes together. There are two modes:

1. **Manual Combos** — explicitly defined parent-child relationships
2. **Auto-Clustering** — automatic grouping by community ID or algorithm

### Data Model

```typescript
interface Node {
  id: string;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
  
  // === Clustering ===
  parent?: string;       // ID of parent combo (manual)
  communityId?: string;  // for auto-clustering
}

interface Cluster {
  id: string;
  label?: string;
  parent?: string;       // nested clusters
  nodeIds?: string[];    // computed for auto-clusters
}
```

### Props

```typescript
interface GraphonProps {
  nodes: Node[];
  edges: Edge[];
  
  // === Manual Combos ===
  combos?: Cluster[];
  
  // === Auto-Clustering ===
  clustering?: {
    enabled: boolean;
    groupBy: 'communityId' | ((node: Node) => string | null);
    
    // Initial state
    defaultExpanded?: boolean;
    expandedClusters?: string[];
    
    // Visual
    minSize?: number;      // minimum cluster size to show
    showCount?: boolean;   // show node count badge
  };
  
  // === Cluster State (Controlled) ===
  expandedClusters?: string[];
  onExpandedClustersChange?: (expanded: string[]) => void;
  
  // === Cluster Styling ===
  clusterStyle?: ClusterStyle | ((cluster: Cluster, state: ClusterState) => ClusterStyle);
}

interface ClusterStyle {
  shape: 'rectangle' | 'round-rectangle' | 'ellipse' | 'circle';
  padding: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  
  label?: {
    text?: string;       // defaults to cluster ID
    position?: 'top' | 'center' | 'bottom';
    color?: string;
    fontSize?: number;
  };
  
  // Badge showing node count
  countBadge?: {
    visible: boolean;
    position?: 'top-right' | 'top-left';
    color?: string;
    textColor?: string;
  };
}

interface ClusterState {
  isExpanded: boolean;
  isCollapsed: boolean;
  isSelected: boolean;
  isHovered: boolean;
  nodeCount: number;
  edgeCount: number;
}
```

### Cluster Behavior

```typescript
// Collapsed cluster behavior:
// - All child nodes are hidden
// - Cluster node appears at centroid of children
// - Edges to/from children connect to cluster node instead
// - Size based on child count or configured metric

// Double-click to expand:
<Graphon
  interactions={{
    cluster: {
      expandOnDoubleClick: true,
      collapseOnDoubleClick: true,
    },
  }}
  onClusterExpand={(clusterId) => {
    setExpandedClusters([...expandedClusters, clusterId]);
  }}
  onClusterCollapse={(clusterId) => {
    setExpandedClusters(expandedClusters.filter(id => id !== clusterId));
  }}
/>
```

### Example: Community-Based Clustering

```tsx
const nodes = [
  { id: 'a', communityId: 'group1', data: { label: 'Node A' } },
  { id: 'b', communityId: 'group1', data: { label: 'Node B' } },
  { id: 'c', communityId: 'group2', data: { label: 'Node C' } },
  { id: 'd', communityId: 'group2', data: { label: 'Node D' } },
];

<Graphon
  nodes={nodes}
  edges={edges}
  
  clustering={{
    enabled: true,
    groupBy: 'communityId',
    defaultExpanded: false,
    showCount: true,
  }}
  
  clusterStyle={(cluster, state) => ({
    shape: 'round-rectangle',
    padding: 20,
    color: state.isExpanded ? 'transparent' : '#f3f4f6',
    borderColor: state.isHovered ? '#3b82f6' : '#d1d5db',
    borderWidth: 2,
    borderStyle: state.isExpanded ? 'dashed' : 'solid',
    label: {
      text: `Community ${cluster.id}`,
      position: 'top',
    },
    countBadge: {
      visible: !state.isExpanded,
      position: 'top-right',
      color: '#3b82f6',
      textColor: 'white',
    },
  })}
/>
```

---

## 8. Dynamic Data & Expansion

### Overview

Support for dynamically loading graph data, enabling "expand on demand" patterns where users can right-click or double-click a node to fetch and display its connections.

### Props

```typescript
interface GraphonProps {
  // === Data Loading ===
  onExpandNode?: (nodeId: string, event: ExpandEvent) => Promise<ExpandResult> | void;
  onCollapseNode?: (nodeId: string) => void;
  
  // === Loading State ===
  loadingNodes?: string[];  // nodes currently loading
  
  // === Expandable Indicator ===
  expandableNodes?: string[];  // nodes that can be expanded
  // Or derive from data:
  isNodeExpandable?: (node: Node) => boolean;
}

interface ExpandEvent {
  nodeId: string;
  trigger: 'double-click' | 'context-menu' | 'api';
  position: { x: number; y: number };
}

interface ExpandResult {
  nodes: Node[];
  edges: Edge[];
}
```

### Expand Pattern

```tsx
function GraphWithExpand() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [loading, setLoading] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  
  const handleExpand = async (nodeId: string) => {
    if (expanded.has(nodeId)) return;
    
    setLoading(prev => [...prev, nodeId]);
    
    try {
      // Fetch connected nodes from API
      const result = await api.getConnections(nodeId);
      
      // Add new nodes and edges
      setNodes(prev => [...prev, ...result.nodes]);
      setEdges(prev => [...prev, ...result.edges]);
      setExpanded(prev => new Set([...prev, nodeId]));
    } finally {
      setLoading(prev => prev.filter(id => id !== nodeId));
    }
  };
  
  return (
    <Graphon
      nodes={nodes}
      edges={edges}
      
      loadingNodes={loading}
      isNodeExpandable={(node) => !expanded.has(node.id) && node.data?.hasConnections}
      
      onExpandNode={handleExpand}
      
      // Visual indicator for expandable nodes
      nodeStyle={(node, state) => ({
        ...baseStyle,
        // Plus icon decorator for expandable nodes
        decorators: state.isExpandable && !expanded.has(node.id) ? [{
          position: 'bottom-right',
          type: 'icon',
          content: '+',
          color: '#3b82f6',
        }] : undefined,
        // Spinner for loading
        ...(loading.includes(node.id) && {
          decorators: [{
            position: 'center',
            type: 'spinner',
          }],
        }),
      })}
      
      // Context menu for expansion
      onContextMenu={(event) => {
        if (event.target.type === 'node') {
          showContextMenu({
            items: [
              { label: 'Expand connections', onClick: () => handleExpand(event.target.id) },
              { label: 'Collapse', onClick: () => handleCollapse(event.target.id) },
            ],
          });
        }
      }}
    />
  );
}
```

### Collapse Pattern

```typescript
const handleCollapse = (nodeId: string) => {
  // Remove all nodes that were added when expanding this node
  const nodesToRemove = expandedNodesMap.get(nodeId) || [];
  
  setNodes(prev => prev.filter(n => !nodesToRemove.includes(n.id)));
  setEdges(prev => prev.filter(e => 
    !nodesToRemove.includes(e.source) && !nodesToRemove.includes(e.target)
  ));
  setExpanded(prev => {
    const next = new Set(prev);
    next.delete(nodeId);
    return next;
  });
};
```

### Data Update Methods (via Ref)

```typescript
interface GraphonRef {
  // === Data Manipulation ===
  addNodes(nodes: Node[]): void;
  addEdges(edges: Edge[]): void;
  removeNodes(nodeIds: string[]): void;
  removeEdges(edgeIds: string[]): void;
  updateNode(nodeId: string, updates: Partial<Node>): void;
  updateEdge(edgeId: string, updates: Partial<Edge>): void;
  
  // === Batch Updates ===
  batch(callback: () => void): void;  // batch multiple updates
  
  // === Animation for New Data ===
  animateIn(nodeIds: string[], options?: AnimateOptions): void;
  animateOut(nodeIds: string[], options?: AnimateOptions): void;
}
```

---

## 9. Annotations

```typescript
interface Annotation {
  id: string;
  type: 'text' | 'shape' | 'arrow' | 'image';
  position: { x: number; y: number };
  
  // For text
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  
  // For shape
  shape?: 'rectangle' | 'ellipse' | 'line';
  size?: { width: number; height: number };
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  
  // For arrow
  points?: Array<{ x: number; y: number }>;
  arrowHead?: ArrowStyle;
  
  // Common
  rotation?: number;
  opacity?: number;
  
  // Anchoring to nodes
  anchor?: {
    nodeId: string;
    offset?: { x: number; y: number };
  };
}

<Graphon
  annotations={[
    {
      id: 'label1',
      type: 'text',
      text: 'Important cluster',
      position: { x: 100, y: 100 },
      fontSize: 16,
      color: '#374151',
    },
    {
      id: 'highlight',
      type: 'shape',
      shape: 'ellipse',
      position: { x: 200, y: 200 },
      size: { width: 150, height: 100 },
      fill: 'rgba(59, 130, 246, 0.1)',
      stroke: '#3b82f6',
    },
  ]}
/>
```

---

## 10. Events

```typescript
interface GraphonProps {
  // === Click ===
  onClick?: (event: GraphonClickEvent) => void;
  onDoubleClick?: (event: GraphonClickEvent) => void;
  onContextMenu?: (event: GraphonContextMenuEvent) => void;
  
  // === Drag ===
  onDragStart?: (event: GraphonDragEvent) => void;
  onDrag?: (event: GraphonDragEvent) => void;
  onDragEnd?: (event: GraphonDragEvent) => void;
  
  // === Hover ===
  onNodeHover?: (nodeId: string | null, event: GraphonHoverEvent) => void;
  onEdgeHover?: (edgeId: string | null, event: GraphonHoverEvent) => void;
  
  // === Selection ===
  onSelect?: (selection: Selection) => void;
  onDeselect?: (deselected: Selection) => void;
  
  // === Cluster ===
  onClusterExpand?: (clusterId: string) => void;
  onClusterCollapse?: (clusterId: string) => void;
  
  // === Viewport ===
  onZoom?: (zoom: number, event: GraphonZoomEvent) => void;
  onPan?: (position: Position, event: GraphonPanEvent) => void;
  
  // === Layout ===
  onLayoutStart?: () => void;
  onLayoutProgress?: (progress: number) => void;
  onLayoutComplete?: (positions: Map<string, Position>) => void;
  
  // === Data ===
  onExpandNode?: (nodeId: string, event: ExpandEvent) => Promise<ExpandResult> | void;
}

interface GraphonClickEvent {
  target: {
    type: 'node' | 'edge' | 'cluster' | 'canvas';
    id?: string;
  };
  position: {
    graph: { x: number; y: number };
    screen: { x: number; y: number };
  };
  originalEvent: MouseEvent;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
}
```

---

## 11. Ref API

```typescript
interface GraphonRef {
  // === Viewport ===
  fitToView(options?: { padding?: number; animate?: boolean }): void;
  zoomTo(level: number, options?: { animate?: boolean }): void;
  panTo(position: Position, options?: { animate?: boolean }): void;
  centerOn(nodeId: string, options?: { zoom?: number; animate?: boolean }): void;
  
  // === Export ===
  toImage(options?: { format: 'png' | 'svg'; scale?: number }): Promise<Blob>;
  toJSON(): GraphData;
  
  // === Layout ===
  runLayout(options?: LayoutOptions): Promise<void>;
  stopLayout(): void;
  
  // === Data Manipulation ===
  addNodes(nodes: Node[]): void;
  addEdges(edges: Edge[]): void;
  removeNodes(nodeIds: string[]): void;
  removeEdges(edgeIds: string[]): void;
  
  // === Clusters ===
  expandCluster(clusterId: string): void;
  collapseCluster(clusterId: string): void;
  expandAll(): void;
  collapseAll(): void;
  
  // === Queries ===
  getNodePosition(nodeId: string): Position | null;
  getNodeAtPoint(point: Position): string | null;
  getEdgeAtPoint(point: Position): string | null;
  getVisibleNodes(): string[];
  getBoundingBox(): BoundingBox;
  
  // === Graph Metrics ===
  getNeighbors(nodeId: string): { nodes: string[]; edges: string[] };
  getShortestPath(sourceId: string, targetId: string): string[];
  getConnectedComponents(): string[][];
  getClusters(): Map<string, string[]>;
}
```

---

## 12. Implementation Phases

### Phase 14.1: Core API Restructure
**Priority: Critical | Effort: Medium**

- [ ] Remove physics worker from public API
- [ ] Implement controlled selection state
- [ ] Implement controlled hover state  
- [ ] Implement controlled viewport state
- [ ] State-aware style functions with `NodeState`/`EdgeState`
- [ ] Per-node/edge style overrides via `nodeStyles`/`edgeStyles`

### Phase 14.2: Node Visual Enhancements
**Priority: High | Effort: High**

- [ ] Additional shapes (15+ shapes)
- [ ] Gradient fills (linear, radial)
- [ ] Image nodes
- [ ] Icon support (font icons)
- [ ] Decorators (badges, dots, glyphs)
- [ ] Pie/donut charts on nodes
- [ ] Rich label system (positioning, background, rotation)

### Phase 14.3: Edge Visual Enhancements
**Priority: High | Effort: High**

- [ ] Curve styles (bezier, taxi, segments, arc)
- [ ] Arrow system (source, target, mid arrows)
- [ ] Arrow shapes (12+ shapes)
- [ ] Dash styles (solid, dashed, dotted, custom)
- [ ] Gradient edges
- [ ] Animated flow
- [ ] Edge labels

### Phase 14.4: Clustering & Combos
**Priority: High | Effort: High**

- [ ] Manual combo support (parent-child)
- [ ] Auto-clustering by `communityId`
- [ ] Cluster expand/collapse
- [ ] Double-click to expand
- [ ] Cluster styling
- [ ] Edge bundling to clusters
- [ ] Nested clusters

### Phase 14.5: Dynamic Data & Expansion
**Priority: High | Effort: Medium**

- [ ] `onExpandNode` callback
- [ ] Loading state indicators
- [ ] Expandable node indicators
- [ ] Ref methods: `addNodes`, `addEdges`, `removeNodes`, `removeEdges`
- [ ] Animate in/out for new data
- [ ] Context menu integration

### Phase 14.6: Layout System
**Priority: Medium | Effort: High**

- [ ] Layout type selection
- [ ] Force layout options
- [ ] Hierarchical layout
- [ ] Circular layout
- [ ] Grid layout
- [ ] Radial layout
- [ ] Concentric layout
- [ ] Layout animations
- [ ] Per-cluster layouts

### Phase 14.7: Interactions
**Priority: Medium | Effort: Medium**

- [ ] Configurable pan/zoom
- [ ] Box selection
- [ ] Configurable hover behavior
- [ ] Node dragging with constraints
- [ ] Keyboard navigation
- [ ] Context menu events

### Phase 14.8: Advanced Features
**Priority: Low | Effort: Medium**

- [ ] Annotations
- [ ] Export to image (PNG/SVG)
- [ ] Graph metrics helpers
- [ ] Level-of-detail rendering
- [ ] Mini-map

---

## Complete Example

```tsx
function NetworkExplorer() {
  // === State ===
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selection, setSelection] = useState<Selection>({ nodes: [], edges: [] });
  const [expandedClusters, setExpandedClusters] = useState<string[]>([]);
  const [loadingNodes, setLoadingNodes] = useState<string[]>([]);
  
  const graphRef = useRef<GraphonRef>(null);
  
  // === Handlers ===
  const handleExpandNode = async (nodeId: string) => {
    setLoadingNodes(prev => [...prev, nodeId]);
    try {
      const { nodes: newNodes, edges: newEdges } = await api.fetchConnections(nodeId);
      setNodes(prev => [...prev, ...newNodes]);
      setEdges(prev => [...prev, ...newEdges]);
    } finally {
      setLoadingNodes(prev => prev.filter(id => id !== nodeId));
    }
  };
  
  // === Styles ===
  const nodeStyle = useCallback((node: Node, state: NodeState): NodeStyle => ({
    shape: node.data?.type === 'hub' ? 'hexagon' : 'circle',
    size: 20 + (node.data?.importance ?? 0) * 5,
    
    color: state.isSelected ? '#2563eb' :
           state.isHovered ? '#3b82f6' :
           state.isDimmed ? '#e5e7eb' :
           node.data?.color ?? '#6b7280',
    
    borderWidth: state.isSelected ? 3 : 1,
    borderColor: state.isSelected ? '#1d4ed8' : 'transparent',
    
    decorators: [
      ...(node.data?.alerts ? [{
        position: 'top-right' as const,
        type: 'badge' as const,
        content: String(node.data.alerts),
        color: '#ef4444',
      }] : []),
      ...(loadingNodes.includes(node.id) ? [{
        position: 'center' as const,
        type: 'spinner' as const,
      }] : []),
    ],
    
    label: {
      text: node.data?.label ?? node.id,
      position: 'bottom',
      visible: state.isHovered || state.isSelected,
    },
  }), [loadingNodes]);
  
  const edgeStyle = useCallback((edge: Edge, state: EdgeState): EdgeStyle => ({
    curveStyle: 'bezier',
    width: state.isHighlighted ? 3 : 1.5,
    color: state.isDimmed ? '#e5e7eb' : '#9ca3af',
    
    targetArrow: edge.data?.directed ? {
      shape: 'triangle',
      size: 8,
    } : undefined,
    
    flow: edge.data?.active ? {
      enabled: true,
      speed: 50,
      color: '#3b82f6',
    } : undefined,
  }), []);
  
  const clusterStyle = useCallback((cluster: Cluster, state: ClusterState): ClusterStyle => ({
    shape: 'round-rectangle',
    padding: 20,
    color: state.isExpanded ? 'transparent' : '#f3f4f6',
    borderColor: state.isHovered ? '#3b82f6' : '#d1d5db',
    borderWidth: 2,
    borderStyle: state.isExpanded ? 'dashed' : 'solid',
    
    label: {
      text: cluster.label ?? `Group ${cluster.id}`,
      position: 'top',
    },
    
    countBadge: {
      visible: !state.isExpanded,
      position: 'top-right',
      color: '#3b82f6',
      textColor: 'white',
    },
  }), []);
  
  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        onFitView={() => graphRef.current?.fitToView({ animate: true })}
        onExpandAll={() => graphRef.current?.expandAll()}
        onCollapseAll={() => graphRef.current?.collapseAll()}
      />
      
      <Graphon
        ref={graphRef}
        
        // === Data ===
        nodes={nodes}
        edges={edges}
        
        // === Styling ===
        nodeStyle={nodeStyle}
        edgeStyle={edgeStyle}
        clusterStyle={clusterStyle}
        
        // === Clustering ===
        clustering={{
          enabled: true,
          groupBy: 'communityId',
          showCount: true,
        }}
        expandedClusters={expandedClusters}
        onExpandedClustersChange={setExpandedClusters}
        
        // === Selection ===
        selection={selection}
        onSelectionChange={setSelection}
        selectionMode="multiple"
        
        // === Dynamic Data ===
        loadingNodes={loadingNodes}
        isNodeExpandable={(node) => node.data?.hasMore && !node.data?.expanded}
        
        // === Interactions ===
        interactions={{
          hover: {
            highlightNeighbors: true,
            dimNonNeighbors: true,
            dimOpacity: 0.15,
          },
          select: { boxSelect: true },
          drag: { nodes: true },
          cluster: {
            expandOnDoubleClick: true,
          },
        }}
        
        // === Layout ===
        layout="force"
        layoutOptions={{
          animate: true,
          clusterPadding: 30,
        }}
        
        // === Events ===
        onContextMenu={(event) => {
          if (event.target.type === 'node') {
            showMenu([
              { label: 'Expand connections', onClick: () => handleExpandNode(event.target.id!) },
              { label: 'View details', onClick: () => openDetails(event.target.id!) },
            ]);
          }
        }}
        
        onDoubleClick={(event) => {
          if (event.target.type === 'node') {
            handleExpandNode(event.target.id!);
          }
        }}
      />
    </div>
  );
}
```

---

## Migration Guide

### From Current API

```typescript
// Before
<Graphon
  nodes={nodes}
  edges={edges}
  nodeStyleFn={(node) => ({ color: node.data.color })}
  highlightNeighborsOnHover={true}
/>

// After
<Graphon
  nodes={nodes}
  edges={edges}
  nodeStyle={(node, state) => ({
    color: state.isDimmed ? '#e5e7eb' : node.data.color,
    shape: 'circle',
    size: 20,
  })}
  interactions={{
    hover: {
      highlightNeighbors: true,
      dimNonNeighbors: true,
    },
  }}
/>
```

---

## Appendix: Feature Comparison

| Feature | Current | Phase 14 |
|---------|---------|----------|
| Node shapes | 3 | 20+ |
| Edge curves | straight | 6 types |
| Arrows | ❌ | ✅ Full system |
| Gradients | ❌ | ✅ Nodes & edges |
| Flow animation | ❌ | ✅ |
| Icons | ❌ | ✅ |
| Images | ❌ | ✅ |
| Decorators | ❌ | ✅ |
| Pie charts | ❌ | ✅ |
| Rich labels | Basic | ✅ Full |
| Clustering | ❌ | ✅ Auto & manual |
| Dynamic data | ❌ | ✅ Expand/collapse |
| Controlled state | Partial | ✅ Full |
| State-aware styles | ❌ | ✅ |
| Annotations | ❌ | ✅ |
| Export | ❌ | ✅ PNG/SVG |
| Physics exposed | ✅ | ❌ (internal) |
