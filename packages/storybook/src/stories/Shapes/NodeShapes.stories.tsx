import type { Meta, StoryObj } from '@storybook/react';
import type { ExtendedNodeShape, Node } from '@graphon/core';
import { Graphon } from '@graphon/react';

const meta: Meta<typeof Graphon> = {
  title: 'Shapes/Node Shapes',
  component: Graphon,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Graphon>;

interface NodeData {
  label: string;
  shape: ExtendedNodeShape;
}

const shapes: ExtendedNodeShape[] = [
  'circle',
  'square',
  'diamond',
  'ellipse',
  'rectangle',
  'round-rectangle',
  'triangle',
  'round-triangle',
  'round-diamond',
  'pentagon',
  'hexagon',
  'octagon',
  'star',
  'tag',
  'vee',
];

const colors = [
  0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e, 0x16a085,
  0xc0392b, 0x2980b9, 0x27ae60, 0xd35400, 0x8e44ad, 0x7f8c8d,
];

function createShapeShowcaseNodes(): Node<NodeData>[] {
  return shapes.map((shape) => ({
    id: shape,
    data: { label: shape, shape },
  }));
}

const showcaseNodes = createShapeShowcaseNodes();

export const AllShapes: Story = {
  args: {
    nodes: showcaseNodes,
    edges: [],
    width: 900,
    height: 600,
    isAnimated: true,
    nodeStyleFn: (node) => {
      const idx = shapes.indexOf(node.id as ExtendedNodeShape);
      return {
        shape: (node.id as ExtendedNodeShape) ?? 'circle',
        color: colors[idx >= 0 ? idx : 0] ?? 0x3498db,
        radius: 30,
      };
    },
  },
};

const basicShapeNodes: Node<{ label: string }>[] = [
  { id: 'circle', data: { label: 'Circle' } },
  { id: 'square', data: { label: 'Square' } },
  { id: 'diamond', data: { label: 'Diamond' } },
];

const basicEdges = [
  { id: 'cs', source: 'circle', target: 'square', data: {} },
  { id: 'sd', source: 'square', target: 'diamond', data: {} },
  { id: 'dc', source: 'diamond', target: 'circle', data: {} },
];

export const BasicShapes: Story = {
  args: {
    nodes: basicShapeNodes,
    edges: basicEdges,
    width: 800,
    height: 500,
    isAnimated: true,
    nodeStyleFn: (node) => {
      const shapeMap: Record<string, 'circle' | 'square' | 'diamond'> = {
        circle: 'circle',
        square: 'square',
        diamond: 'diamond',
      };
      const colorMap: Record<string, number> = {
        circle: 0x3498db,
        square: 0xe74c3c,
        diamond: 0x2ecc71,
      };
      return {
        shape: shapeMap[node.id] ?? 'circle',
        color: colorMap[node.id] ?? 0x95a5a6,
        radius: 35,
      };
    },
  },
};

const specialNodes: Node<{ label: string }>[] = [
  { id: 'star', data: { label: 'Star' } },
  { id: 'tag', data: { label: 'Tag' } },
  { id: 'vee', data: { label: 'Vee' } },
];

const specialEdges = [
  { id: 'e1', source: 'star', target: 'tag', data: {} },
  { id: 'e2', source: 'tag', target: 'vee', data: {} },
];

export const SpecialShapes: Story = {
  args: {
    nodes: specialNodes,
    edges: specialEdges,
    width: 800,
    height: 500,
    isAnimated: true,
    nodeStyleFn: (node) => {
      const colorMap: Record<string, number> = {
        star: 0xf39c12,
        tag: 0x1abc9c,
        vee: 0xe74c3c,
      };
      const shapeMap: Record<string, ExtendedNodeShape> = {
        star: 'star',
        tag: 'tag',
        vee: 'vee',
      };
      return {
        shape: shapeMap[node.id] ?? 'circle',
        color: colorMap[node.id] ?? 0x95a5a6,
        radius: 35,
      };
    },
  },
};
