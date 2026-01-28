/**
 * Core physics worker logic.
 *
 * Extracted from physics.worker.ts to enable unit testing.
 * This class runs the force-directed layout calculations.
 */

import {
  DEFAULT_PHYSICS_CONFIG,
  type NodeState,
  type PhysicsConfig,
  SETTLE_THRESHOLD,
} from '../types';
import { buildQuadtree } from '../Quadtree';
import { applyForce, applyVelocities, computeForces } from '../forces';
import type {
  PhysicsWorkerAPI,
  WorkerInitData,
  WorkerPinRequest,
  WorkerPositionUpdate,
  WorkerResizeRequest,
  WorkerTickResult,
} from './types';

export class PhysicsWorkerCore implements PhysicsWorkerAPI {
  private config: PhysicsConfig = { ...DEFAULT_PHYSICS_CONFIG };
  private nodeStates = new Map<string, NodeState>();
  private adjacency = new Map<string, Set<string>>();
  private nodeOrder: string[] = [];
  private isSettled = false;
  private kineticEnergy = Infinity;

  initialize(data: WorkerInitData): void {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...data.config };
    this.nodeStates.clear();
    this.adjacency.clear();
    this.nodeOrder = [];
    this.isSettled = false;
    this.kineticEnergy = Infinity;

    this.initializeNodeStates(data.nodes);
    this.buildAdjacency(data.nodes, data.edges);
  }

  private initializeNodeStates(nodes: WorkerInitData['nodes']): void {
    for (const node of nodes) {
      this.nodeOrder.push(node.id);
      this.nodeStates.set(node.id, {
        id: node.id,
        x: node.x,
        y: node.y,
        vx: 0,
        vy: 0,
        pinned: false,
      });
    }
  }

  private buildAdjacency(nodes: WorkerInitData['nodes'], edges: WorkerInitData['edges']): void {
    for (const node of nodes) {
      this.adjacency.set(node.id, new Set());
    }
    for (const edge of edges) {
      this.adjacency.get(edge.source)?.add(edge.target);
      this.adjacency.get(edge.target)?.add(edge.source);
    }
  }

  tick(): WorkerTickResult {
    if (!this.isSettled) {
      this.runPhysicsTick();
    }
    return this.packResult();
  }

  private runPhysicsTick(): void {
    const states = Array.from(this.nodeStates.values());
    const quadtree = buildQuadtree(states, this.config.width, this.config.height);

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
    this.updateKineticEnergy(states);
  }

  private updateKineticEnergy(states: NodeState[]): void {
    let energy = 0;
    for (const state of states) {
      if (!state.pinned) {
        energy += state.vx * state.vx + state.vy * state.vy;
      }
    }
    this.kineticEnergy = energy;
    this.isSettled = energy < SETTLE_THRESHOLD;
  }

  private packResult(): WorkerTickResult {
    const positions = new Float64Array(this.nodeOrder.length * 2);
    let i = 0;
    for (const id of this.nodeOrder) {
      const state = this.nodeStates.get(id);
      if (state) {
        positions[i++] = state.x;
        positions[i++] = state.y;
      }
    }
    return { positions, kineticEnergy: this.kineticEnergy, isSettled: this.isSettled };
  }

  setNodePosition(update: WorkerPositionUpdate): void {
    const state = this.nodeStates.get(update.nodeId);
    if (!state) return;
    state.x = update.x;
    state.y = update.y;
    state.vx = 0;
    state.vy = 0;
  }

  setPinned(request: WorkerPinRequest): void {
    const state = this.nodeStates.get(request.nodeId);
    if (!state) return;
    state.pinned = request.pinned;
    if (request.pinned) {
      state.vx = 0;
      state.vy = 0;
    } else {
      this.wake();
    }
  }

  resize(request: WorkerResizeRequest): void {
    this.config.width = request.width;
    this.config.height = request.height;
  }

  wake(): void {
    this.isSettled = false;
    this.kineticEnergy = Infinity;
  }

  getPositions(): WorkerTickResult {
    return this.packResult();
  }
}
