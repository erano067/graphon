import type { Position, PositionMap } from '../model/types';
import type { AnimationManager } from './AnimationManager';
import type { EasingName } from './easings';

/**
 * Options for layout transitions.
 */
export interface LayoutTransitionOptions {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Easing function name */
  easing?: EasingName;
  /** Delay between each node's animation start (for staggered effect) */
  stagger?: number;
  /** Callback with progress (0 to 1) as nodes complete */
  onProgress?: (progress: number) => void;
  /** Callback when all animations complete */
  onComplete?: () => void;
}

/**
 * Callback invoked when positions are updated during transition.
 */
export type TransitionUpdateCallback = () => void;

/**
 * Animates smooth transitions between layout positions.
 *
 * Supports staggered animations where nodes animate sequentially
 * with a configurable delay between starts.
 *
 * @example
 * ```ts
 * const transition = new LayoutTransition(positions, animationManager, () => {
 *   renderer.render(nodes, edges, positions);
 * });
 *
 * const newLayout = circularLayout.compute(nodes, edges);
 * await transition.to(newLayout, { duration: 500, stagger: 20 });
 * ```
 */
export class LayoutTransition {
  private positions: PositionMap;
  private animationManager: AnimationManager;
  private onUpdate: TransitionUpdateCallback;
  private activeAnimationIds: string[] = [];

  constructor(
    positions: PositionMap,
    animationManager: AnimationManager,
    onUpdate: TransitionUpdateCallback
  ) {
    this.positions = positions;
    this.animationManager = animationManager;
    this.onUpdate = onUpdate;
  }

  /**
   * Update the position map reference.
   */
  setPositions(positions: PositionMap): void {
    this.positions = positions;
  }

  /**
   * Transition all nodes to new positions.
   * Returns a promise that resolves when all animations complete.
   */
  to(targetPositions: PositionMap, options?: LayoutTransitionOptions): Promise<void> {
    return new Promise((resolve) => {
      this.cancel();

      const entries: [string, Position][] = Array.from(targetPositions.entries());
      if (entries.length === 0) {
        resolve();
        return;
      }

      const state = { completed: 0, total: entries.length };
      const resolveWhenDone = this.createCompletionHandler(state, options, resolve);

      entries.forEach(([nodeId, target], index) => {
        this.animateNode({
          nodeId,
          target,
          index,
          options,
          onNodeComplete: resolveWhenDone,
          state,
        });
      });

      if (state.completed === state.total) {
        this.onUpdate();
        resolve();
      }
    });
  }

  private animateNode(params: {
    nodeId: string;
    target: Position;
    index: number;
    options: LayoutTransitionOptions | undefined;
    onNodeComplete: () => void;
    state: { completed: number };
  }): void {
    const { nodeId, target, index, options, onNodeComplete, state } = params;
    const current = this.positions.get(nodeId);

    if (!current) {
      this.positions.set(nodeId, { x: target.x, y: target.y });
      state.completed++;
      return;
    }

    const duration = options?.duration ?? 500;
    const stagger = options?.stagger ?? 0;

    const animId = this.animationManager.animateValues(
      { x: current.x, y: current.y },
      { x: target.x, y: target.y },
      {
        duration,
        easing: options?.easing ?? 'easeOutQuad',
        ...(stagger > 0 && { delay: index * stagger }),
        onUpdate: (values) => {
          this.positions.set(nodeId, { x: values.x, y: values.y });
          this.onUpdate();
        },
        onComplete: onNodeComplete,
      }
    );

    this.activeAnimationIds.push(animId);
  }

  private createCompletionHandler(
    state: { completed: number; total: number },
    options: LayoutTransitionOptions | undefined,
    resolve: () => void
  ): () => void {
    return () => {
      state.completed++;
      options?.onProgress?.(state.completed / state.total);

      if (state.completed === state.total) {
        this.activeAnimationIds = [];
        options?.onComplete?.();
        resolve();
      }
    };
  }

  /**
   * Animate nodes from center to target positions.
   * Useful for initial graph appearance animations.
   */
  fromCenter(
    targetPositions: PositionMap,
    center: Position = { x: 0, y: 0 },
    options?: LayoutTransitionOptions
  ): Promise<void> {
    for (const nodeId of targetPositions.keys()) {
      this.positions.set(nodeId, { x: center.x, y: center.y });
    }

    return this.to(targetPositions, {
      ...options,
      easing: options?.easing ?? 'easeOutExpo',
    });
  }

  /**
   * Animate all nodes to center.
   * Useful for exit animations before removing the graph.
   */
  toCenter(
    nodeIds: string[],
    center: Position = { x: 0, y: 0 },
    options?: LayoutTransitionOptions
  ): Promise<void> {
    const targetPositions: PositionMap = new Map();
    for (const nodeId of nodeIds) {
      targetPositions.set(nodeId, { x: center.x, y: center.y });
    }

    return this.to(targetPositions, {
      ...options,
      easing: options?.easing ?? 'easeInExpo',
    });
  }

  /**
   * Cancel all active transition animations.
   */
  cancel(): void {
    for (const animId of this.activeAnimationIds) {
      this.animationManager.cancel(animId);
    }
    this.activeAnimationIds = [];
  }

  /**
   * Check if a transition is in progress.
   */
  get isTransitioning(): boolean {
    return this.activeAnimationIds.length > 0;
  }
}
