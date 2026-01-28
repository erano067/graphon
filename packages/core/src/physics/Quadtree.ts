import {
  DIST_EPSILON,
  type Force,
  type NodeState,
  type QuadNode,
  type RepulsionParams,
} from './types';

export function buildQuadtree(states: NodeState[], width: number, height: number): QuadNode {
  const bounds = computeBounds(states, width, height);
  const root = createRootNode(bounds);
  states.forEach((state, i) => insertNode(root, state.x, state.y, i));
  computeMassDistribution(root, states);
  return root;
}

interface Bounds {
  minX: number;
  minY: number;
  size: number;
}

function computeBounds(states: NodeState[], defaultWidth: number, defaultHeight: number): Bounds {
  if (states.length === 0) {
    return { minX: 0, minY: 0, size: Math.max(defaultWidth, defaultHeight) };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const state of states) {
    minX = Math.min(minX, state.x);
    minY = Math.min(minY, state.y);
    maxX = Math.max(maxX, state.x);
    maxY = Math.max(maxY, state.y);
  }

  // Add margin to prevent nodes at edges from causing issues
  const margin = 100;
  minX -= margin;
  minY -= margin;
  maxX += margin;
  maxY += margin;

  // Quadtree needs square bounds
  const size = Math.max(maxX - minX, maxY - minY, 1);

  return { minX, minY, size };
}

export function calculateRepulsion(params: RepulsionParams): Force {
  const { position, node, repulsion, theta } = params;
  if (node.mass === 0) return { fx: 0, fy: 0 };

  const dx = position.x - node.cx;
  const dy = position.y - node.cy;
  const distSq = dx * dx + dy * dy + DIST_EPSILON;
  const dist = Math.sqrt(distSq);

  const isLeafOrFarEnough = node.width / dist < theta || node.nodeIndex !== undefined;
  if (isLeafOrFarEnough) {
    const force = (repulsion * node.mass) / distSq;
    return { fx: (dx / dist) * force, fy: (dy / dist) * force };
  }

  return node.children.reduce<Force>(
    (acc, child) => {
      if (!child) return acc;
      const childForce = calculateRepulsion({ position, node: child, repulsion, theta });
      return { fx: acc.fx + childForce.fx, fy: acc.fy + childForce.fy };
    },
    { fx: 0, fy: 0 }
  );
}

function createRootNode(bounds: Bounds): QuadNode {
  return {
    cx: 0,
    cy: 0,
    mass: 0,
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.size,
    children: [undefined, undefined, undefined, undefined],
    nodeIndex: undefined,
  };
}

function insertNode(node: QuadNode, x: number, y: number, index: number): void {
  if (node.mass === 0 && node.nodeIndex === undefined) {
    node.nodeIndex = index;
    node.mass = 1;
    node.cx = x;
    node.cy = y;
    return;
  }

  if (node.width < 1) return;

  const halfWidth = node.width / 2;

  if (node.nodeIndex !== undefined) {
    const existingIdx = node.nodeIndex;
    node.nodeIndex = undefined;
    const existingQuad = getQuadrant({
      nodeX: node.x,
      nodeY: node.y,
      halfWidth,
      px: node.cx,
      py: node.cy,
    });
    ensureChild(node, existingQuad);
    const existingChild = node.children[existingQuad];
    if (existingChild) insertNode(existingChild, node.cx, node.cy, existingIdx);
  }

  const quad = getQuadrant({ nodeX: node.x, nodeY: node.y, halfWidth, px: x, py: y });
  ensureChild(node, quad);
  const child = node.children[quad];
  if (child) insertNode(child, x, y, index);
}

function ensureChild(parent: QuadNode, quadrant: number): void {
  if (parent.children[quadrant]) return;

  const halfWidth = parent.width / 2;
  const x = parent.x + (quadrant % 2 === 1 ? halfWidth : 0);
  const y = parent.y + (quadrant >= 2 ? halfWidth : 0);

  parent.children[quadrant] = {
    cx: 0,
    cy: 0,
    mass: 0,
    x,
    y,
    width: halfWidth,
    children: [undefined, undefined, undefined, undefined],
    nodeIndex: undefined,
  };
}

interface QuadrantParams {
  nodeX: number;
  nodeY: number;
  halfWidth: number;
  px: number;
  py: number;
}

function getQuadrant(params: QuadrantParams): number {
  const { nodeX, nodeY, halfWidth, px, py } = params;
  const right = px >= nodeX + halfWidth ? 1 : 0;
  const bottom = py >= nodeY + halfWidth ? 2 : 0;
  return right + bottom;
}

function computeMassDistribution(node: QuadNode, states: NodeState[]): void {
  if (node.nodeIndex !== undefined) {
    const state = states[node.nodeIndex];
    if (!state) return;
    node.mass = 1;
    node.cx = state.x;
    node.cy = state.y;
    return;
  }

  node.mass = 0;
  node.cx = 0;
  node.cy = 0;

  for (const child of node.children) {
    if (!child) continue;
    computeMassDistribution(child, states);
    node.mass += child.mass;
    node.cx += child.cx * child.mass;
    node.cy += child.cy * child.mass;
  }

  if (node.mass > 0) {
    node.cx /= node.mass;
    node.cy /= node.mass;
  }
}
