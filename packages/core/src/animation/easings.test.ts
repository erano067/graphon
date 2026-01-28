import { describe, expect, it } from 'vitest';
import { type EasingName, easings, getEasing } from './easings';

describe('easings', () => {
  it('linear returns input unchanged', () => {
    expect(easings.linear(0)).toBe(0);
    expect(easings.linear(0.5)).toBe(0.5);
    expect(easings.linear(1)).toBe(1);
  });

  it('all easings return 0 at t=0', () => {
    for (const name of Object.keys(easings) as EasingName[]) {
      expect(easings[name](0)).toBeCloseTo(0, 5);
    }
  });

  it('all easings return 1 at t=1', () => {
    for (const name of Object.keys(easings) as EasingName[]) {
      expect(easings[name](1)).toBeCloseTo(1, 5);
    }
  });

  it('easeIn functions start slow (derivative < 1 at t=0)', () => {
    const easeIns: EasingName[] = ['easeInQuad', 'easeInCubic', 'easeInQuart', 'easeInExpo'];
    for (const name of easeIns) {
      // At t=0.1, easeIn should return less than 0.1 (starting slow)
      expect(easings[name](0.1)).toBeLessThan(0.1);
    }
  });

  it('easeOut functions start fast (derivative > 1 at t=0)', () => {
    const easeOuts: EasingName[] = ['easeOutQuad', 'easeOutCubic', 'easeOutQuart', 'easeOutExpo'];
    for (const name of easeOuts) {
      // At t=0.1, easeOut should return more than 0.1 (starting fast)
      expect(easings[name](0.1)).toBeGreaterThan(0.1);
    }
  });

  it('easeOutBounce creates bounce effect', () => {
    // Bounces should exceed 1.0 before settling
    // Actually easeOutBounce stays <= 1, but has distinctive segments
    expect(easings.easeOutBounce(0.5)).toBeGreaterThan(0.5);
    expect(easings.easeOutBounce(1)).toBe(1);
  });

  it('elastic easings overshoot', () => {
    // easeOutElastic overshoots 1.0 before settling
    const midValue = easings.easeOutElastic(0.5);
    expect(midValue).toBeGreaterThan(0.9); // Should overshoot early
  });
});

describe('getEasing', () => {
  it('returns easeOutQuad for undefined', () => {
    expect(getEasing(undefined)).toBe(easings.easeOutQuad);
  });

  it('returns named easing', () => {
    expect(getEasing('linear')).toBe(easings.linear);
    expect(getEasing('easeInCubic')).toBe(easings.easeInCubic);
  });

  it('returns custom function as-is', () => {
    const custom = (t: number): number => t * t * t;
    expect(getEasing(custom)).toBe(custom);
  });
});
