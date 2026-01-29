/**
 * Tests for node gradient functions.
 */

import { describe, expect, it } from 'vitest';
import {
  type ColorStop,
  type LinearGradient,
  type RadialGradient,
  computeLinearGradientOffset,
  computeRadialGradientOffset,
  createTwoColorGradient,
  getGradientColorAtOffset,
  getPrimaryGradientColor,
  gradientsEqual,
  interpolateColor,
  sampleGradientColor,
} from './nodeGradients';

describe('nodeGradients', () => {
  describe('interpolateColor', () => {
    it('returns first color at t=0', () => {
      const result = interpolateColor(0xff0000, 0x0000ff, 0);
      expect(result).toBe(0xff0000);
    });

    it('returns second color at t=1', () => {
      const result = interpolateColor(0xff0000, 0x0000ff, 1);
      expect(result).toBe(0x0000ff);
    });

    it('returns midpoint color at t=0.5', () => {
      const result = interpolateColor(0xff0000, 0x0000ff, 0.5);
      // Red (255,0,0) to Blue (0,0,255) at midpoint = (128,0,128) due to rounding
      expect(result).toBe(0x800080);
    });

    it('handles black to white', () => {
      const result = interpolateColor(0x000000, 0xffffff, 0.5);
      // Should be gray (128, 128, 128) = 0x808080
      expect(result).toBe(0x808080);
    });
  });

  describe('getGradientColorAtOffset', () => {
    const stops: ColorStop[] = [
      { offset: 0, color: 0xff0000 },
      { offset: 0.5, color: 0x00ff00 },
      { offset: 1, color: 0x0000ff },
    ];

    it('returns first color at offset 0', () => {
      const result = getGradientColorAtOffset(stops, 0);
      expect(result).toBe(0xff0000);
    });

    it('returns last color at offset 1', () => {
      const result = getGradientColorAtOffset(stops, 1);
      expect(result).toBe(0x0000ff);
    });

    it('returns middle color at offset 0.5', () => {
      const result = getGradientColorAtOffset(stops, 0.5);
      expect(result).toBe(0x00ff00);
    });

    it('interpolates between stops', () => {
      const result = getGradientColorAtOffset(stops, 0.25);
      // Between red (0) and green (0.5), at midpoint = (128, 128, 0)
      expect(result).toBe(0x808000);
    });

    it('clamps offset below 0', () => {
      const result = getGradientColorAtOffset(stops, -1);
      expect(result).toBe(0xff0000);
    });

    it('clamps offset above 1', () => {
      const result = getGradientColorAtOffset(stops, 2);
      expect(result).toBe(0x0000ff);
    });

    it('handles empty stops array', () => {
      const result = getGradientColorAtOffset([], 0.5);
      expect(result).toBe(0x000000);
    });

    it('handles single stop', () => {
      const result = getGradientColorAtOffset([{ offset: 0, color: 0xff0000 }], 0.5);
      expect(result).toBe(0xff0000);
    });
  });

  describe('computeLinearGradientOffset', () => {
    it('returns 0 at top for to-bottom direction', () => {
      const center = { x: 50, y: 50 };
      const point = { x: 50, y: 40 }; // Above center
      const result = computeLinearGradientOffset(point, center, 10, 'to-bottom');
      expect(result).toBe(0);
    });

    it('returns 1 at bottom for to-bottom direction', () => {
      const center = { x: 50, y: 50 };
      const point = { x: 50, y: 60 }; // Below center
      const result = computeLinearGradientOffset(point, center, 10, 'to-bottom');
      expect(result).toBe(1);
    });

    it('returns 0.5 at center', () => {
      const center = { x: 50, y: 50 };
      const point = { x: 50, y: 50 }; // At center
      const result = computeLinearGradientOffset(point, center, 10, 'to-bottom');
      expect(result).toBe(0.5);
    });

    it('handles to-right direction', () => {
      const center = { x: 50, y: 50 };
      const rightPoint = { x: 60, y: 50 };
      const result = computeLinearGradientOffset(rightPoint, center, 10, 'to-right');
      expect(result).toBe(1);
    });

    it('handles diagonal direction', () => {
      const center = { x: 50, y: 50 };
      const point = { x: 50, y: 50 }; // At center
      const result = computeLinearGradientOffset(point, center, 10, 'to-bottom-right');
      expect(result).toBeCloseTo(0.5);
    });
  });

  describe('computeRadialGradientOffset', () => {
    it('returns 0 at center', () => {
      const center = { x: 50, y: 50 };
      const point = { x: 50, y: 50 };
      const result = computeRadialGradientOffset(point, center, 10);
      expect(result).toBe(0);
    });

    it('returns 1 at edge', () => {
      const center = { x: 50, y: 50 };
      const point = { x: 60, y: 50 }; // At edge (10 units right)
      const result = computeRadialGradientOffset(point, center, 10);
      expect(result).toBe(1);
    });

    it('returns 0.5 at half radius', () => {
      const center = { x: 50, y: 50 };
      const point = { x: 55, y: 50 }; // Half way (5 units right)
      const result = computeRadialGradientOffset(point, center, 10);
      expect(result).toBe(0.5);
    });

    it('clamps beyond radius to 1', () => {
      const center = { x: 50, y: 50 };
      const point = { x: 70, y: 50 }; // Beyond radius
      const result = computeRadialGradientOffset(point, center, 10);
      expect(result).toBe(1);
    });
  });

  describe('sampleGradientColor', () => {
    it('samples linear gradient color', () => {
      const gradient: LinearGradient = {
        type: 'linear',
        direction: 'to-bottom',
        stops: [
          { offset: 0, color: 0xff0000 },
          { offset: 1, color: 0x0000ff },
        ],
      };
      const center = { x: 50, y: 50 };

      // At center, should be midpoint color (128, 0, 128) due to rounding
      const result = sampleGradientColor(gradient, center, center, 10);
      expect(result).toBe(0x800080);
    });

    it('samples radial gradient color', () => {
      const gradient: RadialGradient = {
        type: 'radial',
        stops: [
          { offset: 0, color: 0xffffff },
          { offset: 1, color: 0x000000 },
        ],
      };
      const center = { x: 50, y: 50 };

      // At center, should be white
      const result = sampleGradientColor(gradient, center, center, 10);
      expect(result).toBe(0xffffff);
    });
  });

  describe('getPrimaryGradientColor', () => {
    it('returns middle color for linear gradient', () => {
      const gradient: LinearGradient = {
        type: 'linear',
        direction: 'to-bottom',
        stops: [
          { offset: 0, color: 0xff0000 },
          { offset: 1, color: 0x0000ff },
        ],
      };
      const result = getPrimaryGradientColor(gradient);
      // Midpoint color (128, 0, 128) due to rounding
      expect(result).toBe(0x800080);
    });

    it('returns center color for radial gradient', () => {
      const gradient: RadialGradient = {
        type: 'radial',
        stops: [
          { offset: 0, color: 0xff0000 },
          { offset: 1, color: 0x0000ff },
        ],
      };
      const result = getPrimaryGradientColor(gradient);
      expect(result).toBe(0xff0000);
    });
  });

  describe('gradientsEqual', () => {
    it('returns true for identical gradients', () => {
      const a: LinearGradient = {
        type: 'linear',
        direction: 'to-bottom',
        stops: [{ offset: 0, color: 0xff0000 }],
      };
      const b: LinearGradient = {
        type: 'linear',
        direction: 'to-bottom',
        stops: [{ offset: 0, color: 0xff0000 }],
      };
      expect(gradientsEqual(a, b)).toBe(true);
    });

    it('returns false for different types', () => {
      const a: LinearGradient = {
        type: 'linear',
        direction: 'to-bottom',
        stops: [{ offset: 0, color: 0xff0000 }],
      };
      const b: RadialGradient = {
        type: 'radial',
        stops: [{ offset: 0, color: 0xff0000 }],
      };
      expect(gradientsEqual(a, b)).toBe(false);
    });

    it('returns false for different directions', () => {
      const a: LinearGradient = {
        type: 'linear',
        direction: 'to-bottom',
        stops: [{ offset: 0, color: 0xff0000 }],
      };
      const b: LinearGradient = {
        type: 'linear',
        direction: 'to-right',
        stops: [{ offset: 0, color: 0xff0000 }],
      };
      expect(gradientsEqual(a, b)).toBe(false);
    });

    it('returns true for both undefined', () => {
      expect(gradientsEqual(undefined, undefined)).toBe(true);
    });

    it('returns false if one is undefined', () => {
      const a: LinearGradient = {
        type: 'linear',
        direction: 'to-bottom',
        stops: [],
      };
      expect(gradientsEqual(a, undefined)).toBe(false);
    });
  });

  describe('createTwoColorGradient', () => {
    it('creates linear gradient by default', () => {
      const result = createTwoColorGradient(0xff0000, 0x0000ff);
      expect(result.type).toBe('linear');
      if (result.type === 'linear') {
        expect(result.direction).toBe('to-bottom');
      }
      expect(result.stops).toHaveLength(2);
    });

    it('creates radial gradient when specified', () => {
      const result = createTwoColorGradient(0xff0000, 0x0000ff, 'radial');
      expect(result.type).toBe('radial');
      expect(result.stops).toHaveLength(2);
    });

    it('uses custom direction', () => {
      const result = createTwoColorGradient(0xff0000, 0x0000ff, 'linear', 'to-right');
      if (result.type === 'linear') {
        expect(result.direction).toBe('to-right');
      }
    });
  });
});
