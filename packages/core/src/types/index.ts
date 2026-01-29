/**
 * Core type definitions for Graphon.
 */

// Common types
export type {
  BoundingBox,
  Gradient,
  GradientStop,
  HexColor,
  LabelStyle,
  Position,
  PositionMap,
  Size,
} from './common';

// Node types
export type {
  DecoratorPosition,
  DecoratorType,
  Node,
  NodeDecorator,
  NodeIcon,
  NodeImage,
  NodeRenderState,
  NodeShape,
  NodeStyleFn,
  NodeVisualStyle,
  PieChart,
  PieSlice,
} from './node';
export { DEFAULT_NODE_STYLE } from './node';

// Edge types
export type {
  ArrowFill,
  ArrowShape,
  ArrowStyle,
  Edge,
  EdgeCurveStyle,
  EdgeFlow,
  EdgeLabelStyle,
  EdgeLineStyle,
  EdgeRenderState,
  EdgeStyleFn,
  EdgeVisualStyle,
} from './edge';
export { DEFAULT_EDGE_STYLE } from './edge';

// Cluster types
export type {
  Cluster,
  ClusterCountBadge,
  ClusteringConfig,
  ClusterRenderState,
  ClusterShape,
  ClusterStyleFn,
  ClusterVisualStyle,
} from './cluster';
export { DEFAULT_CLUSTER_STYLE } from './cluster';

// Interaction types
export type {
  ClusterInteractionConfig,
  ContextMenuItem,
  DragConfig,
  ExpandNodeEvent,
  ExpandNodeResult,
  GraphonClickEvent,
  GraphonContextMenuEvent,
  GraphonDragEvent,
  GraphonEventBase,
  GraphonEventTarget,
  GraphonHoverEvent,
  GraphonPanEvent,
  GraphonSelectionEvent,
  GraphonViewportEvent,
  GraphonZoomEvent,
  HoverConfig,
  InteractionsConfig,
  ModifierKeys,
  PanConfig,
  SelectConfig,
  ZoomConfig,
} from './interaction';
export { DEFAULT_INTERACTIONS } from './interaction';

// State types
export type { HighlightedItems, HoveredItem, Selection, Viewport } from './state';
export { DEFAULT_HIGHLIGHTED_ITEMS, DEFAULT_SELECTION, DEFAULT_VIEWPORT } from './state';

// Layout types
export type {
  BaseLayoutOptions,
  CircularLayoutOptions,
  ConcentricLayoutOptions,
  ForceLayoutOptions,
  GridLayoutOptions,
  HierarchicalDirection,
  HierarchicalLayoutOptions,
  Layout,
  LayoutCallbacks,
  LayoutConfig,
  LayoutOptions,
  LayoutType,
  NoLayoutOptions,
  RadialLayoutOptions,
} from './layout';
export { DEFAULT_FORCE_LAYOUT } from './layout';
