/**
 * Tests for node decorator functions.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Graphics } from 'pixi.js';
import {
  computeDecoratorPosition,
  createCountBadge,
  createHoverRing,
  createSelectionRing,
  createStatusDot,
  drawBadge,
  drawDecorator,
  drawDecorators,
  drawDot,
  drawRing,
} from './nodeDecorators';

interface MockGraphics {
  circle: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
}

function createMockGraphics(): MockGraphics & Graphics {
  return {
    circle: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
  } as MockGraphics & Graphics;
}

describe('nodeDecorators', () => {
  describe('computeDecoratorPosition', () => {
    const nodeCenter = { x: 100, y: 100 };
    const nodeRadius = 20;
    const decoratorSize = 8;

    it('computes top-right position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'top-right', decoratorSize);
      expect(pos.x).toBeGreaterThan(nodeCenter.x);
      expect(pos.y).toBeLessThan(nodeCenter.y);
    });

    it('computes top-left position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'top-left', decoratorSize);
      expect(pos.x).toBeLessThan(nodeCenter.x);
      expect(pos.y).toBeLessThan(nodeCenter.y);
    });

    it('computes bottom-right position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'bottom-right', decoratorSize);
      expect(pos.x).toBeGreaterThan(nodeCenter.x);
      expect(pos.y).toBeGreaterThan(nodeCenter.y);
    });

    it('computes bottom-left position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'bottom-left', decoratorSize);
      expect(pos.x).toBeLessThan(nodeCenter.x);
      expect(pos.y).toBeGreaterThan(nodeCenter.y);
    });

    it('computes top position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'top', decoratorSize);
      expect(pos.x).toBe(nodeCenter.x);
      expect(pos.y).toBeLessThan(nodeCenter.y);
    });

    it('computes bottom position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'bottom', decoratorSize);
      expect(pos.x).toBe(nodeCenter.x);
      expect(pos.y).toBeGreaterThan(nodeCenter.y);
    });

    it('computes left position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'left', decoratorSize);
      expect(pos.x).toBeLessThan(nodeCenter.x);
      expect(pos.y).toBe(nodeCenter.y);
    });

    it('computes right position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'right', decoratorSize);
      expect(pos.x).toBeGreaterThan(nodeCenter.x);
      expect(pos.y).toBe(nodeCenter.y);
    });

    it('computes center position', () => {
      const pos = computeDecoratorPosition(nodeCenter, nodeRadius, 'center', decoratorSize);
      expect(pos.x).toBe(nodeCenter.x);
      expect(pos.y).toBe(nodeCenter.y);
    });
  });

  describe('drawBadge', () => {
    let graphics: Graphics;

    beforeEach(() => {
      graphics = createMockGraphics();
    });

    it('draws a filled circle', () => {
      drawBadge(graphics, { x: 50, y: 50 }, { color: 0xff0000 });

      expect(graphics.circle).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- testing mock fill() method
      expect(graphics.fill).toHaveBeenCalledWith({ color: 0xff0000 });
    });

    it('draws border when specified', () => {
      drawBadge(
        graphics,
        { x: 50, y: 50 },
        {
          color: 0xff0000,
          borderColor: 0xffffff,
          borderWidth: 2,
        }
      );

      expect(graphics.stroke).toHaveBeenCalledWith({ color: 0xffffff, width: 2 });
    });

    it('uses default size', () => {
      drawBadge(graphics, { x: 50, y: 50 }, { color: 0xff0000 });
      expect(graphics.circle).toHaveBeenCalledWith(50, 50, 4); // Default size 8 / 2
    });

    it('uses custom size', () => {
      drawBadge(graphics, { x: 50, y: 50 }, { color: 0xff0000, size: 12 });
      expect(graphics.circle).toHaveBeenCalledWith(50, 50, 6);
    });
  });

  describe('drawDot', () => {
    let graphics: Graphics;

    beforeEach(() => {
      graphics = createMockGraphics();
    });

    it('draws a filled circle', () => {
      drawDot(graphics, { x: 50, y: 50 }, { color: 0x00ff00 });

      expect(graphics.circle).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- testing mock fill() method
      expect(graphics.fill).toHaveBeenCalledWith({ color: 0x00ff00 });
    });

    it('uses default dot size (smaller than badge)', () => {
      drawDot(graphics, { x: 50, y: 50 }, { color: 0x00ff00 });
      expect(graphics.circle).toHaveBeenCalledWith(50, 50, 3); // Default size 6 / 2
    });
  });

  describe('drawRing', () => {
    let graphics: Graphics;

    beforeEach(() => {
      graphics = createMockGraphics();
    });

    it('draws a ring around node', () => {
      drawRing(graphics, { x: 50, y: 50 }, 20, { color: 0x4a90d9 });

      expect(graphics.circle).toHaveBeenCalled();
      expect(graphics.stroke).toHaveBeenCalledWith({ color: 0x4a90d9, width: 2 });
    });

    it('uses custom width and offset', () => {
      drawRing(graphics, { x: 50, y: 50 }, 20, { color: 0x4a90d9, width: 3, offset: 5 });

      expect(graphics.circle).toHaveBeenCalledWith(50, 50, 25); // nodeRadius + offset
      expect(graphics.stroke).toHaveBeenCalledWith({ color: 0x4a90d9, width: 3 });
    });
  });

  describe('drawDecorator', () => {
    let graphics: Graphics;

    beforeEach(() => {
      graphics = createMockGraphics();
    });

    it('draws badge decorator', () => {
      drawDecorator(graphics, { x: 50, y: 50 }, 20, {
        type: 'badge',
        position: 'top-right',
        color: 0xff0000,
      });

      expect(graphics.circle).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- testing mock fill() method
      expect(graphics.fill).toHaveBeenCalled();
    });

    it('draws dot decorator', () => {
      drawDecorator(graphics, { x: 50, y: 50 }, 20, {
        type: 'dot',
        position: 'bottom-left',
        color: 0x00ff00,
      });

      expect(graphics.circle).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- testing mock fill() method
      expect(graphics.fill).toHaveBeenCalled();
    });

    it('draws ring decorator', () => {
      drawDecorator(graphics, { x: 50, y: 50 }, 20, {
        type: 'ring',
        color: 0x0000ff,
      });

      expect(graphics.circle).toHaveBeenCalled();
      expect(graphics.stroke).toHaveBeenCalled();
    });
  });

  describe('drawDecorators', () => {
    let graphics: Graphics;

    beforeEach(() => {
      graphics = createMockGraphics();
    });

    it('draws multiple decorators', () => {
      drawDecorators(graphics, { x: 50, y: 50 }, 20, [
        { type: 'dot', position: 'top-right', color: 0xff0000 },
        { type: 'ring', color: 0x00ff00 },
      ]);

      // Should have called circle twice (once for dot, once for ring)
      expect(graphics.circle).toHaveBeenCalledTimes(2);
    });

    it('handles empty array', () => {
      drawDecorators(graphics, { x: 50, y: 50 }, 20, []);
      expect(graphics.circle).not.toHaveBeenCalled();
    });
  });

  describe('helper functions', () => {
    describe('createStatusDot', () => {
      it('creates a dot with default position', () => {
        const dot = createStatusDot(0xff0000);
        expect(dot.type).toBe('dot');
        expect(dot.position).toBe('top-right');
        expect(dot.color).toBe(0xff0000);
        expect(dot.borderColor).toBe(0xffffff);
      });

      it('creates a dot with custom position', () => {
        const dot = createStatusDot(0x00ff00, 'bottom-left');
        expect(dot.position).toBe('bottom-left');
      });
    });

    describe('createCountBadge', () => {
      it('creates small badge for single digit', () => {
        const badge = createCountBadge(5);
        expect(badge.type).toBe('badge');
        expect(badge.text).toBe('5');
        expect(badge.size).toBe(10);
      });

      it('creates medium badge for double digit', () => {
        const badge = createCountBadge(42);
        expect(badge.text).toBe('42');
        expect(badge.size).toBe(12);
      });

      it('creates large badge with 99+ for triple digit', () => {
        const badge = createCountBadge(150);
        expect(badge.text).toBe('99+');
        expect(badge.size).toBe(14);
      });

      it('uses custom position and color', () => {
        const badge = createCountBadge(5, 'bottom-right', 0x00ff00);
        expect(badge.position).toBe('bottom-right');
        expect(badge.color).toBe(0x00ff00);
      });
    });

    describe('createSelectionRing', () => {
      it('creates a ring with default color', () => {
        const ring = createSelectionRing();
        expect(ring.type).toBe('ring');
        expect(ring.color).toBe(0x4a90d9);
        expect(ring.width).toBe(2);
        expect(ring.offset).toBe(3);
      });

      it('creates a ring with custom color', () => {
        const ring = createSelectionRing(0xff0000);
        expect(ring.color).toBe(0xff0000);
      });
    });

    describe('createHoverRing', () => {
      it('creates a ring with default color', () => {
        const ring = createHoverRing();
        expect(ring.type).toBe('ring');
        expect(ring.color).toBe(0x666666);
        expect(ring.width).toBe(1);
        expect(ring.offset).toBe(2);
      });
    });
  });
});
