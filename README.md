<p align="center">
  <img src="https://raw.githubusercontent.com/erano067/graphon/main/assets/logo.svg" alt="Graphon Logo" width="200">
</p>

<h1 align="center">Graphon</h1>

<p align="center">
  <strong>High-performance graph visualization for the web</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@graphon/core"><img src="https://img.shields.io/npm/v/@graphon/core.svg?style=flat-square&color=blue" alt="npm version"></a>
  <a href="https://github.com/erano067/graphon/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@graphon/core.svg?style=flat-square" alt="license"></a>
  <a href="https://github.com/erano067/graphon/actions"><img src="https://img.shields.io/github/actions/workflow/status/erano067/graphon/publish.yml?branch=main&style=flat-square" alt="build status"></a>
  <a href="https://bundlephobia.com/package/@graphon/react"><img src="https://img.shields.io/bundlephobia/minzip/@graphon/react?style=flat-square" alt="bundle size"></a>
</p>

<p align="center">
  WebGL-powered • 100k+ nodes • React & Vanilla JS • TypeScript-first
</p>

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [React](#react)
  - [Vanilla JavaScript](#vanilla-javascript)
- [Examples](#examples)
  - [Custom Node Styles](#custom-node-styles)
  - [Edge Styling](#edge-styling)
  - [Force-Directed Layout](#force-directed-layout)
  - [Clustering & Level of Detail](#clustering--level-of-detail)
  - [Event Handling](#event-handling)
- [API Reference](#api-reference)
  - [Graphon Component Props](#graphon-component-props)
  - [Node Shapes](#node-shapes)
  - [Edge Curve Styles](#edge-curve-styles)
  - [Arrow Shapes](#arrow-shapes)
  - [Layout Types](#layout-types)
- [Architecture](#architecture)
- [Performance Tips](#performance-tips)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Feature | Description |
|---------|-------------|
| 🚀 **WebGL Rendering** | Powered by PixiJS for buttery-smooth 60fps with 100k+ nodes |
| 🎨 **Rich Styling** | 15+ node shapes, gradients, images, icons, pie charts, decorators |
| 🔗 **Edge Variety** | Bezier curves, arrows, animated flow, taxi routing, bundling |
| 📐 **Multiple Layouts** | Force-directed, circular, grid, hierarchical, radial, concentric |
| 🔍 **Clustering & LOD** | Automatic cluster detection with level-of-detail rendering |
| ⚡ **Web Workers** | Physics simulation offloaded to worker threads |
| 🎬 **Animations** | Smooth layout transitions with configurable easings |
| 🖱️ **Interactions** | Drag, pan, zoom, select, hover with neighbor highlighting |
| 📦 **TypeScript** | Full type definitions with generics for node/edge data |
| ⚛️ **React Ready** | First-class React bindings with hooks |

---

## Installation

```bash
# Using npm
npm install @graphon/react

# Using pnpm
pnpm add @graphon/react

# Using yarn
yarn add @graphon/react
```

For vanilla JavaScript (no React):

```bash
npm install @graphon/core
```

---

## Quick Start

### React

```tsx
import { Graphon } from '@graphon/react';

function App() {
  const nodes = [
    { id: 'a', data: { label: 'Alice' } },
    { id: 'b', data: { label: 'Bob' } },
    { id: 'c', data: { label: 'Charlie' } },
  ];

  const edges = [
    { id: 'e1', source: 'a', target: 'b', data: {} },
    { id: 'e2', source: 'b', target: 'c', data: {} },
    { id: 'e3', source: 'c', target: 'a', data: {} },
  ];

  return (
    <Graphon
      nodes={nodes}
      edges={edges}
      width={800}
      height={600}
      onNodeClick={(node) => console.log('Clicked:', node.id)}
    />
  );
}
```

### Vanilla JavaScript

```typescript
import { createGraphModel, createRenderer, ForceLayout } from '@graphon/core';

// Create the graph model
const graph = createGraphModel();

// Add nodes and edges
graph.addNode('a', { label: 'Alice' });
graph.addNode('b', { label: 'Bob' });
graph.addEdge('e1', 'a', 'b', {});

// Create renderer
const renderer = createRenderer(document.getElementById('graph')!, {
  width: 800,
  height: 600,
});

// Apply layout
const layout = new ForceLayout();
const positions = layout.run(graph.getNodes(), graph.getEdges());

// Render
renderer.render(graph, positions);
```

---

## Examples

### Custom Node Styles

Style nodes dynamically based on data and interaction state:

```tsx
import { Graphon } from '@graphon/react';
import type { NodeVisualStyle, NodeRenderState, Node } from '@graphon/react';

interface MyNodeData {
  category: 'person' | 'company' | 'product';
  importance: number;
}

const nodeStyleFn = (node: Node<MyNodeData>, state: NodeRenderState): NodeVisualStyle => ({
  // Shape based on category
  shape: node.data.category === 'person' ? 'circle' 
       : node.data.category === 'company' ? 'hexagon' 
       : 'diamond',
  
  // Size based on importance
  size: 20 + node.data.importance * 10,
  
  // Color with state-based modifications
  color: state.isSelected ? '#ff6b6b' 
       : state.isHovered ? '#4ecdc4' 
       : '#667eea',
  
  // Border
  borderColor: '#ffffff',
  borderWidth: state.isSelected ? 3 : 1,
  
  // Label
  label: {
    text: node.data.category,
    fontSize: 12,
    color: '#ffffff',
  },
});

<Graphon
  nodes={nodes}
  edges={edges}
  nodeStyleFn={nodeStyleFn}
/>
```

### Edge Styling

Configure edge appearance with curves, arrows, and animations:

```tsx
import type { EdgeVisualStyle, EdgeRenderState, Edge } from '@graphon/react';

const edgeStyleFn = (edge: Edge, state: EdgeRenderState): EdgeVisualStyle => ({
  // Curve style
  curveStyle: 'bezier',
  curvature: 0.3,
  
  // Line appearance
  width: state.isHighlighted ? 3 : 1,
  color: '#999999',
  style: 'solid', // 'solid' | 'dashed' | 'dotted'
  
  // Arrows
  targetArrow: {
    shape: 'triangle',
    size: 8,
    fill: 'filled',
  },
  
  // Animated flow (great for showing data flow)
  flow: {
    enabled: true,
    color: '#4ecdc4',
    speed: 50,
    width: 3,
    gap: 20,
  },
  
  // Opacity based on state
  opacity: state.isDimmed ? 0.15 : 0.8,
});
```

### Force-Directed Layout

Configure the physics simulation:

```tsx
<Graphon
  nodes={nodes}
  edges={edges}
  layout={{
    type: 'force',
    iterations: 300,
    strength: 0.1,
    linkDistance: 100,
    chargeStrength: -300,
    centerStrength: 0.05,
  }}
  isAnimated={true}
/>
```

Use Web Workers for better performance:

```tsx
// physics.worker.ts
import { PhysicsWorkerCore } from '@graphon/react';
new PhysicsWorkerCore();

// App.tsx
import PhysicsWorker from './physics.worker?worker';

<Graphon
  nodes={nodes}
  edges={edges}
  createWorkerFn={() => new PhysicsWorker()}
/>
```

### Clustering & Level of Detail

Automatically group nodes and show/hide detail based on zoom:

```tsx
import { Graphon, useClusterLOD } from '@graphon/react';

function ClusteredGraph({ nodes, edges }) {
  const { 
    visibleNodes, 
    visibleEdges, 
    clusters,
    expandCluster,
    collapseCluster,
  } = useClusterLOD({
    nodes,
    edges,
    communityFn: (node) => node.data.community,
    config: {
      clusterThreshold: 0.5,  // Zoom level to show clusters
      expandThreshold: 1.5,   // Zoom level to expand
    },
  });

  return (
    <Graphon
      nodes={visibleNodes}
      edges={visibleEdges}
      clusters={clusters}
      onClusterClick={(cluster) => expandCluster(cluster.id)}
    />
  );
}
```

### Event Handling

React to user interactions:

```tsx
<Graphon
  nodes={nodes}
  edges={edges}
  
  // Node events
  onNodeClick={(node, event) => {
    console.log('Clicked node:', node.id);
    console.log('Modifier keys:', event.modifierKeys);
  }}
  onNodeHover={(node) => setTooltip(node?.data.label)}
  onNodeDrag={(node, position) => console.log('Dragging:', position)}
  onNodeDragEnd={(node, position) => savePosition(node.id, position)}
  
  // Edge events
  onEdgeClick={(edge) => console.log('Clicked edge:', edge.id)}
  onEdgeHover={(edge) => highlightPath(edge)}
  
  // Canvas events
  onCanvasClick={() => clearSelection()}
  onZoomChange={(zoom) => setCurrentZoom(zoom)}
  
  // Interaction settings
  isDraggable={true}
  isPannable={true}
  isZoomable={true}
  minZoom={0.1}
  maxZoom={4}
  
  // Neighbor highlighting
  highlightNeighbors={true}
  dimOpacity={0.15}
/>
```

---

## API Reference

### Graphon Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `Node<N>[]` | required | Array of nodes to render |
| `edges` | `Edge<E>[]` | required | Array of edges to render |
| `width` | `number` | `800` | Canvas width in pixels |
| `height` | `number` | `600` | Canvas height in pixels |
| `nodeStyleFn` | `NodeStyleFn<N>` | - | Function to compute node styles |
| `edgeStyleFn` | `EdgeStyleFn<E>` | - | Function to compute edge styles |
| `layout` | `LayoutOptions` | `{ type: 'force' }` | Layout algorithm configuration |
| `isAnimated` | `boolean` | `true` | Enable layout animations |
| `isDraggable` | `boolean` | `true` | Enable node dragging |
| `isPannable` | `boolean` | `true` | Enable canvas panning |
| `isZoomable` | `boolean` | `true` | Enable zoom |
| `minZoom` | `number` | `0.1` | Minimum zoom level |
| `maxZoom` | `number` | `4` | Maximum zoom level |
| `highlightNeighbors` | `boolean` | `true` | Highlight neighbors on hover/select |
| `dimOpacity` | `number` | `0.15` | Opacity for non-highlighted elements |
| `communityFn` | `(node) => string` | - | Function to determine node community |
| `createWorkerFn` | `() => Worker` | - | Factory for physics Web Worker |
| `onNodeClick` | `(node, event) => void` | - | Node click handler |
| `onNodeHover` | `(node \| null) => void` | - | Node hover handler |
| `onNodeDrag` | `(node, position) => void` | - | Node drag handler |
| `onNodeDragEnd` | `(node, position) => void` | - | Node drag end handler |
| `onEdgeClick` | `(edge, event) => void` | - | Edge click handler |
| `onEdgeHover` | `(edge \| null) => void` | - | Edge hover handler |
| `onCanvasClick` | `(event) => void` | - | Canvas click handler |
| `onZoomChange` | `(zoom) => void` | - | Zoom change handler |

### Node Shapes

```
circle        ellipse       rectangle     round-rectangle
triangle      round-triangle
diamond       round-diamond
pentagon      hexagon       octagon
star          tag           vee
polygon (custom points)
```

### Edge Curve Styles

| Style | Description |
|-------|-------------|
| `straight` | Direct line between nodes |
| `bezier` | Smooth quadratic curve |
| `unbundled-bezier` | Bezier with custom control points |
| `segments` | Multiple line segments |
| `taxi` | Orthogonal routing (right angles) |
| `arc` | Circular arc |

### Arrow Shapes

```
triangle      triangle-tee    triangle-cross
vee           chevron         tee
bar           circle          diamond
square        none
```

### Layout Types

| Layout | Description |
|--------|-------------|
| `force` | Physics-based force-directed layout |
| `circular` | Nodes arranged in a circle |
| `grid` | Nodes in a regular grid |
| `hierarchical` | Tree/DAG layout (top-down, left-right, etc.) |
| `radial` | Nodes radiating from a center |
| `concentric` | Concentric circles based on node attributes |

---

## Architecture

Graphon follows a clean layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     @graphon/react                          │
│   Graphon component, hooks (useLayout, useLOD, etc.)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      @graphon/core                          │
│   GraphModel, PixiRenderer, Layouts, Physics, Clustering    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Libraries                        │
│   PixiJS (WebGL), Graphology (graph algorithms)             │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- Implementation details (PixiJS, Graphology) are hidden behind interfaces
- Clean separation between model, rendering, and layout
- Physics can run in Web Workers for 60fps with large graphs
- TypeScript-first with full generic support

---

## Performance Tips

1. **Use Web Workers** for physics simulation with large graphs:
   ```tsx
   createWorkerFn={() => new PhysicsWorker()}
   ```

2. **Enable clustering** for graphs with 10k+ nodes:
   ```tsx
   <Graphon clusters={clusters} />
   ```

3. **Simplify styles at low zoom** levels:
   ```tsx
   const nodeStyleFn = (node, state) => ({
     // Skip expensive decorators when zoomed out
     decorators: zoom > 0.5 ? node.data.decorators : undefined,
   });
   ```

4. **Use `visible: false`** instead of filtering arrays:
   ```tsx
   const nodeStyleFn = (node) => ({
     visible: node.data.shouldShow,
   });
   ```

5. **Batch updates** when modifying many nodes:
   ```tsx
   graphRef.current?.batchUpdate(() => {
     nodes.forEach(n => graphRef.current?.updateNode(n.id, updates));
   });
   ```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repo
git clone https://github.com/erano067/graphon.git
cd graphon

# Install dependencies
pnpm install

# Run the demo
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build
```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features (triggers minor release)
- `fix:` Bug fixes (triggers patch release)
- `docs:` Documentation changes
- `chore:` Maintenance tasks
- `perf:` Performance improvements
- `refactor:` Code refactoring

---

## License

MIT © [erano067](https://github.com/erano067)

---

<p align="center">
  <sub>Built with ❤️ using TypeScript, PixiJS, and React</sub>
</p>
