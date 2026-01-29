/**
 * Tests for edge curve drawing functions.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Graphics } from 'pixi.js';
import {
  drawArcEdge,
  drawBezierEdge,
  drawCurvedEdge,
  drawSegmentsEdge,
  drawStraightEdge,
  drawTaxiEdge,
  drawUnbundledBezierEdge,
} from './edgeCurves';

function createMockGraphics(): Graphics {
  return {
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    quadraticCurveTo: vi.fn().mockReturnThis(),
    bezierCurveTo: vi.fn().mockReturnThis(),
    closePath: vi.fn().mockReturnThis(),
  } as unknown as Graphics;
}

describe('edgeCurves', () => {
  let graphics: Graphics;

  beforeEach(() => {
    graphics = createMockGraphics();
  });

  describe('drawStraightEdge', () => {
    it('draws a straight line between two points', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawStraightEdge(graphics, source, target);

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.lineTo).toHaveBeenCalledWith(100, 100);
    });

    it('handles negative coordinates', () => {
      const source = { x: -50, y: -50 };
      const target = { x: 50, y: 50 };

      drawStraightEdge(graphics, source, target);

      expect(graphics.moveTo).toHaveBeenCalledWith(-50, -50);
      expect(graphics.lineTo).toHaveBeenCalledWith(50, 50);
    });
  });

  describe('drawBezierEdge', () => {
    it('draws a quadratic bezier curve', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 0 };

      drawBezierEdge(graphics, source, target, 0.3);

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.quadraticCurveTo).toHaveBeenCalled();
    });

    it('uses default curvature when not specified', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 0 };

      drawBezierEdge(graphics, source, target);

      expect(graphics.quadraticCurveTo).toHaveBeenCalled();
    });

    it('handles zero-length edge', () => {
      const source = { x: 50, y: 50 };
      const target = { x: 50, y: 50 };

      drawBezierEdge(graphics, source, target, 0.3);

      expect(graphics.moveTo).toHaveBeenCalledWith(50, 50);
      expect(graphics.quadraticCurveTo).toHaveBeenCalled();
    });
  });

  describe('drawArcEdge', () => {
    it('draws an arc (approximated with bezier)', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 0 };

      drawArcEdge(graphics, source, target, 0.5);

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.quadraticCurveTo).toHaveBeenCalled();
    });
  });

  describe('drawTaxiEdge', () => {
    it('draws horizontal-first taxi path', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawTaxiEdge(graphics, source, target, { direction: 'horizontal' });

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.lineTo).toHaveBeenCalledWith(100, 100);
    });

    it('draws vertical-first taxi path', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawTaxiEdge(graphics, source, target, { direction: 'vertical' });

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.lineTo).toHaveBeenCalledWith(100, 100);
    });

    it('auto-selects direction based on distance', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 200, y: 50 }; // Wider than tall

      drawTaxiEdge(graphics, source, target, { direction: 'auto' });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
    });

    it('uses default options', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawTaxiEdge(graphics, source, target);

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
    });

    it('draws rounded corners when cornerRadius is set', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawTaxiEdge(graphics, source, target, { cornerRadius: 10 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.quadraticCurveTo).toHaveBeenCalled();
    });
  });

  describe('drawSegmentsEdge', () => {
    it('draws polyline through control points', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };
      const controlPoints = [
        { x: 25, y: 50 },
        { x: 75, y: 50 },
      ];

      drawSegmentsEdge(graphics, source, target, controlPoints);

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.lineTo).toHaveBeenCalledWith(25, 50);
      expect(graphics.lineTo).toHaveBeenCalledWith(75, 50);
      expect(graphics.lineTo).toHaveBeenCalledWith(100, 100);
    });

    it('draws straight line with no control points', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawSegmentsEdge(graphics, source, target, []);

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.lineTo).toHaveBeenCalledWith(100, 100);
    });
  });

  describe('drawUnbundledBezierEdge', () => {
    it('draws straight line with no control points', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawUnbundledBezierEdge(graphics, source, target, []);

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.lineTo).toHaveBeenCalledWith(100, 100);
    });

    it('draws quadratic bezier with one control point', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };
      const controlPoints = [{ x: 50, y: 0 }];

      drawUnbundledBezierEdge(graphics, source, target, controlPoints);

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.quadraticCurveTo).toHaveBeenCalledWith(50, 0, 100, 100);
    });

    it('draws cubic bezier with two control points', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };
      const controlPoints = [
        { x: 25, y: 0 },
        { x: 75, y: 100 },
      ];

      drawUnbundledBezierEdge(graphics, source, target, controlPoints);

      expect(graphics.moveTo).toHaveBeenCalledWith(0, 0);
      expect(graphics.bezierCurveTo).toHaveBeenCalledWith(25, 0, 75, 100, 100, 100);
    });
  });

  describe('drawCurvedEdge', () => {
    it('dispatches to straight edge', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawCurvedEdge(graphics, source, target, { style: 'straight' });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
      expect(graphics.quadraticCurveTo).not.toHaveBeenCalled();
    });

    it('dispatches to bezier edge', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 0 };

      drawCurvedEdge(graphics, source, target, { style: 'bezier', curvature: 0.5 });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.quadraticCurveTo).toHaveBeenCalled();
    });

    it('dispatches to arc edge', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 0 };

      drawCurvedEdge(graphics, source, target, { style: 'arc' });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.quadraticCurveTo).toHaveBeenCalled();
    });

    it('dispatches to taxi edge', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawCurvedEdge(graphics, source, target, { style: 'taxi' });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
    });

    it('dispatches to segments edge', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };
      const controlPoints = [{ x: 50, y: 25 }];

      drawCurvedEdge(graphics, source, target, { style: 'segments', controlPoints });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalledWith(50, 25);
    });

    it('dispatches to unbundled-bezier edge', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };
      const controlPoints = [{ x: 50, y: 0 }];

      drawCurvedEdge(graphics, source, target, { style: 'unbundled-bezier', controlPoints });

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.quadraticCurveTo).toHaveBeenCalled();
    });

    it('uses default style when not specified', () => {
      const source = { x: 0, y: 0 };
      const target = { x: 100, y: 100 };

      drawCurvedEdge(graphics, source, target);

      expect(graphics.moveTo).toHaveBeenCalled();
      expect(graphics.lineTo).toHaveBeenCalled();
    });
  });
});
