export { Graphon } from './Graphon';
export type { GraphonProps } from './types';

// Hooks
export { useLOD } from './hooks/useLOD';
export type { UseLODOptions, UseLODResult } from './hooks/useLOD';
export { useAnimation } from './hooks/useAnimation';
export type { UseAnimationOptions, UseAnimationResult } from './hooks/useAnimation';
export { useLayout } from './hooks/useLayout';
export type { UseLayoutOptions, UseLayoutResult } from './hooks/useLayout';

// Re-export everything from @graphon/core for convenience
export {
  // Model
  GraphologyAdapter,
  createGraphModel,
  // Renderer
  PixiRenderer,
  createRenderer,
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
  DEFAULT_RENDER_CONFIG,
  DEFAULT_NODE_VISUALS,
  // Layout
  ForceLayout,
  CircularLayout,
  GridLayout,
  createLayout,
  DEFAULT_LAYOUT_OPTIONS,
  DEFAULT_FORCE_OPTIONS,
  // Physics
  PhysicsSimulation,
  createPhysicsSimulation,
  PhysicsWorkerClient,
  PhysicsWorkerCore,
  supportsWebWorkers,
  isAsyncPhysicsEngine,
  DEFAULT_PHYSICS_CONFIG,
  // Clustering
  ClusterBuilder,
  LODManager,
  DEFAULT_LOD_CONFIG,
  // Animation
  AnimationManager,
  easings,
  getEasing,
  LayoutTransition,
  NodeAnimator,
  Tween,
} from '@graphon/core';

export type {
  // Model
  GraphModel,
  GraphEventMap,
  GraphEventType,
  Node,
  Edge,
  GraphData,
  Position,
  PositionMap,
  // Renderer
  Renderer,
  Viewport,
  HitTestResult,
  RenderConfig,
  NodeStyle,
  EdgeStyle,
  NodeStyleFn,
  NodeShape,
  ResolvedNodeVisuals,
  RenderOptions,
  // Layout
  Layout,
  LayoutType,
  LayoutOptions,
  ForceLayoutOptions,
  // Physics
  PhysicsConfig,
  NodeState,
  PhysicsWorkerClientOptions,
  PhysicsEngine,
  // Clustering
  ClusterBuilderOptions,
  ClusterEdge,
  ClusterHierarchy,
  ClusterNode,
  LODConfig,
  LODRenderSet,
  // Animation
  EasingFn,
  EasingName,
  LayoutTransitionOptions,
  NodeAnimationOptions,
  PositionUpdateCallback,
  TransitionUpdateCallback,
  TweenOptions,
} from '@graphon/core';
