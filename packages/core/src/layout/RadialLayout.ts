import type { Edge, Node, PositionMap } from '../model/types';
import { DEFAULT_LAYOUT_OPTIONS, type Layout, type LayoutOptions } from './types';

export interface RadialLayoutOptions extends LayoutOptions {
  startRadius?: number;
  levelRadius?: number;
  startAngle?: number;
  endAngle?: number;
}

const DEFAULT_RADIAL_OPTIONS: RadialLayoutOptions = {
  ...DEFAULT_LAYOUT_OPTIONS,
  startRadius: 0,
  levelRadius: 100,
  startAngle: 0,
  endAngle: 2 * Math.PI,
};

export class RadialLayout<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> implements Layout<N, E> {
  private options: RadialLayoutOptions;
  private centerNodeId: string | undefined;

  constructor(options: Partial<RadialLayoutOptions> = {}, centerNodeId?: string) {
    this.options = { ...DEFAULT_RADIAL_OPTIONS, ...options };
    this.centerNodeId = centerNodeId ?? undefined;
  }

  compute(nodes: Node<N>[], edges: Edge<E>[]): PositionMap {
    const positions: PositionMap = new Map();
    const {
      width,
      height,
      startRadius = 0,
      levelRadius = 100,
      startAngle = 0,
      endAngle = 2 * Math.PI,
    } = this.options;

    if (nodes.length === 0) return positions;

    const centerX = width / 2;
    const centerY = height / 2;

    const adjacency = this.buildAdjacency(nodes, edges);
    const centerNode = this.findCenterNode(nodes, adjacency);

    if (!centerNode) {
      return this.fallbackCircular(nodes, centerX, centerY);
    }

    const levels = this.bfsLevels(centerNode.id, adjacency, nodes);

    positions.set(centerNode.id, { x: centerX, y: centerY });

    levels.forEach((levelNodeIds, levelIndex) => {
      if (levelIndex === 0) return;

      const radius = startRadius + levelIndex * levelRadius;
      const angleRange = endAngle - startAngle;
      const angleStep = angleRange / levelNodeIds.length;
      let angle = startAngle;

      for (const nodeId of levelNodeIds) {
        positions.set(nodeId, {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        });
        angle += angleStep;
      }
    });

    return positions;
  }

  private buildAdjacency(nodes: Node<N>[], edges: Edge<E>[]): Map<string, Set<string>> {
    const adjacency = new Map<string, Set<string>>();
    for (const node of nodes) {
      adjacency.set(node.id, new Set());
    }
    for (const edge of edges) {
      adjacency.get(edge.source)?.add(edge.target);
      adjacency.get(edge.target)?.add(edge.source);
    }
    return adjacency;
  }

  private findCenterNode(
    nodes: Node<N>[],
    adjacency: Map<string, Set<string>>
  ): Node<N> | undefined {
    if (this.centerNodeId !== undefined) {
      return nodes.find((n) => n.id === this.centerNodeId);
    }

    let maxDegree = -1;
    let centerNode: Node<N> | undefined;

    for (const node of nodes) {
      const degree = adjacency.get(node.id)?.size ?? 0;
      if (degree > maxDegree) {
        maxDegree = degree;
        centerNode = node;
      }
    }

    return centerNode;
  }

  private bfsLevels(
    startId: string,
    adjacency: Map<string, Set<string>>,
    nodes: Node<N>[]
  ): string[][] {
    const levels: string[][] = [[startId]];
    const visited = new Set<string>([startId]);

    while (visited.size < nodes.length) {
      const currentLevel = levels[levels.length - 1];
      if (currentLevel === undefined || currentLevel.length === 0) break;

      const nextLevel = this.collectUnvisitedNeighbors(currentLevel, adjacency, visited);

      if (nextLevel.length > 0) {
        levels.push(nextLevel);
        continue;
      }

      const didAddDisconnected = this.addFirstUnvisitedNode(nodes, visited, levels);
      if (!didAddDisconnected) break;
    }

    return levels;
  }

  private collectUnvisitedNeighbors(
    currentLevel: string[],
    adjacency: Map<string, Set<string>>,
    visited: Set<string>
  ): string[] {
    const nextLevel: string[] = [];
    for (const nodeId of currentLevel) {
      const neighbors = adjacency.get(nodeId) ?? new Set<string>();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextLevel.push(neighbor);
        }
      }
    }
    return nextLevel;
  }

  private addFirstUnvisitedNode(
    nodes: Node<N>[],
    visited: Set<string>,
    levels: string[][]
  ): boolean {
    const firstUnvisited = nodes.find((n) => !visited.has(n.id));
    if (firstUnvisited === undefined) return false;
    visited.add(firstUnvisited.id);
    levels.push([firstUnvisited.id]);
    return true;
  }

  private fallbackCircular(nodes: Node<N>[], centerX: number, centerY: number): PositionMap {
    const positions: PositionMap = new Map();
    const radius = Math.min(this.options.width, this.options.height) / 2 - this.options.padding;
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
