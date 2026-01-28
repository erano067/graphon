/**
 * Configuration options for the physics simulation.
 *
 * These parameters control how the force-directed layout behaves.
 * Adjust these values to change the look and feel of the graph layout.
 */
export interface PhysicsConfig {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Padding from canvas edges in pixels */
  padding: number;
  /** Spring force strength for connected nodes (higher = stronger attraction) */
  springStrength: number;
  /** Ideal spring length between connected nodes in pixels */
  springLength: number;
  /** Maximum spring force to prevent long edges from dominating (0 = unlimited) */
  maxSpringForce: number;
  /** Repulsion force between all nodes (higher = more spread out) */
  repulsion: number;
  /** Velocity damping factor (0-1, lower = faster stabilization) */
  damping: number;
  /** Maximum velocity cap to prevent instability */
  maxVelocity: number;
  /** Barnes-Hut approximation threshold (0-1, higher = faster but less accurate) */
  theta: number;
}

/**
 * Internal state of a node during physics simulation.
 */
export interface NodeState {
  /** Node identifier */
  id: string;
  /** Current X position */
  x: number;
  /** Current Y position */
  y: number;
  /** Current X velocity */
  vx: number;
  /** Current Y velocity */
  vy: number;
  /** If true, node position is fixed and won't move */
  pinned: boolean;
}

/**
 * A node in the Barnes-Hut quadtree for efficient force calculations.
 *
 * The quadtree divides space into quadrants to approximate distant
 * node forces, reducing complexity from O(n²) to O(n log n).
 */
export interface QuadNode {
  /** Center of mass X coordinate */
  cx: number;
  /** Center of mass Y coordinate */
  cy: number;
  /** Total mass of all nodes in this quadrant */
  mass: number;
  /** Quadrant origin X */
  x: number;
  /** Quadrant origin Y */
  y: number;
  /** Quadrant width (and height, since square) */
  width: number;
  /** Child quadrants [NW, NE, SW, SE] */
  children: (QuadNode | undefined)[];
  /** Index of single node if leaf, undefined if internal */
  nodeIndex: number | undefined;
}

export interface Force {
  fx: number;
  fy: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface RepulsionParams {
  position: Position;
  node: QuadNode;
  repulsion: number;
  theta: number;
}

export interface SpringParams {
  state: NodeState;
  adjacency: Map<string, Set<string>>;
  nodeStates: Map<string, NodeState>;
  config: { springStrength: number; springLength: number; maxSpringForce: number };
}

export const VELOCITY_CUTOFF = 0.01;
export const CENTER_GRAVITY = 0.00002;
export const DIST_EPSILON = 0.01;

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  width: 800,
  height: 600,
  padding: 50,
  springStrength: 0.015,
  springLength: 80,
  maxSpringForce: 2,
  repulsion: 400,
  damping: 0.7,
  maxVelocity: 10,
  theta: 0.8,
};
