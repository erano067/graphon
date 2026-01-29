import { useCallback, useState } from 'react';
import type { ArrowShape, EdgeCurveStyle, ExtendedNodeShape, Node } from '@graphon/react';
import type { NodeData } from '../generator';

interface AppState {
  nodeCount: number;
  setNodeCount: (count: number) => void;
  communityCount: number;
  setCommunityCount: (count: number) => void;
  selectedNode: Node<NodeData> | undefined;
  setSelectedNode: (node: Node<NodeData> | undefined) => void;
  hoveredNode: Node<NodeData> | undefined;
  setHoveredNode: (node: Node<NodeData> | undefined) => void;
  seed: number;
  regenerate: () => void;
  shapeMode: 'community' | ExtendedNodeShape;
  setShapeMode: (mode: 'community' | ExtendedNodeShape) => void;
  nodeSize: number;
  setNodeSize: (size: number) => void;
  edgeWidth: number;
  setEdgeWidth: (width: number) => void;
  shouldHighlightNeighbors: boolean;
  setShouldHighlightNeighbors: (value: boolean) => void;
  dimOpacity: number;
  setDimOpacity: (opacity: number) => void;
  curveStyle: EdgeCurveStyle;
  setCurveStyle: (style: EdgeCurveStyle) => void;
  curvature: number;
  setCurvature: (curvature: number) => void;
  targetArrow: ArrowShape;
  setTargetArrow: (arrow: ArrowShape) => void;
}

export function useAppState(): AppState {
  const [nodeCount, setNodeCount] = useState(100);
  const [communityCount, setCommunityCount] = useState(5);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData>>();
  const [hoveredNode, setHoveredNode] = useState<Node<NodeData>>();
  const [seed, setSeed] = useState(0);
  const [shapeMode, setShapeMode] = useState<'community' | ExtendedNodeShape>('community');
  const [nodeSize, setNodeSize] = useState(8);
  const [edgeWidth, setEdgeWidth] = useState(1);
  const [shouldHighlightNeighbors, setShouldHighlightNeighbors] = useState(true);
  const [dimOpacity, setDimOpacity] = useState(0.15);
  const [curveStyle, setCurveStyle] = useState<EdgeCurveStyle>('straight');
  const [curvature, setCurvature] = useState(0.3);
  const [targetArrow, setTargetArrow] = useState<ArrowShape>('none');

  const regenerate = useCallback(() => setSeed((s) => s + 1), []);

  return {
    nodeCount,
    setNodeCount,
    communityCount,
    setCommunityCount,
    selectedNode,
    setSelectedNode,
    hoveredNode,
    setHoveredNode,
    seed,
    regenerate,
    shapeMode,
    setShapeMode,
    nodeSize,
    setNodeSize,
    edgeWidth,
    setEdgeWidth,
    shouldHighlightNeighbors,
    setShouldHighlightNeighbors,
    dimOpacity,
    setDimOpacity,
    curveStyle,
    setCurveStyle,
    curvature,
    setCurvature,
    targetArrow,
    setTargetArrow,
  };
}
