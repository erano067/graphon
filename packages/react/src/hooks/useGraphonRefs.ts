import { useEffect, useRef } from 'react';
import type {
  Edge,
  Node,
  NodeColorFn,
  PhysicsEngine,
  PhysicsWorkerClient,
  PixiRenderer,
} from '@graphon/core';

export interface PanState {
  startX: number;
  startY: number;
  viewportX: number;
  viewportY: number;
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
  dragState: React.RefObject<{ nodeId: string } | undefined>;
  isDragging: React.RefObject<boolean>;
  isPanning: React.RefObject<boolean>;
  isInteracting: React.RefObject<boolean>;
  panState: React.RefObject<PanState | undefined>;
  nodes: React.RefObject<Node<N>[]>;
  edges: React.RefObject<Edge<E>[]>;
  nodeColorFn: React.RefObject<NodeColorFn<N> | undefined>;
}

export function useGraphonRefs<N, E>(
  nodes: Node<N>[],
  edges: Edge<E>[],
  nodeColorFn?: NodeColorFn<N>
): GraphonRefs<N, E> {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PixiRenderer<N, E> | undefined>(undefined);
  const physicsRef = useRef<PhysicsEngine<N, E> | undefined>(undefined);
  const workerClientRef = useRef<PhysicsWorkerClient<N, E> | undefined>(undefined);
  const animationRef = useRef<number | undefined>(undefined);
  const graphKeyRef = useRef('');
  const hoveredNodeRef = useRef<string | undefined>(undefined);
  const hoveredEdgeRef = useRef<string | undefined>(undefined);
  const dragStateRef = useRef<{ nodeId: string } | undefined>(undefined);
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isInteractingRef = useRef(false);
  const panStateRef = useRef<PanState | undefined>(undefined);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const nodeColorFnRef = useRef(nodeColorFn);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    nodeColorFnRef.current = nodeColorFn;
  }, [nodeColorFn]);

  return {
    container: containerRef,
    renderer: rendererRef,
    physics: physicsRef,
    workerClient: workerClientRef,
    animation: animationRef,
    graphKey: graphKeyRef,
    hoveredNode: hoveredNodeRef,
    hoveredEdge: hoveredEdgeRef,
    dragState: dragStateRef,
    isDragging: isDraggingRef,
    isPanning: isPanningRef,
    isInteracting: isInteractingRef,
    panState: panStateRef,
    nodes: nodesRef,
    edges: edgesRef,
    nodeColorFn: nodeColorFnRef,
  };
}
