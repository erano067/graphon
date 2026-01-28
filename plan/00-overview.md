# Graphon Implementation Plan

## Overview

A high-performance graph visualization library built with TypeScript and PixiJS. Designed for 100k+ nodes with cluster-based LOD.

## Architecture

See [Architecture Review](13-architecture-review.md) for detailed rationale.

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC API LAYER                         │
│   GraphonProvider, useGraph, useSelection, useLayout            │
│   - Stable, semantic, domain-focused                            │
│   - NO implementation details (no graphology, no PixiJS)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│   GraphonCore - orchestrates all subsystems                     │
│   - Coordinates model ↔ renderer ↔ animation                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                              │
│   GraphModel, SelectionModel, ViewportModel (interfaces)        │
│   - Pure domain logic, no rendering/storage details             │
│   - Depends on NOTHING                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                         │
│   GraphologyAdapter, PixiRenderer, WebWorkerLayout              │
│   - Implements domain interfaces                                │
│   - Swappable without changing upper layers                     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principle: Implementation Details Don't Leak

| Internal | Exposed to Users |
|----------|------------------|
| graphology | ❌ Hidden behind `GraphModel` interface |
| PixiJS | ❌ Hidden behind `Renderer` interface |
| Web Workers | ❌ Hidden behind `LayoutEngine` interface |
| **Our API** | ✅ `useGraph()`, `addNode()`, `runLayout()` |

### Monorepo Structure

```
graphon/
├── packages/
│   ├── core/                 # @graphon/core - domain + infrastructure
│   ├── react/                # @graphon/react - public API layer
│   └── layouts/              # @graphon/layouts - layout algorithms
├── apps/
│   └── demo/                 # Demo/playground app
└── tests/
    ├── visual/               # Visual regression tests
    └── benchmarks/           # Performance benchmarks
```

### Package Structure (within @graphon/core)

```
packages/core/src/
├── model/                    # DOMAIN LAYER (interfaces)
│   ├── GraphModel.ts         # Graph abstraction
│   ├── SelectionModel.ts     # Selection abstraction
│   ├── ViewportModel.ts      # Viewport abstraction
│   └── types.ts              # NodeData, EdgeData, etc.
├── adapters/                 # INFRASTRUCTURE (implementations)
│   ├── GraphologyAdapter.ts  # GraphModel → graphology
│   └── index.ts
├── renderer/                 # INFRASTRUCTURE
│   ├── PixiRenderer.ts       # Main WebGL renderer
│   ├── NodeRenderer.ts
│   ├── EdgeRenderer.ts
│   └── LabelRenderer.ts
├── animation/                # DOMAIN + INFRASTRUCTURE
│   ├── AnimationController.ts
│   └── Tween.ts
├── spatial/                  # INFRASTRUCTURE
│   └── QuadTree.ts
├── core/                     # APPLICATION LAYER
│   ├── GraphonCore.ts        # Orchestrator
│   └── EventBridge.ts        # Model → Renderer sync
├── factory.ts                # Dependency injection
└── index.ts                  # Public exports (types only!)
```

## Design Principles

1. **Implementation Hiding** — graphology, PixiJS are internal details; users see only our API
2. **Dependency Inversion** — Upper layers depend on interfaces, not implementations
3. **Single Responsibility** — Each module has one reason to change
4. **No Shotgun Surgery** — Changing storage/rendering only affects adapter files
5. **Declarative API** — Configuration-driven, React-native patterns
6. **Test-First** — Every task includes tests; mock implementations for unit tests

## Implementation Phases

| Phase | Description | Est. Time | Plan Document |
|-------|-------------|-----------|---------------|
| **0** | Project Setup | 1-2 days | [Phase 0](01-phase-0-project-setup.md) |
| **1** | Core Infrastructure | 2-3 days | [Phase 1](02-phase-1-core-infrastructure.md) |
| **2** | Basic Rendering | 3-4 days | [Phase 2](03-phase-2-basic-rendering.md) |
| **3** | Node Styling | 2-3 days | [Phase 3](04-phase-3-node-styling.md) |
| **4** | Edge Styling | 2-3 days | [Phase 4](05-phase-4-edge-styling.md) |
| **5** | Interactions | 3-4 days | [Phase 5](06-phase-5-interactions.md) |
| **6** | Labels | 1-2 days | [Phase 6](07-phase-6-labels.md) |
| **7** | Layouts | 3-4 days | [Phase 7](08-phase-7-layouts.md) |
| **8** | Clustering & LOD | 4-5 days | [Phase 8](09-phase-8-clustering-lod.md) |
| **9** | Animations | 2-3 days | [Phase 9](10-phase-9-animations.md) |
| **10** | Advanced Features | 4-5 days | [Phase 10](11-phase-10-advanced-features.md) |

