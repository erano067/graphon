import { useEffect, useRef } from 'react';
import type {
  Edge,
  EdgeStyleFn,
  Node,
  NodeStyleFn,
  PhysicsEngine,
  PhysicsWorkerClient,
  PixiRenderer,
} from '@graphon/core';
import { useAdjacencyMap } from './useAdjacencyMap';
import { useSyncedRef } from './useSyncedRef';

export interface PanState {
  startX: number;
  startY: number;
  viewportX: number;
  viewportY: number;
}

export interface HighlightOptions {
  highlightNeighbors: boolean;
  dimOpacity: number;
}

export interface GraphonRefs<N, E> {
  container: React.RefObject<HTMLDivElement | null>;
  renderer: React.RefObject<PixiRenderer<N, E> | undefined>;
  physics: React.RefObject<PhysicsEngine<N, E> | undefined>;
  workerClient: React.RefObject<PhysicsWorkerClient<N, E> | undefined>;
  animation: React.RefObject<number | undefined>;
  graphKey: React.RefObject<string>;
  hoveredNode: React.RefObject<string | undefined>;
  hoveredEdge: React.RefObject<string | undefined>;
  selectedNodes: React.RefObject<Set<string>>;
  adjacency: React.RefObject<Map<string, Set<string>>>;
  highlightOptions: React.RefObject<HighlightOptions>;
  dragState: React.RefObject<{ nodeId: string } | undefined>;
  isDragging: React.RefObject<boolean>;
  isPanning: React.RefObject<boolean>;
  isInteracting: React.RefObject<boolean>;
  panState: React.RefObject<PanState | undefined>;
  nodes: React.RefObject<Node<N>[]>;
  edges: React.RefObject<Edge<E>[]>;
  nodeStyleFn: React.RefObject<NodeStyleFn<N> | undefined>;
  edgeStyleFn: React.RefObject<EdgeStyleFn<E> | undefined>;
}

export interface UseGraphonRefsOptions<N, E> {
  nodeStyleFn?: NodeStyleFn<N>;
  edgeStyleFn?: EdgeStyleFn<E>;
  highlightNeighbors?: boolean;
  dimOpacity?: number;
}

export function useGraphonRefs<N, E>(
  nodes: Node<N>[],
  edges: Edge<E>[],
  options: UseGraphonRefsOptions<N, E> = {}
): GraphonRefs<N, E> {
  const {
    nodeStyleFn,
    edgeStyleFn,
    highlightNeighbors: shouldHighlightNeighbors = true,
    dimOpacity = 0.15,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PixiRenderer<N, E> | undefined>(undefined);
  const physicsRef = useRef<PhysicsEngine<N, E> | undefined>(undefined);
  const workerClientRef = useRef<PhysicsWorkerClient<N, E> | undefined>(undefined);
  const animationRef = useRef<number | undefined>(undefined);
  const graphKeyRef = useRef('');
  const hoveredNodeRef = useRef<string | undefined>(undefined);
  const hoveredEdgeRef = useRef<string | undefined>(undefined);
  const selectedNodesRef = useRef<Set<string>>(new Set());
  const adjacencyRef = useAdjacencyMap(edges);
  const highlightOptionsRef = useRef<HighlightOptions>({
    highlightNeighbors: shouldHighlightNeighbors,
    dimOpacity,
  });
  const dragStateRef = useRef<{ nodeId: string } | undefined>(undefined);
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isInteractingRef = useRef(false);
  const panStateRef = useRef<PanState | undefined>(undefined);
  const nodesRef = useSyncedRef(nodes);
  const edgesRef = useSyncedRef(edges);
  const nodeStyleFnRef = useSyncedRef(nodeStyleFn);
  const edgeStyleFnRef = useSyncedRef(edgeStyleFn);

  useEffect(() => {
    highlightOptionsRef.current = { highlightNeighbors: shouldHighlightNeighbors, dimOpacity };
  }, [shouldHighlightNeighbors, dimOpacity]);

  return {
    container: containerRef,
    renderer: rendererRef,
    physics: physicsRef,
    workerClient: workerClientRef,
    animation: animationRef,
    graphKey: graphKeyRef,
    hoveredNode: hoveredNodeRef,
    hoveredEdge: hoveredEdgeRef,
    selectedNodes: selectedNodesRef,
    adjacency: adjacencyRef,
    highlightOptions: highlightOptionsRef,
    dragState: dragStateRef,
    isDragging: isDraggingRef,
    isPanning: isPanningRef,
    isInteracting: isInteractingRef,
    panState: panStateRef,
    nodes: nodesRef,
    edges: edgesRef,
    nodeStyleFn: nodeStyleFnRef,
    edgeStyleFn: edgeStyleFnRef,
  };
}
