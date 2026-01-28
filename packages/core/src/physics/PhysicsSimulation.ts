import type { Edge, Node, Position, PositionMap } from '../model/types';
import { DEFAULT_PHYSICS_CONFIG, type NodeState, type PhysicsConfig } from './types';
import { buildQuadtree } from './Quadtree';
import { applyForce, applyVelocities, computeForces } from './forces';
import { computeCommunityPositions, createInitialNodeState } from './positions';

export class PhysicsSimulation<N = Record<string, unknown>, E = Record<string, unknown>> {
  private config: PhysicsConfig;
  private nodeStates = new Map<string, NodeState>();
  private adjacency = new Map<string, Set<string>>();
  private communityGetter?: (node: Node<N>) => number;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
  }

  setCommunityGetter(fn: (node: Node<N>) => number): void {
    this.communityGetter = fn;
  }

  initialize(nodes: Node<N>[], edges: Edge<E>[]): PositionMap {
    this.nodeStates.clear();
    this.adjacency.clear();

    const communityPositions = computeCommunityPositions(nodes, this.config, this.communityGetter);

    for (const node of nodes) {
      const state = createInitialNodeState(
        node,
        this.config,
        communityPositions,
        this.communityGetter
      );
      this.nodeStates.set(node.id, state);
    }

    this.buildAdjacency(nodes, edges);
    return this.getPositions();
  }

  tick(): PositionMap {
    const states = Array.from(this.nodeStates.values());
    const { width, height } = this.config;
    const quadtree = buildQuadtree(states, width, height);

    for (const state of states) {
      if (state.pinned) continue;
      const force = computeForces({
        state,
        adjacency: this.adjacency,
        nodeStates: this.nodeStates,
        quadtree,
        config: this.config,
      });
      applyForce(state, force, this.config);
    }

    applyVelocities(states);
    return this.getPositions();
  }

  setNodePosition(nodeId: string, position: Position): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;
    state.x = position.x;
    state.y = position.y;
    state.vx = 0;
    state.vy = 0;
  }

  pinNode(nodeId: string): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;
    state.pinned = true;
    state.vx = 0;
    state.vy = 0;
  }

  unpinNode(nodeId: string): void {
    const state = this.nodeStates.get(nodeId);
    if (state) state.pinned = false;
  }

  getPositions(): PositionMap {
    const positions: PositionMap = new Map();
    for (const [id, state] of this.nodeStates) {
      positions.set(id, { x: state.x, y: state.y });
    }
    return positions;
  }

  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
  }

  private buildAdjacency(nodes: Node<N>[], edges: Edge<E>[]): void {
    for (const node of nodes) {
      this.adjacency.set(node.id, new Set());
    }
    for (const edge of edges) {
      this.adjacency.get(edge.source)?.add(edge.target);
      this.adjacency.get(edge.target)?.add(edge.source);
    }
  }
}

export function createPhysicsSimulation<N = Record<string, unknown>, E = Record<string, unknown>>(
  config?: Partial<PhysicsConfig>
): PhysicsSimulation<N, E> {
  return new PhysicsSimulation<N, E>(config);
}
