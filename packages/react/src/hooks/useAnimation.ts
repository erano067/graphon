import { useCallback, useMemo, useRef } from 'react';
import {
  AnimationManager,
  LayoutTransition,
  type LayoutTransitionOptions,
  type NodeAnimationOptions,
  NodeAnimator,
  type Position,
  type PositionMap,
} from '@graphon/core';

export interface UseAnimationOptions {
  /** Callback when any animation updates (triggers re-render) */
  onUpdate?: () => void;
}

export interface UseAnimationResult {
  /** Move a single node to a new position */
  moveNode: (nodeId: string, x: number, y: number, options?: NodeAnimationOptions) => void;
  /** Move multiple nodes to new positions */
  moveNodes: (targets: Map<string, Position>, options?: NodeAnimationOptions) => void;
  /** Transition to a new layout (positions for all nodes) */
  transitionTo: (positions: PositionMap, options?: LayoutTransitionOptions) => Promise<void>;
  /** Animate nodes from center to their positions */
  expandFromCenter: (
    positions: PositionMap,
    center?: Position,
    options?: LayoutTransitionOptions
  ) => Promise<void>;
  /** Animate nodes to center (collapse animation) */
  collapseToCenter: (
    nodeIds: string[],
    center?: Position,
    options?: LayoutTransitionOptions
  ) => Promise<void>;
  /** Cancel all running animations */
  cancelAll: () => void;
  /** Cancel animations for a specific node */
  cancelNode: (nodeId: string) => void;
  /** Check if any animations are running */
  isAnimating: boolean;
  /** Access to underlying AnimationManager */
  animationManager: AnimationManager;
}

/** Default no-op callback */
function noop(): void {
  // Intentionally empty
}

/**
 * Hook for animating node positions and layout transitions.
 *
 * @example
 * ```tsx
 * const { moveNode, transitionTo } = useAnimation(positions, {
 *   onUpdate: () => requestRender(),
 * });
 * moveNode('node-1', 100, 200, { duration: 200 });
 * ```
 */
export function useAnimation(
  positions: PositionMap,
  options?: UseAnimationOptions
): UseAnimationResult {
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const onUpdateCallback = useMemo(() => options?.onUpdate ?? noop, [options?.onUpdate]);

  const animationManager = useMemo(() => new AnimationManager(), []);
  const nodeAnimator = useMemo(
    () => new NodeAnimator(positionsRef.current, animationManager, onUpdateCallback),
    [animationManager, onUpdateCallback]
  );
  const layoutTransition = useMemo(
    () => new LayoutTransition(positionsRef.current, animationManager, onUpdateCallback),
    [animationManager, onUpdateCallback]
  );

  // Sync positions ref
  nodeAnimator.setPositions(positionsRef.current);
  layoutTransition.setPositions(positionsRef.current);

  const moveNode = useCallback(
    (nodeId: string, x: number, y: number, opts?: NodeAnimationOptions) =>
      nodeAnimator.moveTo(nodeId, x, y, opts),
    [nodeAnimator]
  );
  const moveNodes = useCallback(
    (targets: Map<string, Position>, opts?: NodeAnimationOptions) =>
      nodeAnimator.moveMany(targets, opts),
    [nodeAnimator]
  );
  const transitionTo = useCallback(
    (target: PositionMap, opts?: LayoutTransitionOptions) => layoutTransition.to(target, opts),
    [layoutTransition]
  );
  const expandFromCenter = useCallback(
    (target: PositionMap, center?: Position, opts?: LayoutTransitionOptions) =>
      layoutTransition.fromCenter(target, center, opts),
    [layoutTransition]
  );
  const collapseToCenter = useCallback(
    (nodeIds: string[], center?: Position, opts?: LayoutTransitionOptions) =>
      layoutTransition.toCenter(nodeIds, center, opts),
    [layoutTransition]
  );
  const cancelAll = useCallback(() => {
    nodeAnimator.cancelAll();
    layoutTransition.cancel();
  }, [nodeAnimator, layoutTransition]);
  const cancelNode = useCallback(
    (nodeId: string) => nodeAnimator.cancelNode(nodeId),
    [nodeAnimator]
  );

  return {
    moveNode,
    moveNodes,
    transitionTo,
    expandFromCenter,
    collapseToCenter,
    cancelAll,
    cancelNode,
    get isAnimating() {
      return animationManager.isAnimating;
    },
    animationManager,
  };
}
