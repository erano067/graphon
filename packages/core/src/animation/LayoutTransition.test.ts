import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PositionMap } from '../model/types';
import { AnimationManager } from './AnimationManager';
import { LayoutTransition } from './LayoutTransition';

describe('LayoutTransition', () => {
  let positions: PositionMap;
  let manager: AnimationManager;
  let transition: LayoutTransition;
  let onUpdate: Mock<() => void>;
  let rafCallbacks: ((time: number) => void)[];
  let rafId: number;
  let mockTime: number;

  beforeEach(() => {
    positions = new Map([
      ['node-1', { x: 0, y: 0 }],
      ['node-2', { x: 10, y: 10 }],
    ]);
    manager = new AnimationManager();
    onUpdate = vi.fn<() => void>();
    transition = new LayoutTransition(positions, manager, onUpdate);

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

  describe('to', () => {
    it('transitions all nodes to target positions', async () => {
      const target: PositionMap = new Map([
        ['node-1', { x: 100, y: 100 }],
        ['node-2', { x: 200, y: 200 }],
      ]);

      const promise = transition.to(target, { duration: 100 });
      flushRaf(100);
      await promise;

      expect(positions.get('node-1')).toEqual({ x: 100, y: 100 });
      expect(positions.get('node-2')).toEqual({ x: 200, y: 200 });
    });

    it('calls onUpdate during transition', async () => {
      const target: PositionMap = new Map([['node-1', { x: 100, y: 100 }]]);

      const promise = transition.to(target, { duration: 100 });
      flushRaf(50);
      flushRaf(100);
      await promise;

      expect(onUpdate).toHaveBeenCalled();
    });

    it('calls onProgress with completion ratio', async () => {
      const onProgress = vi.fn();
      const target: PositionMap = new Map([
        ['node-1', { x: 100, y: 100 }],
        ['node-2', { x: 200, y: 200 }],
      ]);

      const promise = transition.to(target, { duration: 100, onProgress });
      flushRaf(100);
      await promise;

      expect(onProgress).toHaveBeenCalledWith(0.5);
      expect(onProgress).toHaveBeenCalledWith(1);
    });

    it('calls onComplete when all animations finish', async () => {
      const onComplete = vi.fn();
      const target: PositionMap = new Map([['node-1', { x: 100, y: 100 }]]);

      const promise = transition.to(target, { duration: 100, onComplete });
      flushRaf(100);
      await promise;

      expect(onComplete).toHaveBeenCalled();
    });

    it('resolves immediately for empty targets', async () => {
      const promise = transition.to(new Map());
      await promise;
      // No assertions needed - just verifying it doesn't hang
    });

    it('handles new nodes without animation', async () => {
      const target: PositionMap = new Map([['node-3', { x: 50, y: 50 }]]);

      const promise = transition.to(target, { duration: 100 });
      await promise;

      expect(positions.get('node-3')).toEqual({ x: 50, y: 50 });
    });
  });

  describe('stagger', () => {
    it('delays each node animation', async () => {
      const target: PositionMap = new Map([
        ['node-1', { x: 100, y: 100 }],
        ['node-2', { x: 200, y: 200 }],
      ]);

      const promise = transition.to(target, { duration: 100, stagger: 50 });

      // At t=50, node-1 should be halfway, node-2 just starting
      flushRaf(50);
      expect(positions.get('node-1')?.x).toBeGreaterThan(0);
      expect(positions.get('node-2')?.x).toBe(10); // Not started yet

      // At t=100, node-1 done, node-2 halfway
      flushRaf(100);
      expect(positions.get('node-1')).toEqual({ x: 100, y: 100 });
      expect(positions.get('node-2')?.x).toBeGreaterThan(10);
      expect(positions.get('node-2')?.x).toBeLessThan(200);

      // At t=150, both done
      flushRaf(150);
      await promise;

      expect(positions.get('node-2')).toEqual({ x: 200, y: 200 });
    });
  });

  describe('fromCenter', () => {
    it('sets all nodes to center then animates to targets', async () => {
      const target: PositionMap = new Map([
        ['node-1', { x: 100, y: 100 }],
        ['node-2', { x: -100, y: -100 }],
      ]);

      const promise = transition.fromCenter(target, { x: 0, y: 0 }, { duration: 100 });

      // Nodes should start at center
      expect(positions.get('node-1')).toEqual({ x: 0, y: 0 });
      expect(positions.get('node-2')).toEqual({ x: 0, y: 0 });

      flushRaf(100);
      await promise;

      expect(positions.get('node-1')).toEqual({ x: 100, y: 100 });
      expect(positions.get('node-2')).toEqual({ x: -100, y: -100 });
    });
  });

  describe('toCenter', () => {
    it('animates all nodes to center', async () => {
      const promise = transition.toCenter(
        ['node-1', 'node-2'],
        { x: 50, y: 50 },
        { duration: 100 }
      );

      flushRaf(100);
      await promise;

      expect(positions.get('node-1')).toEqual({ x: 50, y: 50 });
      expect(positions.get('node-2')).toEqual({ x: 50, y: 50 });
    });
  });

  describe('cancel', () => {
    it('stops all transition animations', () => {
      const target: PositionMap = new Map([
        ['node-1', { x: 100, y: 100 }],
        ['node-2', { x: 200, y: 200 }],
      ]);

      void transition.to(target, { duration: 100 });
      flushRaf(50);
      transition.cancel();

      const pos1 = { ...positions.get('node-1') };
      const pos2 = { ...positions.get('node-2') };

      flushRaf(100);

      // Positions should not have changed after cancel
      expect(positions.get('node-1')?.x).toBeCloseTo(pos1.x ?? 0, 0);
      expect(positions.get('node-2')?.x).toBeCloseTo(pos2.x ?? 0, 0);
    });
  });

  describe('isTransitioning', () => {
    it('returns true during transition', () => {
      void transition.to(new Map([['node-1', { x: 100, y: 100 }]]), { duration: 100 });
      expect(transition.isTransitioning).toBe(true);
    });

    it('returns false when no transition', () => {
      expect(transition.isTransitioning).toBe(false);
    });
  });
});
