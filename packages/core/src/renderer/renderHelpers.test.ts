import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LARGE_GRAPH_THRESHOLD,
  type StyleGroupKey,
  darkenColor,
  drawNodeGroup,
  drawStyledNodeGroup,
  groupNodesByStyle,
  groupNodesByVisuals,
  parseStyleKey,
} from './renderHelpers';
import type { Graphics } from 'pixi.js';
import type { Node, Position } from '../model/types';
import { DEFAULT_NODE_VISUALS } from './shapes';

describe('darkenColor', () => {
  it('should return the same color when factor is 0', () => {
    expect(darkenColor(0xff0000, 0)).toBe(0xff0000); // Red
    expect(darkenColor(0x00ff00, 0)).toBe(0x00ff00); // Green
    expect(darkenColor(0x0000ff, 0)).toBe(0x0000ff); // Blue
    expect(darkenColor(0xffffff, 0)).toBe(0xffffff); // White
  });

  it('should return black when factor is 1', () => {
    expect(darkenColor(0xff0000, 1)).toBe(0x000000);
    expect(darkenColor(0x00ff00, 1)).toBe(0x000000);
    expect(darkenColor(0x0000ff, 1)).toBe(0x000000);
    expect(darkenColor(0xffffff, 1)).toBe(0x000000);
  });

  it('should darken color by 50% when factor is 0.5', () => {
    // 0xff (255) * 0.5 = 127.5 -> floor = 127 = 0x7f
    expect(darkenColor(0xff0000, 0.5)).toBe(0x7f0000);
    expect(darkenColor(0x00ff00, 0.5)).toBe(0x007f00);
    expect(darkenColor(0x0000ff, 0.5)).toBe(0x00007f);
  });

  it('should darken color by 30% (common use case for node strokes)', () => {
    // 0xff (255) * 0.7 = 178.5 -> floor = 178 = 0xb2
    expect(darkenColor(0xffffff, 0.3)).toBe(0xb2b2b2);
  });

  it('should handle black (already darkest)', () => {
    expect(darkenColor(0x000000, 0.5)).toBe(0x000000);
  });
});

describe('drawNodeGroup', () => {
  interface MockGraphics {
    circle: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
  }

  const createMockGraphics = (): MockGraphics => ({
    circle: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  });

  const defaultStyle = {
    radius: 8,
    fill: 0x4a90d9,
    fillAlpha: 1,
    stroke: 0x2d5a87,
    strokeWidth: 2,
    strokeAlpha: 1,
  };

  it('should draw circles and fill for simplified mode', () => {
    const mocks = createMockGraphics();
    const positions = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ];

    drawNodeGroup({
      graphics: mocks as unknown as Graphics,
      positions,
      radius: 8,
      color: 0xff0000,
      isSimplified: true,
      style: defaultStyle,
    });

    expect(mocks.circle).toHaveBeenCalledTimes(2);
    expect(mocks.circle).toHaveBeenCalledWith(10, 20, 8);
    expect(mocks.circle).toHaveBeenCalledWith(30, 40, 8);
    expect(mocks.fill).toHaveBeenCalledWith({ color: 0xff0000, alpha: 1 });
    expect(mocks.stroke).not.toHaveBeenCalled();
  });

  it('should draw circles, fill, and stroke for non-simplified mode', () => {
    const mocks = createMockGraphics();
    const positions = [{ x: 10, y: 20 }];

    drawNodeGroup({
      graphics: mocks as unknown as Graphics,
      positions,
      radius: 8,
      color: 0xffffff,
      isSimplified: false,
      style: defaultStyle,
    });

    // 2 circle calls: one for fill, one for stroke
    expect(mocks.circle).toHaveBeenCalledTimes(2);
    expect(mocks.fill).toHaveBeenCalledTimes(1);
    expect(mocks.stroke).toHaveBeenCalledTimes(1);
    // Stroke color should be darkened (0xffffff * 0.7 = 0xb2b2b2)
    expect(mocks.stroke).toHaveBeenCalledWith({
      width: 2,
      color: 0xb2b2b2,
      alpha: 1,
    });
  });

  it('should handle empty positions array', () => {
    const mocks = createMockGraphics();

    drawNodeGroup({
      graphics: mocks as unknown as Graphics,
      positions: [],
      radius: 8,
      color: 0xff0000,
      isSimplified: true,
      style: defaultStyle,
    });

    expect(mocks.circle).not.toHaveBeenCalled();
    expect(mocks.fill).toHaveBeenCalledTimes(1); // Fill is still called (empty path)
  });
});

