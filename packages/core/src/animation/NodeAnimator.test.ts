import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PositionMap } from '../model/types';
import { AnimationManager } from './AnimationManager';
import { NodeAnimator } from './NodeAnimator';

describe('NodeAnimator', () => {
  let positions: PositionMap;
  let manager: AnimationManager;
  let animator: NodeAnimator;
  let onUpdate: Mock<() => void>;
  let rafCallbacks: ((time: number) => void)[];
  let rafId: number;
  let mockTime: number;

  beforeEach(() => {
    positions = new Map([
      ['node-1', { x: 0, y: 0 }],
      ['node-2', { x: 100, y: 100 }],
    ]);
    manager = new AnimationManager();
    onUpdate = vi.fn<() => void>();
    animator = new NodeAnimator(positions, manager, onUpdate);

    rafCallbacks = [];
    rafId = 0;
    mockTime = 0;

    vi.stubGlobal('performance', { now: () => mockTime });
    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    manager.destroy();
    vi.unstubAllGlobals();
  });

  function flushRaf(time: number): void {
    mockTime = time;
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    for (const cb of callbacks) {
      cb(time);
    }
  }

  describe('moveTo', () => {
    it('animates node to new position', () => {
      animator.moveTo('node-1', 100, 50, { duration: 100 });

      flushRaf(50);
      expect(positions.get('node-1')?.x).toBeCloseTo(50, 0);
      expect(positions.get('node-1')?.y).toBeCloseTo(25, 0);
      expect(onUpdate).toHaveBeenCalled();
    });

    it('completes animation at target position', () => {
      animator.moveTo('node-1', 100, 50, { duration: 100 });

      flushRaf(100);
      expect(positions.get('node-1')).toEqual({ x: 100, y: 50 });
    });

    it('calls onComplete when finished', () => {
      const onComplete = vi.fn();
      animator.moveTo('node-1', 100, 50, { duration: 100, onComplete });

      flushRaf(100);
      expect(onComplete).toHaveBeenCalled();
    });

    it('does nothing for non-existent node', () => {
      animator.moveTo('non-existent', 100, 50);
      flushRaf(50);

      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('moveMany', () => {
    it('animates multiple nodes', () => {
      animator.moveMany(
        new Map([
          ['node-1', { x: 50, y: 50 }],
          ['node-2', { x: 150, y: 150 }],
        ]),
        { duration: 100 }
      );

      flushRaf(100);

      expect(positions.get('node-1')).toEqual({ x: 50, y: 50 });
      expect(positions.get('node-2')).toEqual({ x: 150, y: 150 });
    });
  });

  describe('cancelNode', () => {
    it('stops animation for specific node', () => {
      animator.moveTo('node-1', 100, 100, { duration: 100 });
      animator.moveTo('node-2', 200, 200, { duration: 100 });

      flushRaf(25);
      animator.cancelNode('node-1');
      const stoppedPos = { ...positions.get('node-1') };

      flushRaf(100);

      // node-1 should not have moved further
      expect(positions.get('node-1')?.x).toBe(stoppedPos.x);
      // node-2 should have completed
      expect(positions.get('node-2')).toEqual({ x: 200, y: 200 });
    });
  });

  describe('cancelAll', () => {
    it('stops all node animations', () => {
      animator.moveTo('node-1', 100, 100, { duration: 100 });
      animator.moveTo('node-2', 200, 200, { duration: 100 });

      flushRaf(25);
      animator.cancelAll();

      const pos1 = { ...positions.get('node-1') };
      const pos2 = { ...positions.get('node-2') };

      flushRaf(100);

      expect(positions.get('node-1')?.x).toBe(pos1.x);
      expect(positions.get('node-2')?.x).toBe(pos2.x);
    });
  });

  describe('isAnimating', () => {
    it('returns true for node with active animation', () => {
      animator.moveTo('node-1', 100, 100, { duration: 100 });
      expect(animator.isAnimating('node-1')).toBe(true);
    });

    it('returns false for node without animation', () => {
      expect(animator.isAnimating('node-1')).toBe(false);
    });
  });

  describe('hasActiveAnimations', () => {
    it('returns true when animations are active', () => {
      animator.moveTo('node-1', 100, 100, { duration: 100 });
      expect(animator.hasActiveAnimations).toBe(true);
    });

    it('returns false when no animations', () => {
      expect(animator.hasActiveAnimations).toBe(false);
    });
  });

  describe('setPositions', () => {
    it('updates position map reference', () => {
      const newPositions: PositionMap = new Map([['node-3', { x: 0, y: 0 }]]);
      animator.setPositions(newPositions);
      animator.moveTo('node-3', 100, 100, { duration: 100 });

      flushRaf(100);
      expect(newPositions.get('node-3')).toEqual({ x: 100, y: 100 });
    });
  });
});