**Total estimated time: 28-38 days**

## State Management

See [State Management Architecture](12-state-management.md) for detailed design.

**Key principle:** Graph data lives in a `useRef`, NOT React state.

- graphology emits granular events (`nodeAdded`, `nodeDropped`, `attributesUpdated`)
- Graphon subscribes to these events and animates diffs automatically
- React only manages: config props, UI state (selection, hover), callbacks
- Bulk operations use `transaction()` to batch changes

```tsx
// ✅ Correct pattern
const graph = useRef(new Graph()).current;
graph.addNode('x', { x: 0, y: 0 }); // Graphon auto-animates

// ❌ Don't do this
const [graph, setGraph] = useState(new Graph()); // Bad for 100k nodes
```

## Testing Strategy

### Test Types

| Type | Tool | Location | Purpose |
|------|------|----------|---------|
| Unit | Vitest | `src/**/__tests__/` | Logic, pure functions |
| Integration | Vitest | `tests/integration/` | Feature combinations |
| Visual Regression | Playwright | `tests/visual/` | Screenshot comparison |
| Performance | Custom + Vitest | `tests/benchmarks/` | 10k/50k/100k node tests |

### Test Requirements Per Task

Every task MUST:
1. Add unit tests for new code (>80% coverage)
2. Add integration test if feature interacts with others
3. Add visual regression test for rendering changes
4. Run full test suite and pass before completion

### CI Pipeline

```yaml
# Every PR must pass:
- pnpm lint
- pnpm typecheck
- pnpm test:unit
- pnpm test:integration
- pnpm test:visual
- pnpm test:bench (with threshold)
```

## API Design (Declarative + React)

### Core Configuration

```typescript
interface GraphonConfig {
  // Data
  graph: Graph;  // graphology instance
  
  // Styling (declarative)
  nodeStyle?: NodeStyleConfig | NodeStyleFn;
  edgeStyle?: EdgeStyleConfig | EdgeStyleFn;
  
  // Clustering
  clustering?: ClusteringConfig;
  
  // Interactions
  interactions?: InteractionsConfig;
  
  // Callbacks (React paradigm)
  onNodeClick?: (node: NodeData, event: PointerEvent) => void;
  onNodeHover?: (node: NodeData | null) => void;
  onEdgeClick?: (edge: EdgeData, event: PointerEvent) => void;
  onSelectionChange?: (selection: Selection) => void;
  onViewportChange?: (viewport: ViewportState) => void;
  // ... more callbacks
}
```

### React Component

```tsx
import { Graphon } from '@graphon/react';

function MyGraph() {
  const graph = useGraph(); // user's graphology instance
  
  return (
    <Graphon
      graph={graph}
      nodeStyle={{
        shape: 'circle',
        size: (node) => node.data.weight * 10,
        color: (node) => colorScale(node.data.cluster),
      }}
      edgeStyle={{
        width: 1,
        color: '#ccc',
      }}
      clustering={{
        attribute: 'cluster',
        lod: { collapseThreshold: 50 },
      }}
      onNodeClick={(node) => console.log('Clicked:', node)}
      onSelectionChange={(sel) => setSelected(sel.nodes)}
    />
  );
}
```

## Task File Format

Each task file follows this structure:

```markdown
# Task X.Y: Task Name

## Overview
Brief description of what this task accomplishes.

## Dependencies
- Task X.Z (what it depends on)

## Acceptance Criteria
- [ ] Specific, testable criteria

## Implementation Steps
1. Step-by-step instructions

## Files to Create/Modify
- `path/to/file.ts` - description

## Tests Required
- Unit: what to test
- Integration: what to test
- Visual: what to capture

## Demo Addition
What to add to the demo app.

## API Surface
```typescript
// New types/functions exposed
```
```

## Next Steps

See individual task files:
- [Phase 0: Project Setup](./01-phase-0-project-setup.md)
- [Phase 1: Core Infrastructure](./02-phase-1-core-infrastructure.md)
- [Phase 2: Basic Rendering](./03-phase-2-basic-rendering.md)
- ... (more phases)