describe('drawStyledNodeGroup', () => {
  const defaultStyle = {
    radius: 8,
    fill: 0x4a90d9,
    fillAlpha: 1,
    stroke: 0x2d5a87,
    strokeWidth: 2,
    strokeAlpha: 1,
  };

  const createMocks = () => ({
    circle: vi.fn(),
    rect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  });

  it('should draw circles and fill only for simplified mode', () => {
    const mocks = createMocks();
    const positions = [{ x: 10, y: 20 }];

    drawStyledNodeGroup({
      graphics: mocks as unknown as Graphics,
      positions,
      radius: 8,
      color: 0xff0000,
      shape: 'circle',
      isSimplified: true,
      style: defaultStyle,
    });

    expect(mocks.circle).toHaveBeenCalledTimes(1);
    expect(mocks.fill).toHaveBeenCalledTimes(1);
    expect(mocks.stroke).not.toHaveBeenCalled();
  });

  it('should draw circles with stroke for non-simplified mode', () => {
    const mocks = createMocks();
    const positions = [{ x: 10, y: 20 }];

    drawStyledNodeGroup({
      graphics: mocks as unknown as Graphics,
      positions,
      radius: 8,
      color: 0xffffff,
      shape: 'circle',
      isSimplified: false,
      style: defaultStyle,
    });

    // 2 circle calls: one for fill, one for stroke
    expect(mocks.circle).toHaveBeenCalledTimes(2);
    expect(mocks.fill).toHaveBeenCalledTimes(1);
    expect(mocks.stroke).toHaveBeenCalledTimes(1);
    expect(mocks.stroke).toHaveBeenCalledWith({
      width: 2,
      color: 0xb2b2b2, // darkened white
      alpha: 1,
    });
  });

  it('should draw squares for square shape', () => {
    const mocks = createMocks();
    const positions = [{ x: 100, y: 100 }];

    drawStyledNodeGroup({
      graphics: mocks as unknown as Graphics,
      positions,
      radius: 10,
      color: 0x00ff00,
      shape: 'square',
      isSimplified: true,
      style: defaultStyle,
    });

    expect(mocks.rect).toHaveBeenCalledWith(90, 90, 20, 20);
    expect(mocks.circle).not.toHaveBeenCalled();
  });

  it('should draw diamonds for diamond shape', () => {
    const mocks = createMocks();
    const positions = [{ x: 50, y: 50 }];

    drawStyledNodeGroup({
      graphics: mocks as unknown as Graphics,
      positions,
      radius: 10,
      color: 0x0000ff,
      shape: 'diamond',
      isSimplified: true,
      style: defaultStyle,
    });

    expect(mocks.moveTo).toHaveBeenCalled();
    expect(mocks.lineTo).toHaveBeenCalled();
    expect(mocks.closePath).toHaveBeenCalled();
    expect(mocks.circle).not.toHaveBeenCalled();
  });
});

describe('DEFAULT_LARGE_GRAPH_THRESHOLD', () => {
  it('should be 1000', () => {
    expect(DEFAULT_LARGE_GRAPH_THRESHOLD).toBe(1000);
  });
});

