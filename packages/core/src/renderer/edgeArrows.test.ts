/**
 * Tests for edge arrow drawing functions.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Graphics } from 'pixi.js';
import {
  DEFAULT_ARROW_OPTIONS,
  computeMidArrowPosition,
  computeSourceArrowPosition,
  computeTargetArrowPosition,
  drawArrowShape,
} from './edgeArrows';

interface MockGraphics {
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  closePath: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  circle: ReturnType<typeof vi.fn>;
}

function createMockGraphics(): MockGraphics & Graphics {
  return {
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    closePath: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    circle: vi.fn().mockReturnThis(),
  } as MockGraphics & Graphics;
}

describe('edgeArrows', () => {
  describe('DEFAULT_ARROW_OPTIONS', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_ARROW_OPTIONS.shape).toBe('triangle');
      expect(DEFAULT_ARROW_OPTIONS.size).toBe(10);
      expect(DEFAULT_ARROW_OPTIONS.fill).toBe('filled');
      expect(DEFAULT_ARROW_OPTIONS.color).toBe(0x999999);
    });
  });

  describe('drawArrowShape', () => {
    let graphics: Graphics;

    beforeEach(() => {
      graphics = createMockGraphics();
    });

    it('does nothing for none shape', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, { shape: 'none' });

      expect(graphics.moveTo).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- testing mock fill() method was not called
      expect(graphics.fill).not.toHaveBeenCalled();
    });

    it('draws filled triangle', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, {
        shape: 'triangle',
        size: 10,
        fill: 'filled',
      });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
      expect(graphics.closePath).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- testing mock fill() method was called
      expect(graphics.fill).toHaveBeenCalled();
    });

    it('draws hollow triangle', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, {
        shape: 'triangle',
        size: 10,
        fill: 'hollow',
      });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.closePath).toHaveBeenCalled();
      expect(graphics.stroke).toHaveBeenCalled();
    });

    it('draws vee arrow', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, {
        shape: 'vee',
        size: 10,
        fill: 'filled',
      });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
      expect(graphics.stroke).toHaveBeenCalled();
    });

    it('draws chevron arrow', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, { shape: 'chevron', size: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
      expect(graphics.stroke).toHaveBeenCalled();
    });

    it('draws tee arrow', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, { shape: 'tee', size: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
      expect(graphics.stroke).toHaveBeenCalled();
    });

    it('draws bar arrow (alias for tee)', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, { shape: 'bar', size: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
      expect(graphics.stroke).toHaveBeenCalled();
    });

    it('draws filled circle', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, {
        shape: 'circle',
        size: 10,
        fill: 'filled',
      });

      expect(graphics.circle).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- testing mock fill() method was called
      expect(graphics.fill).toHaveBeenCalled();
    });

    it('draws hollow circle', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, {
        shape: 'circle',
        size: 10,
        fill: 'hollow',
      });

      expect(graphics.circle).toHaveBeenCalled();
      expect(graphics.stroke).toHaveBeenCalled();
    });

    it('draws diamond arrow', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, { shape: 'diamond', size: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
      expect(graphics.closePath).toHaveBeenCalled();
    });

    it('draws square arrow', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, { shape: 'square', size: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
      expect(graphics.closePath).toHaveBeenCalled();
    });

    it('draws triangle-tee arrow', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, { shape: 'triangle-tee', size: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.closePath).toHaveBeenCalled();
    });

    it('draws triangle-cross arrow', () => {
      drawArrowShape(graphics, { x: 50, y: 50 }, 0, { shape: 'triangle-cross', size: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.closePath).toHaveBeenCalled();
    });

    it('applies rotation based on angle', () => {
      const angle = Math.PI / 4; // 45 degrees
      drawArrowShape(graphics, { x: 50, y: 50 }, angle, { shape: 'triangle', size: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      // The coordinates should be rotated
    });
  });

  describe('computeSourceArrowPosition', () => {
    it('computes position at source end offset by node radius', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 0 };
      const nodeRadius = 10;

      const result = computeSourceArrowPosition(source, target, nodeRadius);

      // Source arrow is at source node boundary, offset toward opposite of target
      // angle from target to source is π, so position moves -10 in x
      expect(result.position.x).toBeCloseTo(-10, 5);
      expect(result.position.y).toBeCloseTo(0, 5);
      // Angle points away from source (adding π to angle from target→source)
      // atan2(0, -100) + π = π + π = 2π ≈ 0
      expect(Math.cos(result.angle)).toBeCloseTo(1, 5); // Pointing right
    });

    it('computes angle for diagonal edge', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };
      const nodeRadius = 10;

      const result = computeSourceArrowPosition(source, target, nodeRadius);

      // angle = atan2(0-100, 0-100) + π = atan2(-100, -100) + π = -3π/4 + π = π/4
      expect(result.angle).toBeCloseTo(Math.PI / 4, 1);
    });

    it('handles vertical edges', () => {
      const source = { x: 50, y: 0 };
      const target = { x: 50, y: 100 };
      const nodeRadius = 10;

      const result = computeSourceArrowPosition(source, target, nodeRadius);

      // angle from target to source is -π/2, so offset is (0, -10)
      expect(result.position.x).toBeCloseTo(50, 5);
      expect(result.position.y).toBeCloseTo(-10, 5);
    });
  });

  describe('computeTargetArrowPosition', () => {
    it('computes position at target end offset by node radius', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 0 };
      const nodeRadius = 10;

      const result = computeTargetArrowPosition(source, target, nodeRadius);

      // Target arrow is offset inward from target
      expect(result.position.x).toBeCloseTo(90, 5); // 100 - nodeRadius
      expect(result.position.y).toBeCloseTo(0, 5);
      expect(result.angle).toBeCloseTo(0, 5); // Pointing right
    });

    it('computes angle for diagonal edge', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };
      const nodeRadius = 10;

      const result = computeTargetArrowPosition(source, target, nodeRadius);

      // Angle should be ~45 degrees (π/4)
      expect(result.angle).toBeCloseTo(Math.PI / 4, 1);
    });
  });

  describe('computeMidArrowPosition', () => {
    it('computes position at midpoint', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      const result = computeMidArrowPosition(source, target);

      expect(result.position.x).toBe(50);
      expect(result.position.y).toBe(50);
    });

    it('computes angle pointing from source to target', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 0 };

      const result = computeMidArrowPosition(source, target);

      expect(result.angle).toBeCloseTo(0, 5); // Pointing right
    });

    it('handles reversed direction', () => {
      const source = { x: 100, y: 0 };
      const target = { x: 0, y: 0 };

      const result = computeMidArrowPosition(source, target);

      expect(result.position.x).toBe(50);
      expect(result.angle).toBeCloseTo(Math.PI, 5); // Pointing left
    });
  });
});
