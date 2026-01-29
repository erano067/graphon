import type {
  Cluster,
  ClusterStyleFn,
  ClusteringConfig,
  ContextMenuItem,
  Edge,
  EdgeStyleFn,
  ExpandNodeResult,
  ForceLayoutOptions,
  GraphonContextMenuEvent,
  GraphonSelectionEvent,
  GraphonViewportEvent,
  HighlightedItems,
  InteractionsConfig,
  LayoutOptions,
  LayoutType,
  Node,
  NodeStyleFn,
  Position,
  ResolvedEdgeVisuals,
  ResolvedNodeVisuals,
  Selection,
  ViewportState,
} from '@graphon/core';

// ============================================================================
// Core Input Types
// ============================================================================

/**
 * Node input for the Graphon component.
 * Extends the core Node type with optional position and visual overrides.
 */
export interface GraphonNode<N = Record<string, unknown>> extends Node<N> {
  /** Optional initial position. If not provided, layout will determine position. */
  position?: Position;
  /** Community ID for automatic clustering. Nodes with same communityId group together. */
  communityId?: string;
}

/**
 * Edge input for the Graphon component.
 */
export interface GraphonEdge<E = Record<string, unknown>> extends Edge<E> {
  /** Optional label displayed on the edge */
  label?: string;
}

// ============================================================================
// Ref Handle for Imperative Methods
// ============================================================================

/**
 * Imperative methods exposed via ref.
 *
 * @example
 * ```tsx
 * const graphRef = useRef<GraphonRef>(null);
 *
 * // Add nodes dynamically
 * graphRef.current?.addNodes([{ id: 'new', data: {} }]);
 *
 * // Fit view to show all content
 * graphRef.current?.fitView();
 * ```
 */
export interface GraphonRef<N = Record<string, unknown>, E = Record<string, unknown>> {
  /** Add nodes to the graph */
  addNodes: (nodes: GraphonNode<N>[]) => void;
  /** Add edges to the graph */
  addEdges: (edges: GraphonEdge<E>[]) => void;
  /** Remove nodes by ID */
  removeNodes: (nodeIds: string[]) => void;
  /** Remove edges by ID */
  removeEdges: (edgeIds: string[]) => void;
  /** Update node data/properties */
  updateNode: (nodeId: string, updates: Partial<GraphonNode<N>>) => void;
  /** Update edge data/properties */
  updateEdge: (edgeId: string, updates: Partial<GraphonEdge<E>>) => void;
  /** Get current node by ID */
  getNode: (nodeId: string) => GraphonNode<N> | undefined;
  /** Get current edge by ID */
  getEdge: (edgeId: string) => GraphonEdge<E> | undefined;
  /** Get all nodes */
  getNodes: () => GraphonNode<N>[];
  /** Get all edges */
  getEdges: () => GraphonEdge<E>[];
  /** Get neighbors of a node */
  getNeighbors: (nodeId: string) => GraphonNode<N>[];
  /** Get edges connected to a node */
  getConnectedEdges: (nodeId: string) => GraphonEdge<E>[];
  /** Fit view to show all nodes with optional padding */
  fitView: (padding?: number) => void;
  /** Center view on specific node */
  centerOnNode: (nodeId: string, zoom?: number) => void;
  /** Center view on specific position */
  centerOnPosition: (position: Position, zoom?: number) => void;
  /** Set zoom level */
  setZoom: (zoom: number) => void;
  /** Get current zoom level */
  getZoom: () => number;
  /** Set viewport pan position */
  setPan: (x: number, y: number) => void;
  /** Get current viewport bounds */
  getViewportBounds: () => { x: number; y: number; width: number; height: number };
  /** Expand a cluster to show its children */
  expandCluster: (clusterId: string) => void;
  /** Collapse nodes back into a cluster */
  collapseCluster: (clusterId: string) => void;
  /** Toggle cluster expanded/collapsed state */
  toggleCluster: (clusterId: string) => void;
  /** Get cluster by ID */
  getCluster: (clusterId: string) => Cluster | undefined;
  /** Get all clusters */
  getClusters: () => Cluster[];
  /** Run layout algorithm */
  runLayout: (layout?: LayoutType) => void;
  /** Stop any running layout/animation */
  stopLayout: () => void;
  /** Export graph as PNG image */
  exportPNG: (options?: { scale?: number; backgroundColor?: string }) => Promise<Blob>;
  /** Export graph as SVG */
  exportSVG: () => Promise<string>;
  /** Get underlying PixiJS application (advanced use only) */
  getPixiApp: () => unknown;
}