describe('parseStyleKey', () => {
  it('should parse circle shape key', () => {
    const result = parseStyleKey('circle:16711680');
    expect(result.shape).toBe('circle');
    expect(result.color).toBe(0xff0000);
  });

  it('should parse square shape key', () => {
    const result = parseStyleKey('square:65280');
    expect(result.shape).toBe('square');
    expect(result.color).toBe(0x00ff00);
  });

  it('should parse diamond shape key', () => {
    const result = parseStyleKey('diamond:255');
    expect(result.shape).toBe('diamond');
    expect(result.color).toBe(0x0000ff);
  });
});

describe('groupNodesByStyle', () => {
  const createNode = (id: string, data: { type: string }): Node<{ type: string }> => ({
    id,
    data,
  });

  const createPositions = (ids: string[]): Map<string, Position> => {
    const positions = new Map<string, Position>();
    ids.forEach((id, i) => positions.set(id, { x: i * 10, y: i * 10 }));
    return positions;
  };

  it('should group all nodes under default style when no styleFn provided', () => {
    const nodes = [createNode('a', { type: 'hub' }), createNode('b', { type: 'leaf' })];
    const positions = createPositions(['a', 'b']);

    const groups = groupNodesByStyle(nodes, positions, undefined, DEFAULT_NODE_VISUALS);

    expect(groups.size).toBe(1);
    const key: StyleGroupKey = `${DEFAULT_NODE_VISUALS.shape}:${DEFAULT_NODE_VISUALS.color}`;
    expect(groups.get(key)).toHaveLength(2);
  });

  it('should group nodes by shape and color when styleFn provided', () => {
    const nodes = [
      createNode('a', { type: 'hub' }),
      createNode('b', { type: 'hub' }),
      createNode('c', { type: 'leaf' }),
    ];
    const positions = createPositions(['a', 'b', 'c']);
    const styleFn = (node: { data: { type: string } }) =>
      node.data.type === 'hub'
        ? { shape: 'diamond' as const, color: 0xff0000 }
        : { shape: 'circle' as const, color: 0x00ff00 };

    const groups = groupNodesByStyle(nodes, positions, styleFn, DEFAULT_NODE_VISUALS);

    expect(groups.size).toBe(2);
    expect(groups.get('diamond:16711680')).toHaveLength(2); // a, b (hubs)
    expect(groups.get('circle:65280')).toHaveLength(1); // c (leaf)
  });

  it('should use defaults for unspecified style properties', () => {
    const nodes = [createNode('a', { type: 'normal' })];
    const positions = createPositions(['a']);
    const styleFn = () => ({ color: 0x123456 }); // Only specifies color, not shape

    const groups = groupNodesByStyle(nodes, positions, styleFn, DEFAULT_NODE_VISUALS);

    expect(groups.size).toBe(1);
    // Should use default shape 'circle' with custom color
    expect(groups.get('circle:1193046')).toHaveLength(1);
  });

  it('should skip nodes without positions', () => {
    const nodes = [createNode('a', { type: 'hub' }), createNode('b', { type: 'leaf' })];
    const positions = new Map<string, Position>();
    positions.set('a', { x: 0, y: 0 }); // Only 'a' has position

    const groups = groupNodesByStyle(nodes, positions, undefined, DEFAULT_NODE_VISUALS);

    const key: StyleGroupKey = `${DEFAULT_NODE_VISUALS.shape}:${DEFAULT_NODE_VISUALS.color}`;
    expect(groups.get(key)).toHaveLength(1);
  });

  it('should return empty map for empty nodes array', () => {
    const groups = groupNodesByStyle([], new Map(), undefined, DEFAULT_NODE_VISUALS);
    expect(groups.size).toBe(0);
  });
});

