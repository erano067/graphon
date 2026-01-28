/**
 * Unified interface for physics simulations.
 *
 * Both PhysicsSimulation (main thread) and PhysicsWorkerClient (worker thread)
 * implement this interface, allowing seamless switching between them.
 */

import type { Edge, Node, Position, PositionMap } from '../model/types';

/**
 * Common interface for physics simulations.
 * All methods that differ between sync/async are made async for compatibility.
 */
export interface PhysicsEngine<N = Record<string, unknown>, E = Record<string, unknown>> {
  /** Initialize with nodes and edges, returns initial positions */
  initialize(nodes: Node<N>[], edges: Edge<E>[]): PositionMap | Promise<PositionMap>;

  /** Run one physics tick, returns new positions */
  tick(): PositionMap | Promise<PositionMap>;

  /** Get current positions without running physics */
  getPositions(): PositionMap;

  /** Set a specific node's position */
  setNodePosition(nodeId: string, position: Position): void | Promise<void>;

  /** Pin a node in place */
  pinNode(nodeId: string): void | Promise<void>;

  /** Unpin a node */
  unpinNode(nodeId: string): void | Promise<void>;

  /** Wake up the simulation after settling */
  wake(): void | Promise<void>;

  /** Resize simulation bounds */
  resize(width: number, height: number): void | Promise<void>;

  /** Check if simulation has settled */
  hasSettled(): boolean;

  /** Get current kinetic energy */
  getKineticEnergy(): number;
}

/**
 * Type guard to check if physics engine returns promises (is async/worker-based)
 */
export function isAsyncPhysicsEngine<N, E>(
  engine: PhysicsEngine<N, E>
): engine is PhysicsEngine<N, E> & {
  tick(): Promise<PositionMap>;
  initialize(nodes: Node<N>[], edges: Edge<E>[]): Promise<PositionMap>;
} {
  // PhysicsWorkerClient has a terminate method
  return 'terminate' in engine;
}
