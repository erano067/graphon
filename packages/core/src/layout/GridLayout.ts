import type { Edge, Node, PositionMap } from '../model/types';
import { DEFAULT_LAYOUT_OPTIONS, type Layout, type LayoutOptions } from './types';

export class GridLayout<N = Record<string, unknown>, E = Record<string, unknown>> implements Layout<
  N,
  E
> {
  private options: LayoutOptions;

  constructor(options: Partial<LayoutOptions> = {}) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  }

  compute(nodes: Node<N>[], _edges: Edge<E>[]): PositionMap {
    const positions: PositionMap = new Map();
    const { width, height, padding } = this.options;
    const count = nodes.length;

    if (count === 0) return positions;

    const cols = Math.ceil(Math.sqrt(count));
    const rowCount = Math.ceil(count / cols);

    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const cellWidth = usableWidth / cols;
    const cellHeight = usableHeight / rowCount;

    nodes.forEach((node, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      positions.set(node.id, {
        x: padding + cellWidth * (col + 0.5),
        y: padding + cellHeight * (row + 0.5),
      });
    });

    return positions;
  }
}
