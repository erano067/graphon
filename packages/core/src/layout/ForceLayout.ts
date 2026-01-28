import type { Edge, Node, PositionMap } from '../model/types';
import { DEFAULT_FORCE_OPTIONS, type ForceLayoutOptions, type Layout } from './types';

interface Velocity {
  vx: number;
  vy: number;
}

export class ForceLayout<
  N = Record<string, unknown>,
  E = Record<string, unknown>,
> implements Layout<N, E> {
  private options: ForceLayoutOptions;

  constructor(options: Partial<ForceLayoutOptions> = {}) {
    this.options = { ...DEFAULT_FORCE_OPTIONS, ...options };
  }

  compute(nodes: Node<N>[], edges: Edge<E>[]): PositionMap {
    const positions = this.initializePositions(nodes);
    const velocities = this.initializeVelocities(nodes);
    const adjacency = this.buildAdjacency(nodes, edges);

    for (let i = 0; i < this.options.iterations; i++) {
      const movement = this.tick(nodes, adjacency, positions, velocities);
      if (movement < 0.5) break;
    }

    return positions;
  }

  private initializePositions(nodes: Node<N>[]): PositionMap {
    const positions: PositionMap = new Map();
    const { width, height, padding } = this.options;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;

    for (const node of nodes) {
      positions.set(node.id, {
        x: padding + Math.random() * usableWidth,
        y: padding + Math.random() * usableHeight,
      });
    }

    return positions;
  }

  private initializeVelocities(nodes: Node<N>[]): Map<string, Velocity> {
    const velocities = new Map<string, Velocity>();
    for (const node of nodes) {
      velocities.set(node.id, { vx: 0, vy: 0 });
    }
    return velocities;
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

  private tick(
    nodes: Node<N>[],
    adjacency: Map<string, Set<string>>,
    positions: PositionMap,
    velocities: Map<string, Velocity>
  ): number {
    this.calculateForces(nodes, adjacency, positions, velocities);
    return this.applyVelocities(nodes, positions, velocities);
  }

  private calculateForces(
    nodes: Node<N>[],
    adjacency: Map<string, Set<string>>,
    positions: PositionMap,
    velocities: Map<string, Velocity>
  ): void {
    const { repulsion, attraction, damping } = this.options;

    for (const node of nodes) {
      const pos = positions.get(node.id);
      const vel = velocities.get(node.id);
      if (!pos || !vel) continue;

      let fx = 0;
      let fy = 0;

      for (const other of nodes) {
        if (other.id === node.id) continue;
        const otherPos = positions.get(other.id);
        if (!otherPos) continue;

        const dx = pos.x - otherPos.x;
        const dy = pos.y - otherPos.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);

        const force = repulsion / distSq;
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }

      const neighbors = adjacency.get(node.id) ?? new Set<string>();
      for (const otherId of neighbors) {
        const otherPos = positions.get(otherId);
        if (!otherPos) continue;

        fx += (otherPos.x - pos.x) * attraction;
        fy += (otherPos.y - pos.y) * attraction;
      }

      vel.vx = (vel.vx + fx) * damping;
      vel.vy = (vel.vy + fy) * damping;
    }
  }

  private applyVelocities(
    nodes: Node<N>[],
    positions: PositionMap,
    velocities: Map<string, Velocity>
  ): number {
    const { width, height, padding } = this.options;
    let totalMovement = 0;

    for (const node of nodes) {
      const pos = positions.get(node.id);
      const vel = velocities.get(node.id);
      if (!pos || !vel) continue;

      pos.x += vel.vx;
      pos.y += vel.vy;

      pos.x = Math.max(padding, Math.min(width - padding, pos.x));
      pos.y = Math.max(padding, Math.min(height - padding, pos.y));

      totalMovement += Math.abs(vel.vx) + Math.abs(vel.vy);
    }

    return totalMovement;
  }
}
