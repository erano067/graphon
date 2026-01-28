import {
  CENTER_GRAVITY,
  type Force,
  type NodeState,
  type PhysicsConfig,
  type QuadNode,
  type SpringParams,
  VELOCITY_CUTOFF,
} from './types';
import { calculateRepulsion } from './Quadtree';

interface ComputeForcesParams {
  state: NodeState;
  adjacency: Map<string, Set<string>>;
  nodeStates: Map<string, NodeState>;
  quadtree: QuadNode;
  config: PhysicsConfig;
}

export function computeForces(params: ComputeForcesParams): Force {
  const { state, adjacency, nodeStates, quadtree, config } = params;
  const { springStrength, springLength, repulsion, width, height, theta } = config;

  const repForce = calculateRepulsion({
    position: { x: state.x, y: state.y },
    node: quadtree,
    repulsion,
    theta,
  });
  const springForce = computeSpringForces({
    state,
    adjacency,
    nodeStates,
    config: { springStrength, springLength },
  });
  const centerForce = computeCenterGravity(state, width, height);

  return {
    fx: repForce.fx + springForce.fx + centerForce.fx,
    fy: repForce.fy + springForce.fy + centerForce.fy,
  };
}

export function applyForce(state: NodeState, force: Force, config: PhysicsConfig): void {
  const { damping, maxVelocity } = config;

  state.vx = state.vx * damping + force.fx;
  state.vy = state.vy * damping + force.fy;

  const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);

  if (speed > maxVelocity) {
    state.vx = (state.vx / speed) * maxVelocity;
    state.vy = (state.vy / speed) * maxVelocity;
  }

  if (speed < VELOCITY_CUTOFF) {
    state.vx = 0;
    state.vy = 0;
  }
}

export function applyVelocities(states: NodeState[], config: PhysicsConfig): void {
  const { padding, width, height } = config;

  for (const state of states) {
    if (state.pinned) continue;

    state.x += state.vx;
    state.y += state.vy;

    state.x = Math.max(padding, Math.min(width - padding, state.x));
    state.y = Math.max(padding, Math.min(height - padding, state.y));
  }
}

function computeSpringForces(params: SpringParams): Force {
  const { state, adjacency, nodeStates, config } = params;
  const { springStrength, springLength } = config;
  const neighbors = adjacency.get(state.id);
  if (!neighbors) return { fx: 0, fy: 0 };

  let fx = 0;
  let fy = 0;

  for (const neighborId of neighbors) {
    const neighbor = nodeStates.get(neighborId);
    if (!neighbor) continue;

    const dx = neighbor.x - state.x;
    const dy = neighbor.y - state.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = springStrength * (dist - springLength);

    fx += (dx / dist) * force;
    fy += (dy / dist) * force;
  }

  return { fx, fy };
}

function computeCenterGravity(state: NodeState, width: number, height: number): Force {
  return {
    fx: (width / 2 - state.x) * CENTER_GRAVITY,
    fy: (height / 2 - state.y) * CENTER_GRAVITY,
  };
}
