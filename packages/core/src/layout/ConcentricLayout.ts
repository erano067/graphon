import type { Edge, Node, PositionMap } from '../model/types';
import { DEFAULT_LAYOUT_OPTIONS, type Layout, type LayoutOptions } from './types';

export interface ConcentricLayoutOptions extends LayoutOptions {
  minRadius?: number;
  levelWidth?: number;
  startAngle?: number;
}

const DEFAULT_CONCENTRIC_OPTIONS: ConcentricLayoutOptions = {
  ...DEFAULT_LAYOUT_OPTIONS,
  minRadius: 50,
  levelWidth: 80,
  startAngle: -Math.PI / 2,
};

export class ConcentricLayout<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> implements Layout<N, E> {
  private options: ConcentricLayoutOptions;
  private metricFn: (node: Node<N>, edges: Edge<E>[]) => number;

  constructor(
    options: Partial<ConcentricLayoutOptions> = {},
    metricFn?: (node: Node<N>, edges: Edge<E>[]) => number
  ) {
    this.options = { ...DEFAULT_CONCENTRIC_OPTIONS, ...options };
    this.metricFn = metricFn ?? this.defaultMetric.bind(this);
  }

  private defaultMetric(node: Node<N>, edges: Edge<E>[]): number {
    return edges.filter((e) => e.source === node.id || e.target === node.id).length;
  }

  compute(nodes: Node<N>[], edges: Edge<E>[]): PositionMap {
    const positions: PositionMap = new Map();
    const {
      width,
      height,
      minRadius = 50,
      levelWidth = 80,
      startAngle = -Math.PI / 2,
    } = this.options;

    if (nodes.length === 0) return positions;

    const centerX = width / 2;
    const centerY = height / 2;

    const scored = nodes.map((node) => ({
      node,
      score: this.metricFn(node, edges),
    }));

    scored.sort((a, b) => b.score - a.score);

    const levels = this.groupByLevel(scored);

    levels.forEach((levelNodes, levelIndex) => {
      const radius = minRadius + levelIndex * levelWidth;
      const angleStep = (2 * Math.PI) / levelNodes.length;
      let angle = startAngle;

      for (const { node } of levelNodes) {
        if (levelIndex === 0 && levelNodes.length === 1) {
          positions.set(node.id, { x: centerX, y: centerY });
        } else {
          positions.set(node.id, {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          });
        }
        angle += angleStep;
      }
    });

    return positions;
  }

  private groupByLevel(
    scored: { node: Node<N>; score: number }[]
  ): { node: Node<N>; score: number }[][] {
    if (scored.length === 0) return [];

    const levels: { node: Node<N>; score: number }[][] = [];
    let currentScore = scored[0]?.score;
    let currentLevel: { node: Node<N>; score: number }[] = [];

    for (const item of scored) {
      if (item.score !== currentScore) {
        if (currentLevel.length > 0) {
          levels.push(currentLevel);
        }
        currentLevel = [item];
        currentScore = item.score;
      } else {
        currentLevel.push(item);
      }
    }

    if (currentLevel.length > 0) {
      levels.push(currentLevel);
    }

    return levels;
  }
}
