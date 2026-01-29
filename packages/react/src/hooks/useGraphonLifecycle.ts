import { useCallback, useEffect } from 'react';
import { type Node, PhysicsWorkerClient, createRenderer } from '@graphon/core';
import type { GraphonRefs } from './useGraphonRefs';

interface LifecycleOptions<N> {
  width: number;
  height: number;
  isAnimated: boolean;
  communityFn?: (node: Node<N>) => number;
  createWorkerFn?: () => Worker;
}

function computeGraphKey(nodes: { id: string }[], edges: { id: string }[]): string {
  const nodeIds = nodes
    .map((n) => n.id)
    .sort()
    .join(',');
  const edgeIds = edges
    .map((e) => e.id)
    .sort()
    .join(',');
  return `${nodeIds}:${edgeIds}`;
}

function createAnimationLoop<N, E>(refs: GraphonRefs<N, E>): () => void {
  let lastFrameTime = 0;
  let isPendingTick = false;
  const MIN_FRAME_TIME = 16;

  const runTick = async (): Promise<void> => {
    const {
      workerClient,
      renderer,
      nodes,
      edges,
      nodeStyleFn,
      edgeStyleFn,
      isInteracting,
      hoveredNode,
      selectedNodes,
      adjacency,
      highlightOptions,
    } = refs;
    if (!workerClient.current || !renderer.current) return;

    const positions = await workerClient.current.tick();
    const { highlightNeighbors: shouldHighlightNeighbors, dimOpacity } = highlightOptions.current;
    const hoveredNodeId = hoveredNode.current;

    renderer.current.render(nodes.current, edges.current, positions, {
      ...(nodeStyleFn.current && { nodeStyleFn: nodeStyleFn.current }),
      ...(edgeStyleFn.current && { edgeStyleFn: edgeStyleFn.current }),
      isInteracting: isInteracting.current,
      highlightState: {
        ...(hoveredNodeId !== undefined && { hoveredNodeId }),
        selectedNodeIds: selectedNodes.current,
        shouldHighlightNeighbors,
        dimOpacity,
      },
      adjacency: adjacency.current,
    });
  };

  const tick = (currentTime: number): void => {
    const { workerClient, renderer, animation, isInteracting } = refs;
    if (!workerClient.current || !renderer.current) {
      animation.current = undefined;
      return;
    }
    if (isInteracting.current && currentTime - lastFrameTime < MIN_FRAME_TIME) {
      animation.current = requestAnimationFrame(tick);
      return;
    }
    if (isPendingTick) {
      animation.current = requestAnimationFrame(tick);
      return;
    }
    lastFrameTime = currentTime;
    isPendingTick = true;

    runTick()
      .catch(() => {
        /* ignore errors */
      })
      .finally(() => {
        isPendingTick = false;
      });

    animation.current = requestAnimationFrame(tick);
  };

  return () => {
    refs.animation.current = requestAnimationFrame(tick);
  };
}

interface InitializerParams<N, E> {
  refs: GraphonRefs<N, E>;
  renderer: ReturnType<typeof createRenderer<N, E>>;
  options: { width: number; height: number; isAnimated: boolean; createWorkerFn?: () => Worker };
  communityFn?: (node: Node<N>) => number;
  startAnimationLoop: () => void;
}

async function initializeWorker<N, E>(params: InitializerParams<N, E>): Promise<void> {
  const { refs, renderer, options, communityFn, startAnimationLoop } = params;
  const { width, height, isAnimated, createWorkerFn } = options;
  const container = refs.container.current;
  if (!container) return;

  const workerClient = new PhysicsWorkerClient<N, E>({
    config: { width, height },
    ...(communityFn && { communityFn }),
    ...(createWorkerFn && { createWorker: createWorkerFn }),
  });

  await renderer.mount(container);
  refs.renderer.current = renderer;
  refs.workerClient.current = workerClient;
  refs.physics.current = workerClient;

  const positions = await workerClient.initialize(refs.nodes.current, refs.edges.current);
  renderer.resize(width, height);
  renderer.render(refs.nodes.current, refs.edges.current, positions, {
    ...(refs.nodeStyleFn.current && { nodeStyleFn: refs.nodeStyleFn.current }),
  });
  refs.graphKey.current = computeGraphKey(refs.nodes.current, refs.edges.current);
  if (isAnimated) startAnimationLoop();
}

export function useGraphonLifecycle<N, E>(
  refs: GraphonRefs<N, E>,
  options: LifecycleOptions<N>
): void {
  const { width, height, isAnimated, communityFn, createWorkerFn } = options;

  const startAnimationLoop = useCallback((): void => {
    createAnimationLoop(refs)();
  }, [refs]);

  useEffect(() => {
    const container = refs.container.current;
    if (!container) return;

    const renderer = createRenderer<N, E>();
    const initParams = {
      refs,
      renderer,
      options: { width, height, isAnimated, ...(createWorkerFn && { createWorkerFn }) },
      ...(communityFn && { communityFn }),
      startAnimationLoop,
    };

    void initializeWorker(initParams);

    return (): void => {
      if (refs.animation.current) cancelAnimationFrame(refs.animation.current);
      refs.animation.current = undefined;
      renderer.destroy();
      refs.workerClient.current?.terminate();
      refs.workerClient.current = undefined;
      refs.renderer.current = undefined;
      refs.physics.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { renderer, physics, animation } = refs;
    if (isAnimated && renderer.current && physics.current && !animation.current) {
      startAnimationLoop();
    } else if (!isAnimated && animation.current) {
      cancelAnimationFrame(animation.current);
      refs.animation.current = undefined;
    }
  }, [isAnimated, startAnimationLoop, refs]);
}
