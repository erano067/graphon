import { useCallback, useEffect } from 'react';
import { createPhysicsSimulation, createRenderer } from '@graphon/core';
import type { GraphonRefs } from './useGraphonRefs';

interface LifecycleOptions<N> {
  width: number;
  height: number;
  isAnimated: boolean;
  communityFn: ((node: { id: string; data: N }) => number) | undefined;
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

export function useGraphonLifecycle<N, E>(
  refs: GraphonRefs<N, E>,
  options: LifecycleOptions<N>
): void {
  const { width, height, isAnimated, communityFn } = options;

  const startAnimationLoop = useCallback((): void => {
    const tick = (): void => {
      const { physics, renderer, nodes, edges, nodeColorFn, animation } = refs;
      if (!physics.current || !renderer.current) {
        animation.current = undefined;
        return;
      }
      const positions = physics.current.tick();
      renderer.current.render(nodes.current, edges.current, positions, {
        nodeColorFn: nodeColorFn.current,
      });
      animation.current = requestAnimationFrame(tick);
    };
    refs.animation.current = requestAnimationFrame(tick);
  }, [refs]);

  useEffect(() => {
    const container = refs.container.current;
    if (!container) return;

    let isCancelled = false;
    const renderer = createRenderer<N, E>();
    const physics = createPhysicsSimulation<N, E>({ width, height });

    void renderer.mount(container).then(() => {
      if (isCancelled) {
        renderer.destroy();
        return;
      }
      refs.renderer.current = renderer;
      refs.physics.current = physics;
      if (communityFn) physics.setCommunityGetter(communityFn);
      const positions = physics.initialize(refs.nodes.current, refs.edges.current);
      renderer.resize(width, height);
      renderer.render(refs.nodes.current, refs.edges.current, positions, {
        nodeColorFn: refs.nodeColorFn.current,
      });
      refs.graphKey.current = computeGraphKey(refs.nodes.current, refs.edges.current);
      if (isAnimated) startAnimationLoop();
    });

    return (): void => {
      isCancelled = true;
      if (refs.animation.current) cancelAnimationFrame(refs.animation.current);
      refs.animation.current = undefined;
      renderer.destroy();
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
