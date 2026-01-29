# Phase 11: Visual Features

## Overview

Implement advanced visual features: dynamic node/edge sizing, visibility control, cluster visualization, and highlight effects for hover/selection states.

---

## Task 11.1: Node/Edge Sizing

### Overview
Allow dynamic sizing of nodes and edges through style functions.

### Dependencies
- Phase 9 complete

### Acceptance Criteria
- [x] `radius` property in NodeStyleFn controls node size
- [ ] Per-node radius support (not just grouped by style key)
- [ ] `width` property in EdgeStyleFn controls edge thickness
- [ ] Size changes animate smoothly

### Implementation

Extend `ResolvedNodeVisuals` to include `radius` (already present).
Add `EdgeStyleFn` type for edge styling.
Update renderer to render each node/edge at its specified size.

---

## Task 11.2: Node/Edge Visibility

### Overview
Allow hiding nodes and edges via style functions.

### Dependencies
- Task 11.1

### Acceptance Criteria
- [ ] `visible` property in NodeStyleFn hides nodes when false
- [ ] `visible` property in EdgeStyleFn hides edges when false
- [ ] Hidden edges connected to hidden nodes auto-hide
- [ ] Visibility changes can animate (fade in/out)

### Implementation

Add `visible?: boolean` to `ResolvedNodeVisuals` and `ResolvedEdgeVisuals`.
Filter out invisible elements before rendering.

---

## Task 11.3: Hover/Selection Highlighting

### Overview
Highlight hovered/selected nodes, their neighbors, and dim the rest.

### Dependencies
- Task 11.2

### Acceptance Criteria
- [ ] Hovered node highlights with glow/border effect
- [ ] Selected node(s) highlight distinctly
- [ ] Connected neighbors of hovered/selected nodes highlight
- [ ] Non-highlighted elements dim (reduced opacity)
- [ ] Edge highlighting follows node highlighting

### Implementation

Track hover/selection state in React component.
Pass highlight state to renderer via RenderOptions.
Renderer applies highlight/dim effects based on state.

---

## Task 11.4: Cluster Visualization

### Overview
Render community clusters as large aggregate nodes with hierarchical support.

### Dependencies
- Task 11.3
- Phase 8 (Clustering & LOD)

### Acceptance Criteria
- [ ] Communities can collapse into single cluster node
- [ ] Cluster node size reflects member count
- [ ] Cluster nodes show aggregate label/count
- [ ] Hierarchical communities nest (communities within communities)
- [ ] Smooth expand/collapse animations

### Implementation

Extend LODManager to support cluster rendering mode.
Create ClusterNode visual representation.
Aggregate edges between clusters.

---

## Task 11.5: Demo Showcase

### Overview
Add controls to demo for all Phase 11 features.

### Dependencies
- Tasks 11.1-11.4

### Acceptance Criteria
- [ ] Size slider for nodes/edges
- [ ] Visibility toggle for communities
- [ ] Highlight mode selector (hover, selection, both)
- [ ] Cluster toggle with hierarchy depth control

---

## Types

```typescript
// Extended node visuals
interface ResolvedNodeVisuals {
  color: number;
  radius: number;
  shape: NodeShape;
  visible?: boolean;      // NEW
  alpha?: number;         // NEW - for dimming
  highlighted?: boolean;  // NEW - for glow effect
  strokeColor?: number;   // NEW - for selection border
  strokeWidth?: number;   // NEW
}

// New edge visuals
interface ResolvedEdgeVisuals {
  color: number;
  width: number;
  alpha?: number;
  visible?: boolean;
  highlighted?: boolean;
}

// Style functions
type NodeStyleFn<N> = (node: Node<N>) => Partial<ResolvedNodeVisuals>;
type EdgeStyleFn<E> = (edge: Edge<E>) => Partial<ResolvedEdgeVisuals>;

// Highlight state passed to renderer
interface HighlightState {
  hoveredNodeId?: string;
  selectedNodeIds: Set<string>;
  highlightNeighbors: boolean;
  dimOpacity: number;  // 0.1-0.3 typical
}
```
