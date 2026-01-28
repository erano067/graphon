import type { Edge, Node } from '../model/types';

interface Position {
  x: number;
  y: number;
}

export function findNodeAt<N>(
  pos: Position,
  nodes: Node<N>[],
  positions: Map<string, Position>,
  radius: number
): Node<N> | undefined {
  return nodes.find((node) => {
    const nodePos = positions.get(node.id);
    if (!nodePos) return false;
    const dx = pos.x - nodePos.x;
    const dy = pos.y - nodePos.y;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  });
}

export function findEdgeAt<E>(
  pos: Position,
  edges: Edge<E>[],
  positions: Map<string, Position>,
  hitDistance: number
): Edge<E> | undefined {
  return edges.find((edge) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (!source || !target) return false;
    return pointToLineDistance(pos, source, target) <= hitDistance;
  });
}

function pointToLineDistance(point: Position, start: Position, end: Position): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt((point.x - start.x) ** 2 + (point.y - start.y) ** 2);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq)
  );
  const projX = start.x + t * dx;
  const projY = start.y + t * dy;

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  viewport: { x: number; y: number; scale: number }
): Position {
  return {
    x: (screenX - viewport.x) / viewport.scale,
    y: (screenY - viewport.y) / viewport.scale,
  };
}
