import { describe, expect, it, vi } from 'vitest';
import { Tween } from './Tween';

describe('Tween', () => {
  it('interpolates value from start to end', () => {
    const values: number[] = [];
    const tween = new Tween(0, 100, {
      duration: 1000,
      easing: 'linear',
      onUpdate: (value) => values.push(value),
    });

    tween.start(0);
    tween.update(0); // t=0
    tween.update(500); // t=0.5
    tween.update(1000); // t=1

    expect(values[0]).toBeCloseTo(0);
    expect(values[1]).toBeCloseTo(50);
    expect(values[2]).toBeCloseTo(100);
  });

  it('applies easing function', () => {
    const values: number[] = [];
    const tween = new Tween(0, 100, {
      duration: 1000,
      easing: 'easeInQuad', // t^2
      onUpdate: (value) => values.push(value),
    });

    tween.start(0);
    tween.update(500); // t=0.5, eased = 0.25

    expect(values[0]).toBeCloseTo(25); // 100 * 0.25
  });

  it('respects delay', () => {
    const values: number[] = [];
    const tween = new Tween(0, 100, {
      duration: 1000,
      delay: 500,
      easing: 'linear',
      onUpdate: (value) => values.push(value),
    });

    tween.start(0);
    expect(tween.update(250)).toBe(true); // Still in delay
    expect(values.length).toBe(0);

    tween.update(500); // Delay ends, progress = 0
    expect(values[0]).toBeCloseTo(0);

    tween.update(1000); // progress = 0.5
    expect(values[1]).toBeCloseTo(50);
  });

  it('calls onComplete when finished', () => {
    const onComplete = vi.fn();
    const tween = new Tween(0, 100, {
      duration: 1000,
      onComplete,
    });

    tween.start(0);
    expect(tween.update(500)).toBe(true);
    expect(onComplete).not.toHaveBeenCalled();

    expect(tween.update(1000)).toBe(false);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('can be canceled', () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const tween = new Tween(0, 100, {
      duration: 1000,
      onUpdate,
      onComplete,
    });

    tween.start(0);
    tween.update(500);
    expect(onUpdate).toHaveBeenCalled();

    tween.cancel();
    expect(tween.canceled).toBe(true);
    expect(tween.running).toBe(false);

    onUpdate.mockClear();
    tween.update(1000);
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('reports running state correctly', () => {
    const tween = new Tween(0, 100, { duration: 1000 });

    expect(tween.running).toBe(false);
    tween.start(0);
    expect(tween.running).toBe(true);
    tween.update(1000);
    expect(tween.running).toBe(false);
  });

  it('clamps progress to 1 when overshooting', () => {
    const values: number[] = [];
    const tween = new Tween(0, 100, {
      duration: 1000,
      easing: 'linear',
      onUpdate: (value) => values.push(value),
    });

    tween.start(0);
    tween.update(2000); // Way past end

    expect(values[0]).toBeCloseTo(100); // Clamped to end value
  });

  it('accepts custom easing function', () => {
    const values: number[] = [];
    const customEasing = (t: number): number => t * t * t; // Cubic
    const tween = new Tween(0, 1000, {
      duration: 1000,
      easing: customEasing,
      onUpdate: (value) => values.push(value),
    });

    tween.start(0);
    tween.update(500); // t=0.5, eased = 0.125

    expect(values[0]).toBeCloseTo(125); // 1000 * 0.125
  });
});