// ============================================================================
// Main Props Interface
// ============================================================================

/**
 * Props for the Graphon React component.
 *
 * @typeParam N - Node data type
 * @typeParam E - Edge data type
 *
 * @example
 * ```tsx
 * <Graphon
 *   nodes={nodes}
 *   edges={edges}
 *   nodeStyle={(node) => ({
 *     shape: 'hexagon',
 *     fill: node.data.category === 'important' ? '#ff0000' : '#666',
 *     radius: 20,
 *   })}
 *   edgeStyle={(edge) => ({
 *     curve: 'bezier',
 *     stroke: '#999',
 *   })}
 *   clustering={{ enabled: true, clusterBy: 'communityId' }}
 *   onNodeClick={(event) => console.log('Clicked:', event.node.id)}
 *   onExpandNode={async (event) => {
 *     const connections = await fetchConnections(event.nodeId);
 *     return { nodes: connections.nodes, edges: connections.edges };
 *   }}
 * />
 * ```
 */
export interface GraphonProps<N = Record<string, unknown>, E = Record<string, unknown>> {
  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  /** Array of nodes to render */
  nodes: GraphonNode<N>[];
  /** Array of edges connecting nodes */
  edges: GraphonEdge<E>[];

  // ---------------------------------------------------------------------------
  // Dimensions
  // ---------------------------------------------------------------------------
  /** Canvas width in pixels @default 800 */
  width?: number;
  /** Canvas height in pixels @default 600 */
  height?: number;

  // ---------------------------------------------------------------------------
  // Container Styling
  // ---------------------------------------------------------------------------
  /** CSS class name for the container */
  className?: string;
  /** Inline styles for the container */
  style?: React.CSSProperties;

  // ---------------------------------------------------------------------------
  // Styling Functions (new API - will be implemented in Phase 14)
  // ---------------------------------------------------------------------------
  /** Function to determine node visual style (new API) */
  nodeStyle?: (node: Node<N>) => Partial<ResolvedNodeVisuals>;
  /** Function to determine edge visual style (new API) */
  edgeStyle?: (edge: Edge<E>) => Partial<ResolvedEdgeVisuals>;
  /** Function to determine cluster visual style */
  clusterStyle?: ClusterStyleFn;

  // ---------------------------------------------------------------------------
  // Clustering
  // ---------------------------------------------------------------------------
  /** Clustering configuration */
  clustering?: ClusteringConfig;

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------
  /** Layout algorithm to use @default 'force' */
  layout?: LayoutType;
  /** Layout-specific options */
  layoutOptions?: LayoutOptions | ForceLayoutOptions;
  /** Whether physics simulation is running @default true */
  isAnimated?: boolean;

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------
  /** Interaction configuration */
  interactions?: Partial<InteractionsConfig>;

  // ---------------------------------------------------------------------------
  // Controlled State
  // ---------------------------------------------------------------------------
  /** Controlled selection state */
  selection?: Selection;
  /** Controlled viewport state */
  viewport?: ViewportState;
  /** Controlled highlight state */
  highlightedItems?: HighlightedItems;

  // ---------------------------------------------------------------------------
  // Visual Settings
  // ---------------------------------------------------------------------------
  /** Opacity for dimmed (non-highlighted) elements @default 0.15 */
  dimOpacity?: number;
  /** Background color of the canvas @default '#1a1a2e' */
  backgroundColor?: string;

