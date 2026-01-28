import type { Edge, Node, PositionMap } from '../model/types';
import { DEFAULT_LAYOUT_OPTIONS, type Layout, type LayoutOptions } from './types';

export class CircularLayout<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> implements Layout<N, E> {
  private options: LayoutOptions;

  constructor(options: Partial<LayoutOptions> = {}) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  }

  compute(nodes: Node<N>[], _edges: Edge<E>[]): PositionMap {
    const positions: PositionMap = new Map();
    const { width, height, padding } = this.options;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - padding;
    const angleStep = (2 * Math.PI) / nodes.length;

    let angle = -Math.PI / 2;
    for (const node of nodes) {
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
      angle += angleStep;
    }

    return positions;
  }
}
