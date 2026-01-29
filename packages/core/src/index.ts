// ============================================================================
// New API Types (Phase 14) - Non-conflicting exports
// These can be imported directly. Types that conflict with legacy renderer/layout
// types are exported under the 'newapi' namespace or with 'New' prefix.
// ============================================================================
export type {
  // Common
  Size,
  BoundingBox,
  GradientStop,
  Gradient,
  LabelStyle,
  // Node visual types (don't conflict with renderer NodeStyle)
  NodeDecorator,
  NodeImage,
  NodeIcon,
  PieSlice,
  PieChart,
  NodeVisualStyle,
  NodeRenderState,
  // Edge visual types
  EdgeCurveStyle,
  ArrowShape,
  ArrowStyle,
  EdgeFlow,
  EdgeVisualStyle,
  EdgeRenderState,
  // Cluster
  Cluster,
  ClusterVisualStyle,
  ClusterRenderState,
  ClusterStyleFn,
  ClusteringConfig,
  // Interaction
  GraphonClickEvent,
  GraphonHoverEvent,
  GraphonDragEvent,
  GraphonSelectionEvent,
  GraphonViewportEvent,
  ContextMenuItem,
  GraphonContextMenuEvent,
  ExpandNodeEvent,
  ExpandNodeResult,
  InteractionsConfig,
  // State
  Selection,
  HoveredItem,
  Viewport as ViewportState,
  HighlightedItems,
  // Layout (non-conflicting)
  CircularLayoutOptions,
  GridLayoutOptions,
  HierarchicalLayoutOptions,
  RadialLayoutOptions,
  ConcentricLayoutOptions,
} from './types';

export {
  DEFAULT_SELECTION,
  DEFAULT_VIEWPORT,
  DEFAULT_HIGHLIGHTED_ITEMS,
  DEFAULT_CLUSTER_STYLE,
  DEFAULT_INTERACTIONS,
} from './types';

// Re-export new Node, Edge, Position types (compatible with model types)
export type { Node, Edge, Position, PositionMap } from './types';

// Export new NodeShape as NewNodeShape (the expanded 20+ shapes version)
export type { NodeShape as NewNodeShape } from './types';

// New style function types (use these for the new API)
export type { NodeStyleFn as NewNodeStyleFn, EdgeStyleFn as NewEdgeStyleFn } from './types';

// New layout types (use these for the new API)
export type {
  LayoutType as NewLayoutType,
  Layout as NewLayout,
  LayoutOptions as NewLayoutOptions,
  ForceLayoutOptions as NewForceLayoutOptions,
} from './types';

// ============================================================================
// Legacy Model Types (compatibility layer)
// ============================================================================
export type { GraphModel, GraphEventMap, GraphEventType } from './model/GraphModel';
export type { GraphData } from './model/types';
export { GraphologyAdapter, createGraphModel } from './model/GraphologyAdapter';

// ============================================================================
// Renderer
// ============================================================================
export type {
  Renderer,
  Viewport,
  HitTestResult,
  RenderConfig,
  NodeStyle,
  EdgeStyle,
  NodeStyleFn,
  EdgeStyleFn,
  NodeShape,
  ExtendedNodeShape,
  ExtendedShapeOptions,
  ResolvedNodeVisuals,
  ResolvedEdgeVisuals,
  RenderOptions,
  HighlightState,
} from './renderer';
export {
  PixiRenderer,
  createRenderer,
  DEFAULT_RENDER_CONFIG,
  DEFAULT_NODE_VISUALS,
  DEFAULT_EDGE_VISUALS,
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
} from './renderer';

// ============================================================================
// Layout
// ============================================================================
export type {
  Layout,
  LayoutType,
  LayoutOptions,
  ForceLayoutOptions,
  ConcentricLayoutOptions as CoreConcentricLayoutOptions,
  RadialLayoutOptions as CoreRadialLayoutOptions,
  CreateLayoutOptions,
  LayoutWorkerRequest,
  LayoutWorkerResult,
  LayoutWorkerType,
} from './layout';
export {
  ForceLayout,
  CircularLayout,
  GridLayout,
  ConcentricLayout,
  RadialLayout,
  LayoutWorkerCore,
  createLayout,
  DEFAULT_LAYOUT_OPTIONS,
  DEFAULT_FORCE_OPTIONS,
} from './layout';

export {
  PhysicsSimulation,
  createPhysicsSimulation,
  PhysicsWorkerClient,
  PhysicsWorkerCore,
  supportsWebWorkers,
  isAsyncPhysicsEngine,
  DEFAULT_PHYSICS_CONFIG,
} from './physics';
export type {
  PhysicsConfig,
  NodeState,
  PhysicsWorkerClientOptions,
  PhysicsEngine,
} from './physics';

export {
  buildClustersFromCommunity,
  buildClustersFromAttributes,
  DEFAULT_LOD_CONFIG,
  LODManager,
} from './clustering';
export type {
  ClusterBuilderOptions,
  ClusterEdge,
  ClusterHierarchy,
  ClusterNode,
  LODConfig,
  LODRenderSet,
} from './clustering';

export {
  AnimationManager,
  easings,
  getEasing,
  LayoutTransition,
  NodeAnimator,
  Tween,
} from './animation';
export type {
  EasingFn,
  EasingName,
  LayoutTransitionOptions,
  NodeAnimationOptions,
  PositionUpdateCallback,
  TransitionUpdateCallback,
  TweenOptions,
} from './animation';
