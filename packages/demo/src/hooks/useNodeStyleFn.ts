import { useMemo } from 'react';
import type { ExtendedNodeShape, Node } from '@graphon/react';
import type { NodeData } from '../generator';
import { COMMUNITY_COLORS_HEX, COMMUNITY_SHAPES } from '../styleConfig';

interface NodeStyleOptions {
  shapeMode: 'community' | ExtendedNodeShape;
  nodeSize: number;
}

type NodeStyleFn = (node: Node<NodeData>) => {
  color: number;
  radius: number;
  shape: ExtendedNodeShape;
};

export function useNodeStyleFn(options: NodeStyleOptions): NodeStyleFn {
  const { shapeMode, nodeSize } = options;

  return useMemo(() => {
    return (node: Node<NodeData>) => ({
      color: COMMUNITY_COLORS_HEX[node.data.community % COMMUNITY_COLORS_HEX.length],
      radius: nodeSize,
      shape:
        shapeMode === 'community'
          ? COMMUNITY_SHAPES[node.data.community % COMMUNITY_SHAPES.length]
          : shapeMode,
    });
  }, [shapeMode, nodeSize]);
}
