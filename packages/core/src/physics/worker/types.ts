/**
 * Types for physics worker communication.
 * Uses TypedArrays for efficient data transfer between threads.
 */

import type { PhysicsConfig } from '../types';

/** Serializable node data for worker initialization */
export interface WorkerNodeData {
  id: string;
  x: number;
  y: number;
}

/** Serializable edge data for worker initialization */
export interface WorkerEdgeData {
  source: string;
  target: string;
}

/** Configuration passed to worker on init */
export interface WorkerInitData {
  nodes: WorkerNodeData[];
  edges: WorkerEdgeData[];
  config: PhysicsConfig;
}

/** Result from a physics tick - uses Float64Array for efficient transfer */
export interface WorkerTickResult {
  /** Packed positions: [x0, y0, x1, y1, ...] in same order as init nodes */
  positions: Float64Array;
  /** Total kinetic energy of the system */
  kineticEnergy: number;
  /** Whether simulation has settled */
  isSettled: boolean;
}

/** Position update from main thread */
export interface WorkerPositionUpdate {
  nodeId: string;
  x: number;
  y: number;
}

/** Pin/unpin request */
export interface WorkerPinRequest {
  nodeId: string;
  pinned: boolean;
}

/** Resize request */
export interface WorkerResizeRequest {
  width: number;
  height: number;
}

/**
 * The worker's exposed API via Comlink.
 * All methods are async from the main thread's perspective.
 */
export interface PhysicsWorkerAPI {
  /** Initialize the simulation with nodes and edges */
  initialize(data: WorkerInitData): void;

  /** Run one physics tick, returns positions as transferable */
  tick(): WorkerTickResult;

  /** Set a node's position (e.g., during drag) */
  setNodePosition(update: WorkerPositionUpdate): void;

  /** Pin or unpin a node */
  setPinned(request: WorkerPinRequest): void;

  /** Resize the simulation bounds */
  resize(request: WorkerResizeRequest): void;

  /** Wake up the simulation after settling */
  wake(): void;

  /** Get current positions without running physics */
  getPositions(): WorkerTickResult;
}
