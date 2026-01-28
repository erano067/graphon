export interface PhysicsConfig {
  width: number;
  height: number;
  padding: number;
  springStrength: number;
  springLength: number;
  repulsion: number;
  damping: number;
  maxVelocity: number;
  theta: number;
}

export interface NodeState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

export interface QuadNode {
  cx: number;
  cy: number;
  mass: number;
  x: number;
  y: number;
  width: number;
  children: (QuadNode | undefined)[];
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
  config: { springStrength: number; springLength: number };
}

export const VELOCITY_CUTOFF = 0.01;
export const CENTER_GRAVITY = 0.0002;
export const DIST_EPSILON = 0.01;

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  width: 800,
  height: 600,
  padding: 50,
  springStrength: 0.015,
  springLength: 80,
  repulsion: 400,
  damping: 0.7,
  maxVelocity: 10,
  theta: 0.8,
};
