import type { Edge, Node, PositionMap } from '../model/types';

export type LayoutType = 'force' | 'circular' | 'grid';

export interface LayoutOptions {
  width: number;
  height: number;
  padding: number;
}

export interface ForceLayoutOptions extends LayoutOptions {
  iterations: number;
  repulsion: number;
  attraction: number;
  damping: number;
}

/**
 * Layout interface - computes positions for nodes.
 * Layouts are stateless - they compute positions from scratch each time.
 */
export interface Layout<N = Record<string, unknown>, E = Record<string, unknown>> {
  compute(nodes: Node<N>[], edges: Edge<E>[]): PositionMap;
}

export const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  width: 800,
  height: 600,
  padding: 50,
};

export const DEFAULT_FORCE_OPTIONS: ForceLayoutOptions = {
  ...DEFAULT_LAYOUT_OPTIONS,
  iterations: 50,
  repulsion: 1000,
  attraction: 0.05,
  damping: 0.85,
};
