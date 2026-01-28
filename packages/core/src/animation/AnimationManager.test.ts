import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimationManager } from './AnimationManager';

describe('AnimationManager', () => {
  let manager: AnimationManager;
  let rafCallbacks: ((time: number) => void)[];
  let rafId: number;
  let mockTime: number;

  beforeEach(() => {
    manager = new AnimationManager();
    rafCallbacks = [];
    rafId = 0;
    mockTime = 0;

    vi.stubGlobal('performance', { now: () => mockTime });

    vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });

    vi.stubGlobal('cancelAnimationFrame', (_id: number) => {
      // Just track that it was called
    });
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

  it('creates and runs an animation', () => {
    const values: number[] = [];
    manager.animate(0, 100, {
      duration: 1000,
      easing: 'linear',
      onUpdate: (value) => values.push(value),
    });

    expect(manager.isAnimating).toBe(true);
    expect(manager.animationCount).toBe(1);

    flushRaf(500);
    expect(values.length).toBeGreaterThan(0);
  });

  it('returns animation ID', () => {
    const id = manager.animate(0, 100, { duration: 1000 });
    expect(id).toMatch(/^anim_\d+$/);
  });

  it('cancels animation by ID', () => {
    const onComplete = vi.fn();
    const id = manager.animate(0, 100, { duration: 1000, onComplete });

    manager.cancel(id);
    expect(manager.isAnimating).toBe(false);

    flushRaf(1500);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cancels all animations', () => {
    manager.animate(0, 100, { duration: 1000 });
    manager.animate(0, 200, { duration: 2000 });
    expect(manager.animationCount).toBe(2);

    manager.cancelAll();
    expect(manager.animationCount).toBe(0);
    expect(manager.isAnimating).toBe(false);
  });

  it('removes completed animations', () => {
    const onComplete = vi.fn();
    manager.animate(0, 100, { duration: 100, onComplete });

    expect(manager.animationCount).toBe(1);

    // Run past completion
    flushRaf(200);

    expect(onComplete).toHaveBeenCalled();
    // Animation should be removed after completion
    expect(manager.animationCount).toBe(0);
  });

  it('animates multiple values together', () => {
    const results: { x: number; y: number }[] = [];
    manager.animateValues(
      { x: 0, y: 0 },
      { x: 100, y: 200 },
      {
        duration: 1000,
        easing: 'linear',
        onUpdate: (values) => results.push({ ...values }),
      }
    );

    flushRaf(500);
    expect(results.length).toBeGreaterThan(0);
    const lastResult = results.at(-1);
    expect(lastResult).toBeDefined();
    expect(lastResult?.x).toBeCloseTo(50, 0);
    expect(lastResult?.y).toBeCloseTo(100, 0);
  });

  it('handles cancel of non-existent ID gracefully', () => {
    expect(() => manager.cancel('non_existent')).not.toThrow();
  });

  it('destroy cleans up all animations', () => {
    manager.animate(0, 100, { duration: 1000 });
    manager.animate(0, 200, { duration: 2000 });

    manager.destroy();
    expect(manager.animationCount).toBe(0);
  });
});
