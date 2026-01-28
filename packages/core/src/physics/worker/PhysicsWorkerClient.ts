/**
 * Main thread client for the physics worker.
 *
 * Provides the same interface as PhysicsSimulation but runs
 * calculations in a web worker for better performance.
 */

import * as Comlink from 'comlink';
import type { Edge, Node, Position, PositionMap } from '../../model/types';
import { DEFAULT_PHYSICS_CONFIG, type PhysicsConfig } from '../types';
import { computeCommunityPositions, createInitialNodeState } from '../positions';
import type { PhysicsWorkerAPI, WorkerNodeData, WorkerTickResult } from './types';

export interface PhysicsWorkerClientOptions<N> {
  config?: Partial<PhysicsConfig>;
  communityFn?: (node: Node<N>) => number;
  /**
   * Custom worker factory for environments that need special worker creation.
   * If not provided, uses standard Worker constructor.
   */
  createWorker?: () => Worker;
}

export class PhysicsWorkerClient<N = Record<string, unknown>, E = Record<string, unknown>> {
  private config: PhysicsConfig;
  private worker: Worker | null = null;
  private api: Comlink.Remote<PhysicsWorkerAPI> | null = null;
  private nodeOrder: string[] = [];
  private cachedPositions: PositionMap = new Map();
  private communityFn: ((node: Node<N>) => number) | undefined;
  private isSettled = false;
  private kineticEnergy = Infinity;
  private createWorkerFn: (() => Worker) | undefined;

  constructor(options: PhysicsWorkerClientOptions<N> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...options.config };
    this.communityFn = options.communityFn;
    this.createWorkerFn = options.createWorker;
  }

  /**
   * Initialize the worker and simulation.
   * Must be called before tick().
   */
  async initialize(nodes: Node<N>[], edges: Edge<E>[]): Promise<PositionMap> {
    this.ensureWorker();
    const api = this.getApi();

    const workerNodes = this.prepareWorkerNodes(nodes);
    const workerEdges = edges.map((e) => ({ source: e.source, target: e.target }));
    this.nodeOrder = nodes.map((n) => n.id);

    await api.initialize({ nodes: workerNodes, edges: workerEdges, config: this.config });

    const result = await api.getPositions();
    this.updateFromResult(result);
    return this.getPositions();
  }

  private prepareWorkerNodes(nodes: Node<N>[]): WorkerNodeData[] {
    const communityPositions = computeCommunityPositions(nodes, this.config, this.communityFn);
    return nodes.map((node) => {
      const state = createInitialNodeState(node, this.config, communityPositions, this.communityFn);
      return { id: state.id, x: state.x, y: state.y };
    });
  }

  /**
   * Run one physics tick asynchronously.
   */
  async tick(): Promise<PositionMap> {
    const api = this.getApi();
    const result = await api.tick();
    this.updateFromResult(result);
    return this.getPositions();
  }

  private updateFromResult(result: WorkerTickResult): void {
    this.isSettled = result.isSettled;
    this.kineticEnergy = result.kineticEnergy;
    this.unpackPositions(result.positions);
  }

  private unpackPositions(packed: Float64Array): void {
    this.cachedPositions.clear();
    for (let i = 0; i < this.nodeOrder.length; i++) {
      const id = this.nodeOrder[i];
      const x = packed[i * 2];
      const y = packed[i * 2 + 1];
      if (id === undefined || x === undefined || y === undefined) continue;
      this.cachedPositions.set(id, { x, y });
    }
  }

  /** Set a node's position (e.g., during drag). */
  async setNodePosition(nodeId: string, position: Position): Promise<void> {
    if (!this.api) return;
    await this.api.setNodePosition({ nodeId, x: position.x, y: position.y });
    this.cachedPositions.set(nodeId, { ...position });
  }

  /** Pin a node in place. */
  async pinNode(nodeId: string): Promise<void> {
    if (!this.api) return;
    await this.api.setPinned({ nodeId, pinned: true });
  }

  /** Unpin a node to allow movement. */
  async unpinNode(nodeId: string): Promise<void> {
    if (!this.api) return;
    await this.api.setPinned({ nodeId, pinned: false });
    this.isSettled = false;
  }

  /** Resize the simulation bounds. */
  async resize(width: number, height: number): Promise<void> {
    this.config.width = width;
    this.config.height = height;
    if (this.api) {
      await this.api.resize({ width, height });
    }
  }

  /** Wake up the simulation. */
  async wake(): Promise<void> {
    if (!this.api) return;
    await this.api.wake();
    this.isSettled = false;
  }

  /**
   * Get current positions (cached from last tick).
   */
  getPositions(): PositionMap {
    return new Map(this.cachedPositions);
  }

  /**
   * Check if simulation has settled.
   */
  hasSettled(): boolean {
    return this.isSettled;
  }

  /**
   * Get current kinetic energy.
   */
  getKineticEnergy(): number {
    return this.kineticEnergy;
  }

  /**
   * Terminate the worker.
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.api = null;
    }
  }

  private ensureWorker(): void {
    if (this.worker) return;

    this.worker = this.createWorkerFn
      ? this.createWorkerFn()
      : new Worker(new URL('./physics.worker.ts', import.meta.url), { type: 'module' });

    this.api = Comlink.wrap<PhysicsWorkerAPI>(this.worker);
  }

  private getApi(): Comlink.Remote<PhysicsWorkerAPI> {
    if (!this.api) {
      throw new Error('PhysicsWorkerClient not initialized. Call initialize() first.');
    }
    return this.api;
  }
}

/**
 * Check if web workers are supported in the current environment.
 */
export function supportsWebWorkers(): boolean {
  return typeof Worker !== 'undefined';
}
