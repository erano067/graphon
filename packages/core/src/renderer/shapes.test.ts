import { describe, expect, it, vi } from 'vitest';
import type { Graphics } from 'pixi.js';
import { DEFAULT_NODE_VISUALS, drawCircles, drawDiamonds, drawShape, drawSquares } from './shapes';

function createMockGraphics(): Graphics {
  return {
    circle: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    closePath: vi.fn().mockReturnThis(),
  } as unknown as Graphics;
}

describe('DEFAULT_NODE_VISUALS', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_NODE_VISUALS.shape).toBe('circle');
    expect(DEFAULT_NODE_VISUALS.radius).toBe(8);
    expect(DEFAULT_NODE_VISUALS.color).toBe(0x4a90d9);
  });
});

describe('drawCircles', () => {
  it('should draw nothing for empty positions', () => {
    const g = createMockGraphics();
    drawCircles(g, [], 10);
    expect(g.circle).not.toHaveBeenCalled();
  });

  it('should draw a circle for each position', () => {
    const g = createMockGraphics();
    const positions = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ];

    drawCircles(g, positions, 5);

    expect(g.circle).toHaveBeenCalledTimes(2);
    expect(g.circle).toHaveBeenCalledWith(10, 20, 5);
    expect(g.circle).toHaveBeenCalledWith(30, 40, 5);
  });
});

describe('drawSquares', () => {
  it('should draw nothing for empty positions', () => {
    const g = createMockGraphics();
    drawSquares(g, [], 10);
    expect(g.rect).not.toHaveBeenCalled();
  });

  it('should draw a centered square for each position', () => {
    const g = createMockGraphics();
    const positions = [{ x: 100, y: 100 }];
    const radius = 10;

    drawSquares(g, positions, radius);

    expect(g.rect).toHaveBeenCalledTimes(1);
    // Centered square: x - radius, y - radius, size = radius * 2
    expect(g.rect).toHaveBeenCalledWith(90, 90, 20, 20);
  });

  it('should draw multiple squares', () => {
    const g = createMockGraphics();
    const positions = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
    ];

    drawSquares(g, positions, 5);

    expect(g.rect).toHaveBeenCalledTimes(2);
    expect(g.rect).toHaveBeenCalledWith(-5, -5, 10, 10);
    expect(g.rect).toHaveBeenCalledWith(45, 45, 10, 10);
  });
});

describe('drawDiamonds', () => {
  it('should draw nothing for empty positions', () => {
    const g = createMockGraphics();
    drawDiamonds(g, [], 10);
    expect(g.moveTo).not.toHaveBeenCalled();
  });

  it('should draw a diamond shape for each position', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];
    const radius = 10;

    drawDiamonds(g, positions, radius);

    // Diamond: top, right, bottom, left, close
    expect(g.moveTo).toHaveBeenCalledWith(50, 40); // top
    expect(g.lineTo).toHaveBeenCalledWith(60, 50); // right
    expect(g.lineTo).toHaveBeenCalledWith(50, 60); // bottom
    expect(g.lineTo).toHaveBeenCalledWith(40, 50); // left
    expect(g.closePath).toHaveBeenCalledTimes(1);
  });

  it('should draw multiple diamonds', () => {
    const g = createMockGraphics();
    const positions = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];

    drawDiamonds(g, positions, 5);

    expect(g.moveTo).toHaveBeenCalledTimes(2);
    expect(g.closePath).toHaveBeenCalledTimes(2);
  });
});

describe('drawShape', () => {
  it('should delegate to drawCircles for circle shape', () => {
    const g = createMockGraphics();
    const positions = [{ x: 10, y: 20 }];

    drawShape(g, positions, 5, 'circle');

    expect(g.circle).toHaveBeenCalledWith(10, 20, 5);
    expect(g.rect).not.toHaveBeenCalled();
    expect(g.moveTo).not.toHaveBeenCalled();
  });

  it('should delegate to drawSquares for square shape', () => {
    const g = createMockGraphics();
    const positions = [{ x: 10, y: 10 }];

    drawShape(g, positions, 5, 'square');

    expect(g.rect).toHaveBeenCalledWith(5, 5, 10, 10);
    expect(g.circle).not.toHaveBeenCalled();
    expect(g.moveTo).not.toHaveBeenCalled();
  });

  it('should delegate to drawDiamonds for diamond shape', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawShape(g, positions, 10, 'diamond');

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalled();
    expect(g.closePath).toHaveBeenCalled();
    expect(g.circle).not.toHaveBeenCalled();
    expect(g.rect).not.toHaveBeenCalled();
  });
});
