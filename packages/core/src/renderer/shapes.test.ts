import { describe, expect, it, vi } from 'vitest';
import type { Graphics } from 'pixi.js';
import {
  DEFAULT_NODE_VISUALS,
  drawCircles,
  drawDiamonds,
  drawEllipses,
  drawExtendedShape,
  drawHexagons,
  drawOctagons,
  drawPentagons,
  drawRectangles,
  drawRegularPolygons,
  drawRoundRectangles,
  drawShape,
  drawSingleShape,
  drawSquares,
  drawStars,
  drawTags,
  drawTriangles,
  drawVees,
} from './shapes';

function createMockGraphics(): Graphics {
  return {
    circle: vi.fn().mockReturnThis(),
    ellipse: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    roundRect: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    quadraticCurveTo: vi.fn().mockReturnThis(),
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

// ============================================================================
// Extended Shape Tests
// ============================================================================

describe('drawEllipses', () => {
  it('should draw ellipses at given positions', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawEllipses(g, positions, { radiusX: 15, radiusY: 10 });

    expect(g.ellipse).toHaveBeenCalledWith(50, 50, 15, 10);
  });
});

describe('drawRectangles', () => {
  it('should draw centered rectangles', () => {
    const g = createMockGraphics();
    const positions = [{ x: 100, y: 100 }];

    drawRectangles(g, positions, { width: 30, height: 20 });

    expect(g.rect).toHaveBeenCalledWith(85, 90, 30, 20);
  });
});

describe('drawRoundRectangles', () => {
  it('should draw rounded rectangles', () => {
    const g = createMockGraphics();
    const positions = [{ x: 100, y: 100 }];

    drawRoundRectangles(g, positions, { width: 30, height: 20, cornerRadius: 5 });

    expect(g.roundRect).toHaveBeenCalledWith(85, 90, 30, 20, 5);
  });
});

describe('drawTriangles', () => {
  it('should draw triangles', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawTriangles(g, positions, 10);

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalledTimes(2);
    expect(g.closePath).toHaveBeenCalled();
  });
});

describe('drawRegularPolygons', () => {
  it('should draw pentagons', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawPentagons(g, positions, 10);

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalledTimes(4); // 5 sides - 1 moveTo
    expect(g.closePath).toHaveBeenCalled();
  });

  it('should draw hexagons', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawHexagons(g, positions, 10);

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalledTimes(5); // 6 sides - 1 moveTo
    expect(g.closePath).toHaveBeenCalled();
  });

  it('should draw octagons', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawOctagons(g, positions, 10);

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalledTimes(7); // 8 sides - 1 moveTo
    expect(g.closePath).toHaveBeenCalled();
  });

  it('should handle empty positions', () => {
    const g = createMockGraphics();
    drawRegularPolygons(g, [], 10, { sides: 6 });
    expect(g.moveTo).not.toHaveBeenCalled();
  });
});

describe('drawStars', () => {
  it('should draw 5-pointed star by default', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawStars(g, positions, 10, { points: 5, innerRadiusRatio: 0.4 });

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalledTimes(9); // 10 points - 1 moveTo
    expect(g.closePath).toHaveBeenCalled();
  });

  it('should support custom point count', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawStars(g, positions, 10, { points: 6, innerRadiusRatio: 0.4 }); // 6-pointed star

    expect(g.lineTo).toHaveBeenCalledTimes(11); // 12 points - 1 moveTo
  });
});

describe('drawTags', () => {
  it('should draw tag shapes', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawTags(g, positions, { width: 30, height: 20 });

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalledTimes(4);
    expect(g.closePath).toHaveBeenCalled();
  });
});

describe('drawVees', () => {
  it('should draw vee/chevron shapes', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawVees(g, positions, 10);

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalledTimes(5);
    expect(g.closePath).toHaveBeenCalled();
  });
});

describe('drawExtendedShape', () => {
  it('should draw all extended shape types', () => {
    const shapes = [
      'circle',
      'ellipse',
      'square',
      'rectangle',
      'round-rectangle',
      'diamond',
      'triangle',
      'pentagon',
      'hexagon',
      'octagon',
      'star',
      'tag',
      'vee',
      'polygon',
    ] as const;

    for (const shape of shapes) {
      const g = createMockGraphics();
      expect(() =>
        drawExtendedShape(g, { positions: [{ x: 50, y: 50 }], radius: 10, shape })
      ).not.toThrow();
    }
  });

  it('should use custom options', () => {
    const g = createMockGraphics();
    drawExtendedShape(g, {
      positions: [{ x: 50, y: 50 }],
      radius: 10,
      shape: 'star',
      shapeOptions: { starPoints: 8, starInnerRadius: 0.5 },
    });
    expect(g.lineTo).toHaveBeenCalledTimes(15); // 16 points - 1 moveTo
  });
});

describe('drawSingleShape', () => {
  it('should draw a single shape at given position', () => {
    const g = createMockGraphics();
    drawSingleShape(g, { position: { x: 100, y: 100 }, radius: 10, shape: 'circle' });
    expect(g.circle).toHaveBeenCalledWith(100, 100, 10);
  });
});

describe('drawRoundDiamonds', () => {
  it('should draw nothing for empty positions', () => {
    const g = createMockGraphics();
    drawExtendedShape(g, { positions: [], radius: 10, shape: 'round-diamond' });
    expect(g.moveTo).not.toHaveBeenCalled();
  });

  it('should draw round diamond with bezier curves', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawExtendedShape(g, { positions, radius: 10, shape: 'round-diamond' });

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.quadraticCurveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalled();
    expect(g.closePath).toHaveBeenCalled();
  });

  it('should draw multiple round diamonds', () => {
    const g = createMockGraphics();
    const positions = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];

    drawExtendedShape(g, { positions, radius: 10, shape: 'round-diamond' });

    expect(g.closePath).toHaveBeenCalledTimes(2);
  });
});

describe('drawRoundTriangles', () => {
  it('should draw nothing for empty positions', () => {
    const g = createMockGraphics();
    drawExtendedShape(g, { positions: [], radius: 10, shape: 'round-triangle' });
    expect(g.moveTo).not.toHaveBeenCalled();
  });

  it('should draw round triangle with bezier curves', () => {
    const g = createMockGraphics();
    const positions = [{ x: 50, y: 50 }];

    drawExtendedShape(g, { positions, radius: 10, shape: 'round-triangle' });

    expect(g.moveTo).toHaveBeenCalled();
    expect(g.quadraticCurveTo).toHaveBeenCalled();
    expect(g.lineTo).toHaveBeenCalled();
    expect(g.closePath).toHaveBeenCalled();
  });

  it('should draw multiple round triangles', () => {
    const g = createMockGraphics();
    const positions = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];

    drawExtendedShape(g, { positions, radius: 10, shape: 'round-triangle' });

    expect(g.closePath).toHaveBeenCalledTimes(2);
  });
});