describe('groupNodesByVisuals', () => {
  const createNode = (id: string, data: { type: string }): Node<{ type: string }> => ({
    id,
    data,
  });

  const createPositions = (ids: string[]): Map<string, Position> => {
    const positions = new Map<string, Position>();
    ids.forEach((id, i) => positions.set(id, { x: i * 10, y: i * 10 }));
    return positions;
  };

  it('should group all nodes under default visuals when no styleFn provided', () => {
    const nodes = [createNode('a', { type: 'hub' }), createNode('b', { type: 'leaf' })];
    const positions = createPositions(['a', 'b']);

    const groups = groupNodesByVisuals({
      nodes,
      positions,
      styleFn: undefined,
      defaults: DEFAULT_NODE_VISUALS,
    });

    expect(groups.size).toBe(1);
  });

  it('should group nodes by shape, color, radius, and alpha', () => {
    const nodes = [
      createNode('a', { type: 'hub' }),
      createNode('b', { type: 'hub' }),
      createNode('c', { type: 'leaf' }),
    ];
    const positions = createPositions(['a', 'b', 'c']);
    const styleFn = (node: { data: { type: string } }) =>
      node.data.type === 'hub'
        ? { shape: 'diamond' as const, color: 0xff0000, radius: 10, alpha: 1 }
        : { shape: 'circle' as const, color: 0x00ff00, radius: 8, alpha: 0.5 };

    const groups = groupNodesByVisuals({
      nodes,
      positions,
      styleFn,
      defaults: DEFAULT_NODE_VISUALS,
    });

    expect(groups.size).toBe(2);
  });

  it('should skip invisible nodes', () => {
    const nodes = [createNode('a', { type: 'visible' }), createNode('b', { type: 'hidden' })];
    const positions = createPositions(['a', 'b']);
    const styleFn = (node: { data: { type: string } }) => ({
      visible: node.data.type !== 'hidden',
    });

    const groups = groupNodesByVisuals({
      nodes,
      positions,
      styleFn,
      defaults: DEFAULT_NODE_VISUALS,
    });

    let totalPositions = 0;
    groups.forEach((group) => {
      totalPositions += group.positions.length;
    });
    expect(totalPositions).toBe(1);
  });

  it('should skip nodes without positions', () => {
    const nodes = [createNode('a', { type: 'hub' }), createNode('b', { type: 'leaf' })];
    const positions = new Map<string, Position>();
    positions.set('a', { x: 0, y: 0 });

    const groups = groupNodesByVisuals({
      nodes,
      positions,
      styleFn: undefined,
      defaults: DEFAULT_NODE_VISUALS,
    });

    let totalPositions = 0;
    groups.forEach((group) => {
      totalPositions += group.positions.length;
    });
    expect(totalPositions).toBe(1);
  });

  it('should apply alpha modifier when provided', () => {
    const nodes = [createNode('a', { type: 'hub' })];
    const positions = createPositions(['a']);
    const alphaModifier = (_nodeId: string, baseAlpha: number) => baseAlpha * 0.5;

    const groups = groupNodesByVisuals({
      nodes,
      positions,
      styleFn: undefined,
      defaults: DEFAULT_NODE_VISUALS,
      alphaModifier,
    });

    expect(groups.size).toBe(1);
  });

  it('should round radius and alpha to reduce unique keys', () => {
    const nodes = [createNode('a', { type: 'hub' }), createNode('b', { type: 'hub' })];
    const positions = createPositions(['a', 'b']);
    const styleFn = (node: { id: string }) =>
      node.id === 'a' ? { radius: 10.01, alpha: 0.991 } : { radius: 10.04, alpha: 0.994 };

    const groups = groupNodesByVisuals({
      nodes,
      positions,
      styleFn,
      defaults: DEFAULT_NODE_VISUALS,
    });

    expect(groups.size).toBe(1);
  });

  it('should return empty map for empty nodes array', () => {
    const groups = groupNodesByVisuals({
      nodes: [],
      positions: new Map(),
      styleFn: undefined,
      defaults: DEFAULT_NODE_VISUALS,
    });
    expect(groups.size).toBe(0);
  });
});