  // ---------------------------------------------------------------------------
  // Zoom Limits
  // ---------------------------------------------------------------------------
  /** Minimum zoom scale @default 0.1 */
  minZoom?: number;
  /** Maximum zoom scale @default 4 */
  maxZoom?: number;

  // ---------------------------------------------------------------------------
  // Context Menu
  // ---------------------------------------------------------------------------
  /** Items to show in context menu. Return empty array to disable. */
  contextMenuItems?: (event: GraphonContextMenuEvent<N, E>) => ContextMenuItem[];

  // ---------------------------------------------------------------------------
  // Dynamic Data Expansion
  // ---------------------------------------------------------------------------
  /**
   * Callback to fetch additional data when expanding a node.
   * Triggered by right-click menu "Expand" action.
   * Return nodes and edges to add to the graph.
   */
  onExpandNode?: (event: {
    nodeId: string;
    node: GraphonNode<N>;
  }) => Promise<ExpandNodeResult<N, E>> | ExpandNodeResult<N, E>;

  // ---------------------------------------------------------------------------
  // Event Callbacks (legacy signatures for backward compatibility)
  // ---------------------------------------------------------------------------
  /** Callback when a node is clicked */
  onNodeClick?: (node: Node<N>) => void;
  /** Callback when a node is double-clicked */
  onNodeDoubleClick?: (node: Node<N>) => void;
  /** Callback when mouse enters/leaves a node */
  onNodeHover?: (node: Node<N> | undefined) => void;
  /** Callback while a node is being dragged */
  onNodeDrag?: (nodeId: string, position: Position) => void;
  /** Callback when node dragging ends */
  onNodeDragEnd?: (nodeId: string, position: Position) => void;
  /** Callback when an edge is clicked */
  onEdgeClick?: (edge: Edge<E>) => void;
  /** Callback when mouse enters/leaves an edge */
  onEdgeHover?: (edge: Edge<E> | undefined) => void;
  /** Callback when a cluster is clicked */
  onClusterClick?: (clusterId: string) => void;
  /** Callback when a cluster is double-clicked (default: toggle expand) */
  onClusterDoubleClick?: (clusterId: string) => void;
  /** Callback when canvas (not node/edge/cluster) is clicked */
  onCanvasClick?: (position: Position) => void;
  /** Callback when selection changes */
  onSelectionChange?: (event: GraphonSelectionEvent) => void;
  /** Callback when viewport (pan/zoom) changes */
  onViewportChange?: (event: GraphonViewportEvent) => void;
  /** Callback when context menu item is selected */
  onContextMenu?: (event: GraphonContextMenuEvent<N, E>) => void;
  /** Callback when graph is ready (renderer initialized) */
  onReady?: () => void;
  /** Callback when layout completes */
  onLayoutComplete?: () => void;

  // ---------------------------------------------------------------------------
  // Worker Configuration
  // ---------------------------------------------------------------------------
  /**
   * Factory function to create the physics web worker.
   * Required for Vite and other bundlers that need explicit worker imports.
   * @example
   * ```tsx
   * import PhysicsWorker from '@graphon/core/physics.worker?worker';
   * <Graphon createWorkerFn={() => new PhysicsWorker()} ... />
   * ```
   */
  createWorkerFn?: () => Worker;

  // ---------------------------------------------------------------------------
  // Legacy Props (for existing component - will migrate to new API in Phase 14)
  // ---------------------------------------------------------------------------
  /** Function to determine node visual style (current API) */
  nodeStyleFn?: NodeStyleFn<N>;
  /** Function to determine edge visual style (current API) */
  edgeStyleFn?: EdgeStyleFn<E>;
  /** Function to determine node community for clustering */
  communityFn?: (node: Node<N>) => number;
  /** Enable node dragging @default true */
  isDraggable?: boolean;
  /** Enable canvas panning @default true */
  isPannable?: boolean;
  /** Enable mouse wheel zooming @default true */
  isZoomable?: boolean;
  /** Whether to highlight neighbors when hovering/selecting nodes @default true */
  highlightNeighbors?: boolean;
  /** Callback when zoom level changes */
  onZoomChange?: (zoom: number) => void;
}
