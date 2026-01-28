import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LARGE_GRAPH_THRESHOLD,
  darkenColor,
  drawNodeGroup,
  groupNodesByColor,
} from './renderHelpers';
import type { Graphics } from 'pixi.js';
import type { Node, Position } from '../model/types';

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

describe('groupNodesByColor', () => {
  const createNode = (id: string, data: { community: number }): Node<{ community: number }> => ({
    id,
    data,
  });

  const createPositions = (ids: string[]): Map<string, Position> => {
    const positions = new Map<string, Position>();
    ids.forEach((id, i) => positions.set(id, { x: i * 10, y: i * 10 }));
    return positions;
  };

  it('should group all nodes under default color when no colorFn provided', () => {
    const nodes = [createNode('a', { community: 0 }), createNode('b', { community: 1 })];
    const positions = createPositions(['a', 'b']);
    const defaultColor = 0x4a90d9;

    const groups = groupNodesByColor(nodes, positions, undefined, defaultColor);

    expect(groups.size).toBe(1);
    expect(groups.get(defaultColor)).toHaveLength(2);
  });

  it('should group nodes by color when colorFn provided', () => {
    const nodes = [
      createNode('a', { community: 0 }),
      createNode('b', { community: 0 }),
      createNode('c', { community: 1 }),
    ];
    const positions = createPositions(['a', 'b', 'c']);
    const colorFn = (node: { data: { community: number } }) =>
      node.data.community === 0 ? 0xff0000 : 0x00ff00;

    const groups = groupNodesByColor(nodes, positions, colorFn, 0x000000);

    expect(groups.size).toBe(2);
    expect(groups.get(0xff0000)).toHaveLength(2); // a, b
    expect(groups.get(0x00ff00)).toHaveLength(1); // c
  });

  it('should skip nodes without positions', () => {
    const nodes = [createNode('a', { community: 0 }), createNode('b', { community: 0 })];
    const positions = new Map<string, Position>();
    positions.set('a', { x: 0, y: 0 }); // Only 'a' has position

    const groups = groupNodesByColor(nodes, positions, undefined, 0x4a90d9);

    expect(groups.size).toBe(1);
    expect(groups.get(0x4a90d9)).toHaveLength(1);
  });

  it('should return empty map for empty nodes array', () => {
    const groups = groupNodesByColor([], new Map(), undefined, 0x4a90d9);
    expect(groups.size).toBe(0);
  });

  it('should preserve position coordinates in groups', () => {
    const nodes = [createNode('a', { community: 0 })];
    const positions = new Map<string, Position>();
    positions.set('a', { x: 100, y: 200 });

    const groups = groupNodesByColor(nodes, positions, undefined, 0x4a90d9);
    const positionsInGroup = groups.get(0x4a90d9);

    expect(positionsInGroup).toBeDefined();
    expect(positionsInGroup?.[0]).toEqual({ x: 100, y: 200 });
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

describe('DEFAULT_LARGE_GRAPH_THRESHOLD', () => {
  it('should be 1000', () => {
    expect(DEFAULT_LARGE_GRAPH_THRESHOLD).toBe(1000);
  });
});
