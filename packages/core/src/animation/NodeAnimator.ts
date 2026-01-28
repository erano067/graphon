import type { Position, PositionMap } from '../model/types';
import type { AnimationManager } from './AnimationManager';
import type { EasingName } from './easings';

/**
 * Options for node animations.
 */
export interface NodeAnimationOptions {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Easing function name */
  easing?: EasingName;
  /** Delay before animation starts in milliseconds */
  delay?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Callback invoked when positions are updated during animation.
 */
export type PositionUpdateCallback = () => void;

/**
 * Animates node positions in a PositionMap.
 *
 * Works with the external position storage pattern used throughout Graphon.
 * Call the onUpdate callback to trigger re-renders when positions change.
 *
 * @example
 * ```ts
 * const animator = new NodeAnimator(positions, animationManager, () => {
 *   renderer.render(nodes, edges, positions);
 * });
 * animator.moveTo('node-1', 100, 200, { duration: 300 });
 * ```
 */
export class NodeAnimator {
  private positions: PositionMap;
  private animationManager: AnimationManager;
  private onUpdate: PositionUpdateCallback;
  private activeAnimations = new Map<string, string[]>();

  constructor(
    positions: PositionMap,
    animationManager: AnimationManager,
    onUpdate: PositionUpdateCallback
  ) {
    this.positions = positions;
    this.animationManager = animationManager;
    this.onUpdate = onUpdate;
  }

  /**
   * Update the position map reference.
   * Call this when the position map is replaced (e.g., after layout change).
   */
  setPositions(positions: PositionMap): void {
    this.positions = positions;
  }

  /**
   * Animate a node to a new position.
   */
  moveTo(nodeId: string, x: number, y: number, options?: NodeAnimationOptions): void {
    this.cancelNode(nodeId);

    const current = this.positions.get(nodeId);
    if (!current) return;

    const animId = this.animationManager.animateValues(
      { x: current.x, y: current.y },
      { x, y },
      {
        duration: options?.duration ?? 300,
        easing: options?.easing ?? 'easeOutQuad',
        ...(options?.delay !== undefined && { delay: options.delay }),
        onUpdate: (values) => {
          this.positions.set(nodeId, { x: values.x, y: values.y });
          this.onUpdate();
        },
        ...(options?.onComplete && { onComplete: options.onComplete }),
      }
    );

    this.trackAnimation(nodeId, animId);
  }

  /**
   * Animate multiple nodes to new positions.
   */
  moveMany(targets: Map<string, Position>, options?: NodeAnimationOptions): void {
    for (const [nodeId, pos] of targets) {
      this.moveTo(nodeId, pos.x, pos.y, options);
    }
  }

  /**
   * Cancel all animations for a specific node.
   */
  cancelNode(nodeId: string): void {
    const animIds = this.activeAnimations.get(nodeId);
    if (!animIds) return;

    for (const animId of animIds) {
      this.animationManager.cancel(animId);
    }
    this.activeAnimations.delete(nodeId);
  }

  /**
   * Cancel all active node animations.
   */
  cancelAll(): void {
    for (const nodeId of this.activeAnimations.keys()) {
      this.cancelNode(nodeId);
    }
  }

  /**
   * Check if a specific node has active animations.
   */
  isAnimating(nodeId: string): boolean {
    return this.activeAnimations.has(nodeId);
  }

  /**
   * Check if any node animations are active.
   */
  get hasActiveAnimations(): boolean {
    return this.activeAnimations.size > 0;
  }

  private trackAnimation(nodeId: string, animId: string): void {
    const existing = this.activeAnimations.get(nodeId) ?? [];
    this.activeAnimations.set(nodeId, [...existing, animId]);
  }
}
